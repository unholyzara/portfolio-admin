import type { ReactNode } from 'react';

export type ApiItem = Record<string, any>;

export type ResourceKey =
  | 'personalInfo'
  | 'overview'
  | 'spokenLanguage'
  | 'education'
  | 'company'
  | 'skill'
  | 'technology'
  | 'workExperience'
  | 'workResponsibility'
  | 'project'
  | 'projectRepository';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'date'
  | 'number'
  | 'level'
  | 'boolean'
  | 'select'
  | 'relation'
  | 'relations';

export interface SelectOption {
  value: string;
  label: string;
}

export interface RelationConfig {
  resource: ResourceKey;
  filter?: (item: ApiItem) => boolean;
  preset?: Record<string, unknown>;
  lockedFields?: string[];
}

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  nullable?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  placeholder?: string;
  hint?: string;
  toggleLabel?: string;
  options?: SelectOption[];
  relation?: RelationConfig;
  defaultValue?: string | boolean;
}

export interface PairEntry {
  title: string;
  hint?: string;
  pair: [FieldDef, FieldDef];
}

export type FormEntry = FieldDef | PairEntry;

export interface ColumnDef {
  key: string;
  label: string;
  render?: (item: ApiItem) => ReactNode;
  sortValue?: (item: ApiItem) => string | number;
}

export interface ResourceDef {
  key: ResourceKey;
  kind: 'collection' | 'singleton';
  endpoint: string;
  path: string;
  title: string;
  description: string;
  newLabel: string;
  editLabel: string;
  emptyMessage: string;
  entries: FormEntry[];
  columns: ColumnDef[];
  label: (item: ApiItem) => string;
}
