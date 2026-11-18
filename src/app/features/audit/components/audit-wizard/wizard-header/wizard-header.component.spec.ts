import { TestBed } from '@angular/core/testing';
import { WizardHeaderComponent } from './wizard-header.component';
import { WaveHeaderComponent } from '../wave-header/wave-header.component';
import { CircularHeaderComponent } from '../circular-header/circular-header.component';
import { MetroHeaderComponent } from '../metro-header/metro-header.component';
import type { WizardHeaderData } from '../../../audit.models';

describe('WizardHeaderComponent', () => {
  const section = { id: 's', title: { fr: 'S', ar: 'S' }, fields: [] };
  const data: WizardHeaderData = { stepIndex: 0, totalSteps: 1, progressPercent: 100, currentSection: section, sections: [section], locale: 'fr' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WizardHeaderComponent, WaveHeaderComponent, CircularHeaderComponent, MetroHeaderComponent],
    }).compileComponents();
  });

  it('accepte un design reçu avant les données sans planter', () => {
    const fixture = TestBed.createComponent(WizardHeaderComponent);
    expect(() => {
      fixture.componentRef.setInput('design', 'wave');
      fixture.componentRef.setInput('data', data);
      fixture.detectChanges();
    }).not.toThrow();
    expect(fixture.nativeElement.querySelector('app-wave-header')).not.toBeNull();
  });
});
