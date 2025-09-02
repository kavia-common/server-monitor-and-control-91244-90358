import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { Component } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';

/**
 * Lightweight stub components for protected routes to ensure routing works.
 * Replace these with actual feature modules/components later.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `<div style="padding:16px"><h2>Dashboard</h2><p>Protected area. Replace with real dashboard.</p></div>`,
})
export class DashboardStubComponent {}

@Component({
  selector: 'app-services',
  standalone: true,
  template: `<div style="padding:16px"><h2>Services</h2><p>Protected services route. Replace with services list.</p></div>`,
})
export class ServicesStubComponent {}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => Promise.resolve(DashboardStubComponent) },
      { path: 'services', loadComponent: () => Promise.resolve(ServicesStubComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' },
];
