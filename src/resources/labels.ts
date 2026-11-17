import type { ApiItem } from './types';

export const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return '';
};

export const companyLabel = (item: ApiItem) => firstText(item.name);

export const skillLabel = (item: ApiItem) => firstText(item.name_it, item.name_en, item.name);

export const technologyLabel = (item: ApiItem) => firstText(item.name);

export const projectLabel = (item: ApiItem) => firstText(item.title_it, item.title_en, item.title);

export const workExperienceLabel = (item: ApiItem) => {
  const title = firstText(item.title_it, item.title_en, item.title);
  const company = item.company && typeof item.company === 'object' ? firstText(item.company.name) : '';
  return company ? `${title} (${company})` : title;
};
