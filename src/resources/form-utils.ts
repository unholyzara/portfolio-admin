import { z } from 'zod';
import type { ApiItem, FieldDef, FormEntry } from './types';

const REQUIRED_MESSAGE = 'Campo obbligatorio';

export const flattenEntries = (entries: FormEntry[]): FieldDef[] =>
  entries.flatMap((entry) => ('pair' in entry ? entry.pair : [entry]));

const textSchema = (field: FieldDef) => {
  let base = z.string().trim();
  if (field.maxLength) {
    base = base.max(field.maxLength, `Massimo ${field.maxLength} caratteri`);
  }
  return base.superRefine((value, ctx) => {
    if (value === '') {
      if (field.required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: REQUIRED_MESSAGE });
      return;
    }
    if (field.kind === 'email' && !z.string().email().safeParse(value).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Indirizzo email non valido' });
    }
    if (field.kind === 'url' && !z.string().url().safeParse(value).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL non valido, includi http:// o https://' });
    }
    if (field.pattern && !field.pattern.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: field.patternMessage ?? 'Formato non valido' });
    }
  });
};

const numberSchema = (field: FieldDef) =>
  z.string().superRefine((value, ctx) => {
    if (value.trim() === '') {
      if (field.required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: REQUIRED_MESSAGE });
      return;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inserisci un numero intero' });
      return;
    }
    const belowMin = field.min !== undefined && parsed < field.min;
    const aboveMax = field.max !== undefined && parsed > field.max;
    if (belowMin || aboveMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Il valore deve essere tra ${field.min ?? '-'} e ${field.max ?? '-'}`,
      });
    }
  });

export const fieldSchema = (field: FieldDef): z.ZodTypeAny => {
  switch (field.kind) {
    case 'boolean':
      return z.boolean();
    case 'relations':
      return z.array(z.string());
    case 'relation':
    case 'select':
      return field.required ? z.string().min(1, 'Seleziona un valore') : z.string();
    case 'number':
    case 'level':
      return numberSchema(field);
    default:
      return textSchema(field);
  }
};

export const buildSchema = (fields: FieldDef[]) =>
  z.object(Object.fromEntries(fields.map((field) => [field.name, fieldSchema(field)])));

export const extractUuid = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'uuid' in value) {
    return String((value as { uuid: unknown }).uuid);
  }
  return '';
};

export const toFormValues = (
  fields: FieldDef[],
  item?: ApiItem | null,
  preset: Record<string, unknown> = {},
): Record<string, unknown> => {
  const source: ApiItem = item ?? preset;
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = source[field.name];
    switch (field.kind) {
      case 'boolean':
        values[field.name] = raw === undefined || raw === null ? field.defaultValue === true : Boolean(raw);
        break;
      case 'relations':
        values[field.name] = Array.isArray(raw) ? raw.map(extractUuid).filter(Boolean) : [];
        break;
      case 'relation':
        values[field.name] = extractUuid(raw);
        break;
      default:
        values[field.name] = raw === undefined || raw === null ? String(field.defaultValue ?? '') : String(raw);
    }
  }
  return values;
};

export const toPayload = (fields: FieldDef[], values: Record<string, unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    switch (field.kind) {
      case 'boolean':
        payload[field.name] = Boolean(value);
        break;
      case 'relations':
        payload[field.name] = Array.isArray(value) ? value : [];
        break;
      case 'relation':
        payload[field.name] = value === '' || value === undefined ? null : value;
        break;
      case 'number':
      case 'level': {
        const text = String(value ?? '').trim();
        if (text !== '') payload[field.name] = Number(text);
        else if (field.nullable) payload[field.name] = null;
        break;
      }
      default: {
        const text = String(value ?? '').trim();
        payload[field.name] = text === '' && field.nullable ? null : text;
      }
    }
  }
  return payload;
};

export const serverMessage = (value: unknown): string =>
  Array.isArray(value) ? value.map(String).join(' ') : String(value);
