import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  // camelCase aliases used by the dashboard template
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  pendingLeave: number;
  todayAttendance: number;
  pendingJobs: number;
  newHiresThisMonth: number;
}

// Shape the FastAPI backend actually returns
interface BackendStats {
  total_employees: number;
  active_employees: number;
  total_departments: number;
  pending_leave_requests: number;
  todays_attendance: number;
  todays_present: number;
  todays_late: number;
  open_jobs: number;
  total_candidates: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  constructor(private http: HttpClient) {}

  get(): Observable<AdminStats> {
    return this.http.get<BackendStats>(`${environment.apiBaseUrl}/api/admin/stats`).pipe(
      map((s): AdminStats => ({
        totalEmployees:    s.total_employees,
        activeEmployees:   s.active_employees,
        onLeaveEmployees:  s.total_employees - s.active_employees,
        totalDepartments:  s.total_departments,
        pendingLeave:      s.pending_leave_requests,
        todayAttendance:   s.todays_attendance,
        pendingJobs:       s.open_jobs,
        newHiresThisMonth: 0,   // not tracked yet by backend
      }))
    );
  }
}
