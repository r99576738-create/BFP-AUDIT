import { Component, EventEmitter, Input, Output } from '@angular/core';
export type HeaderDesign = 'circular' | 'wave' | 'metro';

@Component({
  selector: 'app-design-switcher',
  standalone: false,
  templateUrl: './design-switcher.component.html',
  styleUrl: './design-switcher.component.scss'
})
export class DesignSwitcherComponent {
  @Input() currentDesign: HeaderDesign = 'circular';
  @Output() designChange = new EventEmitter<HeaderDesign>();

  setDesign(design: HeaderDesign): void {
    this.designChange.emit(design);
  }
}
