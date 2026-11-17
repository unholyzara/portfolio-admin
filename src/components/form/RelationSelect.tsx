import { useList } from '../../api/hooks';
import { RESOURCES } from '../../resources/definitions';
import type { FieldDef } from '../../resources/types';
import { QuickCreate } from './QuickCreate';

interface Props {
  id: string;
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  allowQuickCreate: boolean;
}

export function RelationSelect({ id, field, value, onChange, invalid, allowQuickCreate }: Props) {
  const relation = field.relation!;
  const resource = RESOURCES[relation.resource];
  const { data, isLoading, isError } = useList(resource.endpoint);
  const options = (data ?? []).filter(relation.filter ?? (() => true));

  return (
    <div className="relation">
      <select
        id={id}
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        disabled={isLoading}
      >
        <option value="">{field.required ? 'Seleziona...' : 'Nessuno'}</option>
        {options.map((item) => (
          <option key={item.uuid} value={item.uuid}>
            {resource.label(item)}
          </option>
        ))}
      </select>
      {allowQuickCreate && <QuickCreate relation={relation} onCreated={onChange} />}
      {isError && (
        <p className="field-error" role="alert">
          Impossibile caricare l'elenco
        </p>
      )}
    </div>
  );
}
