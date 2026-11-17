import { describe, expect, it } from 'vitest';
import { RESOURCES } from './definitions';
import { buildSchema, flattenEntries, toFormValues, toPayload } from './form-utils';

const experience = RESOURCES.workExperience;
const fields = flattenEntries(experience.entries);

const apiExperience = {
  uuid: 'e1',
  active: true,
  title_it: 'Sviluppatore',
  title_en: null,
  description_it: null,
  description_en: 'Backend work',
  company: { uuid: 'c1', name: 'Acme', website: null },
  start_date: '03/2021',
  end_date: null,
  technical_skills: [{ uuid: 's1' }, { uuid: 's2' }],
  soft_skills: [],
  technologies: [{ uuid: 't1' }],
};

describe('toFormValues', () => {
  it('extracts uuids from nested relations and keeps nulls as empty strings', () => {
    const values = toFormValues(fields, apiExperience);
    expect(values.company).toBe('c1');
    expect(values.technical_skills).toEqual(['s1', 's2']);
    expect(values.technologies).toEqual(['t1']);
    expect(values.title_en).toBe('');
    expect(values.end_date).toBe('');
    expect(values.active).toBe(true);
  });

  it('defaults active to true on create and applies defaults for numbers', () => {
    const responsibility = flattenEntries(RESOURCES.workResponsibility.entries);
    const values = toFormValues(responsibility);
    expect(values.active).toBe(true);
    expect(values.order).toBe('0');
    expect(values.work_experience).toBe('');
  });
});

describe('toPayload', () => {
  it('sends null for empty nullable fields and relations', () => {
    const values = { ...toFormValues(fields, apiExperience), company: '' };
    const payload = toPayload(fields, values);
    expect(payload.company).toBeNull();
    expect(payload.end_date).toBeNull();
    expect(payload.title_en).toBeNull();
    expect(payload.title_it).toBe('Sviluppatore');
    expect(payload.technologies).toEqual(['t1']);
  });

  it('keeps empty strings for non nullable optional text and converts numbers', () => {
    const repository = flattenEntries(RESOURCES.projectRepository.entries);
    const payload = toPayload(repository, { project: 'p1', url: 'https://github.com/x', label: '' });
    expect(payload.label).toBe('');
    const responsibility = flattenEntries(RESOURCES.workResponsibility.entries);
    const withOrder = toPayload(responsibility, {
      active: true,
      work_experience: 'e1',
      description_it: 'x',
      description_en: '',
      order: '4',
    });
    expect(withOrder.order).toBe(4);
  });
});

describe('buildSchema', () => {
  const schema = buildSchema(fields);
  const valid = toFormValues(fields, apiExperience);

  it('accepts a complete work experience', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('rejects dates outside MM/YYYY or DD/MM/YYYY', () => {
    expect(schema.safeParse({ ...valid, start_date: '2021-03' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, start_date: '15/03/2021' }).success).toBe(true);
    expect(schema.safeParse({ ...valid, end_date: '13/2022' }).success).toBe(false);
  });

  it('requires the italian title', () => {
    const result = schema.safeParse({ ...valid, title_it: '  ' });
    expect(result.success).toBe(false);
  });

  it('validates levels between 1 and 5', () => {
    const technology = buildSchema(flattenEntries(RESOURCES.technology.entries));
    const base = { active: true, name: 'Python', typology: 'language' };
    expect(technology.safeParse({ ...base, level: '5' }).success).toBe(true);
    expect(technology.safeParse({ ...base, level: '6' }).success).toBe(false);
    expect(technology.safeParse({ ...base, level: '' }).success).toBe(false);
  });
});
