import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <h2>Welcome back</h2>
        <p>Sign in to your HR workspace</p>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
        <div class="field">
          <label for="email">Email address</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="you@company.com"
            autocomplete="email"
          />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="input-wrap">
            <input
              id="password"
              [type]="showPw() ? 'text' : 'password'"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-pw" (click)="showPw.set(!showPw())">
              {{ showPw() ? '🙈' : '👁' }}
            </button>
          </div>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Password is required.</span>
          }
        </div>

        <button type="submit" class="btn btn-primary btn-full" [disabled]="submitting()">
          @if (submitting()) {
            <span class="spinner"></span> Signing in…
          } @else {
            Sign in →
          }
        </button>
      </form>

      <div class="auth-divider">
        <span>Quick login</span>
      </div>

      <div class="quick-logins">
        <button class="quick-btn" type="button" (click)="fillAdmin()">
          <span class="quick-role admin">Admin</span>
          admin&#64;hrportal.com
        </button>
        <button class="quick-btn" type="button" (click)="fillEmployee()">
          <span class="quick-role emp">Employee</span>
          avery.morgan&#64;company.com
        </button>
      </div>

      <p class="auth-switch">
        Don't have an account? <a routerLink="/signup">Create one</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-card {
      display: grid;
      gap: 1.25rem;
    }

    .auth-header h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #1e1b4b;
    }

    .auth-header p {
      margin: 0.3rem 0 0;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .auth-form {
      display: grid;
      gap: 1rem;
    }

    .field {
      display: grid;
      gap: 0.4rem;
    }

    .field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .field input {
      width: 100%;
      padding: 0.8rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      background: #fff;
      color: var(--text);
      font-size: 0.95rem;
      transition: border-color .15s, box-shadow .15s;
      outline: none;
    }

    .field input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,.12);
    }

    .input-wrap {
      position: relative;
    }

    .input-wrap input {
      padding-right: 3rem;
    }

    .toggle-pw {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      line-height: 1;
    }

    .field-error {
      font-size: 0.8rem;
      color: var(--danger);
      font-weight: 500;
    }

    .btn-full {
      width: 100%;
      padding: 0.85rem;
      font-size: 1rem;
      border-radius: var(--radius);
      background: #6366f1;
      color: #fff;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all .15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-full:hover:not(:disabled) {
      background: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(99,102,241,.4);
    }

    .btn-full:disabled {
      opacity: .65;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid rgba(220,38,38,.2);
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .quick-logins {
      display: grid;
      gap: 0.5rem;
    }

    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface-muted);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-soft);
      transition: all .15s;
      text-align: left;
    }

    .quick-btn:hover {
      border-color: #6366f1;
      background: #eef2ff;
    }

    .quick-role {
      display: inline-flex;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    .quick-role.admin {
      background: #ede9fe;
      color: #5b21b6;
    }

    .quick-role.emp {
      background: #e0f2fe;
      color: #075985;
    }

    .auth-switch {
      margin: 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted);
    }

    .auth-switch a {
      color: #6366f1;
      font-weight: 600;
    }
  `],
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  submitting = signal(false);
  showPw = signal(false);
  error = signal('');

  readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  fillAdmin(): void {
    this.form.patchValue({ email: 'admin@hrportal.com', password: 'Admin@1234' });
  }

  fillEmployee(): void {
    this.form.patchValue({ email: 'alice.johnson@company.com', password: 'Password@1234' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Invalid email or password.');
      },
    });
  }
}
