import { useState } from 'react';
import { useCreate } from '../../api/hooks';
import { RESOURCES } from '../../resources/definitions';
import type { RelationConfig } from '../../resources/types';
import { Drawer } from '../Drawer';
import { ResourceForm } from './ResourceForm';

interface Props {
  relation: RelationConfig;
  onCreated: (uuid: string) => void;
}

export function QuickCreate({ relation, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const resource = RESOURCES[relation.resource];
  const create = useCreate(resource.endpoint);

  return (
    <>
      <button type="button" className="btn btn--small" onClick={() => setOpen(true)}>
        {resource.newLabel}
      </button>
      {open && (
        <Drawer title={resource.newLabel} onClose={() => setOpen(false)}>
          <ResourceForm
            resource={resource}
            preset={relation.preset}
            lockedFields={relation.lockedFields}
            allowQuickCreate={false}
            submit={(payload) => create.mutateAsync(payload)}
            onSaved={(result) => {
              if (result && result.uuid) onCreated(String(result.uuid));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            submitLabel="Crea e seleziona"
          />
        </Drawer>
      )}
    </>
  );
}
