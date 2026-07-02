import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Attendance, AttendanceSummary } from '../models/attendance';
import { AuthService } from '../auth/auth.service';
import { EmployeeService } from './employee.service';
import { switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly base = `${environment.apiBaseUrl}/api/attendance`;
  private readonly auth = inject(AuthService);
  private readonly empSvc = inject(EmployeeService);

  constructor(private http: HttpClient) {}

  // List all attendance records (admin), optionally filtered by date
  list(params: Record<string, string> = {}): Observable<Attendance[]> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => v && (p = p.set(k, v)));
    return this.http.get<Attendance[]>(this.base, { params: p });
  }

  // Get today's attendance for the current employee
  todayStatus(): Observable<Attendance | null> {
    const email = this.auth.currentUser()?.email;
    if (!email) return of(null);

    return this.empSvc.listEmployees().pipe(
      map(emps => emps.find(e => e.email === email) ?? null),
      switchMap(emp => {
        if (!emp) return of(null);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return this.http.get<Attendance[]>(this.base, {
          params: new HttpParams().set('work_date', today)
        }).pipe(
          map(records => records.find(r => r.employee_id === emp.id) ?? null),
          catchError(() => of(null))
        );
      })
    );
  }

  // Monthly summary for the current employee
  summary(): Observable<AttendanceSummary> {
    const email = this.auth.currentUser()?.email;
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (!email) {
      return of({ present: 0, late: 0, absent: 0, on_leave: 0, half_day: 0, total_days: 0, records: [] } as any);
    }

    return this.empSvc.listEmployees().pipe(
      map(emps => emps.find(e => e.email === email) ?? null),
      switchMap(emp => {
        if (!emp) return of({ present: 0, late: 0, absent: 0, on_leave: 0, half_day: 0, total_days: 0, records: [] } as any);
        const params = new HttpParams()
          .set('employee_id', emp.id)
          .set('month', month);
        return this.http.get<AttendanceSummary>(`${this.base}/summary`, { params });
      })
    );
  }

  // Check-in: backend requires employee_id in body
  checkIn(employeeId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.base}/check-in`, { employee_id: employeeId });
  }

  // Check-out: backend requires employee_id in body
  checkOut(employeeId: string): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.base}/check-out`, { employee_id: employeeId });
  }

  // Admin manual upsert
  adminUpsert(payload: Record<string, unknown>): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.base}/upsert`, payload);
  }
}
