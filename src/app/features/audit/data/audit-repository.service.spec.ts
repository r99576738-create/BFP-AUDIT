import { toAuditRow } from './audit-repository.service';
import type { AuditFormDefinition, AuditScore } from '../audit.models';

describe('toAuditRow', () => {
  const def = { meta: { formId: 'f', version: '2.2.0', locales: ['fr', 'ar'], defaultLocale: 'fr' }, sections: [] } as AuditFormDefinition;
  const score: AuditScore = {
    score: 72.5, rawGrade: 'B', grade: 'C', capped: true, sections: [],
    criticalFailures: ['extinguishersValid', 'firstAidKit'], answeredScorable: 10, totalScorable: 12,
  };

  it('dérive les colonnes de liste à partir des réponses', () => {
    const answers = { gymName: '  Gym Lac  ', addressGovernorate: 'TU', addressCity: 'Tunis', auditDate: '2026-11-02', auditorName: 'Sami' };
    const row = toAuditRow(def, answers, score);
    expect(row.gym_name).toBe('Gym Lac');
    expect(row.governorate).toBe('TU');
    expect(row.city).toBe('Tunis');
    expect(row.audit_date).toBe('2026-11-02');
    expect(row.auditor_name).toBe('Sami');
  });

  it('enregistre la note, la lettre et la version du formulaire', () => {
    const row = toAuditRow(def, { gymName: 'G' }, score);
    expect(row.form_id).toBe('f');
    expect(row.form_version).toBe('2.2.0');
    expect(row.score).toBe(72.5);
    expect(row.grade).toBe('C');
    expect(row.critical_count).toBe(2);
    expect(row.score_details).toBe(score);
  });

  it('met null pour une date ou une ville vide', () => {
    const row = toAuditRow(def, { gymName: 'G', auditDate: '', addressCity: null }, score);
    expect(row.audit_date).toBeNull();
    expect(row.city).toBeNull();
  });
});
