import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, request } from '../api/client';
import { listKey, useCreate, useList, useRemove } from '../api/hooks';
import { ConfirmDialog } from './ConfirmDialog';
import { ENDPOINTS } from '../resources/endpoints';
import type { ApiItem } from '../resources/types';
import { persistResponsibilityOrder, type OrderedResponsibility } from '../resources/work-responsibility-order';

const endpoint = ENDPOINTS.workResponsibility;
const MAX_ORDER = 32767;

interface WorkResponsibility extends ApiItem, OrderedResponsibility {
  work_experience: string;
  description_it: string;
  description_en?: string | null;
}

export interface WorkResponsibilityDraft {
  id: string;
  description_it: string;
  description_en: string;
  error?: string;
}

const errorMessage = (error: unknown, action: string) => {
  if (error instanceof ApiError) {
    return `${action} non riuscito (codice ${error.status}). Riprova.`;
  }
  if (error instanceof Error) return `${action} non riuscito: ${error.message}`;
  return `${action} non riuscito. Riprova.`;
};

const nextOrder = (items: ApiItem[]) => {
  const used = new Set(items.map((item) => Number(item.order)));
  for (let order = 0; order <= MAX_ORDER; order += 1) {
    if (!used.has(order)) return order;
  }
  throw new Error('Non è possibile aggiungere altre mansioni: raggiunto il numero massimo.');
};

const orderedItems = (items: WorkResponsibility[], workExperienceUuid: string) =>
  items
    .filter((item) => item.work_experience === workExperienceUuid)
    .sort((a, b) => Number(a.order) - Number(b.order));

export function WorkResponsibilities({
  workExperienceUuid,
  initialPendingDrafts = [],
}: {
  workExperienceUuid: string;
  initialPendingDrafts?: WorkResponsibilityDraft[];
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useList<WorkResponsibility>(endpoint);
  const create = useCreate(endpoint);
  const remove = useRemove(endpoint);
  const [descriptionIt, setDescriptionIt] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingUuid, setRemovingUuid] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState(initialPendingDrafts);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [retryingDraftId, setRetryingDraftId] = useState<string | null>(null);
  const draggedUuid = useRef<string | null>(null);
  const items = orderedItems(data ?? [], workExperienceUuid);
  const busy = ordering || create.isPending || remove.isPending;

  const addResponsibility = async () => {
    const italian = descriptionIt.trim();
    if (!italian) {
      setFormError('Inserisci la descrizione in italiano.');
      return;
    }

    setFormError(null);
    setFormStatus(null);
    try {
      await create.mutateAsync({
        active: true,
        work_experience: workExperienceUuid,
        description_it: italian,
        description_en: descriptionEn.trim() || null,
        order: nextOrder(items),
      });
      setDescriptionIt('');
      setDescriptionEn('');
      setFormStatus('Mansione aggiunta.');
    } catch (submitError) {
      setFormError(errorMessage(submitError, "Aggiunta della mansione"));
    }
  };

  const persistOrder = async (next: WorkResponsibility[]) => {
    setOrderError(null);
    setOrderStatus(null);
    setOrdering(true);
    try {
      await persistResponsibilityOrder(items, next, (uuid, order) =>
        request(`${endpoint}${uuid}/`, { method: 'PATCH', body: { order } }),
      );
      setOrderStatus('Ordine aggiornato.');
    } catch (reorderError) {
      setOrderError(errorMessage(reorderError, 'Riordino'));
    } finally {
      await queryClient.invalidateQueries({ queryKey: listKey(endpoint) });
      setOrdering(false);
      draggedUuid.current = null;
    }
  };

  const moveItem = (uuid: string, offset: number) => {
    const from = items.findIndex((item) => item.uuid === uuid);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= items.length || busy) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
  };

  const confirmRemoval = async () => {
    if (!removingUuid) return;
    setRemoveError(null);
    try {
      await remove.mutateAsync(removingUuid);
      setRemovingUuid(null);
    } catch (deleteError) {
      setRemoveError(errorMessage(deleteError, 'Eliminazione'));
    }
  };

  const retryPendingDraft = async (draft: WorkResponsibilityDraft) => {
    setPendingError(null);
    setRetryingDraftId(draft.id);
    try {
      await create.mutateAsync({
        active: true,
        work_experience: workExperienceUuid,
        description_it: draft.description_it,
        description_en: draft.description_en.trim() || null,
        order: nextOrder(items),
      });
      setPendingDrafts((current) => current.filter((item) => item.id !== draft.id));
    } catch (retryError) {
      setPendingError(errorMessage(retryError, 'Creazione della mansione'));
    } finally {
      setRetryingDraftId(null);
    }
  };

  return (
    <section className="work-responsibilities" aria-labelledby="responsibilities-title">
      <div className="work-responsibilities__heading">
        <div>
          <h2 id="responsibilities-title">Mansioni</h2>
          <p>Aggiungi le attività svolte e trascinale per cambiarne l'ordine.</p>
        </div>
        <span className="work-responsibilities__count">{items.length}</span>
      </div>

      {pendingDrafts.length > 0 && (
        <div className="work-responsibilities__pending">
          <p>Esperienza creata, ma alcune mansioni non sono state salvate. Puoi riprovare qui:</p>
          <ul>
            {pendingDrafts.map((draft) => (
              <li key={draft.id}>
                <span>
                  {draft.description_it}
                  {draft.error && <small className="work-responsibilities__pending-error">{draft.error}</small>}
                </span>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void retryPendingDraft(draft)}
                  disabled={busy || isLoading || Boolean(error)}
                >
                  {retryingDraftId === draft.id ? 'Salvataggio in corso' : 'Riprova'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pendingError && <p className="notice notice--error" role="alert">{pendingError}</p>}

      {isLoading && <p className="notice" role="status">Caricamento mansioni in corso</p>}
      {error && (
        <div className="notice notice--error" role="alert">
          <p>Impossibile caricare le mansioni.</p>
          <button type="button" className="btn btn--small" onClick={() => void refetch()}>
            Riprova
          </button>
        </div>
      )}

      {!isLoading && !error && (
        items.length ? (
          <ol className="work-responsibilities__list" aria-label="Mansioni in ordine">
            {items.map((item, index) => (
              <li
                className="work-responsibilities__item"
                key={item.uuid}
                draggable={!busy}
                onDragStart={(event) => {
                  draggedUuid.current = item.uuid;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', item.uuid);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const source = event.dataTransfer.getData('text/plain') || draggedUuid.current;
                  const from = items.findIndex((row) => row.uuid === source);
                  const to = items.findIndex((row) => row.uuid === item.uuid);
                  if (from < 0 || to < 0 || from === to || busy) return;
                  const next = [...items];
                  const [moved] = next.splice(from, 1);
                  next.splice(to, 0, moved);
                  void persistOrder(next);
                }}
              >
                <div className="work-responsibilities__text">
                  <span className="work-responsibilities__number">{index + 1}</span>
                  <p>{item.description_it}</p>
                  {item.description_en && <p className="work-responsibilities__translation">{item.description_en}</p>}
                </div>
                <div className="work-responsibilities__actions">
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Sposta la mansione ${index + 1} in alto`}
                    onClick={() => moveItem(item.uuid, -1)}
                    disabled={busy || index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--small"
                    aria-label={`Sposta la mansione ${index + 1} in basso`}
                    onClick={() => moveItem(item.uuid, 1)}
                    disabled={busy || index === items.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--small btn--danger"
                    onClick={() => {
                      setRemoveError(null);
                      setRemovingUuid(item.uuid);
                    }}
                    disabled={busy}
                  >
                    Rimuovi
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="work-responsibilities__empty">Nessuna mansione inserita.</p>
        )
      )}

      {orderError && <p className="notice notice--error" role="alert">{orderError}</p>}
      {orderStatus && <p className="notice notice--ok" role="status">{orderStatus}</p>}

      <div className="work-responsibilities__form">
        <h3>Aggiungi una mansione</h3>
        <div className="form-row">
          <div className="form-row__rail">
            <span className="form-row__label">
              Descrizione
              <span className="req" aria-hidden="true">*</span>
            </span>
          </div>
          <div className="form-row__body pair">
            <div className="pair__cell">
              <label className="pair__lang" htmlFor="responsibility-it">Italiano</label>
              <textarea
                id="responsibility-it"
                className="input input--area"
                value={descriptionIt}
                onChange={(event) => setDescriptionIt(event.target.value)}
                required
                disabled={busy || isLoading || Boolean(error)}
              />
            </div>
            <div className="pair__cell">
              <label className="pair__lang" htmlFor="responsibility-en">Inglese</label>
              <textarea
                id="responsibility-en"
                className="input input--area"
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                disabled={busy || isLoading || Boolean(error)}
              />
            </div>
          </div>
        </div>
        {formError && <p className="notice notice--error" role="alert">{formError}</p>}
        {formStatus && <p className="notice notice--ok" role="status">{formStatus}</p>}
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void addResponsibility()}
          disabled={busy || isLoading || Boolean(error)}>
          {create.isPending ? 'Aggiunta in corso' : 'Aggiungi mansione'}
        </button>
      </div>

      {removingUuid && (
        <ConfirmDialog
          title="Eliminare la mansione?"
          message="La mansione verrà eliminata definitivamente."
          confirmLabel={remove.isPending ? 'Eliminazione in corso' : 'Elimina'}
          tone="danger"
          busy={remove.isPending}
          error={removeError}
          onConfirm={() => void confirmRemoval()}
          onCancel={() => {
            if (!remove.isPending) setRemovingUuid(null);
          }}
        />
      )}
    </section>
  );
}
