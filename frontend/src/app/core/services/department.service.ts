import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Department, DepartmentFormValue } from '../models/department';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/departments`;

  constructor(private readonly http: HttpClient) {}

  listDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.baseUrl);
  }

  getDepartment(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}/${id}`);
  }

  createDepartment(payload: DepartmentFormValue): Observable<Department> {
    return this.http.post<Department>(this.baseUrl, payload);
  }

  updateDepartment(id: string, payload: DepartmentFormValue): Observable<Department> {
    return this.http.put<Department>(`${this.baseUrl}/${id}`, payload);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
