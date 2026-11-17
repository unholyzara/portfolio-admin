import { Controller, type FieldValues, type UseFormReturn } from 'react-hook-form';
import type { FieldDef } from '../../resources/types';
import { LevelInput } from './LevelInput';
import { RelationMulti } from './RelationMulti';
import { RelationSelect } from './RelationSelect';

interface Props {
  field: FieldDef;
  form: UseFormReturn<FieldValues>;
  allowQuickCreate: boolean;
}

export const fieldId = (name: string) => `field-${name}`;

export function FieldControl({ field, form, allowQuickCreate }: Props) {
  const id = fieldId(field.name);
  const invalid = Boolean(form.formState.errors[field.name]);
  const { register, control } = form;

  switch (field.kind) {
    case 'textarea':
      return (
        <textarea
          id={id}
          className="input input--area"
          rows={6}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          {...register(field.name)}
        />
      );
    case 'boolean':
      return (
        <label className="check">
          <input id={id} type="checkbox" {...register(field.name)} />
          <span className="check__box" aria-hidden="true" />
          <span>{field.toggleLabel ?? 'Attivo'}</span>
        </label>
      );
    case 'select':
      return (
        <select id={id} className="input" aria-invalid={invalid} {...register(field.name)}>
          <option value="">Seleziona...</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'level':
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: bound }) => (
            <LevelInput id={id} value={String(bound.value ?? '')} onChange={bound.onChange} />
          )}
        />
      );
    case 'relation':
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: bound }) => (
            <RelationSelect
              id={id}
              field={field}
              value={String(bound.value ?? '')}
              onChange={(next) => bound.onChange(next)}
              invalid={invalid}
              allowQuickCreate={allowQuickCreate}
            />
          )}
        />
      );
    case 'relations':
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: bound }) => (
            <RelationMulti
              id={id}
              field={field}
              value={Array.isArray(bound.value) ? bound.value : []}
              onChange={bound.onChange}
              allowQuickCreate={allowQuickCreate}
            />
          )}
        />
      );
    case 'number':
      return (
        <input
          id={id}
          className="input"
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          aria-invalid={invalid}
          {...register(field.name)}
        />
      );
    default:
      return (
        <input
          id={id}
          className="input"
          type={field.kind === 'date' ? 'date' : field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          aria-invalid={invalid}
          autoComplete="off"
          {...register(field.name)}
        />
      );
  }
}
