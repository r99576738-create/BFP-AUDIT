import { Component, HostListener, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import type { AuditFormDefinition, AuditScore, AuditSection, WizardHeaderData } from '../../audit.models';
import { AuditFormService } from '../../data/audit-form.service';
import { AuditRepository, AuditRepositoryError } from '../../data/audit-repository.service';
import { LocaleService } from '../../data/locale.service';
import { ScoringService } from '../../data/scoring.service';
import { HeaderDesign } from './design-switcher/design-switcher.component';

@Component({
    selector: 'app-audit-wizard',
    standalone: false,
    templateUrl: './audit-wizard.component.html',
    styleUrls: ['./audit-wizard.component.scss'],
})
export class AuditWizardComponent implements OnInit, OnDestroy {
    @Input({ required: true }) def!: AuditFormDefinition;
    @Input({ required: true }) form!: FormGroup;
    /** null = nouvel audit ; sinon id de l'audit modifié. */
    @Input() auditId: string | null = null;

    stepIndex = 0;
    savingPulse = false;
    saving = false;
    saveErrorCode: string | null = null;
    liveScore: AuditScore | null = null;

    headerDesign: HeaderDesign = 'wave';

    private destroy$ = new Subject<void>();
    private readonly STORAGE_KEY_DESIGN = 'bf_wizard_header_design';

    constructor(
        public i18n: LocaleService,
        private auditSrv: AuditFormService,
        private scoring: ScoringService,
        private repo: AuditRepository,
        private router: Router,
    ) {
        this.loadSavedDesign();
    }

    ngOnInit(): void {
        this.updateLiveScore();
        this.form.valueChanges
            .pipe(debounceTime(300), takeUntil(this.destroy$))
            .subscribe(() => this.updateLiveScore());
        this.announceStep();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get headerData(): WizardHeaderData {
        const sections = this.def?.sections || [];
        return {
            stepIndex: this.stepIndex,
            totalSteps: sections.length,
            progressPercent: this.progressPercent(),
            currentSection: this.currentSection,
            sections,
            locale: this.i18n.locale
        };
    }

    onDesignChange(design: HeaderDesign): void {
        this.headerDesign = design;
        try {
            localStorage.setItem(this.STORAGE_KEY_DESIGN, design);
        } catch { }
    }

    onStepChange(index: number): void {
        this.goTo(index);
    }

    // ============ COMPUTED ============
    get totalSteps(): number {
        return this.def?.sections?.length || 0;
    }

    get currentSection(): AuditSection {
        return this.def.sections[this.stepIndex];
    }

    progressPercent(): number {
        if (!this.totalSteps) return 0;
        return Math.round(((this.stepIndex + 1) / this.totalSteps) * 100);
    }

    get saveError(): string | null {
        const code = this.saveErrorCode;
        if (!code) return null;
        if (code === 'PGRST301' || /jwt|session/i.test(code)) {
            return this.i18n.tr(
                'Votre session a expiré. Reconnectez-vous dans un autre onglet puis réessayez : vos réponses sont conservées.',
                'انتهت الجلسة. سجّل الدخول في نافذة أخرى ثم أعد المحاولة: إجاباتك محفوظة.');
        }
        if (/fetch|network/i.test(code)) {
            return this.i18n.tr(
                'Serveur injoignable. Vérifiez votre connexion puis réessayez : vos réponses sont conservées.',
                'تعذّر الاتصال بالخادم. تحقّق من الاتصال ثم أعد المحاولة: إجاباتك محفوظة.');
        }
        return this.i18n.tr(
            `L’enregistrement a échoué (${code}). Vos réponses sont conservées, réessayez.`,
            `فشل الحفظ (${code}). إجاباتك محفوظة، أعد المحاولة.`);
    }

    // ============ DESIGN SWITCHER ============
    private loadSavedDesign(): void {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY_DESIGN);
            if (saved === 'circular' || saved === 'wave' || saved === 'metro') this.headerDesign = saved;
        } catch { }
    }

    // ============ STEP VALIDATION LOGIC ============
    private blockedIndex(): number {
        for (let i = 0; i < this.totalSteps; i++) {
            if (!this.auditSrv.isSectionValid(this.form, this.def.sections[i])) return i;
        }
        return this.totalSteps;
    }

    canGoTo(index: number): boolean {
        if (index <= this.stepIndex) return true;
        return index <= this.blockedIndex();
    }

    canSubmit(): boolean {
        return this.def.sections.every(section => this.auditSrv.isSectionValid(this.form, section));
    }

    // ============ NAVIGATION ============
    prev(): void {
        if (this.stepIndex > 0) {
            this.stepIndex--;
            this.scrollToTop();
            this.announceStep();
        }
    }

    next(): void {
        this.auditSrv.markSectionTouched(this.form, this.currentSection);

        if (!this.auditSrv.isSectionValid(this.form, this.currentSection)) {
            this.flashValidationError();
            return;
        }

        if (this.stepIndex < this.totalSteps - 1) {
            this.stepIndex++;
            this.scrollToTop();
            this.announceStep();
        }
    }

    goTo(targetIndex: number): void {
        if (targetIndex === this.stepIndex) return;

        if (targetIndex < this.stepIndex) {
            this.stepIndex = targetIndex;
            this.scrollToTop();
            this.announceStep();
            return;
        }

        for (let i = this.stepIndex; i < targetIndex; i++) {
            const section = this.def.sections[i];
            this.auditSrv.markSectionTouched(this.form, section);
            if (!this.auditSrv.isSectionValid(this.form, section)) {
                this.stepIndex = i;
                this.scrollToTop();
                this.flashValidationError();
                return;
            }
        }

        this.stepIndex = targetIndex;
        this.scrollToTop();
        this.announceStep();
    }

    // ============ SUBMIT ============
    async submit(): Promise<void> {
        if (this.saving) return;
        this.def.sections.forEach(section => this.auditSrv.markSectionTouched(this.form, section));

        if (!this.canSubmit()) {
            this.stepIndex = this.blockedIndex();
            this.scrollToTop();
            this.flashValidationError();
            this.announceToScreenReader(this.i18n.tr(
                'Veuillez remplir tous les champs requis avant d’enregistrer.',
                'يرجى ملء جميع الحقول المطلوبة قبل الحفظ.'));
            return;
        }

        this.auditSrv.saveDraftNow(this.form);
        this.saving = true;
        this.saveErrorCode = null;
        const answers = this.form.getRawValue();
        const score = this.scoring.compute(this.def, answers);

        try {
            let id = this.auditId;
            if (id) await this.repo.update(id, this.def, answers, score);
            else id = await this.repo.create(this.def, answers, score);

            this.auditSrv.discardDraft(this.form);
            this.form.markAsPristine();
            await this.router.navigate(['/audits', id], { state: { saved: true } });
        } catch (e: any) {
            this.saveErrorCode = e instanceof AuditRepositoryError ? (e.code || e.message) : (e?.message ?? 'unknown');
            this.announceToScreenReader(this.saveError ?? '');
        } finally {
            this.saving = false;
        }
    }

    get showLiveScore(): boolean {
        return !!this.liveScore && this.liveScore.answeredScorable > 0;
    }

    @HostListener('window:pagehide')
    onPageHide(): void {
        if (this.form.dirty) this.auditSrv.saveDraftNow(this.form);
    }

    @HostListener('document:visibilitychange')
    onVisibilityChange(): void {
        if (document.visibilityState === 'hidden') this.onPageHide();
    }

    private updateLiveScore(): void {
        this.liveScore = this.scoring.compute(this.def, this.form.getRawValue());
    }

    // ============ VISUAL FEEDBACK ============
    private flashValidationError(): void {
        this.savingPulse = true;
        setTimeout(() => { this.savingPulse = false; }, 400);
    }

    // ============ ACCESSIBILITY ============
    private scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private announceStep(): void {
        const label = this.i18n.tr(`Étape ${this.stepIndex + 1} / ${this.totalSteps}`, `المرحلة ${this.stepIndex + 1} / ${this.totalSteps}`);
        this.announceToScreenReader(`${label}: ${this.currentSection.title[this.i18n.locale]}`);
    }

    private announceToScreenReader(message: string): void {
        let liveRegion = document.getElementById('bf-wizard-live');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'bf-wizard-live';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = '';
        setTimeout(() => { liveRegion!.textContent = message; }, 100);
    }

    // ============ KEYBOARD NAVIGATION ============
    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        const isRTL = this.i18n.dir === 'rtl';

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            isRTL ? this.next() : this.prev();
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            isRTL ? this.prev() : this.next();
        }

        if (event.key === 'Home') {
            event.preventDefault();
            this.goTo(0);
        }

        if (event.key === 'End') {
            event.preventDefault();
            this.goTo(Math.min(this.totalSteps - 1, this.blockedIndex()));
        }
    }
}
