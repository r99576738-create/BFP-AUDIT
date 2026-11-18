import { fakeAsync, tick } from "@angular/core/testing";
import { FormBuilder } from '@angular/forms';
import { AuditFormService } from './audit-form.service';
import type { AuditSection } from '../audit.models';

describe('AuditFormService.isSectionValid', () => {
  const fb = new FormBuilder();
  const svc = new AuditFormService(null as any, fb);

  const section: AuditSection = {
    id: 's',
    title: { fr: 's', ar: 's' },
    fields: [
      { key: 'kind', type: 'choice', required: true, label: { fr: 'k', ar: 'k' }, options: [] },
      { key: 'detail', type: 'text', required: true, label: { fr: 'd', ar: 'd' }, visibleWhen: { key: 'kind', equals: 'free' } },
    ],
  };

  it('ignore un champ obligatoire masqué', () => {
    const form = fb.group({ kind: ['activity'], detail: [''] });
    expect(svc.isSectionValid(form, section)).toBeTrue();
  });

  it('exige un champ obligatoire visible', () => {
    const form = fb.group({ kind: ['free'], detail: [''] });
    expect(svc.isSectionValid(form, section)).toBeFalse();
  });
});

describe('AuditFormService — brouillons', () => {
  const fb = new FormBuilder();
  const svc = new AuditFormService(null as any, fb);
  const def = {
    meta: { formId: 'draft_test', version: '1', locales: ['fr', 'ar'], defaultLocale: 'fr' },
    sections: [{
      id: 's', title: { fr: 's', ar: 's' }, fields: [
        { key: 'gymName', type: 'text', required: true, label: { fr: 'n', ar: 'n' } },
        { key: 'ok', type: 'toggle', label: { fr: 'o', ar: 'o' } },
      ],
    }],
  } as any;
  const key = (scope: string) => `bf_audit_draft_draft_test_${scope}`;

  beforeEach(() => {
    localStorage.removeItem(key('new'));
    localStorage.removeItem(key('abc'));
  });

  it('restaure le brouillon de la même portée uniquement', () => {
    svc.saveDraft('draft_test', 'new', { gymName: 'Brouillon' });
    expect(svc.buildForm(def, { draftScope: 'new' }).value.gymName).toBe('Brouillon');
    expect(svc.buildForm(def, { draftScope: 'abc' }).value.gymName).toBe('');
  });

  it('restaure un brouillon commencé sur la version enregistrée actuelle, quelle que soit l’horloge', () => {
    svc.saveDraft('draft_test', 'abc', { gymName: 'Modifié' }, { baseVersion: '2026-11-08T10:00:00Z' });
    const draft = JSON.parse(localStorage.getItem(key('abc'))!);
    draft.timestamp = '1999-01-01T00:00:00Z';
    localStorage.setItem(key('abc'), JSON.stringify(draft));
    const form = svc.buildForm(def, { draftScope: 'abc', initialValues: { gymName: 'Enregistré', ok: true }, baseVersion: '2026-11-08T10:00:00Z' });
    expect(form.value.gymName).toBe('Modifié');
  });

  it('ignore et efface un brouillon commencé sur une autre version enregistrée', () => {
    svc.saveDraft('draft_test', 'abc', { gymName: 'Ancien' }, { baseVersion: '2026-11-08T10:00:00Z' });
    const form = svc.buildForm(def, { draftScope: 'abc', initialValues: { gymName: 'Enregistré' }, baseVersion: '2026-11-08T11:30:00Z' });
    expect(form.value.gymName).toBe('Enregistré');
    expect(localStorage.getItem(key('abc'))).toBeNull();
  });

  it('refuse, pour un choix obligatoire, une valeur absente des options', () => {
    const choiceDef = { ...def, sections: [{ ...def.sections[0], fields: [
      { key: 'level', type: 'choice', required: true, label: { fr: 'l', ar: 'l' }, options: [{ value: 'good', label: { fr: 'Bon', ar: 'جيد' } }] },
    ] }] };
    const form = svc.buildForm(choiceDef, { draftScope: 'abc', initialValues: { level: 'renamed' } });
    expect(form.get('level')!.valid).toBeFalse();
    expect(svc.isSectionValid(form, choiceDef.sections[0])).toBeFalse();
    form.get('level')!.setValue('good');
    expect(svc.isSectionValid(form, choiceDef.sections[0])).toBeTrue();
    svc.discardDraft(form);
  });

  it('resetForm remet les valeurs initiales et efface le brouillon', () => {
    svc.saveDraft('draft_test', 'abc', { gymName: 'Modifié' });
    const form = svc.buildForm(def, { draftScope: 'abc', initialValues: { gymName: 'Enregistré' } });
    svc.resetForm(form, def, { gymName: 'Enregistré' });
    expect(form.value.gymName).toBe('Enregistré');
    expect(form.value.ok).toBeNull();
    expect(localStorage.getItem(key('abc'))).toBeNull();
  });

  it('discardDraft empêche une sauvegarde différée de recréer le brouillon', fakeAsync(() => {
    const form = svc.buildForm(def, { draftScope: 'new' });
    form.patchValue({ gymName: 'En cours' });
    svc.discardDraft(form);
    tick(5000);
    expect(localStorage.getItem(key('new'))).toBeNull();
  }));

  it('sauvegarde automatiquement après une pause de saisie', fakeAsync(() => {
    const form = svc.buildForm(def, { draftScope: 'new' });
    form.patchValue({ gymName: 'Auto' });
    tick(5000);
    expect(JSON.parse(localStorage.getItem(key('new'))!).values.gymName).toBe('Auto');
    svc.discardDraft(form);
  }));
});
