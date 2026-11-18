import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignSwitcherComponent } from './design-switcher.component';

describe('DesignSwitcherComponent', () => {
  let component: DesignSwitcherComponent;
  let fixture: ComponentFixture<DesignSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DesignSwitcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
