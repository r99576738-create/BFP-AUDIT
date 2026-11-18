import { Component, Input } from '@angular/core';
import type { AuditField, AuditFormDefinition, AuditScore, Grade, SectionScore } from '../../audit.models';
import { LocaleService } from '../../data/locale.service';
import { ScoringService } from '../../data/scoring.service';

const RING_RADIUS = 52;

@Component({
  selector: 'app-score-summary',
  standalone: false,
  templateUrl: './score-summary.component.html',
  styleUrl: './score-summary.component.scss',
})
export class ScoreSummaryComponent {
  @Input({ required: true }) score!: AuditScore;
  @Input({ required: true }) def!: AuditFormDefinition;

  readonly ringRadius = RING_RADIUS;
  readonly ringCircumference = 2 * Math.PI * RING_RADIUS;

  constructor(public i18n: LocaleService, private scoring: ScoringService) {}

  get ringOffset(): number {
    const clamped = Math.max(0, Math.min(100, this.score.score));
    return this.ringCircumference * (1 - clamped / 100);
  }

  gradeLabel(grade: Grade): string {
    const labels: Record<Grade, [string, string]> = {
      A: ['Excellent', 'ممتاز'],
      B: ['Bon', 'جيد'],
      C: ['Moyen', 'متوسط'],
      D: ['Faible', 'ضعيف'],
      E: ['À risque', 'في خطر'],
    };
    return this.i18n.tr(...labels[grade]);
  }

  sectionTitle(s: SectionScore): string {
    const section = this.def.sections.find(x => x.id === s.id);
    return section ? section.title[this.i18n.locale] : s.id;
  }

  sectionGrade(s: SectionScore): string {
    return this.scoring.gradeFor(s.percent).toLowerCase();
  }

  criticalLabel(key: string): string {
    const field = this.findField(key);
    return field ? field.label[this.i18n.locale] : key;
  }

  private findField(key: string): AuditField | undefined {
    for (const section of this.def.sections) {
      const field = section.fields.find(f => f.key === key);
      if (field) return field;
    }
    return undefined;
  }
}
