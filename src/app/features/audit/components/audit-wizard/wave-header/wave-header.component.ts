import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { WizardHeaderData } from '../../../audit.models';

@Component({
  selector: 'app-wave-header',
  standalone: false,
  templateUrl: './wave-header.component.html',
  styleUrl: './wave-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation Perf
})
export class WaveHeaderComponent {
  @Input() data!: WizardHeaderData;
  @Input() isStepCompleted!: (index: number) => boolean;
  @Input() canGoTo!: (index: number) => boolean;
  @Input() trackBySection!: (index: number, item: any) => any;
  
  @Output() stepClick = new EventEmitter<number>();
  
  // Particules décoratives pour l'animation de flux
  readonly particles = [1, 2, 3];
  
  /** Positionne les nœuds (points d'étapes) sur la rivière */
  getNodePosition(index: number): number {
    const total = this.data.totalSteps;
    if (!total || total <= 1) return 0;
    return (index / (total - 1)) * 100;
  }
  
  /** Largeur de la barre de progression "liquide" */
  get flowFillWidth(): number {
    const total = this.data.totalSteps;
    if (!total || total <= 1) return 0;
    // On ajoute un petit offset pour que le liquide dépasse légèrement le point
    return Math.min(((this.data.stepIndex) / (total - 1)) * 100, 100);
  }
  
  /** Label dynamique pour l'accessibilité */
  get stepLabel(): string {
    const isAr = this.data.locale === 'ar';
    return isAr 
      ? `الخطوة ${this.data.stepIndex + 1} من ${this.data.totalSteps}`
      : `Étape ${this.data.stepIndex + 1} sur ${this.data.totalSteps}`;
  }

  /** Label d'état pour tooltip */
  getStatusLabel(index: number): string {
    const isAr = this.data.locale === 'ar';
    if (this.isStepCompleted(index)) return isAr ? 'مكتمل' : 'Complété';
    if (index === this.data.stepIndex) return isAr ? 'en cours' : 'En cours'; // 'Jari' en arabe? Adapté selon besoin
    return isAr ? 'آت' : 'À venir';
  }
}
