import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldRendererComponent } from './field-renderer.component';
import { UiSignatureComponent } from '../ui-signature/ui-signature.component';
import type { AuditField } from '../../audit.models';

describe('FieldRendererComponent — signature', () => {
  const field: AuditField = { key: 'sig', type: 'signature', label: { fr: 'Signature', ar: 'توقيع' } };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldRendererComponent, UiSignatureComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  it('relie le pad de signature à son contrôle sans formGroup parent dans le même template', () => {
    const writeSpy = spyOn(UiSignatureComponent.prototype, 'writeValue').and.callThrough();
    const form = new FormGroup({ sig: new FormControl<string | null>(null) });
    const fixture = TestBed.createComponent(FieldRendererComponent);
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('form', form);

    expect(() => fixture.detectChanges()).not.toThrow();

    form.controls.sig.setValue('data:image/png;base64,AAAA');
    expect(writeSpy).toHaveBeenCalledWith('data:image/png;base64,AAAA');
  });
});
