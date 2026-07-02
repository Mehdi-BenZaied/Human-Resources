import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { EMPLOYEE_STATUS_OPTIONS } from '../../core/hr.constants';
import { AuthService } from '../../core/auth/auth.service';
import { Department } from '../../core/models/department';
import { Employee } from '../../core/models/employee';
import { DepartmentService } from '../../core/services/department.service';
import { EmployeeService, EmployeeFilters } from '../../core/services/employee.service';

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>{{ auth.isAdmin() ? 'Employee Management' : 'Employee Directory' }}</h2>
          <p>{{ auth.isAdmin()
            ? 'Add, edit, and manage all employee records.'
            : 'Browse the company directory.' }}</p>
        </div>
        @if (auth.isAdmin()) {
          <a routerLink="/employees/new" class="btn btn-primary">+ Add Employee</a>
        }
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <form [formGroup]="filtersForm" class="filters-row">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="search" formControlName="search" placeholder="Search by name, title, email…" />
          </div>
          <select formControlName="department_id">
            <option value="">All departments</option>
            @for (dept of departments$ | async; track dept.id) {
              <option [value]="dept.id">{{ dept.name }}</option>
            }
          </select>
          <select formControlName="status">
            <option value="">All statuses</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </form>
      </div>

      @if (error) { <div class="error-banner">{{ error }}</div> }

      <!-- ══ ADMIN: full table ══ -->
      @if (auth.isAdmin()) {
        <div class="card table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Title</th>
                <th>Department</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr><td colspan="6" class="loading-cell">
                  <span class="spinner-inline"></span> Loading…
                </td></tr>
              } @else {
                @for (emp of employees; track emp.id) {
                  <tr>
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar">{{ emp.name.charAt(0) }}</div>
                        <div>
                          <p class="emp-name">{{ emp.name }}</p>
                          <p class="emp-email">{{ emp.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="text-muted">{{ emp.title }}</td>
                    <td class="text-muted">{{ emp.department?.name ?? '—' }}</td>
                    <td>
                      <span class="badge"
                        [class.badge-success]="emp.status === 'active'"
                        [class.badge-warning]="emp.status === 'on_leave'"
                        [class.badge-muted]="emp.status === 'inactive'">
                        {{ emp.status }}
                      </span>
                    </td>
                    <td class="text-muted">{{ emp.start_date | slice:0:10 }}</td>
                    <td>
                      <div class="row-actions">
                        <a [routerLink]="['/employees', emp.id]" class="btn btn-ghost btn-sm">✏️ Edit</a>
                        <button class="btn btn-danger btn-sm" (click)="delete(emp)">🗑</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="loading-cell">No employees found.</td></tr>
                }
              }
            </tbody>
          </table>
          @if (!loading) {
            <div class="table-footer">{{ employees.length }} result{{ employees.length !== 1 ? 's' : '' }}</div>
          }
        </div>

      } @else {
        <!-- ══ EMPLOYEE: directory cards ══ -->
        @if (loading) {
          <div class="skeleton-grid">
            @for (n of [1,2,3,4,5,6]; track n) { <div class="skeleton-card"></div> }
          </div>
        } @else {
          <div class="dir-grid">
            @for (emp of employees; track emp.id) {
              <a [routerLink]="['/employees', emp.id]" class="dir-card">
                <div class="dir-avatar">{{ emp.name.charAt(0) }}</div>
                <div class="dir-info">
                  <p class="dir-name">{{ emp.name }}</p>
                  <p class="dir-title">{{ emp.title }}</p>
                  <p class="dir-dept">{{ emp.department?.name }}</p>
                </div>
                <span class="badge dir-badge"
                  [class.badge-success]="emp.status === 'active'"
                  [class.badge-warning]="emp.status === 'on_leave'"
                  [class.badge-muted]="emp.status === 'inactive'">
                  {{ emp.status }}
                </span>
              </a>
            } @empty {
              <p class="empty-note">No employees found.</p>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }

    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    }
    h2 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; }
    p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.9rem; }

    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow);
    }
    .filters-card { padding: 1rem 1.25rem; }
    .filters-row { display: flex; gap: 0.75rem; align-items: center; }
    .search-wrap { position: relative; flex: 1; }
    .search-icon {
      position: absolute; left: 0.85rem; top: 50%;
      transform: translateY(-50%); font-size: 0.9rem; pointer-events: none;
    }
    .filters-row input { padding-left: 2.4rem; }
    .filters-row input, .filters-row select {
      width: 100%; padding: 0.7rem 1rem;
      border: 1.5px solid var(--border); border-radius: var(--radius);
      background: var(--surface-muted); font-size: 0.875rem; outline: none;
      transition: border-color .15s;
    }
    .filters-row input:focus, .filters-row select:focus {
      border-color: var(--primary);
    }
    .filters-row select { width: 180px; flex-shrink: 0; }

    .error-banner {
      padding: 0.8rem 1rem; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(220,38,38,.2);
    }

    /* Admin table */
    .table-card { overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th {
      padding: 0.85rem 1.25rem; text-align: left;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--muted);
      background: var(--surface-muted); border-bottom: 1px solid var(--border);
    }
    td {
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
      font-size: 0.875rem; vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface-hover); }
    .text-muted { color: var(--muted); }

    .emp-cell { display: flex; align-items: center; gap: 0.75rem; }
    .emp-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff; font-weight: 700; font-size: 0.875rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .emp-name { margin: 0; font-weight: 600; color: var(--text); }
    .emp-email { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--muted); }

    .row-actions { display: flex; gap: 0.4rem; }
    .loading-cell { text-align: center; color: var(--muted); padding: 3rem; }
    .spinner-inline {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin .6s linear infinite; margin-right: 0.35rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-footer {
      padding: 0.75rem 1.25rem; font-size: 0.82rem; color: var(--muted);
      border-top: 1px solid var(--border); background: var(--surface-muted);
    }

    /* Employee directory */
    .dir-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .dir-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 1.25rem;
      box-shadow: var(--shadow); display: flex; align-items: center; gap: 1rem;
      transition: transform .15s, box-shadow .15s; cursor: pointer;
    }
    .dir-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(99,102,241,.12);
      border-color: rgba(99,102,241,.3);
    }
    .dir-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff; font-size: 1.1rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .dir-info { flex: 1; min-width: 0; }
    .dir-name { margin: 0; font-weight: 700; font-size: 0.9rem; }
    .dir-title { margin: 0.15rem 0 0; font-size: 0.78rem; color: var(--muted); }
    .dir-dept { margin: 0.1rem 0 0; font-size: 0.75rem; color: var(--primary); font-weight: 600; }
    .dir-badge { flex-shrink: 0; }

    .skeleton-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); }
    .skeleton-card {
      height: 90px; border-radius: var(--radius-lg);
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    .empty-note { color: var(--muted); font-size: 0.9rem; }

    @media (max-width: 1100px) { .dir-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) {
      .dir-grid, .skeleton-grid { grid-template-columns: 1fr; }
      .filters-row { flex-direction: column; }
      .filters-row select { width: 100%; }
    }
  `],
})
export class EmployeesPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  readonly auth = inject(AuthService);

  readonly statuses = EMPLOYEE_STATUS_OPTIONS;
  readonly departments$: Observable<Department[]> = this.departmentService.listDepartments();

  employees: Employee[] = [];
  loading = false;
  error = '';

  readonly filtersForm = this.fb.group({
    search:        this.fb.control(''),
    department_id: this.fb.control(''),
    status:        this.fb.control(''),
  });

  ngOnInit(): void {
    this.load();
    this.filtersForm.valueChanges.subscribe(() => this.load());
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    const { search, department_id, status } = this.filtersForm.getRawValue();
    const filters: EmployeeFilters = { search, department: department_id, status };

    this.employeeService.listEmployees(filters).subscribe({
      next: (data) => { this.employees = data; this.loading = false; },
      error: () => { this.error = 'Failed to load employees. Is the backend running?'; this.loading = false; },
    });
  }

  delete(emp: Employee): void {
    if (!confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    this.employeeService.deleteEmployee(emp.id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message ?? 'Failed to delete.'; },
    });
  }
}
