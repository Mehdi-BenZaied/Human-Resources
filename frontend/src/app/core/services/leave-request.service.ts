import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LeaveRequest, LeaveRequestFormValue, LeaveRequestStatus } from '../models/leave-request';

@Injectable({ providedIn: 'root' })
export class LeaveRequestService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/leave-requests`;

  constructor(private readonly http: HttpClient) {}

  listRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(this.baseUrl);
  }

  createRequest(payload: LeaveRequestFormValue): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.baseUrl, payload);
  }

  updateStatus(id: string, status: LeaveRequestStatus): Observable<LeaveRequest> {
    return this.http.patch<LeaveRequest>(`${this.baseUrl}/${id}/status`, { status });
  }

  cancelRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
