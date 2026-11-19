import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, request } from "../api/client";
import {
	useCreate,
	useItem,
	useList,
	useRemove,
	useUpdate,
} from "../api/hooks";
import { PageHeader } from "../components/PageHeader";
import { ResourceForm } from "../components/form/ResourceForm";
import { RESOURCES } from "../resources/definitions";
import { ENDPOINTS } from "../resources/endpoints";
import type { ApiItem } from "../resources/types";

const resource = RESOURCES.project;
const repositoryEndpoint = ENDPOINTS.projectRepository;

interface ProjectRepositoryDraft {
	id: string;
	url: string;
	label: string;
	error?: string;
}

interface ProjectRepository extends ApiItem {
	uuid: string;
	project: string;
	url: string;
	label: string;
}

const errorMessage = (error: unknown, action: string) => {
	if (error instanceof ApiError) {
		return `${action} non riuscito (codice ${error.status}). Riprova.`;
	}
	if (error instanceof Error)
		return `${action} non riuscito: ${error.message}`;
	return `${action} non riuscito. Riprova.`;
};

const validUrl = (value: string) => {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
};

function RepositoryDraftEditor({
	drafts,
	setDrafts,
}: {
	drafts: ProjectRepositoryDraft[];
	setDrafts: (drafts: ProjectRepositoryDraft[]) => void;
}) {
	const [url, setUrl] = useState("");
	const [label, setLabel] = useState("");
	const [error, setError] = useState<string | null>(null);

	const addDraft = () => {
		const normalizedUrl = url.trim();
		if (!normalizedUrl || !validUrl(normalizedUrl)) {
			setError("Inserisci un URL valido.");
			return;
		}
		setDrafts([
			...drafts,
			{
				id: crypto.randomUUID(),
				url: normalizedUrl,
				label: label.trim(),
			},
		]);
		setUrl("");
		setLabel("");
		setError(null);
	};

	return (
		<section
			className="project-repositories"
			aria-labelledby="project-repositories-title">
			<div className="project-repositories__heading">
				<div>
					<h2 id="project-repositories-title">Repository</h2>
					<p>Aggiungi i link ai repository di questo progetto.</p>
				</div>
				<span className="project-repositories__count">
					{drafts.length}
				</span>
			</div>
			{drafts.length > 0 && (
				<ul
					className="project-repositories__list"
					aria-label="Repository da creare">
					{drafts.map((draft) => (
						<li
							className="project-repositories__item"
							key={draft.id}>
							<div>
								<p>{draft.label || draft.url}</p>
								{draft.label && (
									<p className="project-repositories__url">
										{draft.url}
									</p>
								)}
								{draft.error && (
									<p className="project-repositories__url">
										{draft.error}
									</p>
								)}
							</div>
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
						</li>
					))}
				</ul>
			)}
			<div className="project-repositories__form">
				<h3>Nuovo repository</h3>
				<div className="project-repositories__controls">
					<div className="pair__cell">
						<label
							className="pair__lang"
							htmlFor="new-project-repository-url">
							URL
							<span className="req" aria-hidden="true">
								*
							</span>
						</label>
						<input
							id="new-project-repository-url"
							className="input"
							type="url"
							value={url}
							onChange={(event) => setUrl(event.target.value)}
							placeholder="https://github.com/"
							required
						/>
					</div>
					<div className="pair__cell">
						<label
							className="pair__lang"
							htmlFor="new-project-repository-label">
							Etichetta
						</label>
						<input
							id="new-project-repository-label"
							className="input"
							type="text"
							maxLength={100}
							value={label}
							onChange={(event) => setLabel(event.target.value)}
						/>
					</div>
					<div className="pair__cell">
						<span className="pair__lang" aria-hidden="true">
							&nbsp;
						</span>
						<button
							type="button"
							className="btn"
							onClick={addDraft}>
							Aggiungi al progetto
						</button>
					</div>
				</div>
				{error && (
					<p className="notice notice--error" role="alert">
						{error}
					</p>
				)}
			</div>
		</section>
	);
}

function CreateView() {
	const navigate = useNavigate();
	const create = useCreate(resource.endpoint);
	const back = `/${resource.path}`;
	const [drafts, setDrafts] = useState<ProjectRepositoryDraft[]>([]);
	const [createdWithoutUuid, setCreatedWithoutUuid] = useState(false);
	const failedDrafts = useRef<ProjectRepositoryDraft[]>([]);

	const submit = async (payload: Record<string, unknown>) => {
		const project = await create.mutateAsync(payload);
		failedDrafts.current = [];
		if (project.uuid) {
			for (const draft of drafts) {
				try {
					await request(repositoryEndpoint, {
						method: "POST",
						body: {
							project: project.uuid,
							url: draft.url,
							label: draft.label,
						},
					});
				} catch (error) {
					failedDrafts.current.push({
						...draft,
						error: errorMessage(error, "Creazione del repository"),
					});
				}
			}
		}
		return project;
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
						Il progetto è stato creato, ma non è stato possibile
						recuperarne l'identificativo. I repository restano come
						bozze e non sono stati inviati; non ricreare il
						progetto.
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
											failedRepositoryDrafts:
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
					submitLabel="Crea">
					<RepositoryDraftEditor
						drafts={drafts}
						setDrafts={setDrafts}
					/>
				</ResourceForm>
			)}
			{createdWithoutUuid && (
				<RepositoryDraftEditor drafts={drafts} setDrafts={setDrafts} />
			)}
		</>
	);
}

function ProjectRepositories({
	projectUuid,
	pendingRemovals,
	setPendingRemovals,
	initialPendingDrafts,
	saveError,
}: {
	projectUuid: string;
	pendingRemovals: string[];
	setPendingRemovals: (uuids: string[]) => void;
	initialPendingDrafts: ProjectRepositoryDraft[];
	saveError: string | null;
}) {
	const { data, isLoading, error, refetch } =
		useList<ProjectRepository>(repositoryEndpoint);
	const create = useCreate(repositoryEndpoint);
	const [pendingDrafts, setPendingDrafts] = useState(initialPendingDrafts);
	const [url, setUrl] = useState("");
	const [label, setLabel] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [formStatus, setFormStatus] = useState<string | null>(null);
	const [retryingDraft, setRetryingDraft] = useState<string | null>(null);
	const items = (data ?? []).filter((item) => item.project === projectUuid);
	const busy = create.isPending || retryingDraft !== null;

	const addRepository = async () => {
		const normalizedUrl = url.trim();
		if (!normalizedUrl || !validUrl(normalizedUrl)) {
			setFormError("Inserisci un URL valido.");
			return;
		}
		setFormError(null);
		setFormStatus(null);
		try {
			await create.mutateAsync({
				project: projectUuid,
				url: normalizedUrl,
				label: label.trim(),
			});
			setUrl("");
			setLabel("");
			setFormStatus("Repository aggiunto.");
		} catch (error) {
			setFormError(errorMessage(error, "Aggiunta del repository"));
		}
	};

	const retryDraft = async (draft: ProjectRepositoryDraft) => {
		setRetryingDraft(draft.id);
		setPendingDrafts((current) =>
			current.map((item) =>
				item.id === draft.id ? { ...item, error: undefined } : item,
			),
		);
		try {
			await create.mutateAsync({
				project: projectUuid,
				url: draft.url,
				label: draft.label,
			});
			setPendingDrafts((current) =>
				current.filter((item) => item.id !== draft.id),
			);
		} catch (error) {
			setPendingDrafts((current) =>
				current.map((item) =>
					item.id === draft.id
						? {
								...item,
								error: errorMessage(
									error,
									"Creazione del repository",
								),
							}
						: item,
				),
			);
		} finally {
			setRetryingDraft(null);
		}
	};

	return (
		<section
			className="project-repositories"
			aria-labelledby="project-repositories-title">
			<div className="project-repositories__heading">
				<div>
					<h2 id="project-repositories-title">Repository</h2>
					<p>Gestisci i link ai repository di questo progetto.</p>
				</div>
				<span className="project-repositories__count">
					{items.length - pendingRemovals.length}
				</span>
			</div>

			{pendingDrafts.length > 0 && (
				<div className="project-repositories__pending">
					<p>
						Alcuni repository non sono stati creati. Puoi riprovare:
					</p>
					<ul>
						{pendingDrafts.map((draft) => (
							<li key={draft.id}>
								<span>
									{draft.label || draft.url}
									{draft.error && (
										<small>{draft.error}</small>
									)}
								</span>
								<button
									type="button"
									className="btn btn--small"
									onClick={() => void retryDraft(draft)}
									disabled={busy}>
									{retryingDraft === draft.id
										? "Salvataggio in corso"
										: "Riprova"}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
			{isLoading && (
				<p className="notice" role="status">
					Caricamento repository in corso
				</p>
			)}
			{error && (
				<div className="notice notice--error" role="alert">
					<p>Impossibile caricare i repository.</p>
					<button
						type="button"
						className="btn btn--small"
						onClick={() => void refetch()}>
						Riprova
					</button>
				</div>
			)}
			{!isLoading &&
				!error &&
				(items.length ? (
					<ul
						className="project-repositories__list"
						aria-label="Repository del progetto">
						{items.map((item) => {
							const removalPending = pendingRemovals.includes(
								item.uuid,
							);
							return (
								<li
									className={`project-repositories__item${removalPending ? " project-repositories__item--pending" : ""}`}
									key={item.uuid}>
									<div>
										<p>{item.label || item.url}</p>
										{item.label && (
											<p className="project-repositories__url">
												{item.url}
											</p>
										)}
									</div>
									{removalPending ? (
										<div className="project-repositories__actions">
											<span>
												Rimozione al salvataggio
											</span>
											<button
												type="button"
												className="btn btn--small"
												onClick={() =>
													setPendingRemovals(
														pendingRemovals.filter(
															(uuid) =>
																uuid !==
																item.uuid,
														),
													)
												}>
												Annulla
											</button>
										</div>
									) : (
										<button
											type="button"
											className="btn btn--small btn--danger"
											onClick={() =>
												setPendingRemovals([
													...pendingRemovals,
													item.uuid,
												])
											}>
											Rimuovi
										</button>
									)}
								</li>
							);
						})}
					</ul>
				) : (
					<p className="project-repositories__empty">
						Nessun repository inserito.
					</p>
				))}
			{saveError && (
				<p className="notice notice--error" role="alert">
					{saveError}
				</p>
			)}
			<div className="project-repositories__form">
				<h3>Aggiungi un repository</h3>
				<div className="project-repositories__controls">
					<div className="pair__cell">
						<label
							className="pair__lang"
							htmlFor="project-repository-url">
							URL
							<span className="req" aria-hidden="true">
								*
							</span>
						</label>
						<input
							id="project-repository-url"
							className="input"
							type="url"
							value={url}
							onChange={(event) => setUrl(event.target.value)}
							placeholder="https://github.com/"
							required
							disabled={busy || isLoading || Boolean(error)}
						/>
					</div>
					<div className="pair__cell">
						<label
							className="pair__lang"
							htmlFor="project-repository-label">
							Etichetta (opzionale)
						</label>
						<input
							id="project-repository-label"
							className="input"
							type="text"
							maxLength={100}
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							disabled={busy}
						/>
					</div>
					<div className="pair__cell">
						<span className="pair__lang" aria-hidden="true">
							&nbsp;
						</span>
						<button
							type="button"
							className="btn"
							onClick={() => void addRepository()}
							disabled={busy || isLoading || Boolean(error)}>
							{create.isPending
								? "Aggiunta in corso"
								: "Aggiungi repository"}
						</button>
					</div>
				</div>
				{formError && (
					<p className="notice notice--error" role="alert">
						{formError}
					</p>
				)}
				{formStatus && (
					<p className="notice notice--ok" role="status">
						{formStatus}
					</p>
				)}
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
	const remove = useRemove(repositoryEndpoint);
	const back = `/${resource.path}`;
	const locationState = location.state as {
		failedRepositoryDrafts?: ProjectRepositoryDraft[];
	} | null;
	const failedRepositoryDrafts = locationState?.failedRepositoryDrafts ?? [];
	const [pendingDrafts] = useState(failedRepositoryDrafts);
	const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);
	const [repositorySaveError, setRepositorySaveError] = useState<
		string | null
	>(null);

	useEffect(() => {
		if (failedRepositoryDrafts.length > 0) {
			navigate(location.pathname, { replace: true, state: null });
		}
	}, [failedRepositoryDrafts.length, location.pathname, navigate]);

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

	const submit = async (payload: Record<string, unknown>) => {
		setRepositorySaveError(null);
		const project = await update.mutateAsync({ uuid, payload });
		const failedUuids: string[] = [];
		let firstFailure: unknown;
		for (const repositoryUuid of pendingRemovals) {
			try {
				await remove.mutateAsync(repositoryUuid);
			} catch (error) {
				failedUuids.push(repositoryUuid);
				firstFailure ??= error;
			}
		}
		if (failedUuids.length > 0) {
			setPendingRemovals(failedUuids);
			setRepositorySaveError(
				`Il progetto è stato salvato, ma non è stato possibile rimuovere tutti i repository. ${errorMessage(firstFailure, "Eliminazione")}`,
			);
			throw new Error("Rimozione dei repository non completata.");
		}
		setPendingRemovals([]);
		return project;
	};

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
				submit={submit}
				onSaved={() => setRepositorySaveError(null)}
				onCancel={() => navigate(back)}
				submitLabel="Salva modifiche">
				<ProjectRepositories
					projectUuid={uuid}
					pendingRemovals={pendingRemovals}
					setPendingRemovals={setPendingRemovals}
					initialPendingDrafts={pendingDrafts}
					saveError={repositorySaveError}
				/>
			</ResourceForm>
		</>
	);
}

export function ProjectFormPage({ mode }: { mode: "create" | "edit" }) {
	const { uuid } = useParams();
	if (mode === "create") return <CreateView />;
	return <EditView key={uuid ?? ""} uuid={uuid ?? ""} />;
}
