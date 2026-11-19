import { useMemo, useState, type ReactNode } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '../../api/client';
import { buildSchema, flattenEntries, serverMessage, toFormValues, toPayload } from '../../resources/form-utils';
import type { ApiItem, FieldDef, FormEntry, ResourceDef } from '../../resources/types';
import { FieldControl, fieldId } from './FieldControl';

type SubmitResult = ApiItem | undefined | void;

export interface ResourceFormProps {
  resource: ResourceDef;
  item?: ApiItem | null;
  preset?: Record<string, unknown>;
  lockedFields?: string[];
  allowQuickCreate?: boolean;
  submit: (payload: Record<string, unknown>) => Promise<SubmitResult>;
  onSaved: (result: SubmitResult) => void;
  onCancel?: () => void;
  submitLabel: string;
  children?: ReactNode;
}

const isVisible = (entry: FormEntry, locked: string[]) =>
  'pair' in entry ? !entry.pair.some((field) => locked.includes(field.name)) : !locked.includes(entry.name);

function Required({ field }: { field: FieldDef }) {
  return field.required ? (
    <span className="req" aria-hidden="true">
      *
    </span>
  ) : null;
}

export function ResourceForm({
  resource,
  item,
  preset = {},
  lockedFields = [],
  allowQuickCreate = true,
  submit,
  onSaved,
  onCancel,
  submitLabel,
  children,
}: ResourceFormProps) {
  const entries = useMemo(
    () => resource.entries.filter((entry) => isVisible(entry, lockedFields)),
    [resource, lockedFields],
  );
  const fields = useMemo(() => flattenEntries(entries), [entries]);
  const schema = useMemo(() => buildSchema(fields), [fields]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(fields, item, preset),
    mode: 'onTouched',
  });

  const { errors, isSubmitting, isDirty } = form.formState;

  const onValid = async (values: FieldValues) => {
    setFormError(null);
    setSaved(false);
    const locked = Object.fromEntries(lockedFields.map((name) => [name, preset[name]]));
    try {
      const result = await submit({ ...locked, ...toPayload(fields, values) });
      form.reset(values);
      setSaved(true);
      onSaved(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.data && typeof error.data === 'object') {
        const general: string[] = [];
        for (const [key, message] of Object.entries(error.data as Record<string, unknown>)) {
          if (fields.some((field) => field.name === key)) {
            form.setError(key, { type: 'server', message: serverMessage(message) });
          } else {
            general.push(serverMessage(message));
          }
        }
        setFormError(general.length ? general.join(' ') : 'Controlla i campi evidenziati.');
        return;
      }
      const status = error instanceof ApiError ? ` (codice ${error.status})` : '';
      setFormError(`Salvataggio non riuscito${status}. Riprova.`);
    }
  };

  const errorOf = (name: string) => {
    const error = errors[name];
    return error && typeof error.message === 'string' ? error.message : null;
  };

  return (
    <form
      className="form"
      noValidate
      onSubmit={(event) => {
        event.stopPropagation();
        void form.handleSubmit(onValid)(event);
      }}
    >
      {entries.map((entry) => {
        if ('pair' in entry) {
          return (
            <div className="form-row" key={entry.pair[0].name}>
              <div className="form-row__rail">
                <span className="form-row__label">
                  {entry.title}
                  <Required field={entry.pair[0]} />
                </span>
                {entry.hint && <p className="form-row__hint">{entry.hint}</p>}
              </div>
              <div className="form-row__body pair">
                {entry.pair.map((field) => (
                  <div className="pair__cell" key={field.name}>
                    <label className="pair__lang" htmlFor={fieldId(field.name)}>
                      {field.label}
                    </label>
                    <FieldControl field={field} form={form} allowQuickCreate={allowQuickCreate} />
                    {errorOf(field.name) && (
                      <p className="field-error" role="alert">
                        {errorOf(field.name)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="form-row" key={entry.name}>
            <div className="form-row__rail">
              <label className="form-row__label" id={`label-${entry.name}`} htmlFor={fieldId(entry.name)}>
                {entry.label}
                <Required field={entry} />
              </label>
              {entry.hint && <p className="form-row__hint">{entry.hint}</p>}
            </div>
            <div className="form-row__body">
              <FieldControl field={entry} form={form} allowQuickCreate={allowQuickCreate} />
              {errorOf(entry.name) && (
                <p className="field-error" role="alert">
                  {errorOf(entry.name)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {children}

      <div className="form__footer">
        <div className="form__status" aria-live="polite">
          {formError && (
            <p className="notice notice--error" role="alert">
              {formError}
            </p>
          )}
          {saved && !isDirty && !formError && <p className="notice notice--ok">Modifiche salvate</p>}
        </div>
        <div className="form__actions">
          {onCancel && (
            <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
              Annulla
            </button>
          )}
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio in corso' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
