import { Link } from 'react-router-dom';
import { useList, useSingleton } from '../api/hooks';
import { PageHeader } from '../components/PageHeader';
import { COLLECTIONS, RESOURCES } from '../resources/definitions';
import type { ResourceDef } from '../resources/types';

function ListCount({ resource }: { resource: ResourceDef }) {
  const { data, isError } = useList(resource.endpoint);
  if (isError) return <span className="muted">n.d.</span>;
  return <>{data ? data.length : '-'}</>;
}

function SingletonCount({ resource }: { resource: ResourceDef }) {
  const { data, isError, isLoading } = useSingleton(resource.endpoint);
  if (isError) return <span className="muted">n.d.</span>;
  if (isLoading) return <>-</>;
  return <>{data ? 'Presente' : 'Mancante'}</>;
}

export function DashboardPage() {
  const rows = [RESOURCES.personalInfo, ...COLLECTIONS];
  return (
    <>
      <PageHeader title="Contenuti del portfolio" description="Tutto quello che il sito pubblica, in un colpo d'occhio." />
      <ul className="index">
        {rows.map((resource) => (
          <li key={resource.key}>
            <Link to={`/${resource.path}`} className="index__row">
              <span className="index__name">{resource.title}</span>
              <span className="index__count">
                {resource.kind === 'singleton' ? <SingletonCount resource={resource} /> : <ListCount resource={resource} />}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
