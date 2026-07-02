import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Department } from '../../core/models/department';
import { DepartmentService } from '../../core/services/department.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="form-page">
      <div class="heading-row">
        <div>
          <h2>Add Employee</h2>
          <p>Create a new employee record.</p>
        </div>
        <a routerLink="/employees">Back to Employees</a>
      </div>

      @if (error) {
        <p class="error-banner">{{ error }}</p>
      }

      <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <label>
            <span>Name</span>
            <input type="text" formControlName="name" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <span class="field-error">Name is required.</span>
            }
          </label>

          <label>
            <span>Email</span>
            <input type="email" formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="field-error">Valid email is required.</span>
            }
          </label>

          <label>
            <span>Job Title</span>
            <input type="text" formControlName="title" placeholder="e.g. Frontend Engineer" />
            @if (form.controls.title.touched && form.controls.title.invalid) {
              <span class="field-error">Title is required.</span>
            }
          </label>

          <label>
            <span>Department</span>
            <select formControlName="department_id">
              <option value="">Select department</option>
              @for (dept of departments$ | async; track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
            @if (form.controls.department_id.touched && form.controls.department_id.invalid) {
              <span class="field-error">Department is required.</span>
            }
          </label>

          <label>
            <span>Start date</span>
            <input type="date" formControlName="start_date" />
            @if (form.controls.start_date.touched && form.controls.start_date.invalid) {
              <span class="field-error">Start date is required.</span>
            }
          </label>
        </div>

        <button type="submit" [disabled]="submitting">
          {{ submitting ? 'Saving…' : 'Save employee' }}
        </button>
      </form>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .form-page { display: grid; gap: 1rem; }

    .heading-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    h2 { margin: 0; font-size: 1.6rem; letter-spacing: -0.04em; }
    p { margin: 0.35rem 0 0; color: var(--muted); }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.25rem;
      box-shadow: var(--shadow);
    }

    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }

    label { display: grid; gap: 0.35rem; font-weight: 600; }

    input, select {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-muted);
      padding: 0.85rem 0.95rem;
    }

    .field-error { font-size: 0.85rem; color: var(--danger); font-weight: 400; }

    .grid label:last-child { grid-column: 1 / -1; max-width: 320px; }

    button, .heading-row a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0 1rem;
      border-radius: 12px;
      font-weight: 700;
    }

    button {
      margin-top: 1rem;
      border: 0;
      background: var(--primary);
      color: #fff;
      cursor: pointer;
    }

    button:disabled { opacity: 0.7; cursor: wait; }

    .heading-row a {
      background: rgba(15, 118, 110, 0.1);
      color: var(--primary-strong);
    }

    .error-banner {
      background: rgba(180, 35, 24, 0.08);
      color: var(--danger);
      border: 1px solid rgba(180, 35, 24, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin: 0;
    }

    @media (max-width: 900px) {
      .heading-row, .grid { grid-template-columns: 1fr; }
      .grid { display: flex; flex-direction: column; }
      .grid label:last-child { max-width: none; }
    }
  `],
})
export class EmployeeFormPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);

  readonly departments$: Observable<Department[]> = this.departmentService.listDepartments();
  submitting = false;
  error = '';

  readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    title: this.fb.control('', [Validators.required]),
    department_id: this.fb.control('', [Validators.required]),
    start_date: this.fb.control('', [Validators.required]),
  });

  ngOnInit(): void {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.employeeService.addEmployee(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        void this.router.navigate(['/employees']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Failed to create employee.';
      },
    });
  }
}
