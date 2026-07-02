import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../environments/environment';
import { User } from '../models/user';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupPayload extends AuthCredentials {
  name: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'hr_portal.jwt';
  private readonly userKey = 'hr_portal.user';

  private readonly _token = signal<string | null>(this.readFromStorage<string>(this.tokenKey));
  private readonly _user = signal<User | null>(this.readFromStorage<User>(this.userKey));

  readonly isAuthenticated = computed(() => Boolean(this._token()));
  readonly currentUser = computed(() => this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  login(credentials: AuthCredentials): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/api/auth/login`, credentials)
      .pipe(tap((session) => this.storeSession(session)));
  }

  signup(payload: SignupPayload): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/api/auth/signup`, payload)
      .pipe(tap((session) => this.storeSession(session)));
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiBaseUrl}/api/auth/me`);
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this.removeFromStorage(this.tokenKey);
    this.removeFromStorage(this.userKey);
  }

  getToken(): string | null {
    return this._token();
  }

  hasToken(): boolean {
    return Boolean(this._token());
  }

  private storeSession(session: AuthSession): void {
    this._token.set(session.token);
    this._user.set(session.user);
    this.writeToStorage(this.tokenKey, session.token);
    this.writeToStorage(this.userKey, session.user);
  }

  private readFromStorage<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  private writeToStorage(key: string, value: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  private removeFromStorage(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }
}
