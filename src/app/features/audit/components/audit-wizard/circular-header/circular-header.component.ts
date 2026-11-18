import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { WizardHeaderData } from '../../../audit.models';

@Component({
  selector: 'app-circular-header',
  standalone: false,
  templateUrl: './circular-header.component.html',
  styleUrl: './circular-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularHeaderComponent {
  @Input() data!: WizardHeaderData;
  @Input() isStepCompleted!: (index: number) => boolean;
  @Input() canGoTo!: (index: number) => boolean;
  @Input() trackBySection!: (index: number, item: any) => any;
  
  @Output() stepClick = new EventEmitter<number>();
  
  // Circonférence pour r=54 (2 * PI * 54 ≈ 339.292)
  readonly CIRCLE_CIRCUMFERENCE = 339.292;
  
  /** Calcule l'offset du dash SVG pour l'animation de progression */
  get strokeDashoffset(): number {
    const progress = Math.min(Math.max(this.data.progressPercent, 0), 100);
    return this.CIRCLE_CIRCUMFERENCE - (this.CIRCLE_CIRCUMFERENCE * progress / 100);
  }

  /* --- Textes Localisés --- */
  get isAr(): boolean { return this.data.locale === 'ar'; }
  get doneLabel(): string { return this.isAr ? 'مكتملة' : 'complétées'; }
  
  get remainingTimeLabel(): string {
    const remainingSteps = Math.max(0, this.data.totalSteps - this.data.stepIndex);
    const minutes = remainingSteps * 3; // Estimation 3min/step
    return this.isAr 
      ? `~${minutes} دقيقة متبقية`
      : `~${minutes} min restantes`;
  }
}
