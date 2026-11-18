import { Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import type { AuditFormDefinition, AuditRecord, AuditScore, AuditSummary } from '../audit.models';

const TABLE = 'audits';
const SUMMARY_COLUMNS =
  'id, created_at, updated_at, gym_name, governorate, city, audit_date, auditor_name, score, grade, critical_count';

export type AuditRow = ReturnType<typeof toAuditRow>;

export function toAuditRow(def: AuditFormDefinition, answers: Record<string, unknown>, score: AuditScore) {
  return {
    form_id: def.meta.formId,
    form_version: def.meta.version,
    gym_name: text(answers['gymName']) ?? '',
    governorate: text(answers['addressGovernorate']),
    city: text(answers['addressCity']),
    audit_date: text(answers['auditDate']),
    auditor_name: text(answers['auditorName']),
    answers,
    score: score.score,
    grade: score.grade,
    critical_count: score.criticalFailures.length,
    score_details: score,
  };
}

/** Erreur Supabase avec son code (ex. PGRST301 = session expirée, 42501 = refus RLS). */
export class AuditRepositoryError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class AuditRepository {
  constructor(private supabase: SupabaseService) {}

  async list(): Promise<AuditSummary[]> {
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select(SUMMARY_COLUMNS)
      .order('audit_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw new AuditRepositoryError(error.message, error.code);
    return (data ?? []).map(r => ({ ...r, score: Number(r.score) }) as AuditSummary);
  }

  async get(id: string): Promise<AuditRecord> {
    const { data, error } = await this.supabase.client.from(TABLE).select('*').eq('id', id).single();
    if (error) throw new AuditRepositoryError(error.message, error.code);
    return { ...data, score: Number(data.score) } as AuditRecord;
  }

  async create(def: AuditFormDefinition, answers: Record<string, unknown>, score: AuditScore): Promise<string> {
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .insert(toAuditRow(def, answers, score))
      .select('id')
      .single();
    if (error) throw new AuditRepositoryError(error.message, error.code);
    return data.id as string;
  }

  async update(id: string, def: AuditFormDefinition, answers: Record<string, unknown>, score: AuditScore): Promise<void> {
    const { error } = await this.supabase.client
      .from(TABLE)
      .update(toAuditRow(def, answers, score))
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw new AuditRepositoryError(error.message, error.code);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).delete().eq('id', id);
    if (error) throw new AuditRepositoryError(error.message, error.code);
  }
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
