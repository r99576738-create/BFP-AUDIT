import { TestBed } from '@angular/core/testing';
import { MetroHeaderComponent } from './metro-header.component';
import type { WizardHeaderData } from '../../../audit.models';

describe('MetroHeaderComponent', () => {
  const section = { id: 's', title: { fr: 'S', ar: 'S' }, fields: [] };
  const data: WizardHeaderData = { stepIndex: 0, totalSteps: 2, progressPercent: 50, currentSection: section, sections: [section, { ...section, id: 't' }], locale: 'fr' };

  it('affiche les étapes reçues', async () => {
    await TestBed.configureTestingModule({ declarations: [MetroHeaderComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MetroHeaderComponent);
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('isStepCompleted', () => false);
    fixture.componentRef.setInput('canGoTo', () => true);
    fixture.componentRef.setInput('trackBySection', (i: number) => i);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
