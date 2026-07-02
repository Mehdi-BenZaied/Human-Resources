import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

const passwordMatch: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const pw = c.get('password')?.value;
  const cpw = c.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <h2>Create account</h2>
        <p>Register a new HR workspace account</p>
      </div>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" type="text" formControlName="name" placeholder="Alex Johnson" autocomplete="name" />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <span class="field-error">Name is required.</span>
          }
        </div>

        <div class="field">
          <label for="email">Email address</label>
          <input id="email" type="email" formControlName="email" placeholder="you@company.com" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" placeholder="Min. 8 characters" autocomplete="new-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Password must be at least 8 characters.</span>
          }
        </div>

        <div class="field">
          <label for="confirm">Confirm password</label>
          <input id="confirm" type="password" formControlName="confirmPassword" placeholder="Repeat password" autocomplete="new-password" />
          @if (form.touched && form.errors?.['passwordMismatch']) {
            <span class="field-error">Passwords do not match.</span>
          }
        </div>

        <button type="submit" class="btn-full" [disabled]="submitting()">
          @if (submitting()) {
            <span class="spinner"></span> Creating account…
          } @else {
            Create account →
          }
        </button>
      </form>

      <p class="auth-switch">
        Already have an account? <a routerLink="/login">Sign in</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-card { display: grid; gap: 1.25rem; }

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

    .auth-form { display: grid; gap: 1rem; }

    .field { display: grid; gap: 0.4rem; }

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

    .btn-full:disabled { opacity: .65; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px;
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

    .auth-switch {
      margin: 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted);
    }
    .auth-switch a { color: #6366f1; font-weight: 600; }
  `],
})
export class SignupPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  submitting = signal(false);
  error = signal('');

  readonly form = this.fb.group(
    {
      name: this.fb.control('', [Validators.required]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    { validators: [passwordMatch] },
  );

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const { confirmPassword: _, ...payload } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set('');

    this.authService.signup(payload).subscribe({
      next: () => { this.submitting.set(false); void this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Could not create account.');
      },
    });
  }
}
