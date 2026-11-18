import { 
  Component, 
  EventEmitter, 
  Input, 
  Output, 
  ChangeDetectorRef
} from '@angular/core';
import { HeaderDesign } from '../design-switcher/design-switcher.component';
import { WizardHeaderData } from '../../../audit.models';

@Component({
  selector: 'app-wizard-header',
  standalone: false,
  templateUrl: './wizard-header.component.html',
  styleUrl: './wizard-header.component.scss'
  // Ne pas mettre ChangeDetectionStrategy.OnPush ici si possible pour tester, 
  // ou bien s'assurer de bien gérer le cdr.
})
export class WizardHeaderComponent {
  // On rend la propriété publique et simple pour le template
  // On évite le getter/setter complexe si possible pour le binding simple
  // MAIS pour votre problème, on va garder une logique de mise à jour explicite.
  
  _design: HeaderDesign = 'circular';

  @Input() 
  set design(value: HeaderDesign) {
    if (this._design !== value) {
      this._design = value;
      // Le secret : on clone data pour forcer les enfants (Wave/Circular...) 
      // à voir un "nouvel" input et donc se rafraîchir.
      if (this.data) {
        this.data = { ...this.data };
        this.cdr.detectChanges();
      }
    }
  }
  
  get design(): HeaderDesign {
    return this._design;
  }

  @Input() data!: WizardHeaderData;
  @Output() stepChange = new EventEmitter<number>();

  constructor(private cdr: ChangeDetectorRef) {}

  onStepClick(index: number): void {
    this.stepChange.emit(index);
  }

  // Bindings :
  // Au lieu d'utiliser .bind(this) dans le HTML qui est mauvais pour la perf
  // et peut causer des bugs de cycle, on utilise des propriétés fléchées
  // ou on passe simplement la méthode si le contexte 'this' n'est pas perdu 
  // (ce qui est le cas ici car appelé depuis le template enfant).
  // Mais pour être sûr, transformons-les en propriétés :

  isStepCompleted = (index: number): boolean => {
    return index < (this.data?.stepIndex ?? 0);
  }

  canGoTo = (index: number): boolean => {
    return index <= (this.data?.stepIndex ?? 0);
  }

  trackBySection(index: number): number {
    return index;
  }
}
