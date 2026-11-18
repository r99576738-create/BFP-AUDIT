import { Component, OnInit } from '@angular/core';
import type { AuditSummary } from '../../audit.models';
import { cityName, governorateName, matchesAuditSearch } from '../../data/answer-format';
import { AuditRepository } from '../../data/audit-repository.service';
import { LocaleService } from '../../data/locale.service';

@Component({
  selector: 'app-audit-list-page',
  standalone: false,
  templateUrl: './audit-list-page.component.html',
  styleUrl: './audit-list-page.component.scss',
})
export class AuditListPageComponent implements OnInit {
  audits: AuditSummary[] = [];
  loading = true;
  loadFailed = false;
  query = '';

  constructor(private repo: AuditRepository, public i18n: LocaleService) {}

  ngOnInit(): void {
    this.load();
  }

  get filtered(): AuditSummary[] {
    return this.audits.filter(a => matchesAuditSearch(a, this.query));
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadFailed = false;
    try {
      this.audits = await this.repo.list();
    } catch (e) {
      console.error('Failed to load audits:', e);
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }

  place(a: AuditSummary): string {
    return [cityName(a.city, this.i18n.locale), governorateName(a.governorate, this.i18n.locale)]
      .filter(Boolean)
      .join(', ');
  }

  formatDate(iso: string | null): string {
    const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
  }

  trackById(_: number, a: AuditSummary): string {
    return a.id;
  }
}
