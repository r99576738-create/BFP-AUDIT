import { Injectable } from '@angular/core';
import type { AuditField, AuditFormDefinition, AuditScore, Grade, SectionScore } from '../audit.models';
import { isFieldVisible } from './field-visibility';

type FieldResult = { earned: number; max: number } | null;

const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D', 'E'];
const CRITICAL_CAP: Grade = 'C';

@Injectable({ providedIn: 'root' })
export class ScoringService {
  compute(def: AuditFormDefinition, answers: Record<string, unknown>): AuditScore {
    const values = answers ?? {};
    const sections: SectionScore[] = [];
    const criticalFailures: string[] = [];
    let answeredScorable = 0;
    let totalScorable = 0;

    for (const section of def.sections) {
      let earned = 0;
      let max = 0;

      for (const field of section.fields) {
        if (!this.isScorable(field) || !isFieldVisible(field, values)) continue;
        totalScorable++;

        const result = this.scoreField(field, values[field.key]);
        if (!result) continue;

        answeredScorable++;
        earned += result.earned;
        max += result.max;
        if (field.critical && field.type === 'toggle' && values[field.key] === false) {
          criticalFailures.push(field.key);
        }
      }

      const weight = section.weight ?? 0;
      if (weight > 0 && max > 0) {
        sections.push({ id: section.id, weight, earned, max, percent: round1((earned / max) * 100) });
      }
    }

    const totalWeight = sections.reduce((acc, s) => acc + s.weight, 0);
    const weighted = sections.reduce((acc, s) => acc + s.weight * (s.earned / s.max) * 100, 0);
    const score = totalWeight > 0 ? round1(weighted / totalWeight) : 0;

    const rawGrade = this.gradeFor(score);
    const grade = criticalFailures.length > 0 && worse(CRITICAL_CAP, rawGrade) ? CRITICAL_CAP : rawGrade;

    return { score, rawGrade, grade, capped: grade !== rawGrade, sections, criticalFailures, answeredScorable, totalScorable };
  }

  gradeFor(score: number): Grade {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'E';
  }

  private isScorable(field: AuditField): boolean {
    switch (field.type) {
      case 'toggle': return typeof field.points === 'number';
      case 'choice': return (field.options ?? []).some(o => typeof o.points === 'number');
      case 'number': return (field.scoreRanges ?? []).length > 0;
      default: return false;
    }
  }

  private scoreField(field: AuditField, value: unknown): FieldResult {
    switch (field.type) {
      case 'toggle':
        if (typeof value !== 'boolean') return null;
        return { earned: value ? field.points! : 0, max: field.points! };

      case 'choice': {
        const options = field.options ?? [];
        const chosen = options.find(o => o.value === value);
        if (!chosen) return null;
        const max = Math.max(...options.map(o => o.points ?? 0));
        return { earned: chosen.points ?? 0, max };
      }

      case 'number': {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        const ranges = field.scoreRanges!;
        const range = ranges.find(r => r.max === undefined || n <= r.max);
        const max = Math.max(...ranges.map(r => r.points));
        return { earned: range?.points ?? 0, max };
      }

      default:
        return null;
    }
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function worse(a: Grade, b: Grade): boolean {
  return GRADE_ORDER.indexOf(a) > GRADE_ORDER.indexOf(b);
}
