import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import type { AuditSection, AuditField } from '../../audit.models';
import { LocaleService } from '../../data/locale.service';

/**
 * AuditStepComponent
 * 
 * Displays a single audit section with:
 * - Premium header with badge and decorative elements
 * - Responsive grid layout for fields
 * - Automatic full-width detection for specific field types
 * - Staggered animation on load
 * - RTL support with LocalizedText
 */
@Component({
    selector: 'app-audit-step',
    standalone: false,
    templateUrl: './audit-step.component.html',
    styleUrls: ['./audit-step.component.scss']
})
export class AuditStepComponent {
    // ============ INPUTS ============
    @Input({ required: true }) section!: AuditSection;
    @Input({ required: true }) form!: FormGroup;
    @Input() sections: AuditSection[] = [];

    get allFields(): AuditField[] {
        return this.sections.flatMap(s => s.fields);
    }    // ============ CONSTRUCTOR ============
    constructor(public i18n: LocaleService) { }

    // ============ FIELD LAYOUT LOGIC ============

    /**
     * Determines if a field should span full width
     * @param field - AuditField to check
     * @returns true if field should be full width
     */
    isFullWidth(field: AuditField): boolean {
        const fullWidthTypes: AuditField['type'][] = [
            'textarea',
            'signature',
            'divider'
        ];

        return fullWidthTypes.includes(field.type);
    }

    /**
     * TrackBy function for *ngFor performance optimization
     * @param index - Current index
     * @param field - Current field
     * @returns Unique identifier
     */
    trackByField(index: number, field: AuditField): string {
        return field.key || `field-${index}`;
    }
}
