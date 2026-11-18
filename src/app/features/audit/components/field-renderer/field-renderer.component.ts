import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import type { AuditField, VisibleWhenRule } from '../../audit.models';
import { LocaleService } from '../../data/locale.service';
import { isFieldVisible } from '../../data/field-visibility';
import {

  getCitiesByGovernorate,
  TunisiaGovernorate,
  TunisiaCity,
  TUNISIA_GOVERNORATES,
} from '../../data/tunisia-locations.data';

// ✅ si ton fichier s'appelle TUNISIA_GOVERNORATES (sans OR) garde l’ancien import.
// J’ai laissé le nom tel que chez toi, mais corrige selon ton vrai export.

type ChoiceOption = { value: string; label: Record<string, string> };
type CityField = AuditField & { type: 'city'; governorateKey: string };
type NumberLikeField = AuditField & { type: 'number'; min?: number; max?: number; step?: number };
type TextareaLikeField = AuditField & { type: 'textarea'; rows?: number };
type ChoiceLikeField = AuditField & { type: 'choice'; options: ChoiceOption[] };

@Component({
  selector: 'app-field-renderer',
  standalone: false,
  templateUrl: './field-renderer.component.html',
  styleUrls: ['./field-renderer.component.scss'],
})
export class FieldRendererComponent {
  @Input({ required: true }) field!: AuditField;
  @Input({ required: true }) form!: FormGroup;

  /** Optionnel mais recommandé (reset dépendances + city<-governorate) */
  @Input() allFields: AuditField[] = [];

  governorates = TUNISIA_GOVERNORATES; // ✅ adapte si ton export s'appelle TUNISIA_GOVERNORATES

  constructor(public i18n: LocaleService) {}

  // ===================== VISIBILITY (visibleWhen) =====================
  private getVisibleRule(f: AuditField): VisibleWhenRule | undefined {
    return f.visibleWhen;
  }

  isVisible(f: AuditField = this.field): boolean {
    return isFieldVisible(f, this.form.getRawValue());
  }

  private resetValueForField(f: AuditField): any {
    switch (f.type) {
      case 'toggle':
      case 'choice':
      case 'number':
      case 'date':
      case 'governorate':
      case 'city':
      case 'signature':
        return null;
      case 'textarea':
      case 'text':
      case 'tel':
      case 'email':
      default:
        return '';
    }
  }

  /** reset tous les champs qui deviennent cachés à cause d’un changement */
  private clearHiddenDependents(changedKey: string, visited = new Set<string>()): void {
    if (visited.has(changedKey)) return;
    visited.add(changedKey);

    for (const f of this.allFields || []) {
      const rule = this.getVisibleRule(f);
      if (!rule) continue;
      if (rule.key !== changedKey) continue;

      // si f devient invisible => reset
      if (!this.isVisible(f)) {
        const ctrl = this.form.get(f.key);
        if (ctrl) {
          ctrl.setValue(this.resetValueForField(f), { emitEvent: false });
          ctrl.markAsPristine();
          ctrl.markAsUntouched();
          ctrl.updateValueAndValidity({ emitEvent: false });
        }

        // cascade: si d’autres champs dépendent de ce champ reset
        this.clearHiddenDependents(f.key, visited);
      }
    }
  }

  // ===================== CONTROL =====================
  getControl(): FormControl {
    return this.form.get(this.field.key) as FormControl;
  }

  getValue(): unknown {
    return this.getControl()?.value;
  }

  isInvalid(): boolean {
    const c = this.getControl();
    return !!c && (c.touched || c.dirty) && c.invalid;
  }

  isFilled(): boolean {
    const v = this.getValue();
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return !Number.isNaN(v);
    if (typeof v === 'boolean') return true;
    return true;
  }

  // ===================== LABELS / PLACEHOLDER =====================
  getPlaceholder(): string {
    const p = this.field.placeholder;
    if (!p) return '';
    return p[this.i18n.locale] ?? p['fr'] ?? '';
  }

  getLabel(): string {
    const l = this.field.label;
    if (!l) return '';
    return l[this.i18n.locale] ?? l['fr'] ?? '';
  }

  getFieldId(): string {
    return `bf-field-${this.field.key}`;
  }

  getErrorId(): string {
    return `bf-error-${this.field.key}`;
  }

  getHelperId(): string {
    return `${this.getFieldId()}-helper`;
  }

  shouldShowHelper(): boolean {
    return !!this.field.placeholder && this.field.type !== 'choice' && this.field.type !== 'toggle';
  }

  getAriaDescribedBy(): string | null {
    const ids: string[] = [];
    if (this.shouldShowHelper()) ids.push(this.getHelperId());
    if (this.isInvalid()) ids.push(this.getErrorId());
    return ids.length ? ids.join(' ') : null;
  }

  // ===================== ERRORS =====================
  getErrorText(): string {
    const control = this.getControl();
    if (!control?.errors) return '';

    const ar = this.i18n.locale === 'ar';

    if (control.errors['required']) return ar ? 'هذا الحقل مطلوب' : 'Ce champ est requis';
    if (control.errors['email']) return ar ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    if (control.errors['pattern']) return ar ? 'تنسيق غير صالح' : 'Format invalide';

    if (control.errors['min']) {
      const min = control.errors['min'].min;
      return ar ? `الحد الأدنى: ${min}` : `Minimum: ${min}`;
    }

    if (control.errors['max']) {
      const max = control.errors['max'].max;
      return ar ? `الحد الأقصى: ${max}` : `Maximum: ${max}`;
    }

    return ar ? 'قيمة غير صالحة' : 'Valeur invalide';
  }

  // ===================== NUMBER / TEXTAREA GETTERS =====================
  get numberMin(): number | null {
    if (this.field.type !== 'number') return null;
    const f = this.field as NumberLikeField;
    return f.min ?? null;
  }

  get numberMax(): number | null {
    if (this.field.type !== 'number') return null;
    const f = this.field as NumberLikeField;
    return f.max ?? null;
  }

  get numberStep(): number | null {
    if (this.field.type !== 'number') return null;
    const f = this.field as NumberLikeField;
    return f.step ?? null;
  }

  get textareaRows(): number {
    if (this.field.type !== 'textarea') return 4;
    const f = this.field as TextareaLikeField;
    return f.rows ?? 4;
  }

  // ===================== CHOICE =====================
  get choiceOptions(): ChoiceOption[] {
    if (this.field.type !== 'choice') return [];
    const f = this.field as ChoiceLikeField;
    return Array.isArray(f.options) ? f.options : [];
  }

  getOptionLabel(option: ChoiceOption): string {
    return option?.label?.[this.i18n.locale] ?? option?.label?.['fr'] ?? '';
  }

  setChoiceValue(value: string): void {
    const control = this.getControl();
    control.setValue(value);
    control.markAsTouched();
    control.markAsDirty();

    // ✅ reset champs conditionnels cachés
    this.clearHiddenDependents(this.field.key);
  }

  onChoiceKeydown(event: KeyboardEvent, value: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.setChoiceValue(value);
    }
  }

  isChoiceSelected(optionValue: string): boolean {
    return this.getValue() === optionValue;
  }

  trackByOptionValue(_: number, option: ChoiceOption): string {
    return option.value;
  }

  // ===================== TOGGLE =====================
  setToggleValue(value: boolean): void {
    const control = this.getControl();
    control.setValue(value);
    control.markAsTouched();
    control.markAsDirty();

    // ✅ reset champs conditionnels cachés
    this.clearHiddenDependents(this.field.key);
  }

  onToggleKeydown(event: KeyboardEvent, value: boolean): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.setToggleValue(value);
    }
  }

  getTogglePillTransform(): string {
    const value = this.getValue();
    const isRTL = this.i18n.dir === 'rtl';

    if (value === true) return isRTL ? 'translateX(100%)' : 'translateX(0)';
    if (value === false) return isRTL ? 'translateX(0)' : 'translateX(100%)';
    return '';
  }

  isTogglePillVisible(): boolean {
    const value = this.getValue();
    return value === true || value === false;
  }

  // ===================== GOV / CITY =====================
  private isCityField(f: AuditField): f is CityField {
    return f.type === 'city' && typeof f.governorateKey === 'string';
  }

  get availableCities(): TunisiaCity[] {
    if (this.field.type !== 'city') return [];

    const cityField = this.field as CityField;
    const govCode = this.form.get(cityField.governorateKey)?.value as string | null;

    if (!govCode) return [];
    return getCitiesByGovernorate(govCode);
  }

  onGovernorateChange(): void {
    if (!this.allFields?.length) return;

    const governorateKey = this.field.key;

    const dependentCities = this.allFields.filter(
      (f): f is CityField => this.isCityField(f) && f.governorateKey === governorateKey
    );

    dependentCities.forEach(cityField => {
      const c = this.form.get(cityField.key);
      if (!c) return;

      c.setValue(null, { emitEvent: false });
      c.markAsPristine();
      c.markAsUntouched();
      c.updateValueAndValidity({ emitEvent: false });
    });
  }

  trackByGovernorateCode(_: number, gov: TunisiaGovernorate): string {
    return gov.code;
  }

  trackByCityName(_: number, city: TunisiaCity): string {
    return city.name;
  }
}
