import type { AuditField } from '../audit.models';

export function isFieldVisible(field: AuditField, values: Record<string, unknown>): boolean {
  const rule = field.visibleWhen;
  if (!rule) return true;

  const depValue = values?.[rule.key];
  if ('equals' in rule) return depValue === rule.equals;
  if ('in' in rule) return Array.isArray(rule.in) && rule.in.includes(depValue);
  return true;
}

export function hasAnswer(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return true;
}
