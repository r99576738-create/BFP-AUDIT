import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, debounceTime, shareReplay } from 'rxjs/operators';

import type { AuditFormDefinition, AuditField, AuditSection } from '../audit.models';
import { hasAnswer, isFieldVisible } from './field-visibility';

type DraftPayload = {
    formId: string;
    version?: string;
    /** updated_at de l'audit enregistré sur lequel ce brouillon a été commencé. */
    baseVersion?: string;
    timestamp: string;
    values: Record<string, unknown>;
};

type DraftMeta = { version?: string; baseVersion?: string };
type DraftRegistration = DraftMeta & { formId: string; scope: string; sub: Subscription };

export type BuildFormOptions = {
    /** 'new' pour un nouvel audit, l'id de l'audit en modification sinon. */
    draftScope: string;
    initialValues?: Record<string, unknown>;
    /** updated_at de l'audit enregistré : un brouillon commencé sur une autre version est ignoré et effacé. */
    baseVersion?: string;
};

@Injectable({ providedIn: 'root' })
export class AuditFormService {
    private readonly STORAGE_KEY_PREFIX = 'bf_audit_draft';
    private readonly AUTO_SAVE_DEBOUNCE = 1500;
    private readonly DEFINITION_PATH = 'assets/data/form.json';

    private readonly registrations = new WeakMap<FormGroup, DraftRegistration>();
    private definition$?: Observable<AuditFormDefinition>;

    constructor(private http: HttpClient, private fb: FormBuilder) { }

    loadDefinition(): Observable<AuditFormDefinition> {
        this.definition$ ??= this.http.get<AuditFormDefinition>(this.DEFINITION_PATH).pipe(
            catchError(err => {
                this.definition$ = undefined;
                return throwError(() => err);
            }),
            shareReplay(1),
        );
        return this.definition$;
    }

    buildForm(definition: AuditFormDefinition, opts: BuildFormOptions): FormGroup {
        const controls: Record<string, FormControl> = {};
        for (const section of definition.sections) {
            for (const field of section.fields) {
                if (field.type === 'divider') continue;
                controls[field.key] = this.fb.control(this.getDefaultValue(field), {
                    validators: this.buildValidators(field),
                }) as FormControl;
            }
        }
        const form = this.fb.group(controls);
        const { formId, version } = definition.meta;

        if (opts.initialValues) form.patchValue(opts.initialValues, { emitEvent: false });

        const draft = this.loadDraft(formId, opts.draftScope);
        if (draft) {
            const stale = opts.baseVersion !== undefined && draft.baseVersion !== opts.baseVersion;
            if (stale) this.clearDraft(formId, opts.draftScope);
            else form.patchValue(draft.values, { emitEvent: false });
        }

        const meta: DraftMeta = { version, baseVersion: opts.baseVersion };
        const sub = form.valueChanges
            .pipe(debounceTime(this.AUTO_SAVE_DEBOUNCE))
            .subscribe(() => this.saveDraft(formId, opts.draftScope, form.getRawValue(), meta));
        this.registrations.set(form, { formId, scope: opts.draftScope, ...meta, sub });

        return form;
    }

    /** Sauvegarde immédiate (ex. avant de quitter la page). */
    saveDraftNow(form: FormGroup): void {
        const reg = this.registrations.get(form);
        if (reg) this.saveDraft(reg.formId, reg.scope, form.getRawValue(), { version: reg.version, baseVersion: reg.baseVersion });
    }

    stopAutoSave(form: FormGroup): void {
        this.registrations.get(form)?.sub.unsubscribe();
        this.registrations.delete(form);
    }

    /** Arrête la sauvegarde automatique et efface le brouillon (après un enregistrement réussi). */
    discardDraft(form: FormGroup): void {
        const reg = this.registrations.get(form);
        this.stopAutoSave(form);
        if (reg) this.clearDraft(reg.formId, reg.scope);
    }

    resetForm(form: FormGroup, definition: AuditFormDefinition, initialValues?: Record<string, unknown>): void {
        const defaults: Record<string, unknown> = {};
        for (const section of definition.sections) {
            for (const field of section.fields) {
                if (field.type !== 'divider') defaults[field.key] = this.getDefaultValue(field);
            }
        }
        form.reset({ ...defaults, ...(initialValues ?? {}) });
        const reg = this.registrations.get(form);
        if (reg) this.clearDraft(reg.formId, reg.scope);
    }

    // ===================== VALIDATORS =====================

    private buildValidators(field: AuditField): ValidatorFn[] {
        const validators: ValidatorFn[] = [];

        // Required (par type)
        if (field.required) {
            switch (field.type) {
                case 'toggle':
                    validators.push(this.requiredNotNull());
                    break;

                case 'choice':
                    validators.push(this.requiredOption(field));
                    break;

                case 'date':
                case 'governorate':
                case 'city':
                    validators.push(this.requiredNotEmpty());
                    break;

                case 'signature':
                    validators.push(this.signatureRequired());
                    break;

                default:
                    validators.push(Validators.required);
                    break;
            }
        }

        // Type-specific
        switch (field.type) {
            case 'email':
                validators.push(Validators.email);
                break;

            case 'tel':
                // ✅ TN-friendly: accepte "+216 XX XXX XXX" ou "XX XXX XXX"
                validators.push(Validators.pattern(/^(?:\+216\s?)?\d{2}\s?\d{3}\s?\d{3}$/));
                break;

            case 'number': {
                // attention: field.min/max existent seulement sur NumberField
                const anyField = field as any;
                if (anyField.min !== undefined) validators.push(Validators.min(anyField.min));
                if (anyField.max !== undefined) validators.push(Validators.max(anyField.max));
                break;
            }

            case 'text':
            case 'textarea':
                // optionnel: maxLength / pattern si tu ajoutes ces props dans ton schema
                break;
        }

        return validators;
    }

    private requiredNotNull(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const v = control.value;
            return v === null || v === undefined ? { required: true } : null;
        };
    }

    /** Une valeur qui n'est plus parmi les options (form.json modifié) compte comme non répondue. */
    private requiredOption(field: AuditField): ValidatorFn {
        const allowed = new Set((field.options ?? []).map(o => o.value));
        return (control: AbstractControl): ValidationErrors | null =>
            allowed.has(control.value) ? null : { required: true };
    }

    private requiredNotEmpty(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const v = control.value;
            if (v === null || v === undefined) return { required: true };
            if (typeof v === 'string' && v.trim().length === 0) return { required: true };
            return null;
        };
    }

    private signatureRequired(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const v = control.value;

            if (!v) return { required: true };

            // string dataUrl
            if (typeof v === 'string') {
                return v.trim().length > 0 ? null : { required: true };
            }

            // object style: { dataUrl } ou { base64 }
            if (typeof v === 'object') {
                const anyV = v as any;
                if (typeof anyV.dataUrl === 'string' && anyV.dataUrl.trim().length > 0) return null;
                if (typeof anyV.base64 === 'string' && anyV.base64.trim().length > 0) return null;
            }

            return { required: true };
        };
    }

    // ===================== DEFAULT VALUES =====================

    private getDefaultValue(field: AuditField): unknown {
        switch (field.type) {
            case 'toggle':
            case 'number':
            case 'choice':
            case 'date':
            case 'signature':
            case 'governorate':
            case 'city':
                return null; // ✅ force sélection si required
            default:
                return '';
        }
    }

    // ===================== SECTION HELPERS =====================

    getSectionKeys(section: AuditSection): string[] {
        return section.fields.filter(f => f.type !== 'divider').map(f => f.key);
    }

    markSectionTouched(form: FormGroup, section: AuditSection): void {
        this.getSectionKeys(section).forEach(key => {
            const control = form.get(key);
            if (!control) return;
            control.markAsTouched();
            control.markAsDirty();
            control.updateValueAndValidity({ emitEvent: false });
        });
    }

    isSectionValid(form: FormGroup, section: AuditSection): boolean {
        const values = form.getRawValue();
        return section.fields.every(field => {
            if (field.type === 'divider' || !isFieldVisible(field, values)) return true;

            const control = form.get(field.key);
            if (!control) return true;
            if (control.invalid) return false;
            if (field.required) return hasAnswer(control.value);
            return true;
        });
    }

    // ===================== DRAFT STORAGE =====================

    saveDraft(formId: string, scope: string, values: unknown, meta: DraftMeta = {}): void {
        try {
            const draft: DraftPayload = {
                formId,
                version: meta.version,
                baseVersion: meta.baseVersion,
                timestamp: new Date().toISOString(),
                values: (values ?? {}) as Record<string, unknown>,
            };
            localStorage.setItem(this.getDraftKey(formId, scope), JSON.stringify(draft));
        } catch (e) {
            console.warn('Failed to save draft:', e);
        }
    }

    clearDraft(formId: string, scope: string): void {
        try {
            localStorage.removeItem(this.getDraftKey(formId, scope));
        } catch (e) {
            console.warn('Failed to clear draft:', e);
        }
    }

    private loadDraft(formId: string, scope: string): DraftPayload | null {
        try {
            const raw = localStorage.getItem(this.getDraftKey(formId, scope));
            if (!raw) return null;
            const draft = JSON.parse(raw) as DraftPayload;
            return draft?.formId && draft?.values ? draft : null;
        } catch {
            return null;
        }
    }

    private getDraftKey(formId: string, scope: string): string {
        return `${this.STORAGE_KEY_PREFIX}_${formId}_${scope}`;
    }
}
