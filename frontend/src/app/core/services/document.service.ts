import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HrDocument } from '../models/document';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly base = `${environment.apiBaseUrl}/api/documents`;
  constructor(private http: HttpClient) {}

  list(employeeId?: string): Observable<HrDocument[]> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employee_id', employeeId);
    return this.http.get<HrDocument[]>(this.base, { params });
  }

  create(p: Record<string, unknown>): Observable<HrDocument> { return this.http.post<HrDocument>(this.base, p); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
