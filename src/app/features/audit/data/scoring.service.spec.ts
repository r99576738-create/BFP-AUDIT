import { ScoringService } from './scoring.service';
import type { AuditFormDefinition, AuditOption, LocalizedText } from '../audit.models';

const L = (s: string): LocalizedText => ({ fr: s, ar: s });
const opt = (value: string, points?: number): AuditOption =>
  points === undefined ? { value, label: L(value) } : { value, label: L(value), points };

function definition(): AuditFormDefinition {
  return {
    meta: { formId: 't', version: '1', locales: ['fr', 'ar'], defaultLocale: 'fr' },
    sections: [
      {
        id: 'a', title: L('A'), weight: 60, fields: [
          { key: 'license', type: 'toggle', required: true, label: L('license'), points: 3, critical: true },
          { key: 'clean', type: 'choice', required: true, label: L('clean'), options: [opt('excellent', 3), opt('good', 2), opt('average', 1), opt('bad', 0)] },
          { key: 'mirror', type: 'toggle', label: L('mirror'), points: 1 },
          { key: 'kind', type: 'choice', label: L('kind'), options: [opt('free'), opt('activity')] },
          { key: 'pack', type: 'toggle', label: L('pack'), points: 2, visibleWhen: { key: 'kind', equals: 'free' } },
        ],
      },
      {
        id: 'b', title: L('B'), weight: 40, fields: [
          { key: 'age', type: 'number', label: L('age'), scoreRanges: [{ max: 3, points: 3 }, { max: 7, points: 2 }, { max: 12, points: 1 }, { points: 0 }] },
          { key: 'signage', type: 'toggle', required: true, label: L('signage'), points: 1 },
        ],
      },
      {
        id: 'c', title: L('C'), weight: 20, fields: [
          { key: 'notes', type: 'textarea', label: L('notes') },
        ],
      },
    ],
  };
}

function best(): Record<string, unknown> {
  return { license: true, clean: 'excellent', mirror: true, kind: 'free', pack: true, age: 2, signage: true, notes: '' };
}

describe('ScoringService', () => {
  const svc = new ScoringService();
  const section = (r: ReturnType<ScoringService['compute']>, id: string) => r.sections.find(s => s.id === id)!;

  it('donne 100/A quand toutes les réponses sont les meilleures', () => {
    const r = svc.compute(definition(), best());
    expect(r.score).toBe(100);
    expect(r.grade).toBe('A');
    expect(r.capped).toBeFalse();
    expect(r.criticalFailures).toEqual([]);
  });

  it('pondère les sections par leur poids', () => {
    const r = svc.compute(definition(), { ...best(), mirror: null, kind: 'activity', clean: 'bad' });
    expect(section(r, 'a').percent).toBe(50);
    expect(section(r, 'b').percent).toBe(100);
    expect(r.score).toBe(70);
  });

  it('exclut une section sans aucun champ noté', () => {
    const r = svc.compute(definition(), { ...best(), mirror: null, kind: 'activity', clean: 'bad' });
    expect(r.sections.map(s => s.id)).toEqual(['a', 'b']);
    expect(r.score).toBe(70);
  });

  it('arrondit la note à 0,1', () => {
    const r = svc.compute(definition(), { ...best(), clean: 'good' });
    expect(r.score).toBe(93.3);
  });

  it('liste un Non sur une question critique et plafonne la lettre à C', () => {
    const r = svc.compute(definition(), { ...best(), license: false });
    expect(r.criticalFailures).toEqual(['license']);
    expect(r.score).toBe(80);
    expect(r.rawGrade).toBe('B');
    expect(r.grade).toBe('C');
    expect(r.capped).toBeTrue();
  });

  it('ne remonte jamais une lettre déjà inférieure à C', () => {
    const r = svc.compute(definition(), { ...best(), license: false, clean: 'bad', signage: false, age: 20 });
    expect(r.rawGrade).toBe('E');
    expect(r.grade).toBe('E');
    expect(r.capped).toBeFalse();
  });

  it('traite un champ facultatif non répondu comme neutre', () => {
    const r = svc.compute(definition(), { ...best(), mirror: null });
    expect(section(r, 'a').earned).toBe(8);
    expect(section(r, 'a').max).toBe(8);
    expect(r.score).toBe(100);
  });

  it('ignore un champ masqué par visibleWhen même s’il garde une valeur', () => {
    const r = svc.compute(definition(), { ...best(), kind: 'activity', pack: true });
    expect(section(r, 'a').max).toBe(7);
    expect(r.totalScorable).toBe(5);
  });

  it('traite un nombre vide comme non répondu', () => {
    for (const age of [null, '', undefined]) {
      const r = svc.compute(definition(), { ...best(), age });
      expect(section(r, 'b').max).withContext(String(age)).toBe(1);
    }
  });

  it('applique les tranches numériques', () => {
    const earned = (age: number) => section(svc.compute(definition(), { ...best(), age }), 'b').earned - 1;
    expect(earned(2)).toBe(3);
    expect(earned(5)).toBe(2);
    expect(earned(12)).toBe(1);
    expect(earned(20)).toBe(0);
  });

  it('traite une option inconnue comme non répondue', () => {
    const r = svc.compute(definition(), { ...best(), clean: 'zzz' });
    expect(section(r, 'a').max).toBe(6);
    expect(r.answeredScorable).toBe(5);
  });

  it('convertit une note en lettre', () => {
    expect(svc.gradeFor(85)).toBe('A');
    expect(svc.gradeFor(84.9)).toBe('B');
    expect(svc.gradeFor(70)).toBe('B');
    expect(svc.gradeFor(55)).toBe('C');
    expect(svc.gradeFor(40)).toBe('D');
    expect(svc.gradeFor(39.9)).toBe('E');
  });
});
