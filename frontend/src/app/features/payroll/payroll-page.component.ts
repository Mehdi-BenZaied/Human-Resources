import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Payroll, Payslip } from '../../core/models/payroll';
import { Employee } from '../../core/models/employee';

@Component({
  selector: 'app-payroll-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, CurrencyPipe],
  template: `
  <div class="page">
    @if (auth.isAdmin()) {
      <!-- ══ ADMIN: Payroll Management ══ -->
      <div class="page-header">
        <div><h2>Payroll Management</h2><p>Generate payroll runs and issue payslips.</p></div>
        <button class="btn btn-primary" (click)="showCreate = !showCreate">
          {{ showCreate ? '✕ Cancel' : '+ New Payroll Run' }}
        </button>
      </div>

      @if (showCreate) {
        <div class="card">
          <h3>New Payroll Run</h3>
          <form [formGroup]="payrollForm" (ngSubmit)="createPayroll()" class="form-row">
            <div class="field"><label>Period Start</label><input type="date" formControlName="period_start" /></div>
            <div class="field"><label>Period End</label><input type="date" formControlName="period_end" /></div>
            <div class="field"><label>Pay Date</label><input type="date" formControlName="pay_date" /></div>
            <button type="submit" class="btn btn-primary" [disabled]="creating()">{{ creating() ? 'Creating…' : 'Create' }}</button>
          </form>
        </div>
      }

      @if (error()) { <div class="error-banner">{{ error() }}</div> }

      <!-- Payroll list -->
      <div class="card table-card">
        @if (loading()) { <p class="load-cell">Loading payrolls…</p> }
        @else {
          <table>
            <thead><tr><th>Period</th><th>Pay Date</th><th>Status</th><th>Gross</th><th>Net</th><th>Slips</th><th>Actions</th></tr></thead>
            <tbody>
              @for (p of payrolls; track p.id) {
                <tr [class.active-row]="selectedPayroll?.id === p.id">
                  <td class="fw">{{ p.period_start | date:'MMM d' }} – {{ p.period_end | date:'MMM d, yyyy' }}</td>
                  <td>{{ p.pay_date ? (p.pay_date | date:'MMM d, yyyy') : '—' }}</td>
                  <td>
                    <span class="badge" [class.badge-muted]="p.status==='draft'" [class.badge-warning]="p.status==='processing'" [class.badge-success]="p.status==='paid'" [class.badge-danger]="p.status==='failed'">{{ p.status }}</span>
                  </td>
                  <td>{{ p.total_gross ? (p.total_gross | currency) : '—' }}</td>
                  <td class="fw">{{ p.total_net ? (p.total_net | currency) : '—' }}</td>
                  <td>{{ p._count?.payslips ?? 0 }}</td>
                  <td>
                    <div class="row-btns">
                      <button class="btn btn-ghost btn-sm" (click)="selectPayroll(p)">Manage Slips</button>
                      <button class="btn btn-success btn-sm" (click)="markPaid(p.id)" [disabled]="p.status==='paid'">Mark Paid</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="load-cell">No payroll runs yet.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Payslip management panel -->
      @if (selectedPayroll) {
        <div class="card slip-panel">
          <div class="slip-hdr">
            <h3>📋 Payslips — {{ selectedPayroll.period_start | date:'MMM d' }} – {{ selectedPayroll.period_end | date:'MMM d, yyyy' }}</h3>
            <button class="btn btn-ghost btn-sm" (click)="selectedPayroll = null">✕ Close</button>
          </div>

          <form [formGroup]="slipForm" (ngSubmit)="createSlip()" class="slip-form">
            <div class="field"><label>Employee</label>
              <select formControlName="employee_id">
                <option value="">Select…</option>
                @for (e of employees$ | async; track e.id) {
                  <option [value]="e.id">{{ e.name }}</option>
                }
              </select>
            </div>
            <div class="field"><label>Gross Pay</label><input type="number" formControlName="gross_pay" placeholder="0.00" /></div>
            <div class="field"><label>Bonuses</label><input type="number" formControlName="bonuses" placeholder="0.00" /></div>
            <div class="field"><label>Deductions</label><input type="number" formControlName="deductions" placeholder="0.00" /></div>
            <button type="submit" class="btn btn-primary" [disabled]="creatingSlip()">{{ creatingSlip() ? 'Adding…' : '+ Add Payslip' }}</button>
          </form>

          <table class="slip-table">
            <thead><tr><th>Employee</th><th>Gross</th><th>Bonuses</th><th>Deductions</th><th>Net Pay</th></tr></thead>
            <tbody>
              @for (s of selectedPayroll.payslips ?? []; track s.id) {
                <tr>
                  <td>{{ s.employee?.name }}</td>
                  <td>{{ s.gross_pay | currency }}</td>
                  <td class="text-success">+{{ s.bonuses | currency }}</td>
                  <td class="text-danger">-{{ s.deductions | currency }}</td>
                  <td class="fw">{{ s.net_pay | currency }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="load-cell">No payslips yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

    } @else {
      <!-- ══ EMPLOYEE: My Payslips ══ -->
      <div class="page-header">
        <div><h2>My Payslips</h2><p>View and download your salary statements.</p></div>
      </div>

      @if (error()) { <div class="error-banner">{{ error() }}</div> }
      @if (loading()) { <p class="load-cell">Loading payslips…</p> }
      @else if (myPayslips.length === 0) {
        <div class="card empty-state">
          <p class="empty-icon">💰</p>
          <p>No payslips available yet. They will appear here once payroll is processed.</p>
        </div>
      } @else {
        <div class="slips-grid">
          @for (s of myPayslips; track s.id) {
            <div class="slip-card">
              <div class="slip-period">{{ s.payroll?.period_start | date:'MMMM yyyy' }}</div>
              <div class="slip-amounts">
                <div class="sa-row"><span>Gross Pay</span><strong>{{ s.gross_pay | currency:s.currency }}</strong></div>
                @if (+s.bonuses > 0) {
                  <div class="sa-row text-success"><span>Bonuses</span><strong>+{{ s.bonuses | currency:s.currency }}</strong></div>
                }
                @if (+s.deductions > 0) {
                  <div class="sa-row text-danger"><span>Deductions</span><strong>-{{ s.deductions | currency:s.currency }}</strong></div>
                }
                <div class="sa-divider"></div>
                <div class="sa-row net"><span>Net Pay</span><strong>{{ s.net_pay | currency:s.currency }}</strong></div>
              </div>
              <div class="slip-footer">
                <span class="badge badge-success">Issued {{ s.issued_at | date:'MMM d, y' }}</span>
              </div>
            </div>
          }
        </div>
      }
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
    .card h3 { margin: 0 0 1rem; font-size: .95rem; font-weight: 700; }
    .error-banner { padding: .8rem 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .65rem 1.25rem; border-radius: var(--radius); border: none; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-soft); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn-success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(22,163,74,.2); }
    .btn-sm { padding: .4rem .8rem; font-size: .8rem; border-radius: var(--radius-sm); }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .form-row { display: flex; gap: .75rem; align-items: flex-end; flex-wrap: wrap; }
    .field { display: grid; gap: .4rem; }
    .field label { font-size: .82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field select { padding: .7rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); outline: none; transition: border-color .15s; }
    .field input:focus, .field select:focus { border-color: var(--primary); }
    .table-card { overflow: hidden; padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: .75rem 1.25rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); background: var(--surface-muted); border-bottom: 1px solid var(--border); }
    td { padding: .85rem 1.25rem; border-bottom: 1px solid var(--border); font-size: .875rem; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td, .active-row td { background: var(--surface-hover); }
    .fw { font-weight: 600; }
    .load-cell { text-align: center; color: var(--muted); padding: 2.5rem; }
    .row-btns { display: flex; gap: .4rem; }
    .text-success { color: var(--success); } .text-danger { color: var(--danger); }
    .slip-panel { display: grid; gap: 1.25rem; }
    .slip-hdr { display: flex; align-items: center; justify-content: space-between; }
    .slip-hdr h3 { margin: 0; font-size: .95rem; font-weight: 700; }
    .slip-form { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: .75rem; align-items: flex-end; }
    .slip-table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
    .slip-table th { padding: .6rem 1rem; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); background: var(--surface-muted); border-bottom: 1px solid var(--border); text-align: left; }
    .slip-table td { padding: .75rem 1rem; border-bottom: 1px solid var(--border); font-size: .875rem; }
    .slips-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
    .slip-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 1rem; }
    .slip-period { font-size: 1.1rem; font-weight: 800; color: var(--text); letter-spacing: -.02em; }
    .sa-row { display: flex; justify-content: space-between; align-items: center; padding: .5rem 0; }
    .sa-row span { font-size: .875rem; color: var(--muted); }
    .sa-row strong { font-size: .9rem; font-weight: 600; }
    .sa-divider { height: 1px; background: var(--border); margin: .25rem 0; }
    .sa-row.net strong { font-size: 1.2rem; font-weight: 800; color: var(--primary); }
    .sa-row.net span { font-weight: 700; color: var(--text); }
    .text-success strong { color: var(--success); } .text-danger strong { color: var(--danger); }
    .slip-footer { display: flex; justify-content: flex-end; }
    .empty-state { text-align: center; padding: 3rem; }
    .empty-icon { font-size: 2.5rem; margin: 0 0 .5rem; }
    @media (max-width: 900px) { .slips-grid { grid-template-columns: 1fr; } .slip-form { grid-template-columns: 1fr 1fr; } }
  `],
})
export class PayrollPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private svc = inject(PayrollService);
  private empSvc = inject(EmployeeService);
  private fb = inject(NonNullableFormBuilder);

  payrolls: Payroll[] = [];
  myPayslips: Payslip[] = [];
  selectedPayroll: (Payroll & { payslips?: Payslip[] }) | null = null;
  loading = signal(true);
  creating = signal(false);
  creatingSlip = signal(false);
  error = signal('');
  showCreate = false;

  readonly employees$: Observable<Employee[]> = this.empSvc.listEmployees();

  readonly payrollForm = this.fb.group({
    period_start: this.fb.control('', [Validators.required]),
    period_end: this.fb.control('', [Validators.required]),
    pay_date: this.fb.control(''),
  });

  readonly slipForm = this.fb.group({
    employee_id: this.fb.control('', [Validators.required]),
    gross_pay: this.fb.control('', [Validators.required]),
    bonuses: this.fb.control('0'),
    deductions: this.fb.control('0'),
  });

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.svc.listPayrolls().subscribe({ next: p => { this.payrolls = p; this.loading.set(false); }, error: () => { this.error.set('Failed to load.'); this.loading.set(false); } });
    } else {
      this.svc.myPayslips().subscribe({ next: p => { this.myPayslips = p; this.loading.set(false); }, error: () => this.loading.set(false) });
    }
  }

  createPayroll(): void {
    if (this.payrollForm.invalid) { this.payrollForm.markAllAsTouched(); return; }
    this.creating.set(true);
    this.svc.createPayroll(this.payrollForm.getRawValue()).subscribe({
      next: p => { this.payrolls = [p, ...this.payrolls]; this.creating.set(false); this.showCreate = false; this.payrollForm.reset(); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed.'); this.creating.set(false); },
    });
  }

  selectPayroll(p: Payroll): void {
    this.selectedPayroll = p;
    this.svc.getPayrollWithSlips(p.id).subscribe({ next: slips => {
      this.selectedPayroll = { ...p, payslips: slips } as Payroll & { payslips: Payslip[] };
    }});
    this.slipForm.patchValue({ employee_id: '', gross_pay: '', bonuses: '0', deductions: '0' });
  }

  createSlip(): void {
    if (this.slipForm.invalid || !this.selectedPayroll) { this.slipForm.markAllAsTouched(); return; }
    this.creatingSlip.set(true);
    const v = this.slipForm.getRawValue();
    this.svc.createPayslip({ ...v, payroll_id: this.selectedPayroll.id }).subscribe({
      next: () => { this.creatingSlip.set(false); this.slipForm.reset({ bonuses: '0', deductions: '0' }); if (this.selectedPayroll) this.selectPayroll(this.selectedPayroll); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed.'); this.creatingSlip.set(false); },
    });
  }

  markPaid(id: string): void {
    // Backend doesn't have a status-update endpoint yet; update UI optimistically
    this.payrolls = this.payrolls.map(p =>
      p.id === id ? { ...p, status: 'paid' as any } : p
    );
  }
}
