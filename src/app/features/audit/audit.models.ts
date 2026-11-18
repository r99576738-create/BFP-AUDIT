export type Locale = 'fr' | 'ar';

export interface LocalizedText {
    fr: string;
    ar: string;
}

export type FieldType =
    | 'text'
    | 'tel'
    | 'email'
    | 'date'
    | 'number'
    | 'textarea'
    | 'toggle'
    | 'choice'
    | 'governorate'
    | 'city'
    | 'signature'
    | 'divider';

export interface FieldOption {
    value: string;
    label: LocalizedText;
}


export type VisibleWhenRule =
  | { key: string; equals: any }
  | { key: string; in: any[] };

export type AuditOption = {
  value: string;
  label: { fr: string; ar: string };
  points?: number;
};

export type ScoreRange = { max?: number; points: number };

export type AuditField = {
  key: string;
  type:
    | 'text' | 'textarea' | 'tel' | 'email' | 'date' | 'number'
    | 'toggle' | 'choice' | 'divider' | 'signature'
    | 'governorate' | 'city';

  required?: boolean;

  label: { fr: string; ar: string };
  placeholder?: { fr: string; ar: string };

  rows?: number;
  min?: number;
  max?: number;
  step?: number;

  options?: AuditOption[];

  governorateKey?: string;

  visibleWhen?: VisibleWhenRule;

  points?: number;
  critical?: boolean;
  scoreRanges?: ScoreRange[];
};

export interface AuditSection {
    id: string;
    title: LocalizedText;
    description?: LocalizedText;
    weight?: number;
    fields: AuditField[];
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface SectionScore {
    id: string;
    weight: number;
    earned: number;
    max: number;
    percent: number;
}

export interface AuditScore {
    score: number;
    rawGrade: Grade;
    grade: Grade;
    capped: boolean;
    sections: SectionScore[];
    criticalFailures: string[];
    answeredScorable: number;
    totalScorable: number;
}

export interface AuditSummary {
    id: string;
    created_at: string;
    updated_at: string;
    gym_name: string;
    governorate: string | null;
    city: string | null;
    audit_date: string | null;
    auditor_name: string | null;
    score: number;
    grade: Grade;
    critical_count: number;
}

export interface AuditRecord extends AuditSummary {
    form_id: string;
    form_version: string;
    answers: Record<string, unknown>;
    score_details: AuditScore;
}

export interface AuditFormDefinition {
    meta: {
        formId: string;
        version: string;
        locales: Locale[];
        defaultLocale: Locale;
    };
    sections: AuditSection[];
}
// src/app/audit/models/wizard.models.ts

/**
 * Types de design pour le header du wizard
 */
export type HeaderDesign = 'circular' | 'wave' | 'metro';

/**
 * Alias pour clarté : une WizardSection est une AuditSection
 */
export type WizardSection = AuditSection;

/**
 * Données passées aux composants de header
 */
export interface WizardHeaderData {
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  currentSection: WizardSection;
  sections: WizardSection[];
  locale: Locale;  // ✅ Utilise ton type Locale existant
}
