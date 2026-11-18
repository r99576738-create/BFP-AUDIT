import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import { AuditFormService } from '../../data/audit-form.service';
import { AuditRepository } from '../../data/audit-repository.service';
import { LocaleService } from '../../data/locale.service';
import { AuditFormDefinition } from '../../audit.models';

@Component({
  selector: 'app-audit-page',
  standalone: false,
  templateUrl: './audit-page.component.html',
  styleUrls: ['./audit-page.component.scss']
})
export class AuditPageComponent implements OnInit, OnDestroy {
  loading = true;
  loadFailed = false;
  def: AuditFormDefinition | null = null;
  form: FormGroup | null = null;
  auditId: string | null = null;
  gymName = '';

  private initialValues?: Record<string, unknown>;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private auditSrv: AuditFormService,
    private repo: AuditRepository,
    public i18n: LocaleService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => this.load(params.get('id')));
  }

  ngOnDestroy(): void {
    this.releaseForm();
    this.destroy$.next();
    this.destroy$.complete();
  }

  confirmReset(): void {
    if (!this.form || !this.def) return;
    const message = this.auditId
      ? this.i18n.tr('Annuler toutes les modifications non enregistrées ?', 'إلغاء كل التعديلات غير المحفوظة؟')
      : this.i18n.tr('Vider le formulaire ? Toutes les réponses saisies seront perdues.', 'إفراغ النموذج؟ ستُفقد كل الإجابات.');
    if (confirm(message)) {
      this.auditSrv.resetForm(this.form, this.def, this.initialValues);
      window.scrollTo({ top: 0 });
    }
  }

  retryLoad(): void {
    this.load(this.auditId);
  }

  private async load(id: string | null): Promise<void> {
    this.releaseForm();
    this.loading = true;
    this.loadFailed = false;
    this.auditId = id;

    try {
      const def = await firstValueFrom(this.auditSrv.loadDefinition());
      const record = id ? await this.repo.get(id) : null;

      this.def = def;
      this.initialValues = record?.answers;
      this.gymName = record?.gym_name ?? '';
      this.form = this.auditSrv.buildForm(def, {
        draftScope: id ?? 'new',
        initialValues: record?.answers,
        baseVersion: record?.updated_at,
      });
    } catch (error) {
      console.error('Failed to load audit form:', error);
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }

  private releaseForm(): void {
    if (!this.form) return;
    if (this.form.dirty) this.auditSrv.saveDraftNow(this.form);
    this.auditSrv.stopAutoSave(this.form);
    this.form = null;
  }
}
