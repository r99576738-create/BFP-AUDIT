import type { AuditField, AuditSummary, Locale } from '../audit.models';
import { TUNISIA_GOVERNORATES } from './tunisia-locations.data';

const EMPTY = '—';

export function governorateName(code: string | null | undefined, locale: Locale): string {
  if (!code) return '';
  const gov = TUNISIA_GOVERNORATES.find(g => g.code === code);
  if (!gov) return code;
  return locale === 'ar' ? gov.nameAr : gov.name;
}

export function cityName(name: string | null | undefined, locale: Locale): string {
  if (!name) return '';
  if (locale !== 'ar') return name;
  for (const gov of TUNISIA_GOVERNORATES) {
    const city = gov.cities.find(c => c.name === name);
    if (city) return city.nameAr;
  }
  return name;
}

export function formatAnswer(field: AuditField, value: unknown, locale: Locale): string {
  if (value === null || value === undefined) return EMPTY;

  switch (field.type) {
    case 'toggle':
      if (typeof value !== 'boolean') return EMPTY;
      if (locale === 'ar') return value ? 'نعم' : 'لا';
      return value ? 'Oui' : 'Non';

    case 'choice': {
      const option = field.options?.find(o => o.value === value);
      return option ? option.label[locale] ?? option.label.fr : EMPTY;
    }

    case 'governorate':
      return governorateName(String(value), locale) || EMPTY;

    case 'city':
      return cityName(String(value), locale) || EMPTY;

    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
      return m ? `${m[3]}/${m[2]}/${m[1]}` : EMPTY;
    }

    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? String(value) : EMPTY;

    default: {
      const text = String(value).trim();
      return text.length ? text : EMPTY;
    }
  }
}

export function matchesAuditSearch(audit: AuditSummary, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;

  const haystack = [
    audit.gym_name,
    audit.city,
    cityName(audit.city, 'ar'),
    audit.governorate,
    governorateName(audit.governorate, 'fr'),
    governorateName(audit.governorate, 'ar'),
    audit.auditor_name,
  ].map(normalize).join(' ');

  return haystack.includes(q);
}

function normalize(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
