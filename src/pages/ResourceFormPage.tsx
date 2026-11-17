import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useCreate, useItem, useUpdate } from '../api/hooks';
import { PageHeader } from '../components/PageHeader';
import { ResourceForm } from '../components/form/ResourceForm';
import type { ResourceDef } from '../resources/types';

function CreateView({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const create = useCreate(resource.endpoint);
  const back = `/${resource.path}`;

  return (
    <>
      <PageHeader title={resource.newLabel}>
        <Link to={back} className="btn btn--small">
          Torna all'elenco
        </Link>
      </PageHeader>
      <ResourceForm
        resource={resource}
        submit={(payload) => create.mutateAsync(payload)}
        onSaved={() => navigate(back)}
        onCancel={() => navigate(back)}
        submitLabel="Crea"
      />
    </>
  );
}

function EditView({ resource, uuid }: { resource: ResourceDef; uuid: string }) {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useItem(resource.endpoint, uuid);
  const update = useUpdate(resource.endpoint);
  const back = `/${resource.path}`;

  if (isLoading) {
    return <p className="notice" role="status">Caricamento in corso</p>;
  }

  if (error || !data) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        <PageHeader title={resource.editLabel} />
        <div className="notice notice--error" role="alert">
          <p>{missing ? 'Elemento non trovato. Potrebbe essere stato eliminato.' : "Impossibile caricare l'elemento."}</p>
          {!missing && (
            <button type="button" className="btn btn--small" onClick={() => void refetch()}>
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
      <PageHeader title={resource.editLabel} description={resource.label(data)}>
        <Link to={back} className="btn btn--small">
          Torna all'elenco
        </Link>
      </PageHeader>
      <ResourceForm
        key={uuid}
        resource={resource}
        item={data}
        submit={(payload) => update.mutateAsync({ uuid, payload })}
        onSaved={() => navigate(back)}
        onCancel={() => navigate(back)}
        submitLabel="Salva modifiche"
      />
    </>
  );
}

export function ResourceFormPage({ resource, mode }: { resource: ResourceDef; mode: 'create' | 'edit' }) {
  const { uuid } = useParams();
  if (mode === 'create') return <CreateView resource={resource} />;
  return <EditView resource={resource} uuid={uuid ?? ''} />;
}
