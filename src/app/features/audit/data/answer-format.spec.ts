import { formatAnswer, matchesAuditSearch } from './answer-format';
import type { AuditField, AuditSummary } from '../audit.models';

const L = (s: string) => ({ fr: s, ar: s + '-ar' });

describe('formatAnswer', () => {
  it('traduit Oui/Non et laisse un tiret si non répondu', () => {
    const f: AuditField = { key: 't', type: 'toggle', label: L('t') };
    expect(formatAnswer(f, true, 'fr')).toBe('Oui');
    expect(formatAnswer(f, false, 'ar')).toBe('لا');
    expect(formatAnswer(f, null, 'fr')).toBe('—');
  });

  it('affiche le libellé de l’option choisie dans la langue courante', () => {
    const f: AuditField = { key: 'c', type: 'choice', label: L('c'), options: [{ value: 'good', label: { fr: 'Bonne', ar: 'جيدة' } }] };
    expect(formatAnswer(f, 'good', 'fr')).toBe('Bonne');
    expect(formatAnswer(f, 'good', 'ar')).toBe('جيدة');
    expect(formatAnswer(f, 'zzz', 'fr')).toBe('—');
  });

  it('affiche le nom du gouvernorat et de la ville', () => {
    expect(formatAnswer({ key: 'g', type: 'governorate', label: L('g') }, 'TU', 'fr')).toBe('Tunis');
    expect(formatAnswer({ key: 'g', type: 'governorate', label: L('g') }, 'TU', 'ar')).toBe('تونس');
    expect(formatAnswer({ key: 'c', type: 'city', label: L('c') }, 'Bab Bhar', 'ar')).toBe('باب بحر');
  });

  it('formate une date en jj/mm/aaaa', () => {
    expect(formatAnswer({ key: 'd', type: 'date', label: L('d') }, '2026-11-08', 'fr')).toBe('08/11/2026');
  });

  it('garde le texte et les nombres, tiret si vide', () => {
    expect(formatAnswer({ key: 'n', type: 'number', label: L('n') }, 0, 'fr')).toBe('0');
    expect(formatAnswer({ key: 'x', type: 'text', label: L('x') }, '  Salle  ', 'fr')).toBe('Salle');
    expect(formatAnswer({ key: 'x', type: 'textarea', label: L('x') }, '', 'fr')).toBe('—');
  });
});

describe('matchesAuditSearch', () => {
  const a: AuditSummary = {
    id: '1', created_at: '', updated_at: '', gym_name: 'Énergie Gym', governorate: 'TU', city: 'Bab Bhar',
    audit_date: '2026-11-01', auditor_name: 'Sami Ben Ali', score: 80, grade: 'B', critical_count: 0,
  };

  it('ignore la casse et les accents', () => {
    expect(matchesAuditSearch(a, 'energie')).toBeTrue();
    expect(matchesAuditSearch(a, 'GYM')).toBeTrue();
  });

  it('cherche aussi dans la ville, le gouvernorat (nom FR/AR) et l’auditeur', () => {
    expect(matchesAuditSearch(a, 'bab')).toBeTrue();
    expect(matchesAuditSearch(a, 'tunis')).toBeTrue();
    expect(matchesAuditSearch(a, 'تونس')).toBeTrue();
    expect(matchesAuditSearch(a, 'sami')).toBeTrue();
  });

  it('accepte une recherche vide et rejette un terme absent', () => {
    expect(matchesAuditSearch(a, '   ')).toBeTrue();
    expect(matchesAuditSearch(a, 'sfax')).toBeFalse();
  });
});
