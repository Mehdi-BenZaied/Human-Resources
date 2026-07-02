import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';

import { EMPLOYEE_STATUS_OPTIONS } from '../../core/hr.constants';
import { Department } from '../../core/models/department';
import { Employee, EmployeeFormValue } from '../../core/models/employee';
import { LeaveRequest } from '../../core/models/leave-request';
import { AuthService } from '../../core/auth/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveRequestService } from '../../core/services/leave-request.service';

@Component({
  selector: 'app-employee-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="page">

      <!-- Back nav -->
      <div class="back-nav">
        <a routerLink="/employees" class="back-link">← Back to Employees</a>
      </div>

      @if (error) { <div class="error-banner">{{ error }}</div> }

      @if (loading) {
        <div class="loading-card card">Loading employee…</div>
      } @else if (!employee) {
        <div class="card empty-state">Employee not found.</div>
      } @else {

        <!-- Profile header — same for both roles -->
        <div class="profile-header">
          <div class="profile-avatar">{{ employee.name.charAt(0).toUpperCase() }}</div>
          <div class="profile-meta">
            <h2>{{ employee.name }}</h2>
            <p class="profile-title">{{ employee.title }}</p>
            <div class="profile-tags">
              <span class="tag-dept">🏢 {{ employee.department?.name ?? '—' }}</span>
              <span class="badge"
                [class.badge-success]="employee.status === 'active'"
                [class.badge-warning]="employee.status === 'on_leave'"
                [class.badge-muted]="employee.status === 'inactive'">
                {{ employee.status }}
              </span>
            </div>
          </div>
          <div class="profile-side-info">
            <div class="info-chip">📧 {{ employee.email }}</div>
            <div class="info-chip">🗓 Since {{ employee.start_date | date:'MMM d, yyyy' }}</div>
          </div>
        </div>

        <!-- ═══ ADMIN: edit form + leave management ═══ -->
        @if (auth.isAdmin()) {
          <div class="admin-layout">

            <div class="card edit-card">
              <h3>✏️ Edit Record</h3>
              <form [formGroup]="form" (ngSubmit)="submit()">
                <div class="form-grid">
                  <div class="field">
                    <label>Name</label>
                    <input type="text" formControlName="name" />
                  </div>
                  <div class="field">
                    <label>Email</label>
                    <input type="email" formControlName="email" />
                  </div>
                  <div class="field">
                    <label>Job Title</label>
                    <input type="text" formControlName="title" />
                  </div>
                  <div class="field">
                    <label>Department</label>
                    <select formControlName="department_id">
                      @for (dept of departments$ | async; track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="field">
                    <label>Start date</label>
                    <input type="date" formControlName="start_date" />
                  </div>
                  <div class="field">
                    <label>Status</label>
                    <select formControlName="status">
                      @for (s of statuses; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="submitting">
                    {{ submitting ? 'Saving…' : '💾 Save Changes' }}
                  </button>
                  <button type="button" class="btn btn-danger" (click)="deleteEmployee()">
                    🗑 Delete Employee
                  </button>
                </div>
              </form>
            </div>

            <div class="card leave-card">
              <h3>📋 Leave History</h3>
              @if (leaveRequests.length === 0) {
                <p class="empty-note">No leave requests on record.</p>
              } @else {
                <div class="leave-list">
                  @for (req of leaveRequests; track req.id) {
                    <div class="leave-row">
                      <div>
                        <p class="leave-dates">{{ req.start_date | date:'MMM d' }} – {{ req.end_date | date:'MMM d, y' }}</p>
                        <p class="leave-reason">{{ req.reason }}</p>
                      </div>
                      <div class="leave-actions">
                        <span class="badge"
                          [class.badge-warning]="req.status === 'pending'"
                          [class.badge-success]="req.status === 'approved'"
                          [class.badge-danger]="req.status === 'rejected'">
                          {{ req.status }}
                        </span>
                        @if (req.status === 'pending') {
                          <button class="btn btn-success btn-sm" (click)="approveLeave(req.id)">✓</button>
                          <button class="btn btn-danger btn-sm" (click)="rejectLeave(req.id)">✕</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

        } @else {
          <!-- ═══ EMPLOYEE: read-only view of their own record ═══ -->
          <div class="employee-view">

            <div class="card details-card">
              <h3>My Details</h3>
              <div class="detail-rows">
                <div class="detail-row">
                  <span class="detail-label">Full Name</span>
                  <span class="detail-value">{{ employee.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ employee.email }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Job Title</span>
                  <span class="detail-value">{{ employee.title }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Department</span>
                  <span class="detail-value">{{ employee.department?.name ?? '—' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Date</span>
                  <span class="detail-value">{{ employee.start_date | date:'MMMM d, yyyy' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="badge"
                    [class.badge-success]="employee.status === 'active'"
                    [class.badge-warning]="employee.status === 'on_leave'"
                    [class.badge-muted]="employee.status === 'inactive'">
                    {{ employee.status }}
                  </span>
                </div>
              </div>
              <p class="readonly-note">🔒 Contact your HR admin to update your details.</p>
            </div>

            <div class="card leave-card">
              <div class="panel-header">
                <h3>📋 My Leave History</h3>
                <a routerLink="/leave-requests" class="panel-link">Request leave →</a>
              </div>
              @if (leaveRequests.length === 0) {
                <p class="empty-note">No leave requests on record.</p>
              } @else {
                <div class="leave-list">
                  @for (req of leaveRequests; track req.id) {
                    <div class="leave-row">
                      <div>
                        <p class="leave-dates">{{ req.start_date | date:'MMM d' }} – {{ req.end_date | date:'MMM d, y' }}</p>
                        <p class="leave-reason">{{ req.reason }}</p>
                      </div>
                      <span class="badge"
                        [class.badge-warning]="req.status === 'pending'"
                        [class.badge-success]="req.status === 'approved'"
                        [class.badge-danger]="req.status === 'rejected'">
                        {{ req.status }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }

    .back-link {
      font-size: 0.875rem; font-weight: 600; color: var(--primary);
      display: inline-flex; align-items: center; gap: 0.35rem;
    }
    .back-link:hover { text-decoration: underline; }

    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow);
    }
    .loading-card, .empty-state { text-align: center; color: var(--muted); padding: 3rem; }
    .error-banner {
      padding: 0.8rem 1rem; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(220,38,38,.2);
    }

    /* Profile header */
    .profile-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%);
      border-radius: var(--radius-xl); padding: 2rem;
      display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
      box-shadow: var(--shadow-lg);
    }
    .profile-avatar {
      width: 68px; height: 68px; border-radius: 18px;
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      color: #fff; font-size: 1.6rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,.25);
    }
    .profile-meta { flex: 1; }
    .profile-meta h2 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
    .profile-title { margin: 0.2rem 0 0.6rem; color: rgba(255,255,255,.6); font-size: 0.9rem; }
    .profile-tags { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .tag-dept {
      padding: 0.25rem 0.65rem; border-radius: 99px;
      background: rgba(255,255,255,.12); color: rgba(255,255,255,.85);
      font-size: 0.78rem; font-weight: 500;
    }
    .profile-side-info { display: grid; gap: 0.5rem; }
    .info-chip {
      padding: 0.35rem 0.75rem; border-radius: 99px;
      background: rgba(255,255,255,.1); color: rgba(255,255,255,.75);
      font-size: 0.8rem; font-weight: 500; white-space: nowrap;
    }

    /* Admin layout */
    .admin-layout { display: grid; gap: 1.25rem; grid-template-columns: 1.4fr 1fr; }

    .edit-card h3, .leave-card h3 { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 700; }

    .form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); }
    .field { display: grid; gap: 0.4rem; }
    .field label { font-size: 0.82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field select {
      padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius); background: var(--surface-muted);
      font-size: 0.9rem; outline: none; transition: border-color .15s, box-shadow .15s;
    }
    .field input:focus, .field select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99,102,241,.12);
      background: var(--surface);
    }
    .form-actions {
      display: flex; gap: 0.75rem; margin-top: 1.25rem; flex-wrap: wrap;
    }

    /* Leave list */
    .leave-list { display: grid; gap: 0.6rem; }
    .leave-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.85rem 1rem; background: var(--surface-muted);
      border-radius: var(--radius); border: 1px solid var(--border);
    }
    .leave-dates { margin: 0; font-size: 0.875rem; font-weight: 600; }
    .leave-reason { margin: 0.15rem 0 0; font-size: 0.78rem; color: var(--muted); }
    .leave-actions { display: flex; align-items: center; gap: 0.4rem; }
    .empty-note { color: var(--muted); font-size: 0.875rem; margin: 0; }

    /* Employee read-only view */
    .employee-view { display: grid; gap: 1.25rem; grid-template-columns: 1fr 1.2fr; }

    .details-card h3, .panel-header h3 { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 700; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .panel-link { font-size: 0.85rem; font-weight: 600; color: var(--primary); }

    .detail-rows { display: grid; gap: 0; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.85rem 0; border-bottom: 1px solid var(--border);
      gap: 1rem;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 0.85rem; color: var(--muted); font-weight: 500; }
    .detail-value { font-size: 0.9rem; font-weight: 600; color: var(--text); text-align: right; }

    .readonly-note {
      margin: 1.25rem 0 0; padding: 0.75rem 1rem;
      background: var(--info-bg); color: var(--info);
      border-radius: var(--radius); font-size: 0.82rem; font-weight: 500;
    }

    @media (max-width: 900px) {
      .admin-layout, .employee-view, .form-grid { grid-template-columns: 1fr; }
      .profile-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class EmployeeDetailPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly statuses = EMPLOYEE_STATUS_OPTIONS;
  readonly departments$: Observable<Department[]> = this.departmentService.listDepartments();

  employeeId = this.route.snapshot.paramMap.get('id') ?? '';
  employee: Employee | null = null;
  leaveRequests: LeaveRequest[] = [];
  loading = false;
  submitting = false;
  error = '';

  readonly form = this.fb.group({
    name:          this.fb.control('', [Validators.required]),
    email:         this.fb.control('', [Validators.required, Validators.email]),
    title:         this.fb.control('', [Validators.required]),
    department_id: this.fb.control('', [Validators.required]),
    start_date:    this.fb.control('', [Validators.required]),
    status:        this.fb.control<string>('active', [Validators.required]),
  });

  ngOnInit(): void {
    if (!this.employeeId) return;
    this.loading = true;

    combineLatest([
      this.employeeService.getEmployee(this.employeeId),
      this.leaveRequestService.listRequests(),
    ]).subscribe({
      next: ([emp, requests]) => {
        this.employee = emp;
        // Filter leave requests for this specific employee
        this.leaveRequests = requests.filter(r => r.employee_id === emp.id || r.employee?.email === emp.email);
        this.form.patchValue({
          name: emp.name, email: emp.email, title: emp.title,
          department_id: emp.department_id, start_date: emp.start_date, status: emp.status,
        });
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load employee.'; this.loading = false; },
    });
  }

  submit(): void {
    if (this.form.invalid || !this.employeeId) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.employeeService.updateEmployee(this.employeeId, this.form.getRawValue() as Partial<EmployeeFormValue>).subscribe({
      next: () => { this.submitting = false; void this.router.navigate(['/employees']); },
      error: (err) => { this.submitting = false; this.error = err?.error?.message ?? 'Failed to update.'; },
    });
  }

  deleteEmployee(): void {
    if (!confirm(`Permanently delete ${this.employee?.name}? This cannot be undone.`)) return;
    this.employeeService.deleteEmployee(this.employeeId).subscribe({
      next: () => void this.router.navigate(['/employees']),
      error: (err) => { this.error = err?.error?.message ?? 'Failed to delete.'; },
    });
  }

  approveLeave(id: string): void {
    this.leaveRequestService.updateStatus(id, 'approved').subscribe({ next: () => this.ngOnInit() });
  }

  rejectLeave(id: string): void {
    this.leaveRequestService.updateStatus(id, 'rejected').subscribe({ next: () => this.ngOnInit() });
  }
}
