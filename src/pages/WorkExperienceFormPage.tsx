import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, request } from "../api/client";
import { useCreate, useItem, useUpdate } from "../api/hooks";
import { PageHeader } from "../components/PageHeader";
import {
	WorkResponsibilities,
	type WorkResponsibilityDraft,
} from "../components/WorkResponsibilities";
import { ResourceForm } from "../components/form/ResourceForm";
import { RESOURCES } from "../resources/definitions";
import { ENDPOINTS } from "../resources/endpoints";

const resource = RESOURCES.workExperience;

function CreateView() {
	const navigate = useNavigate();
	const create = useCreate(resource.endpoint);
	const back = `/${resource.path}`;
	const [drafts, setDrafts] = useState<WorkResponsibilityDraft[]>([]);
	const [createdWithoutUuid, setCreatedWithoutUuid] = useState(false);
	const failedDrafts = useRef<WorkResponsibilityDraft[]>([]);
	const submit = async (payload: Record<string, unknown>) => {
		const experience = await create.mutateAsync(payload);
		failedDrafts.current = [];
		if (experience.uuid && drafts.length > 0) {
			for (const [order, draft] of drafts.entries()) {
				try {
					await request(ENDPOINTS.workResponsibility, {
						method: "POST",
						body: {
							active: true,
							work_experience: experience.uuid,
							description_it: draft.description_it,
							description_en: draft.description_en.trim() || null,
							order,
						},
					});
				} catch (error) {
					const reason =
						error instanceof ApiError
							? `Errore API ${error.status}`
							: error instanceof Error
								? error.message
								: "Errore sconosciuto";
					failedDrafts.current.push({ ...draft, error: reason });
				}
			}
		}
		return experience;
	};

	return (
		<>
			<PageHeader title={resource.newLabel}>
				<Link to={back} className="btn btn--small">
					Torna all'elenco
				</Link>
			</PageHeader>
			{createdWithoutUuid ? (
				<div className="notice notice--error" role="alert">
					<p>
						L'esperienza è stata creata, ma non è stato possibile
						recuperarne l'identificativo. Le mansioni sono ancora
						presenti come bozze e non sono state inviate; non
						ricreare l'esperienza.
					</p>
					<Link to={back} className="btn btn--small">
						Torna all'elenco
					</Link>
				</div>
			) : (
				<ResourceForm
					resource={resource}
					submit={submit}
					onSaved={(result) => {
						if (result?.uuid) {
							navigate(`${back}/${result.uuid}`, {
								state: failedDrafts.current.length
									? {
											failedResponsibilityDrafts:
												failedDrafts.current,
										}
									: undefined,
							});
						} else if (drafts.length > 0) {
							setCreatedWithoutUuid(true);
						} else {
							navigate(back);
						}
					}}
					onCancel={() => navigate(back)}
					submitLabel="Crea"
				>
					<ResponsibilityDraftEditor
						drafts={drafts}
						setDrafts={setDrafts}
					/>
				</ResourceForm>
			)}
			{createdWithoutUuid && (
				<ResponsibilityDraftEditor drafts={drafts} setDrafts={setDrafts} />
			)}
		</>
	);
}

function ResponsibilityDraftEditor({
	drafts,
	setDrafts,
}: {
	drafts: WorkResponsibilityDraft[];
	setDrafts: (drafts: WorkResponsibilityDraft[]) => void;
}) {
	const [descriptionIt, setDescriptionIt] = useState("");
	const [descriptionEn, setDescriptionEn] = useState("");
	const [error, setError] = useState<string | null>(null);

	const addDraft = () => {
		const italian = descriptionIt.trim();
		if (!italian) {
			setError("Inserisci la descrizione in italiano.");
			return;
		}
		setDrafts([
			...drafts,
			{
				id: crypto.randomUUID(),
				description_it: italian,
				description_en: descriptionEn.trim(),
			},
		]);
		setDescriptionIt("");
		setDescriptionEn("");
		setError(null);
	};

	const moveDraft = (index: number, offset: number) => {
		const target = index + offset;
		if (target < 0 || target >= drafts.length) return;
		const next = [...drafts];
		[next[index], next[target]] = [next[target], next[index]];
		setDrafts(next);
	};

	return (
		<section
			className="work-responsibilities work-responsibilities--drafts"
			aria-labelledby="draft-responsibilities-title">
			<div className="work-responsibilities__heading">
				<div>
					<h2 id="draft-responsibilities-title">Mansioni</h2>
					<p>
						Aggiungi qui le mansioni da creare insieme
						all'esperienza.
					</p>
				</div>
				<span className="work-responsibilities__count">
					{drafts.length}
				</span>
			</div>
			{drafts.length > 0 && (
				<ol
					className="work-responsibilities__list"
					aria-label="Mansioni da creare">
					{drafts.map((draft, index) => (
						<li
							className="work-responsibilities__item"
							key={draft.id}>
							<div className="work-responsibilities__text">
								<span className="work-responsibilities__number">
									{index + 1}
								</span>
								<div>
									<p>{draft.description_it}</p>
									{draft.description_en && (
										<p className="work-responsibilities__translation">
											{draft.description_en}
										</p>
									)}
								</div>
							</div>
							<div className="work-responsibilities__actions">
								<button
									type="button"
									className="btn btn--small"
									aria-label={`Sposta la mansione ${index + 1} in alto`}
									onClick={() => moveDraft(index, -1)}
									disabled={index === 0}>
									↑
								</button>
								<button
									type="button"
									className="btn btn--small"
									aria-label={`Sposta la mansione ${index + 1} in basso`}
									onClick={() => moveDraft(index, 1)}
									disabled={index === drafts.length - 1}>
									↓
								</button>
								<button
									type="button"
									className="btn btn--small btn--danger"
									onClick={() =>
										setDrafts(
											drafts.filter(
												(item) => item.id !== draft.id,
											),
										)
									}>
									Rimuovi
								</button>
							</div>
						</li>
					))}
				</ol>
			)}
			<div className="work-responsibilities__form">
				<h3>Nuova mansione</h3>
				<div className="form-row">
					<div className="form-row__rail">
						<span className="form-row__label">
							Descrizione
							<span className="req" aria-hidden="true">
								*
							</span>
						</span>
					</div>
					<div className="form-row__body pair">
						<div className="pair__cell">
							<label
								className="pair__lang"
								htmlFor="new-responsibility-it">
								Italiano
							</label>
							<textarea
								id="new-responsibility-it"
								className="input input--area"
								value={descriptionIt}
								onChange={(event) =>
									setDescriptionIt(event.target.value)
								}
								required
							/>
						</div>
						<div className="pair__cell">
							<label
								className="pair__lang"
								htmlFor="new-responsibility-en">
								Inglese
							</label>
							<textarea
								id="new-responsibility-en"
								className="input input--area"
								value={descriptionEn}
								onChange={(event) =>
									setDescriptionEn(event.target.value)
								}
							/>
						</div>
					</div>
				</div>
				{error && (
					<p className="notice notice--error" role="alert">
						{error}
					</p>
				)}
				<button
					type="button"
					className="btn"
					onClick={() => addDraft()}>
					Aggiungi alla WorkExperience
				</button>
			</div>
		</section>
	);
}

function EditView({ uuid }: { uuid: string }) {
	const navigate = useNavigate();
	const location = useLocation();
	const { data, isLoading, error, refetch } = useItem(
		resource.endpoint,
		uuid,
	);
	const update = useUpdate(resource.endpoint);
	const back = `/${resource.path}`;
	const locationState = location.state as {
		failedResponsibilityDrafts?: WorkResponsibilityDraft[];
	} | null;
	const failedResponsibilityDrafts =
		locationState?.failedResponsibilityDrafts ?? [];
	const [pendingDrafts] = useState(failedResponsibilityDrafts);

	useEffect(() => {
		if (failedResponsibilityDrafts.length > 0) {
			navigate(location.pathname, { replace: true, state: null });
		}
	}, [failedResponsibilityDrafts.length, location.pathname, navigate]);

	if (isLoading) {
		return (
			<p className="notice" role="status">
				Caricamento in corso
			</p>
		);
	}

	if (error || !data) {
		const missing = error instanceof ApiError && error.status === 404;
		return (
			<>
				<PageHeader title={resource.editLabel} />
				<div className="notice notice--error" role="alert">
					<p>
						{missing
							? "Elemento non trovato. Potrebbe essere stato eliminato."
							: "Impossibile caricare l'elemento."}
					</p>
					{!missing && (
						<button
							type="button"
							className="btn btn--small"
							onClick={() => void refetch()}>
							Riprova
						</button>
					)}
					<Link to={back} className="btn btn--small">
						Torna all'elenco
					</Link>
				</div>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title={resource.editLabel}
				description={resource.label(data)}>
				<Link to={back} className="btn btn--small">
					Torna all'elenco
				</Link>
			</PageHeader>
			<ResourceForm
				key={uuid}
				resource={resource}
				item={data}
				submit={(payload) => update.mutateAsync({ uuid, payload })}
				onSaved={() => undefined}
				onCancel={() => navigate(back)}
				submitLabel="Salva modifiche"
			>
				<WorkResponsibilities
					workExperienceUuid={uuid}
					initialPendingDrafts={pendingDrafts}
				/>
			</ResourceForm>
		</>
	);
}

export function WorkExperienceFormPage({ mode }: { mode: "create" | "edit" }) {
	const { uuid } = useParams();
	if (mode === "create") return <CreateView />;
	return <EditView key={uuid ?? ""} uuid={uuid ?? ""} />;
}
