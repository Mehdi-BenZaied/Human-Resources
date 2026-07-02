import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Attendance, AttendanceSummary } from '../../core/models/attendance';
import { Employee } from '../../core/models/employee';

@Component({
  selector: 'app-attendance-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="page">
    @if (auth.isAdmin()) {
      <!-- ══ ADMIN VIEW ══ -->
      <div class="page-header">
        <div><h2>Attendance Management</h2><p>View, correct, and approve attendance records.</p></div>
        <button class="btn btn-primary" (click)="showCorrectForm = !showCorrectForm">
          {{ showCorrectForm ? '✕ Cancel' : '✏️ Correct Record' }}
        </button>
      </div>

      @if (showCorrectForm) {
        <div class="card correct-form">
          <h3>Manual Correction</h3>
          <form [formGroup]="correctForm" (ngSubmit)="submitCorrection()" class="form-grid">
            <div class="field">
              <label>Employee</label>
              <select formControlName="employee_id">
                <option value="">Select employee</option>
                @for (e of employees$ | async; track e.id) {
                  <option [value]="e.id">{{ e.name }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Date</label>
              <input type="date" formControlName="work_date" />
            </div>
            <div class="field">
              <label>Status</label>
              <select formControlName="status">
                @for (s of statuses; track s.val) {
                  <option [value]="s.val">{{ s.label }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Correction Note</label>
              <input type="text" formControlName="correction_note" placeholder="Reason for correction" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="correcting()">
                {{ correcting() ? 'Saving…' : 'Save Correction' }}
              </button>
            </div>
          </form>
        </div>
      }

      @if (error()) { <div class="error-banner">{{ error() }}</div> }

      <!-- Filters -->
      <div class="card filters-bar">
        <form [formGroup]="filterForm" class="filter-row">
          <select formControlName="employee_id">
            <option value="">All employees</option>
            @for (e of employees$ | async; track e.id) {
              <option [value]="e.id">{{ e.name }}</option>
            }
          </select>
          <input type="date" formControlName="from" />
          <input type="date" formControlName="to" />
          <select formControlName="status">
            <option value="">All statuses</option>
            @for (s of statuses; track s.val) {
              <option [value]="s.val">{{ s.label }}</option>
            }
          </select>
          <button type="button" class="btn btn-ghost" (click)="loadAdmin()">🔍 Search</button>
        </form>
      </div>

      <div class="card table-card">
        @if (loadingList()) {
          <p class="loading-row">Loading…</p>
        } @else {
          <table>
            <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Manual</th></tr></thead>
            <tbody>
              @for (r of records; track r.id) {
                <tr>
                  <td><div class="emp-cell"><div class="av">{{ r.employee?.name?.charAt(0) }}</div>{{ r.employee?.name }}</div></td>
                  <td>{{ r.work_date | date:'EEE, MMM d' }}</td>
                  <td>{{ r.check_in_at ? (r.check_in_at | date:'HH:mm') : '—' }}</td>
                  <td>{{ r.check_out_at ? (r.check_out_at | date:'HH:mm') : '—' }}</td>
                  <td>
                    <span class="badge"
                      [class.badge-success]="r.status==='present'"
                      [class.badge-warning]="r.status==='late'"
                      [class.badge-danger]="r.status==='absent'"
                      [class.badge-info]="r.status==='on_leave'"
                      [class.badge-muted]="r.status==='half_day'">
                      {{ r.status }}
                    </span>
                  </td>
                  <td>{{ r.is_manual ? '✏️' : '' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">No records found.</td></tr>
              }
            </tbody>
          </table>
          @if (total > 0) {
            <div class="table-footer">{{ total }} total records</div>
          }
        }
      </div>

    } @else {
      <!-- ══ EMPLOYEE VIEW ══ -->
      <div class="page-header">
        <div><h2>My Attendance</h2><p>Track your daily check-ins and monthly summary.</p></div>
      </div>

      <!-- Check-in card -->
      <div class="checkin-card">
        <div class="time-display">
          <p class="time-now">{{ now | date:'HH:mm:ss' }}</p>
          <p class="date-now">{{ now | date:'EEEE, MMMM d, yyyy' }}</p>
        </div>

        @if (todayRecord()) {
          <div class="today-status">
            <div class="today-item">
              <span class="ti-label">Check In</span>
              <span class="ti-val">{{ todayRecord()!.check_in_at ? (todayRecord()!.check_in_at! | date:'HH:mm') : '—' }}</span>
            </div>
            <div class="today-sep">→</div>
            <div class="today-item">
              <span class="ti-label">Check Out</span>
              <span class="ti-val">{{ todayRecord()!.check_out_at ? (todayRecord()!.check_out_at! | date:'HH:mm') : '—' }}</span>
            </div>
            @if (todayRecord()!.check_in_at && todayRecord()!.check_out_at) {
              <div class="today-item">
                <span class="ti-label">Duration</span>
                <span class="ti-val">{{ duration(todayRecord()!.check_in_at!, todayRecord()!.check_out_at!) }}</span>
              </div>
            }
            <span class="badge" [class.badge-success]="todayRecord()!.status==='present'" [class.badge-warning]="todayRecord()!.status==='late'">
              {{ todayRecord()!.status }}
            </span>
          </div>
        }

        <div class="checkin-btns">
          @if (!todayRecord()?.check_in_at) {
            <button class="btn-checkin" (click)="checkIn()" [disabled]="actionLoading()">
              @if (actionLoading()) { <span class="spin"></span> } ▶ Check In
            </button>
          } @else if (!todayRecord()?.check_out_at) {
            <button class="btn-checkout" (click)="checkOut()" [disabled]="actionLoading()">
              @if (actionLoading()) { <span class="spin"></span> } ■ Check Out
            </button>
          } @else {
            <div class="done-msg">✅ Attendance recorded for today</div>
          }
        </div>
        @if (error()) { <p class="ci-error">{{ error() }}</p> }
      </div>

      <!-- Monthly summary -->
      @if (summary()) {
        <div class="summary-row">
          @for (s of summaryCards(); track s.label) {
            <div class="sum-card" [style.--sc]="s.color">
              <strong>{{ s.value }}</strong>
              <span>{{ s.label }}</span>
            </div>
          }
        </div>
      }

      <!-- History table -->
      <div class="card table-card">
        <div class="panel-hdr" style="padding:0 0 1rem">
          <h3>Attendance History</h3>
        </div>
        @if (loadingList()) {
          <p class="loading-row">Loading history…</p>
        } @else {
          <table>
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>
              @for (r of records; track r.id) {
                <tr>
                  <td>{{ r.work_date | date:'EEE, MMM d' }}</td>
                  <td>{{ r.check_in_at ? (r.check_in_at | date:'HH:mm') : '—' }}</td>
                  <td>{{ r.check_out_at ? (r.check_out_at | date:'HH:mm') : '—' }}</td>
                  <td>{{ r.check_in_at && r.check_out_at ? duration(r.check_in_at, r.check_out_at) : '—' }}</td>
                  <td>
                    <span class="badge"
                      [class.badge-success]="r.status==='present'"
                      [class.badge-warning]="r.status==='late'"
                      [class.badge-danger]="r.status==='absent'"
                      [class.badge-info]="r.status==='on_leave'">
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">No attendance records yet.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>
    }
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -.03em; }
    p { margin: .25rem 0 0; color: var(--muted); font-size: .9rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow); }
    .error-banner { padding: .8rem 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .65rem 1.25rem; border-radius: var(--radius); border: none; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-soft); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .correct-form h3 { margin: 0 0 1rem; font-size: .95rem; font-weight: 700; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-actions { grid-column: 1/-1; }
    .field { display: grid; gap: .4rem; }
    .field label { font-size: .82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field select { padding: .7rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); outline: none; transition: border-color .15s; }
    .field input:focus, .field select:focus { border-color: var(--primary); }
    .filters-bar { padding: 1rem 1.25rem; }
    .filter-row { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
    .filter-row input, .filter-row select { padding: .65rem .9rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); font-size: .875rem; outline: none; }
    .table-card { overflow: hidden; padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: .75rem 1.25rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); background: var(--surface-muted); border-bottom: 1px solid var(--border); }
    td { padding: .85rem 1.25rem; border-bottom: 1px solid var(--border); font-size: .875rem; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface-hover); }
    .emp-cell { display: flex; align-items: center; gap: .6rem; font-weight: 600; }
    .av { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#6366f1,#818cf8); color: #fff; font-weight: 700; font-size: .75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .empty-cell { text-align: center; color: var(--muted); padding: 3rem; }
    .loading-row { text-align: center; color: var(--muted); padding: 2rem; }
    .table-footer { padding: .65rem 1.25rem; font-size: .82rem; color: var(--muted); background: var(--surface-muted); border-top: 1px solid var(--border); }
    .panel-hdr { display: flex; align-items: center; justify-content: space-between; }
    .panel-hdr h3 { margin: 0; font-size: .95rem; font-weight: 700; }

    /* Check-in card */
    .checkin-card { background: linear-gradient(135deg,#1a1740 0%,#312e81 60%,#4c1d95 100%); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .time-display { text-align: center; }
    .time-now { margin: 0; font-size: 3rem; font-weight: 800; color: #fff; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
    .date-now { margin: .25rem 0 0; color: rgba(255,255,255,.55); font-size: .95rem; }
    .today-status { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; justify-content: center; }
    .today-item { display: flex; flex-direction: column; align-items: center; gap: .2rem; }
    .ti-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.45); font-weight: 600; }
    .ti-val { font-size: 1.25rem; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
    .today-sep { font-size: 1.25rem; color: rgba(255,255,255,.3); }
    .checkin-btns { display: flex; gap: 1rem; }
    .btn-checkin, .btn-checkout {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .9rem 2.5rem; border-radius: var(--radius-lg); border: none;
      font-size: 1rem; font-weight: 700; cursor: pointer; transition: all .15s;
    }
    .btn-checkin { background: #22c55e; color: #fff; box-shadow: 0 4px 16px rgba(34,197,94,.4); }
    .btn-checkin:hover:not(:disabled) { background: #16a34a; transform: translateY(-2px); }
    .btn-checkout { background: #ef4444; color: #fff; box-shadow: 0 4px 16px rgba(239,68,68,.4); }
    .btn-checkout:hover:not(:disabled) { background: #dc2626; transform: translateY(-2px); }
    .btn-checkin:disabled, .btn-checkout:disabled { opacity: .6; cursor: not-allowed; }
    .done-msg { padding: 1rem 2rem; background: rgba(34,197,94,.15); color: #86efac; border-radius: var(--radius-lg); font-weight: 600; }
    .ci-error { color: #fca5a5; font-size: .875rem; margin: 0; }
    .spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Summary row */
    .summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .sum-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow); text-align: center; border-top: 4px solid var(--sc,var(--primary)); }
    .sum-card strong { display: block; font-size: 2rem; font-weight: 800; letter-spacing: -.04em; color: var(--sc,var(--primary)); }
    .sum-card span { font-size: .78rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

    @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } .summary-row { grid-template-columns: repeat(2,1fr); } .filter-row { flex-direction: column; } }
  `],
})
export class AttendancePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private svc = inject(AttendanceService);
  private empSvc = inject(EmployeeService);
  private fb = inject(NonNullableFormBuilder);

  records: Attendance[] = [];
  total = 0;
  loadingList = signal(false);
  actionLoading = signal(false);
  correcting = signal(false);
  error = signal('');
  todayRecord = signal<Attendance | null>(null);
  summary = signal<AttendanceSummary | null>(null);
  showCorrectForm = false;
  now = new Date();

  readonly employees$: Observable<Employee[]> = this.empSvc.listEmployees();

  readonly statuses = [
    { val: 'present', label: 'Present' }, { val: 'late', label: 'Late' },
    { val: 'absent', label: 'Absent' }, { val: 'half_day', label: 'Half Day' },
    { val: 'on_leave', label: 'On Leave' },
  ];

  readonly correctForm = this.fb.group({
    employee_id: this.fb.control('', [Validators.required]),
    work_date: this.fb.control('', [Validators.required]),
    status: this.fb.control('present', [Validators.required]),
    correction_note: this.fb.control(''),
  });

  readonly filterForm = this.fb.group({
    employee_id: this.fb.control(''),
    from: this.fb.control(''),
    to: this.fb.control(''),
    status: this.fb.control(''),
  });

  summaryCards() {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Present', value: s.present, color: '#16a34a' },
      { label: 'Late', value: s.late, color: '#d97706' },
      { label: 'Absent', value: s.absent, color: '#dc2626' },
      { label: 'On Leave', value: s.on_leave, color: '#0284c7' },
    ];
  }

  duration(inTime: string, outTime: string): string {
    const diff = (new Date(outTime).getTime() - new Date(inTime).getTime()) / 60000;
    const h = Math.floor(diff / 60); const m = Math.round(diff % 60);
    return `${h}h ${m}m`;
  }

  ngOnInit(): void {
    setInterval(() => this.now = new Date(), 1000);
    if (this.auth.isAdmin()) { this.loadAdmin(); }
    else { this.loadEmployee(); }
  }

  loadAdmin(): void {
    this.loadingList.set(true);
    const f = this.filterForm.getRawValue();
    const params: Record<string, string> = {};
    if (f.from) params['work_date'] = f.from; // backend uses work_date

    this.svc.list(params).subscribe({
      next: records => { this.records = records; this.total = records.length; this.loadingList.set(false); },
      error: () => { this.error.set('Failed to load records.'); this.loadingList.set(false); },
    });
  }

  loadEmployee(): void {
    this.loadingList.set(true);
    this.svc.todayStatus().subscribe({ next: r => this.todayRecord.set(r) });
    this.svc.summary().subscribe({ next: s => this.summary.set(s) });
    this.svc.list({}).subscribe({
      next: records => { this.records = records; this.loadingList.set(false); },
      error: () => this.loadingList.set(false),
    });
  }

  checkIn(): void {
    this.actionLoading.set(true); this.error.set('');
    const email = this.auth.currentUser()?.email;
    this.empSvc.listEmployees().subscribe(emps => {
      const emp = emps.find(e => e.email === email);
      if (!emp) { this.error.set('Employee profile not found.'); this.actionLoading.set(false); return; }
      this.svc.checkIn(emp.id).subscribe({
        next: r => { this.todayRecord.set(r); this.actionLoading.set(false); this.loadEmployee(); },
        error: e => { this.error.set(e?.error?.detail ?? e?.error?.message ?? 'Check-in failed.'); this.actionLoading.set(false); },
      });
    });
  }

  checkOut(): void {
    this.actionLoading.set(true); this.error.set('');
    const email = this.auth.currentUser()?.email;
    this.empSvc.listEmployees().subscribe(emps => {
      const emp = emps.find(e => e.email === email);
      if (!emp) { this.error.set('Employee profile not found.'); this.actionLoading.set(false); return; }
      this.svc.checkOut(emp.id).subscribe({
        next: r => { this.todayRecord.set(r); this.actionLoading.set(false); this.loadEmployee(); },
        error: e => { this.error.set(e?.error?.detail ?? e?.error?.message ?? 'Check-out failed.'); this.actionLoading.set(false); },
      });
    });
  }

  submitCorrection(): void {
    if (this.correctForm.invalid) { this.correctForm.markAllAsTouched(); return; }
    this.correcting.set(true);
    this.svc.adminUpsert(this.correctForm.getRawValue()).subscribe({
      next: () => { this.correcting.set(false); this.showCorrectForm = false; this.correctForm.reset(); this.loadAdmin(); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed to save.'); this.correcting.set(false); },
    });
  }
}
