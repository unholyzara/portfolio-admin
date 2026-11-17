import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useList, usePatch, useRemove } from "../api/hooks";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { flattenEntries } from "../resources/form-utils";
import type { ApiItem, ResourceDef } from "../resources/types";

interface SortState {
	index: number;
	direction: 1 | -1;
}

export function ResourceListPage({ resource }: { resource: ResourceDef }) {
	const { data, isLoading, isError, refetch } = useList(resource.endpoint);
	const remove = useRemove(resource.endpoint);
	const patch = usePatch(resource.endpoint);
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<SortState | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ApiItem | null>(null);

	const hasActive = useMemo(
		() =>
			flattenEntries(resource.entries).some(
				(field) => field.name === "active",
			),
		[resource],
	);

	const rows = useMemo(() => {
		const needle = query.trim().toLowerCase();
		const filtered = needle
			? (data ?? []).filter((item) =>
					JSON.stringify(item).toLowerCase().includes(needle),
				)
			: [...(data ?? [])];
		if (sort) {
			const sortValue = resource.columns[sort.index]?.sortValue;
			if (sortValue) {
				filtered.sort((a, b) => {
					const left = sortValue(a);
					const right = sortValue(b);
					return left < right
						? -sort.direction
						: left > right
							? sort.direction
							: 0;
				});
			}
		}
		return filtered;
	}, [data, query, sort, resource]);

	const toggleSort = (index: number) =>
		setSort((current) =>
			current && current.index === index
				? { index, direction: current.direction === 1 ? -1 : 1 }
				: { index, direction: 1 },
		);

	const confirmDelete = () => {
		if (!pendingDelete) return;
		remove.mutate(pendingDelete.uuid, {
			onSuccess: () => setPendingDelete(null),
		});
	};

	const deleteError = remove.isError
		? remove.error instanceof ApiError && remove.error.status === 403
			? "Non hai i permessi per eliminare questo elemento."
			: "Impossibile eliminare l'elemento. Potrebbe essere usato da altri record."
		: null;

	const base = `/${resource.path}`;

	return (
		<>
			<PageHeader
				title={resource.title}
				description={resource.description}>
				<p className="page-head__count" aria-live="polite">
					{data
						? `${data.length} ${data.length === 1 ? "elemento" : "elementi"}`
						: ""}
				</p>
				<Link to={`${base}/new`} className="btn btn--primary">
					{resource.newLabel}
				</Link>
			</PageHeader>

			{isLoading && (
				<p className="notice" role="status">
					Caricamento in corso
				</p>
			)}

			{isError && (
				<div className="notice notice--error" role="alert">
					<p>Impossibile caricare i dati.</p>
					<button
						type="button"
						className="btn btn--small"
						onClick={() => void refetch()}>
						Riprova
					</button>
				</div>
			)}

			{patch.isError && (
				<p className="notice notice--error" role="alert">
					Impossibile aggiornare la visibilità. Riprova.
				</p>
			)}

			{data && data.length === 0 && (
				<div className="empty">
					<p className="empty__text">{resource.emptyMessage}</p>
					<Link to={`${base}/new`} className="btn btn--primary">
						{resource.newLabel}
					</Link>
				</div>
			)}

			{data && data.length > 0 && (
				<>
					<div className="toolbar">
						<label className="toolbar__search">
							<span className="visually-hidden">
								Cerca in {resource.title}
							</span>
							<input
								type="search"
								className="input"
								placeholder="Cerca"
								value={query}
								onChange={(event) =>
									setQuery(event.target.value)
								}
							/>
						</label>
					</div>
					<div className="table-wrap">
						<table className="table">
							<thead>
								<tr>
									{resource.columns.map((column, index) => (
										<th
											key={column.key}
											scope="col"
											aria-sort={
												sort?.index === index
													? sort.direction === 1
														? "ascending"
														: "descending"
													: undefined
											}>
											{column.sortValue ? (
												<button
													type="button"
													className="table__sort"
													onClick={() =>
														toggleSort(index)
													}>
													{column.label}
													<span
														className="table__arrow"
														aria-hidden="true">
														{sort?.index === index
															? sort.direction ===
																1
																? "▲"
																: "▼"
															: ""}
													</span>
												</button>
											) : (
												column.label
											)}
										</th>
									))}
									{hasActive && <th scope="col">Visibile</th>}
									<th
										scope="col"
										className="table__actions-head">
										<span className="visually-hidden">
											Azioni
										</span>
									</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((item) => (
									<tr
										key={item.uuid}
										className={
											hasActive && item.active === false
												? "is-inactive"
												: undefined
										}
										onDoubleClick={() =>
											navigate(`${base}/${item.uuid}`)
										}>
										{resource.columns.map(
											(column, index) => (
												<td key={column.key}>
													{index === 0 ? (
														<Link
															to={`${base}/${item.uuid}`}
															className="table__link">
															{column.render
																? column.render(
																		item,
																	)
																: String(
																		item[
																			column
																				.key
																		] ?? "",
																	)}
														</Link>
													) : column.render ? (
														column.render(item)
													) : (
														String(
															item[column.key] ??
																"",
														)
													)}
												</td>
											),
										)}
										{hasActive && (
											<td className="table__active">
												<button
													type="button"
													className={
														item.active === false
															? "flag flag--button"
															: "flag flag--button is-on"
													}
													aria-pressed={
														item.active !== false
													}
													aria-label={`Visibile sul portfolio: ${resource.label(item)}`}
													disabled={
														patch.isPending &&
														patch.variables
															?.uuid === item.uuid
													}
													onDoubleClick={(event) =>
														event.stopPropagation()
													}
													onClick={() =>
														patch.mutate({
															uuid: item.uuid,
															payload: {
																active:
																	item.active ===
																	false,
															},
														})
													}>
													{item.active === false
														? "No"
														: "Sì"}
												</button>
											</td>
										)}
										<td className="table__actions">
											<Link
												to={`${base}/${item.uuid}`}
												className="btn btn--small">
												Modifica
											</Link>
											<button
												type="button"
												className="btn btn--small btn--danger"
												onClick={() => {
													remove.reset();
													setPendingDelete(item);
												}}>
												Elimina
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{rows.length === 0 && (
							<p className="notice">
								Nessun risultato per «{query}».
							</p>
						)}
					</div>
				</>
			)}

			{pendingDelete && (
				<ConfirmDialog
					title="Eliminare questo elemento?"
					message={`«${resource.label(pendingDelete) || "Senza titolo"}» verrà rimosso definitivamente.`}
					confirmLabel="Elimina"
					tone="danger"
					busy={remove.isPending}
					error={deleteError}
					onConfirm={confirmDelete}
					onCancel={() => setPendingDelete(null)}
				/>
			)}
		</>
	);
}
