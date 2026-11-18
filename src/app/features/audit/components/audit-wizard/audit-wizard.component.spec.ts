import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { AuditWizardComponent } from './audit-wizard.component';
import { AuditFormService } from '../../data/audit-form.service';
import { AuditRepositoryError } from '../../data/audit-repository.service';
import { LocaleService } from '../../data/locale.service';
import { ScoringService } from '../../data/scoring.service';

describe('AuditWizardComponent', () => {
  const key = 'bf_audit_draft_wizard_test_new';
  const def = {
    meta: { formId: 'wizard_test', version: '1', locales: ['fr', 'ar'], defaultLocale: 'fr' },
    sections: [{
      id: 's', title: { fr: 'S', ar: 'S' }, weight: 10, fields: [
        { key: 'gymName', type: 'text', required: true, label: { fr: 'n', ar: 'n' } },
        { key: 'ok', type: 'toggle', label: { fr: 'o', ar: 'o' }, points: 2 },
      ],
    }],
  } as any;

  let auditSrv: AuditFormService;
  let wizard: AuditWizardComponent;

  beforeEach(() => {
    localStorage.removeItem(key);
    auditSrv = new AuditFormService(null as any, new FormBuilder());
    const repo = { create: () => Promise.reject(new AuditRepositoryError('Failed to fetch')) } as any;
    const router = { navigate: () => Promise.resolve(true) } as any;
    wizard = new AuditWizardComponent(new LocaleService(), auditSrv, new ScoringService(), repo, router);
    wizard.def = def;
    wizard.form = auditSrv.buildForm(def, { draftScope: 'new' });
  });

  afterEach(() => {
    wizard.ngOnDestroy();
    auditSrv.discardDraft(wizard.form);
  });

  it('sauvegarde le brouillon avant d’enregistrer, même si l’envoi échoue aussitôt', async () => {
    wizard.form.patchValue({ gymName: 'Saisie de dernière seconde' });
    await wizard.submit();
    expect(wizard.saveErrorCode).toBe('Failed to fetch');
    expect(JSON.parse(localStorage.getItem(key)!).values.gymName).toBe('Saisie de dernière seconde');
  });

  it('sauvegarde le brouillon quand la page est masquée ou fermée', () => {
    wizard.form.patchValue({ gymName: 'En cours' });
    wizard.form.markAsDirty();
    wizard.onPageHide();
    expect(JSON.parse(localStorage.getItem(key)!).values.gymName).toBe('En cours');
  });

  it('n’affiche la note provisoire qu’après une première réponse notée', fakeAsync(() => {
    wizard.ngOnInit();
    expect(wizard.showLiveScore).toBeFalse();
    wizard.form.patchValue({ ok: true });
    tick(300);
    expect(wizard.showLiveScore).toBeTrue();
    tick(2000);
  }));
});
