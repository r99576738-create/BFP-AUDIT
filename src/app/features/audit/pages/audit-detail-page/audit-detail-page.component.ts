import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import type { AuditField, AuditFormDefinition, AuditRecord, AuditSection, SectionScore } from '../../audit.models';
import { cityName, formatAnswer, governorateName } from '../../data/answer-format';
import { AuditFormService } from '../../data/audit-form.service';
import { AuditRepository } from '../../data/audit-repository.service';
import { isFieldVisible } from '../../data/field-visibility';
import { LocaleService } from '../../data/locale.service';

@Component({
  selector: 'app-audit-detail-page',
  standalone: false,
  templateUrl: './audit-detail-page.component.html',
  styleUrl: './audit-detail-page.component.scss',
})
export class AuditDetailPageComponent implements OnInit, OnDestroy {
  audit: AuditRecord | null = null;
  def: AuditFormDefinition | null = null;
  loading = true;
  loadFailed = false;
  deleting = false;
  deleteFailed = false;
  justSaved: boolean;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repo: AuditRepository,
    private auditSrv: AuditFormService,
    public i18n: LocaleService,
  ) {
    this.justSaved = !!this.router.getCurrentNavigation()?.extras.state?.['saved'];
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => this.load(params.get('id')!));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async load(id: string): Promise<void> {
    this.loading = true;
    this.loadFailed = false;
    try {
      const [def, audit] = await Promise.all([firstValueFrom(this.auditSrv.loadDefinition()), this.repo.get(id)]);
      this.def = def;
      this.audit = audit;
    } catch (e) {
      console.error('Failed to load audit:', e);
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }

  get answers(): Record<string, unknown> {
    return this.audit?.answers ?? {};
  }

  get address(): string {
    const a = this.answers;
    const street = typeof a['addressStreet'] === 'string' ? (a['addressStreet'] as string).trim() : '';
    const city = cityName(this.audit?.city, this.i18n.locale);
    const gov = governorateName(this.audit?.governorate, this.i18n.locale);
    return [street, city, gov].filter(Boolean).join(', ');
  }

  visibleFields(section: AuditSection): AuditField[] {
    return section.fields.filter(f => isFieldVisible(f, this.answers));
  }

  sectionScore(section: AuditSection): SectionScore | undefined {
    return this.audit?.score_details?.sections?.find(s => s.id === section.id);
  }

  display(field: AuditField): string {
    return formatAnswer(field, this.answers[field.key], this.i18n.locale);
  }

  signature(field: AuditField): string | null {
    const v = this.answers[field.key];
    return typeof v === 'string' && v.startsWith('data:image/') ? v : null;
  }

  isCriticalFailure(field: AuditField): boolean {
    return !!this.audit?.score_details?.criticalFailures?.includes(field.key);
  }

  formatDate(iso: string | null | undefined): string {
    const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
  }

  print(): void {
    window.print();
  }

  async remove(): Promise<void> {
    if (!this.audit || this.deleting) return;
    const ok = confirm(this.i18n.tr(
      `Supprimer définitivement l’audit « ${this.audit.gym_name} » ? Cette action est irréversible.`,
      `حذف تدقيق «${this.audit.gym_name}» نهائيًا؟ لا يمكن التراجع عن ذلك.`));
    if (!ok) return;

    this.deleting = true;
    this.deleteFailed = false;
    try {
      await this.repo.remove(this.audit.id);
      this.router.navigate(['/audits']);
    } catch (e) {
      console.error('Failed to delete audit:', e);
      this.deleteFailed = true;
    } finally {
      this.deleting = false;
    }
  }
}
