import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { LoginPageComponent } from './features/auth/login-page/login-page.component';
import { AuditPageComponent } from './features/audit/pages/audit-page/audit-page.component';
import { AuditListPageComponent } from './features/audit/pages/audit-list-page/audit-list-page.component';
import { AuditDetailPageComponent } from './features/audit/pages/audit-detail-page/audit-detail-page.component';

const routes: Routes = [
  { path: 'login', component: LoginPageComponent, canActivate: [guestGuard] },
  {
    path: 'audits',
    canActivate: [authGuard],
    children: [
      { path: '', component: AuditListPageComponent },
      { path: 'new', component: AuditPageComponent },
      { path: ':id', component: AuditDetailPageComponent },
      { path: ':id/edit', component: AuditPageComponent },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'audits' },
  { path: '**', redirectTo: 'audits' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
