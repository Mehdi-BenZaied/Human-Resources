import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiBaseUrl}/api/notifications`;
  constructor(private http: HttpClient) {}

  list(): Observable<Notification[]> { return this.http.get<Notification[]>(this.base); }
  create(p: Record<string, unknown>): Observable<Notification> { return this.http.post<Notification>(this.base, p); }
  update(id: string, p: Record<string, unknown>): Observable<Notification> { return this.http.patch<Notification>(`${this.base}/${id}`, p); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
