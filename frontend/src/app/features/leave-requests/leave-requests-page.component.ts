import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { Employee } from '../../core/models/employee';
import { LeaveRequest, LeaveRequestStatus, LeaveRequestFormValue } from '../../core/models/leave-request';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveRequestService } from '../../core/services/leave-request.service';

@Component({
  selector: 'app-leave-requests-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="page">

      @if (auth.isAdmin()) {
        <!-- ═══════════════════ ADMIN VIEW ═══════════════════ -->
        <div class="page-header">
          <div>
            <h2>Leave Request Management</h2>
            <p>Review, approve, and reject all employee leave requests.</p>
          </div>
          <div class="status-pills">
            @for (f of statusFilters; track f.value) {
              <button
                class="filter-pill"
                [class.active]="activeFilter === f.value"
                (click)="activeFilter = f.value">
                {{ f.label }}
                <span class="pill-count">{{ countByStatus(f.value) }}</span>
              </button>
            }
          </div>
        </div>

        @if (error) { <div class="error-banner">{{ error }}</div> }

        <div class="card table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr><td colspan="6" class="loading-cell">Loading requests…</td></tr>
              } @else {
                @for (req of filteredRequests; track req.id) {
                  <tr>
                    <td>
                      <div class="emp-cell">
                        <div class="emp-avatar">{{ req.employee?.name?.charAt(0) ?? '?' }}</div>
                        <div>
                          <p class="emp-name">{{ req.employee?.name ?? '—' }}</p>
                          <p class="emp-email">{{ req.employee?.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="date-range">{{ req.start_date | date:'MMM d' }} → {{ req.end_date | date:'MMM d, y' }}</p>
                      <p class="days-count">{{ daysBetween(req.start_date, req.end_date) }} day(s)</p>
                    </td>
                    <td class="reason-cell">{{ req.reason }}</td>
                    <td class="text-muted">{{ req.created_at | date:'MMM d, y' }}</td>
                    <td>
                      <span class="badge"
                        [class.badge-warning]="req.status === 'pending'"
                        [class.badge-success]="req.status === 'approved'"
                        [class.badge-danger]="req.status === 'rejected'">
                        {{ req.status }}
                      </span>
                    </td>
                    <td>
                      <div class="row-actions">
                        @if (req.status === 'pending') {
                          <button class="btn btn-success btn-sm" (click)="updateStatus(req.id, 'approved')">✓ Approve</button>
                          <button class="btn btn-danger btn-sm" (click)="updateStatus(req.id, 'rejected')">✕ Reject</button>
                        }
                        <button class="btn btn-ghost btn-sm" (click)="cancel(req.id)">Cancel</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="loading-cell">No requests match this filter.</td></tr>
                }
              }
            </tbody>
          </table>
        </div>

      } @else {
        <!-- ═══════════════════ EMPLOYEE VIEW ═══════════════════ -->
        <div class="page-header">
          <div>
            <h2>My Leave Requests</h2>
            <p>Submit new requests and track their status.</p>
          </div>
        </div>

        @if (error) { <div class="error-banner">{{ error }}</div> }

        <div class="emp-layout">

          <!-- Submit form -->
          <div class="card submit-card">
            <h3>📝 New Request</h3>
            <form [formGroup]="form" (ngSubmit)="submit()" class="submit-form">
              <div class="field">
                <label>Leave Type</label>
                <select formControlName="leave_type">
                  <option value="annual_leave">Annual Leave</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="maternity_leave">Maternity Leave</option>
                  <option value="emergency_leave">Emergency Leave</option>
                </select>
              </div>
              <div class="field">
                <label>Start date</label>
                <input type="date" formControlName="start_date" />
                @if (form.controls.start_date.touched && form.controls.start_date.invalid) {
                  <span class="field-error">Required.</span>
                }
              </div>
              <div class="field">
                <label>End date</label>
                <input type="date" formControlName="end_date" />
                @if (form.controls.end_date.touched && form.controls.end_date.invalid) {
                  <span class="field-error">Required.</span>
                }
              </div>
              <div class="field field-full">
                <label>Reason</label>
                <textarea formControlName="reason" rows="4" placeholder="Briefly describe the reason for your leave…"></textarea>
                @if (form.controls.reason.touched && form.controls.reason.invalid) {
                  <span class="field-error">At least 5 characters required.</span>
                }
              </div>
              <button type="submit" class="btn btn-primary btn-full" [disabled]="submitting">
                {{ submitting ? 'Submitting…' : '→ Submit Request' }}
              </button>
            </form>

            <!-- Mini stats -->
            <div class="mini-stats">
              <div class="mini-stat">
                <strong>{{ requests.length }}</strong>
                <span>Total</span>
              </div>
              <div class="mini-stat text-success">
                <strong>{{ countByStatus('approved') }}</strong>
                <span>Approved</span>
              </div>
              <div class="mini-stat text-warning">
                <strong>{{ countByStatus('pending') }}</strong>
                <span>Pending</span>
              </div>
              <div class="mini-stat text-danger">
                <strong>{{ countByStatus('rejected') }}</strong>
                <span>Rejected</span>
              </div>
            </div>
          </div>

          <!-- Request list -->
          <div class="requests-list">
            @if (loading) {
              <div class="card loading-cell">Loading your requests…</div>
            } @else if (requests.length === 0) {
              <div class="card empty-state">
                <p>🏖 No requests yet.</p>
                <p>Fill in the form to submit your first leave request.</p>
              </div>
            } @else {
              @for (req of requests; track req.id) {
                <div class="request-card card" [class.pending]="req.status === 'pending'"
                  [class.approved]="req.status === 'approved'"
                  [class.rejected]="req.status === 'rejected'">
                  <div class="req-header">
                    <div class="req-dates">
                      <span class="req-icon">📅</span>
                      <div>
                        <p class="req-range">{{ req.start_date | date:'MMMM d' }} – {{ req.end_date | date:'MMMM d, yyyy' }}</p>
                        <p class="req-days">{{ daysBetween(req.start_date, req.end_date) }} day(s)</p>
                      </div>
                    </div>
                    <span class="badge"
                      [class.badge-warning]="req.status === 'pending'"
                      [class.badge-success]="req.status === 'approved'"
                      [class.badge-danger]="req.status === 'rejected'">
                      {{ req.status }}
                    </span>
                  </div>
                  <p class="req-reason">{{ req.reason }}</p>
                  @if (req.status === 'pending') {
                    <button class="btn btn-ghost btn-sm cancel-btn" (click)="cancel(req.id)">
                      Cancel request
                    </button>
                  }
                </div>
              }
            }
          </div>
        </div>
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

    .error-banner {
      padding: 0.8rem 1rem; border-radius: var(--radius);
      background: var(--danger-bg); color: var(--danger);
      border: 1px solid rgba(220,38,38,.2);
    }

    /* Admin status filter pills */
    .status-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .filter-pill {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.45rem 0.9rem; border-radius: 99px;
      border: 1.5px solid var(--border); background: var(--surface);
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      transition: all .15s; color: var(--text-soft);
    }
    .filter-pill.active {
      border-color: var(--primary); background: var(--primary-light);
      color: var(--primary-text);
    }
    .pill-count {
      min-width: 18px; height: 18px; border-radius: 99px;
      background: var(--border); color: var(--muted);
      font-size: 0.72rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; padding: 0 5px;
    }
    .filter-pill.active .pill-count { background: var(--primary); color: #fff; }

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
    .text-muted { color: var(--muted); font-size: 0.82rem; }
    .emp-cell { display: flex; align-items: center; gap: 0.75rem; }
    .emp-avatar {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff; font-weight: 700; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .emp-name { margin: 0; font-weight: 600; }
    .emp-email { margin: 0.1rem 0 0; font-size: 0.75rem; color: var(--muted); }
    .date-range { margin: 0; font-weight: 600; font-size: 0.85rem; }
    .days-count { margin: 0.1rem 0 0; font-size: 0.75rem; color: var(--muted); }
    .reason-cell { max-width: 220px; color: var(--muted); font-size: 0.82rem; }
    .row-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .loading-cell { text-align: center; color: var(--muted); padding: 3rem; }

    /* Employee layout */
    .emp-layout { display: grid; gap: 1.25rem; grid-template-columns: 340px 1fr; align-items: start; }

    .submit-card { padding: 1.5rem; }
    .submit-card h3 { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 700; }
    .submit-form { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
    .field { display: grid; gap: 0.4rem; }
    .field-full { grid-column: 1 / -1; }
    .field label { font-size: 0.82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field textarea {
      width: 100%; padding: 0.7rem 1rem;
      border: 1.5px solid var(--border); border-radius: var(--radius);
      background: var(--surface-muted); outline: none;
      transition: border-color .15s, box-shadow .15s; resize: vertical;
    }
    .field input:focus, .field textarea:focus {
      border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.12);
      background: var(--surface);
    }
    .field-error { font-size: 0.78rem; color: var(--danger); font-weight: 500; }
    .btn-full { width: 100%; grid-column: 1 / -1; padding: 0.8rem; }

    .mini-stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 0; margin-top: 1.25rem; border-top: 1px solid var(--border);
      padding-top: 1.25rem;
    }
    .mini-stat {
      display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
      padding: 0 0.5rem;
    }
    .mini-stat + .mini-stat { border-left: 1px solid var(--border); }
    .mini-stat strong { font-size: 1.4rem; font-weight: 800; line-height: 1; }
    .mini-stat span { font-size: 0.72rem; color: var(--muted); font-weight: 500; }
    .text-success strong { color: var(--success); }
    .text-warning strong { color: var(--warning); }
    .text-danger  strong { color: var(--danger); }

    /* Employee request cards */
    .requests-list { display: grid; gap: 0.85rem; }
    .request-card { padding: 1.25rem; border-left: 4px solid var(--border); }
    .request-card.pending  { border-left-color: var(--warning); }
    .request-card.approved { border-left-color: var(--success); }
    .request-card.rejected { border-left-color: var(--danger); }
    .req-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem; }
    .req-dates { display: flex; align-items: center; gap: 0.75rem; }
    .req-icon { font-size: 1.25rem; }
    .req-range { margin: 0; font-weight: 700; font-size: 0.95rem; }
    .req-days { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--muted); }
    .req-reason { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-soft); }
    .cancel-btn { font-size: 0.78rem; }

    .empty-state { padding: 3rem; text-align: center; }
    .empty-state p { color: var(--muted); margin: 0.25rem 0; }
    .empty-state p:first-child { font-size: 1.25rem; }

    @media (max-width: 900px) {
      .emp-layout { grid-template-columns: 1fr; }
      .submit-form { grid-template-columns: 1fr; }
    }
  `],
})
export class LeaveRequestsPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly employeeService = inject(EmployeeService);
  readonly auth = inject(AuthService);

  requests: LeaveRequest[] = [];
  loading = false;
  submitting = false;
  error = '';
  activeFilter = 'all';

  readonly statusFilters = [
    { label: 'All',      value: 'all' },
    { label: 'Pending',  value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  get filteredRequests(): LeaveRequest[] {
    if (this.activeFilter === 'all') return this.requests;
    return this.requests.filter(r => r.status === this.activeFilter);
  }

  readonly form = this.fb.group({
    employee_id: this.fb.control(''),
    leave_type:  this.fb.control<'annual_leave' | 'sick_leave' | 'maternity_leave' | 'emergency_leave'>('annual_leave', [Validators.required]),
    start_date:  this.fb.control('', [Validators.required]),
    end_date:    this.fb.control('', [Validators.required]),
    reason:      this.fb.control('', [Validators.required, Validators.minLength(5)]),
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.leaveRequestService.listRequests().subscribe({
      next: (data) => { this.requests = data; this.loading = false; },
      error: () => { this.error = 'Failed to load requests. Is the backend running?'; this.loading = false; },
    });
  }

  countByStatus(status: string): number {
    if (status === 'all') return this.requests.length;
    return this.requests.filter(r => r.status === status).length;
  }

  daysBetween(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.error = '';
    this.leaveRequestService.createRequest(this.form.getRawValue() as LeaveRequestFormValue).subscribe({
      next: () => { this.submitting = false; this.form.reset({ leave_type: 'annual_leave' }); this.load(); },
      error: (err) => { this.submitting = false; this.error = err?.error?.message ?? 'Failed to submit.'; },
    });
  }

  updateStatus(id: string, status: LeaveRequestStatus): void {
    this.leaveRequestService.updateStatus(id, status).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message ?? 'Failed to update status.'; },
    });
  }

  cancel(id: string): void {
    if (!confirm('Cancel this leave request?')) return;
    this.leaveRequestService.cancelRequest(id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err?.error?.message ?? 'Failed to cancel.'; },
    });
  }
}
