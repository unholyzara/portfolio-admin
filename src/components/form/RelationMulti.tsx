import { useState } from 'react';
import { useList } from '../../api/hooks';
import { RESOURCES } from '../../resources/definitions';
import type { FieldDef } from '../../resources/types';
import { QuickCreate } from './QuickCreate';

interface Props {
  id: string;
  field: FieldDef;
  value: string[];
  onChange: (value: string[]) => void;
  allowQuickCreate: boolean;
}

const SEARCH_THRESHOLD = 12;

export function RelationMulti({ id, field, value, onChange, allowQuickCreate }: Props) {
  const relation = field.relation!;
  const resource = RESOURCES[relation.resource];
  const { data, isLoading, isError } = useList(resource.endpoint);
  const [query, setQuery] = useState('');

  const options = (data ?? []).filter(relation.filter ?? (() => true));
  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((item) => resource.label(item).toLowerCase().includes(needle)) : options;

  const toggle = (uuid: string) =>
    onChange(value.includes(uuid) ? value.filter((entry) => entry !== uuid) : [...value, uuid]);

  const addCreated = (uuid: string) => {
    if (!value.includes(uuid)) onChange([...value, uuid]);
  };

  return (
    <div className="relation-multi">
      <div className="relation-multi__tools">
        {options.length > SEARCH_THRESHOLD && (
          <input
            type="search"
            className="input input--compact"
            placeholder="Filtra l'elenco"
            aria-label={`Filtra ${field.label}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        {allowQuickCreate && <QuickCreate relation={relation} onCreated={addCreated} />}
      </div>
      <div id={id} role="group" aria-labelledby={`label-${field.name}`} className="chips">
        {isLoading && <span className="muted">Caricamento...</span>}
        {isError && (
          <span className="field-error" role="alert">
            Impossibile caricare l'elenco
          </span>
        )}
        {!isLoading && !isError && options.length === 0 && <span className="muted">Nessun elemento disponibile</span>}
        {visible.map((item) => {
          const selected = value.includes(item.uuid);
          return (
            <button
              key={item.uuid}
              type="button"
              className={selected ? 'chip is-selected' : 'chip'}
              aria-pressed={selected}
              onClick={() => toggle(item.uuid)}
            >
              {resource.label(item)}
            </button>
          );
        })}
      </div>
      <p className="muted relation-multi__count">{value.length} selezionati</p>
    </div>
  );
}
