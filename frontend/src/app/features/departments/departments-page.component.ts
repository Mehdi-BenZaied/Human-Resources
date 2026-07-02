import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { Department } from '../../core/models/department';
import { DepartmentService } from '../../core/services/department.service';

@Component({
  selector: 'app-departments-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>Departments</h2>
          <p>{{ auth.isAdmin() ? 'Manage teams and headcount.' : 'Browse all company departments.' }}</p>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn btn-primary" (click)="showForm = !showForm">
            {{ showForm ? '✕ Cancel' : '+ New Department' }}
          </button>
        }
      </div>

      <!-- Admin create form -->
      @if (auth.isAdmin() && showForm) {
        <div class="create-form card">
          <h3>New Department</h3>
          <form [formGroup]="form" (ngSubmit)="create()" class="form-row">
            <div class="field" style="flex:1">
              <label>Department name</label>
              <input type="text" formControlName="name" placeholder="e.g. Marketing" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <span class="field-error">Name must be at least 2 characters.</span>
              }
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="submitting">
              {{ submitting ? 'Creating…' : 'Create' }}
            </button>
          </form>
        </div>
      }

      @if (error) { <div class="error-banner">{{ error }}</div> }

      <!-- Loading skeleton -->
      @if (loading) {
        <div class="skeleton-grid">
          @for (n of [1,2,3,4,5]; track n) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else {
        <!-- Admin view — table with actions -->
        @if (auth.isAdmin()) {
          <div class="card table-card">
            <table class="dept-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                  <th>Bar</th>
                  @if (auth.isAdmin()) { <th>Actions</th> }
                </tr>
              </thead>
              <tbody>
                @for (dept of departments; track dept.id) {
                  <tr>
                    <td>
                      <div class="dept-name-cell">
                        <div class="dept-icon">{{ dept.name.charAt(0) }}</div>
                        {{ dept.name }}
                      </div>
                    </td>
                    <td class="headcount">{{ dept.employee_count ?? 0 }}</td>
                    <td class="bar-cell">
                      <div class="bar-track">
                        <div class="bar-fill"
                          [style.width.%]="maxCount ? ((dept.employee_count ?? 0) / maxCount) * 100 : 0">
                        </div>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-danger btn-sm" (click)="delete(dept)">Delete</button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-cell">No departments yet.</td></tr>
                }
              </tbody>
            </table>
          </div>

        } @else {
          <!-- Employee view — read-only cards -->
          <div class="dept-cards">
            @for (dept of departments; track dept.id) {
              <div class="dept-card">
                <div class="dept-card-icon">{{ dept.name.charAt(0) }}</div>
                <div class="dept-card-body">
                  <h3>{{ dept.name }}</h3>
                  <p>{{ dept.employee_count ?? 0 }} {{ (dept.employee_count ?? 0) === 1 ? 'employee' : 'employees' }}</p>
                </div>
                <div class="dept-card-bar">
                  <div class="bar-track">
                    <div class="bar-fill"
                      [style.width.%]="maxCount ? ((dept.employee_count ?? 0) / maxCount) * 100 : 0">
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <p class="empty-note">No departments found.</p>
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
      border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow);
    }

    .create-form h3 { margin: 0 0 1rem; font-size: 1rem; font-weight: 700; }
    .form-row { display: flex; gap: 1rem; align-items: flex-end; }
    .field { display: grid; gap: 0.4rem; }
    .field label { font-size: 0.85rem; font-weight: 600; color: var(--text-soft); }
    .field input {
      padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius); background: var(--surface-muted);
      outline: none; transition: border-color .15s, box-shadow .15s;
    }
    .field input:focus {
      border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.12);
      background: var(--surface);
    }
    .field-error { font-size: 0.8rem; color: var(--danger); font-weight: 500; }
    .error-banner {
      padding: 0.8rem 1rem; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(220,38,38,.2); font-size: 0.875rem;
    }

    /* Skeleton */
    .skeleton-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); }
    .skeleton-card {
      height: 100px; border-radius: var(--radius-lg);
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* Admin table */
    .table-card { padding: 0; overflow: hidden; }
    .dept-table { width: 100%; border-collapse: collapse; }
    .dept-table th {
      padding: 0.85rem 1.25rem; text-align: left;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--muted);
      background: var(--surface-muted); border-bottom: 1px solid var(--border);
    }
    .dept-table td {
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
      font-size: 0.9rem; vertical-align: middle;
    }
    .dept-table tr:last-child td { border-bottom: none; }
    .dept-table tr:hover td { background: var(--surface-hover); }
    .dept-name-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
    .dept-icon {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff; font-weight: 700; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .headcount { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    .bar-cell { width: 200px; }
    .empty-cell { text-align: center; color: var(--muted); padding: 3rem; }

    /* Bars */
    .bar-track {
      height: 8px; background: var(--surface-muted);
      border-radius: 99px; overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #818cf8);
      border-radius: 99px; transition: width .5s ease;
      min-width: 4px;
    }

    /* Employee cards */
    .dept-cards { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .dept-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 1.5rem;
      box-shadow: var(--shadow); display: grid; gap: 0.75rem;
      transition: transform .15s, box-shadow .15s;
    }
    .dept-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(99,102,241,.12);
    }
    .dept-card-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff; font-size: 1.25rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .dept-card-body h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
    .dept-card-body p { margin: 0.25rem 0 0; font-weight: 600; color: var(--primary); font-size: 0.9rem; }
    .empty-note { color: var(--muted); font-size: 0.9rem; }

    @media (max-width: 900px) {
      .dept-cards, .skeleton-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; }
    }
  `],
})
export class DepartmentsPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly departmentService = inject(DepartmentService);
  readonly auth = inject(AuthService);

  departments: Department[] = [];
  loading = false;
  submitting = false;
  error = '';
  showForm = false;
  maxCount = 1;

  readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.departmentService.listDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.maxCount = Math.max(...data.map(d => d.employee_count ?? 0), 1);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load departments. Is the backend running?';
        this.loading = false;
      },
    });
  }

  create(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.departmentService.createDepartment(this.form.getRawValue()).subscribe({
      next: () => { this.submitting = false; this.showForm = false; this.form.reset(); this.load(); },
      error: (err) => { this.submitting = false; this.error = err?.error?.message ?? 'Failed to create.'; },
    });
  }

  delete(dept: Department): void {
    if (!confirm(`Delete "${dept.name}"? Employees must be reassigned first.`)) return;
    this.departmentService.deleteDepartment(dept.id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message ?? 'Failed to delete.'; },
    });
  }
}
