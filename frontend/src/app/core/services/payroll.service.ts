import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Payroll, Payslip } from '../models/payroll';

// Shape the backend actually returns
type BackendPayroll = Payroll & { payslip_count?: number };

function normalizePayroll(p: BackendPayroll): Payroll {
  return { ...p, _count: { payslips: p.payslip_count ?? 0 } };
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly base = `${environment.apiBaseUrl}/api/payroll`;
  constructor(private http: HttpClient) {}

  listPayrolls(): Observable<Payroll[]> {
    return this.http.get<BackendPayroll[]>(this.base).pipe(
      map(items => items.map(normalizePayroll))
    );
  }

  createPayroll(payload: { period_start: string; period_end: string; pay_date?: string }): Observable<Payroll> {
    return this.http.post<BackendPayroll>(this.base, payload).pipe(map(normalizePayroll));
  }

  // Fetch payslips for a specific payroll run to "get" a payroll with slips
  getPayrollWithSlips(payrollId: string): Observable<Payslip[]> {
    return this.http.get<Payslip[]>(`${this.base}/payslips`, {
      params: new HttpParams().set('payroll_id', payrollId)
    });
  }

  myPayslips(): Observable<Payslip[]> {
    return this.http.get<Payslip[]>(`${this.base}/my-payslips`);
  }

  createPayslip(payload: {
    payroll_id: string;
    employee_id: string;
    gross_pay: string;
    bonuses?: string;
    deductions?: string;
  }): Observable<Payslip> {
    const gross = parseFloat(payload.gross_pay) || 0;
    const bonuses = parseFloat(payload.bonuses ?? '0') || 0;
    const deductions = parseFloat(payload.deductions ?? '0') || 0;
    const net_pay = gross + bonuses - deductions;

    return this.http.post<Payslip>(`${this.base}/payslips`, {
      payroll_id: payload.payroll_id,
      employee_id: payload.employee_id,
      gross_pay: gross,
      bonuses: bonuses,
      deductions: deductions,
      net_pay: net_pay,
    });
  }
}
