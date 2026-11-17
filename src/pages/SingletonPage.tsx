import { useSaveSingleton, useSingleton } from '../api/hooks';
import { PageHeader } from '../components/PageHeader';
import { ResourceForm } from '../components/form/ResourceForm';
import type { ResourceDef } from '../resources/types';

export function SingletonPage({ resource }: { resource: ResourceDef }) {
  const { data, isLoading, isError, refetch } = useSingleton(resource.endpoint);
  const save = useSaveSingleton(resource.endpoint);

  return (
    <>
      <PageHeader title={resource.title} description={resource.description} />
      {isLoading && <p className="notice" role="status">Caricamento in corso</p>}
      {isError && (
        <div className="notice notice--error" role="alert">
          <p>Impossibile caricare i dati.</p>
          <button type="button" className="btn btn--small" onClick={() => void refetch()}>
            Riprova
          </button>
        </div>
      )}
      {data === null && <p className="notice">{resource.emptyMessage}</p>}
      {data !== undefined && !isError && (
        <ResourceForm
          key={data?.uuid ?? 'new'}
          resource={resource}
          item={data}
          submit={(payload) => save.mutateAsync({ payload, exists: data !== null })}
          onSaved={() => undefined}
          submitLabel={data ? 'Salva modifiche' : 'Crea'}
        />
      )}
    </>
  );
}
