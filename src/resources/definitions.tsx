import { LevelMeter } from "../components/LevelMeter";
import { RelationCell } from "../components/RelationCell";
import { ENDPOINTS } from "./endpoints";
import {
	companyLabel,
	firstText,
	projectLabel,
	skillLabel,
	technologyLabel,
	workExperienceLabel,
} from "./labels";
import type {
	ApiItem,
	ColumnDef,
	FieldDef,
	FormEntry,
	ResourceDef,
	ResourceKey,
	SelectOption,
} from "./types";

const PERIOD_PATTERN =
	/^(0[1-9]|1[0-2])\/\d{4}$|^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const PERIOD_MESSAGE = "Usa il formato MM/AAAA oppure GG/MM/AAAA";

export const SKILL_TYPOLOGIES: SelectOption[] = [
	{ value: "technical", label: "Tecnica" },
	{ value: "soft", label: "Soft" },
];

export const TECHNOLOGY_TYPOLOGIES: SelectOption[] = [
	{ value: "language", label: "Linguaggio" },
	{ value: "framework", label: "Framework" },
	{ value: "library", label: "Libreria" },
	{ value: "markup", label: "Markup" },
	{ value: "stylesheet", label: "Stylesheet" },
	{ value: "tool", label: "Tool" },
	{ value: "database", label: "Database" },
];

const optionLabel = (options: SelectOption[], value: unknown) =>
	options.find((option) => option.value === value)?.label ??
	String(value ?? "");

const field = (
	name: string,
	label: string,
	kind: FieldDef["kind"],
	extra: Partial<FieldDef> = {},
): FieldDef => ({
	name,
	label,
	kind,
	...extra,
});

const translated = (
	name: string,
	title: string,
	kind: "text" | "textarea",
	extra: { required?: boolean; maxLength?: number; hint?: string } = {},
): FormEntry => ({
	title,
	hint: extra.hint,
	pair: [
		field(`${name}_it`, "Italiano", kind, {
			required: extra.required,
			nullable: !extra.required,
			maxLength: extra.maxLength,
		}),
		field(`${name}_en`, "Inglese", kind, {
			nullable: true,
			maxLength: extra.maxLength,
		}),
	],
});

const activeField: FieldDef = field("active", "Visibilità", "boolean", {
	defaultValue: true,
	toggleLabel: "Visibile sul portfolio",
});

const levelField = (label: string, hint?: string): FieldDef =>
	field("level", label, "level", { required: true, min: 1, max: 5, hint });

const textColumn = (key: string, label: string): ColumnDef => ({
	key,
	label,
	sortValue: (item) => firstText(item[key]).toLowerCase(),
});

const translatedColumn = (key: string, label: string): ColumnDef => ({
	key,
	label,
	render: (item) =>
		firstText(item[`${key}_it`], item[`${key}_en`], item[key]),
	sortValue: (item) =>
		firstText(
			item[`${key}_it`],
			item[`${key}_en`],
			item[key],
		).toLowerCase(),
});

const clip = (value: unknown, length = 90) => {
	const text = firstText(value);
	return text.length > length ? `${text.slice(0, length)}...` : text;
};

const period = (item: ApiItem) =>
	`${item.start_date ?? ""} - ${item.end_date || "in corso"}`;

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
	personalInfo: {
		key: "personalInfo",
		kind: "singleton",
		endpoint: ENDPOINTS.personalInfo,
		path: "persona/informazioni-personali",
		title: "Informazioni personali",
		description:
			"Anagrafica e contatti mostrati nel portfolio e nel CV. Esiste un solo record.",
		newLabel: "Nuove informazioni personali",
		editLabel: "Modifica informazioni personali",
		emptyMessage: "Non hai ancora inserito le informazioni personali.",
		label: (item) =>
			`${firstText(item.name)} ${firstText(item.surname)}`.trim(),
		entries: [
			field("name", "Nome", "text", { required: true }),
			field("surname", "Cognome", "text", { required: true }),
			field("birth_date", "Data di nascita", "date", { required: true }),
			translated("location", "Location", "text", {
				required: true,
				maxLength: 50,
			}),
			translated("job_role", "Ruolo", "text", {
				required: true,
				maxLength: 100,
			}),
			field("email", "Email", "email", {
				required: true,
				maxLength: 254,
			}),
			field("phone_number", "Telefono", "text", { required: true }),
		],
		columns: [],
	},

	overview: {
		key: "overview",
		kind: "collection",
		endpoint: ENDPOINTS.overview,
		path: "persona/overview",
		title: "Overview",
		description: "I testi di presentazione mostrati nella home.",
		newLabel: "Nuova overview",
		editLabel: "Modifica overview",
		emptyMessage: "Nessuna overview. Crea il primo testo di presentazione.",
		label: (item) =>
			clip(firstText(item.short_text_it, item.short_text_en), 50),
		entries: [
			activeField,
			translated("short_text", "Testo breve", "textarea", {
				required: true,
			}),
			translated("text", "Testo", "textarea", { required: true }),
		],
		columns: [
			{
				key: "short_text",
				label: "Testo Breve",
				render: (item) =>
					clip(
						firstText(item.short_text_it, item.short_text_en),
						120,
					),
				sortValue: (item) =>
					firstText(
						item.short_text_it,
						item.short_text_en,
					).toLowerCase(),
			},
			{
				key: "text",
				label: "Testo",
				render: (item) =>
					clip(firstText(item.text_it, item.text_en), 120),
				sortValue: (item) =>
					firstText(item.text_it, item.text_en).toLowerCase(),
			},
		],
	},

	spokenLanguage: {
		key: "spokenLanguage",
		kind: "collection",
		endpoint: ENDPOINTS.spokenLanguage,
		path: "persona/lingue-parlate",
		title: "Lingue parlate",
		description: "Le lingue che parli e il tuo livello in ciascuna.",
		newLabel: "Nuova lingua",
		editLabel: "Modifica lingua",
		emptyMessage: "Nessuna lingua inserita.",
		label: (item) => firstText(item.name_it, item.name_en),
		entries: [
			activeField,
			translated("name", "Nome", "text", { required: true }),
			levelField("Livello", "Da 1 (base) a 5 (madrelingua)"),
		],
		columns: [
			translatedColumn("name", "Lingua"),
			{
				key: "level",
				label: "Livello",
				render: (item) => (
					<LevelMeter value={Number(item.level) || 0} />
				),
				sortValue: (item) => Number(item.level) || 0,
			},
		],
	},

	education: {
		key: "education",
		kind: "collection",
		endpoint: ENDPOINTS.education,
		path: "education",
		title: "Education",
		description: "Percorso di studi e formazione.",
		newLabel: "Nuovo percorso di studi",
		editLabel: "Modifica percorso di studi",
		emptyMessage: "Nessun percorso di studi inserito.",
		label: (item) => firstText(item.institution),
		entries: [
			activeField,
			field("institution", "Istituto", "text", {
				required: true,
				maxLength: 200,
			}),
			translated("qualification", "Titolo di studio", "text", {
				required: true,
				maxLength: 200,
			}),
			translated("field_of_study", "Indirizzo", "text", {
				maxLength: 200,
			}),
			field("start_date", "Data di inizio", "date", { required: true }),
			field("end_date", "Data di fine", "date", {
				nullable: true,
				hint: "Lascia vuoto se è in corso",
			}),
			translated("description", "Descrizione", "textarea"),
		],
		columns: [
			textColumn("institution", "Istituto"),
			translatedColumn("qualification", "Titolo"),
			{
				key: "period",
				label: "Periodo",
				render: period,
				sortValue: (item) => firstText(item.start_date),
			},
		],
	},

	company: {
		key: "company",
		kind: "collection",
		endpoint: ENDPOINTS.company,
		path: "work/societa",
		title: "Società",
		description: "Le aziende presso cui hai lavorato.",
		newLabel: "Nuova società",
		editLabel: "Modifica società",
		emptyMessage: "Nessuna società inserita.",
		label: companyLabel,
		entries: [
			field("name", "Nome", "text", { required: true }),
			field("website", "Sito web", "url", {
				nullable: true,
				maxLength: 200,
				placeholder: "https://",
			}),
		],
		columns: [
			textColumn("name", "Nome"),
			textColumn("website", "Sito web"),
		],
	},

	skill: {
		key: "skill",
		kind: "collection",
		endpoint: ENDPOINTS.skill,
		path: "work/skills",
		title: "Skills",
		description:
			"Competenze tecniche e soft, collegabili alle esperienze lavorative.",
		newLabel: "Nuova skill",
		editLabel: "Modifica skill",
		emptyMessage: "Nessuna skill inserita.",
		label: skillLabel,
		entries: [
			activeField,
			field("typology", "Tipologia", "select", {
				required: true,
				options: SKILL_TYPOLOGIES,
			}),
			translated("name", "Nome", "text", {
				required: true,
				maxLength: 100,
			}),
			translated("description", "Descrizione", "textarea"),
		],
		columns: [
			translatedColumn("name", "Nome"),
			{
				key: "typology",
				label: "Tipologia",
				render: (item) => optionLabel(SKILL_TYPOLOGIES, item.typology),
				sortValue: (item) => firstText(item.typology),
			},
		],
	},

	technology: {
		key: "technology",
		kind: "collection",
		endpoint: ENDPOINTS.technology,
		path: "work/tecnologie",
		title: "Tecnologie",
		description:
			"Linguaggi, framework e strumenti, con il tuo livello di competenza.",
		newLabel: "Nuova tecnologia",
		editLabel: "Modifica tecnologia",
		emptyMessage: "Nessuna tecnologia inserita.",
		label: technologyLabel,
		entries: [
			activeField,
			field("name", "Nome", "text", { required: true, maxLength: 100 }),
			field("typology", "Tipologia", "select", {
				required: true,
				options: TECHNOLOGY_TYPOLOGIES,
			}),
			levelField("Livello", "Da 1 (base) a 5 (esperto)"),
		],
		columns: [
			textColumn("name", "Nome"),
			{
				key: "typology",
				label: "Tipologia",
				render: (item) =>
					firstText(item.typology_display) ||
					optionLabel(TECHNOLOGY_TYPOLOGIES, item.typology),
				sortValue: (item) =>
					firstText(
						item.typology_display,
						item.typology,
					).toLowerCase(),
			},
			{
				key: "level",
				label: "Livello",
				render: (item) => (
					<LevelMeter value={Number(item.level) || 0} />
				),
				sortValue: (item) => Number(item.level) || 0,
			},
		],
	},

	workExperience: {
		key: "workExperience",
		kind: "collection",
		endpoint: ENDPOINTS.workExperience,
		path: "work/esperienze-lavorative",
		title: "Esperienze lavorative",
		description:
			"Ruoli ricoperti, con società, periodo, skills e tecnologie.",
		newLabel: "Nuova esperienza",
		editLabel: "Modifica esperienza",
		emptyMessage: "Nessuna esperienza lavorativa inserita.",
		label: workExperienceLabel,
		entries: [
			activeField,
			translated("title", "Titolo", "text", { required: true }),
			field("company", "Società", "relation", {
				relation: { resource: "company" },
			}),
			field("start_date", "Data di inizio", "text", {
				required: true,
				maxLength: 10,
				placeholder: "MM/AAAA",
				pattern: PERIOD_PATTERN,
				patternMessage: PERIOD_MESSAGE,
			}),
			field("end_date", "Data di fine", "text", {
				nullable: true,
				maxLength: 10,
				placeholder: "MM/AAAA",
				pattern: PERIOD_PATTERN,
				patternMessage: PERIOD_MESSAGE,
				hint: "Lascia vuoto se è in corso",
			}),
			translated("description", "Descrizione", "textarea"),
			field("technical_skills", "Skills tecniche", "relations", {
				relation: {
					resource: "skill",
					filter: (item) => item.typology === "technical",
					preset: { typology: "technical" },
					lockedFields: ["typology"],
				},
			}),
			field("soft_skills", "Soft skills", "relations", {
				relation: {
					resource: "skill",
					filter: (item) => item.typology === "soft",
					preset: { typology: "soft" },
					lockedFields: ["typology"],
				},
			}),
			field("technologies", "Tecnologie", "relations", {
				relation: { resource: "technology" },
			}),
		],
		columns: [
			translatedColumn("title", "Titolo"),
			{
				key: "company",
				label: "Società",
				render: (item) => firstText(item.company?.name),
				sortValue: (item) =>
					firstText(item.company?.name).toLowerCase(),
			},
			{ key: "period", label: "Periodo", render: period },
		],
	},

	workResponsibility: {
		key: "workResponsibility",
		kind: "collection",
		endpoint: ENDPOINTS.workResponsibility,
		path: "work/mansioni",
		title: "Mansioni",
		description:
			"Le attività svolte in ogni esperienza lavorativa, in ordine di apparizione.",
		newLabel: "Nuova mansione",
		editLabel: "Modifica mansione",
		emptyMessage: "Nessuna mansione inserita.",
		label: (item) =>
			clip(
				firstText(
					item.description_it,
					item.description_en,
					item.description,
				),
				50,
			),
		entries: [
			activeField,
			field("work_experience", "Esperienza lavorativa", "relation", {
				required: true,
				relation: { resource: "workExperience" },
			}),
			translated("description", "Descrizione", "textarea", {
				required: true,
			}),
			field("order", "Ordine", "number", {
				required: true,
				min: 0,
				max: 32767,
				defaultValue: "0",
				hint: "Le mansioni con numero più basso compaiono prima",
			}),
		],
		columns: [
			{
				key: "description",
				label: "Descrizione",
				render: (item) =>
					clip(
						firstText(
							item.description_it,
							item.description_en,
							item.description,
						),
						100,
					),
				sortValue: (item) =>
					firstText(
						item.description_it,
						item.description,
					).toLowerCase(),
			},
			{
				key: "work_experience",
				label: "Esperienza",
				render: (item) =>
					workExperienceLabel(item.work_experience ?? {}),
				sortValue: (item) =>
					workExperienceLabel(
						item.work_experience ?? {},
					).toLowerCase(),
			},
		],
	},

	project: {
		key: "project",
		kind: "collection",
		endpoint: ENDPOINTS.project,
		path: "progetti/progetti",
		title: "Progetti",
		description:
			"I progetti mostrati nel portfolio, con tecnologie e esperienza di riferimento.",
		newLabel: "Nuovo progetto",
		editLabel: "Modifica progetto",
		emptyMessage: "Nessun progetto inserito.",
		label: projectLabel,
		entries: [
			activeField,
			field("in_homepage", "In Homepage", "boolean", {
				defaultValue: false,
				toggleLabel: "Visibile in Homepage",
			}),
			field("is_portfolio", "Portfolio", "boolean", {
				defaultValue: false,
				toggleLabel: "Rappresenta il Portfolio",
			}),
			translated("title", "Titolo", "text", {
				required: true,
				maxLength: 100,
			}),
			translated("description", "Descrizione", "textarea", {
				required: true,
			}),
			field("work_experience", "Esperienza lavorativa", "relation", {
				relation: { resource: "workExperience" },
			}),
			field("technologies", "Tecnologie", "relations", {
				relation: { resource: "technology" },
			}),
		],
		columns: [
			translatedColumn("title", "Titolo"),
			{
				key: "work_experience",
				label: "Esperienza",
				render: (item) =>
					item.work_experience
						? workExperienceLabel(item.work_experience)
						: "",
				sortValue: (item) =>
					workExperienceLabel(
						item.work_experience ?? {},
					).toLowerCase(),
			},
			{
				key: "technologies",
				label: "Tecnologie",
				render: (item) =>
					Array.isArray(item.technologies)
						? item.technologies.map(technologyLabel).join(", ")
						: "",
			},
			{
				key: "in_homepage",
				label: "In Homepage",
				render: (item) => (item.in_homepage ? "Sì" : "No"),
				sortValue: (item) =>
					workExperienceLabel(
						item.work_experience ?? {},
					).toLowerCase(),
			},
		],
	},

	projectRepository: {
		key: "projectRepository",
		kind: "collection",
		endpoint: ENDPOINTS.projectRepository,
		path: "progetti/repositories",
		title: "Repositories",
		description: "I link ai repository dei progetti.",
		newLabel: "Nuovo repository",
		editLabel: "Modifica repository",
		emptyMessage: "Nessun repository inserito.",
		label: (item) => firstText(item.label, item.url),
		entries: [
			field("project", "Progetto", "relation", {
				required: true,
				relation: { resource: "project" },
			}),
			field("url", "URL", "url", {
				required: true,
				maxLength: 200,
				placeholder: "https://github.com/",
			}),
			field("label", "Etichetta", "text", {
				maxLength: 100,
				hint: "Il testo mostrato per il link",
			}),
		],
		columns: [
			textColumn("label", "Etichetta"),
			textColumn("url", "URL"),
			{
				key: "project",
				label: "Progetto",
				render: (item) => (
					<RelationCell
						endpoint={ENDPOINTS.project}
						uuid={item.project}
						labelOf={projectLabel}
					/>
				),
			},
		],
	},
};

export const COLLECTIONS = Object.values(RESOURCES).filter(
	(resource) => resource.kind === "collection",
);
