import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { WizardHeaderData } from '../../../audit.models';

@Component({
  selector: 'app-metro-header',
  standalone: false,
  templateUrl: './metro-header.component.html',
  styleUrl: './metro-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetroHeaderComponent {
  @Input() data!: WizardHeaderData;
  @Input() isStepCompleted!: (index: number) => boolean;
  @Input() canGoTo!: (index: number) => boolean;
  @Input() trackBySection!: (index: number, item: any) => any;
  
  @Output() stepClick = new EventEmitter<number>();
  
  /**
   * Calcule la position en pourcentage (0-100%)
   * @param index L'index de l'étape
   */
  getStationPosition(index: number): number {
    const total = this.data.totalSteps;
    if (!total || total <= 1) return 0;
    // On clamp entre 0 et 100 pour éviter les débordements
    return Math.max(0, Math.min((index / (total - 1)) * 100, 100));
  }
  
  /** Position du train (avec easing CSS côté template) */
  get trainPosition(): number {
    return this.getStationPosition(this.data.stepIndex);
  }

  /** Largeur de la ligne parcourue */
  get trainPathWidth(): number {
    return this.trainPosition;
  }
  
  /* --- Getters de Texte (Localisés) --- */
  get isAr(): boolean { return this.data.locale === 'ar'; }
  get lineName(): string { return this.isAr ? 'خط التدقيق' : 'Ligne Audit'; }
  get directionLabel(): string { return this.isAr ? 'الوجهة:' : 'Direction :'; }
  get nextStopLabel(): string { return this.isAr ? 'المحطة القادمة:' : 'Prochain arrêt :'; }
  
  get destinationTitle(): string {
    const last = this.data.sections[this.data.totalSteps - 1];
    return last?.title[this.data.locale] || '';
  }
  
  get nextStopTitle(): string | null {
    if (this.data.stepIndex >= this.data.totalSteps - 1) return null;
    const next = this.data.sections[this.data.stepIndex + 1];
    return next?.title[this.data.locale] || null;
  }
  
  isStationPassed(index: number): boolean {
    return index < this.data.stepIndex;
  }
}
