import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './core/layouts/app-shell.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login',  loadComponent: () => import('./features/auth/login-page.component').then(m => m.LoginPageComponent) },
      { path: 'signup', loadComponent: () => import('./features/auth/signup-page.component').then(m => m.SignupPageComponent) },
    ],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',      loadComponent: () => import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent) },
      { path: 'employees',      loadComponent: () => import('./features/employees/employees-page.component').then(m => m.EmployeesPageComponent) },
      { path: 'employees/new',  loadComponent: () => import('./features/employees/employee-form-page.component').then(m => m.EmployeeFormPageComponent) },
      { path: 'employees/:id',  loadComponent: () => import('./features/employees/employee-detail-page.component').then(m => m.EmployeeDetailPageComponent) },
      { path: 'departments',    loadComponent: () => import('./features/departments/departments-page.component').then(m => m.DepartmentsPageComponent) },
      { path: 'leave-requests', loadComponent: () => import('./features/leave-requests/leave-requests-page.component').then(m => m.LeaveRequestsPageComponent) },
      { path: 'attendance',     loadComponent: () => import('./features/attendance/attendance-page.component').then(m => m.AttendancePageComponent) },
      { path: 'payroll',        loadComponent: () => import('./features/payroll/payroll-page.component').then(m => m.PayrollPageComponent) },
      { path: 'recruitment',    loadComponent: () => import('./features/recruitment/recruitment-page.component').then(m => m.RecruitmentPageComponent) },
      { path: 'notifications',  loadComponent: () => import('./features/notifications/notifications-page.component').then(m => m.NotificationsPageComponent) },
      { path: 'documents',      loadComponent: () => import('./features/documents/documents-page.component').then(m => m.DocumentsPageComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
