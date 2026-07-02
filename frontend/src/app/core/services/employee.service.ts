import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Employee, EmployeeFormValue } from '../models/employee';

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
}

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/employees`;

  constructor(private readonly http: HttpClient) {}

  listEmployees(filters: EmployeeFilters = {}): Observable<Employee[]> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('q', filters.search);
    }
    if (filters.department && filters.department !== 'all') {
      params = params.set('department', filters.department);
    }
    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    return this.http.get<Employee[]>(this.baseUrl, { params });
  }

  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  addEmployee(employee: Omit<EmployeeFormValue, 'status'>): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, employee);
  }

  updateEmployee(id: string, updates: Partial<EmployeeFormValue>): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, updates);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
