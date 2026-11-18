import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuditPageComponent } from './features/audit/pages/audit-page/audit-page.component';
import { AuditWizardComponent } from './features/audit/components/audit-wizard/audit-wizard.component';
import { AuditStepComponent } from './features/audit/components/audit-step/audit-step.component';
import { FieldRendererComponent } from './features/audit/components/field-renderer/field-renderer.component';
import { UiSignatureComponent } from './features/audit/components/ui-signature/ui-signature.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { DesignSwitcherComponent } from './features/audit/components/audit-wizard/design-switcher/design-switcher.component';
import { WizardHeaderComponent } from './features/audit/components/audit-wizard/wizard-header/wizard-header.component';
import { CircularHeaderComponent } from './features/audit/components/audit-wizard/circular-header/circular-header.component';
import { WaveHeaderComponent } from './features/audit/components/audit-wizard/wave-header/wave-header.component';
import { MetroHeaderComponent } from './features/audit/components/audit-wizard/metro-header/metro-header.component';
import { TopbarComponent } from './core/topbar/topbar.component';
import { LoginPageComponent } from './features/auth/login-page/login-page.component';
import { AuditListPageComponent } from './features/audit/pages/audit-list-page/audit-list-page.component';
import { AuditDetailPageComponent } from './features/audit/pages/audit-detail-page/audit-detail-page.component';
import { ScoreSummaryComponent } from './features/audit/components/score-summary/score-summary.component';

@NgModule({
  declarations: [
    AppComponent,
    AuditPageComponent,
    AuditWizardComponent,
    AuditStepComponent,
    FieldRendererComponent,
    UiSignatureComponent,
    DesignSwitcherComponent,
    WizardHeaderComponent,
    CircularHeaderComponent,
    WaveHeaderComponent,
    MetroHeaderComponent,
    TopbarComponent,
    LoginPageComponent,
    AuditListPageComponent,
    AuditDetailPageComponent,
    ScoreSummaryComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideAnimations(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
