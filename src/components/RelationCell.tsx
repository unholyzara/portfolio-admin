import { useList } from '../api/hooks';
import type { ApiItem } from '../resources/types';

interface Props {
  endpoint: string;
  uuid: string | null | undefined;
  labelOf: (item: ApiItem) => string;
}

export function RelationCell({ endpoint, uuid, labelOf }: Props) {
  const { data } = useList(endpoint);
  if (!uuid) return <span className="muted">Nessuno</span>;
  const found = data?.find((item) => item.uuid === uuid);
  return <>{found ? labelOf(found) : '...'}</>;
}
