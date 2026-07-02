import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { EmployeeService } from '../../core/services/employee.service';
import { HrDocument, DocumentType } from '../../core/models/document';
import { Employee } from '../../core/models/employee';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="page">
    <div class="page-header">
      <div>
        <h2>Documents</h2>
        <p>{{ auth.isAdmin() ? 'Manage employee files, contracts, and HR documents.' : 'Access your employment documents and certificates.' }}</p>
      </div>
      <button class="btn btn-primary" (click)="showForm = !showForm">
        {{ showForm ? '✕ Cancel' : '+ Upload Document' }}
      </button>
    </div>

    @if (showForm) {
      <div class="card upload-card">
        <h3>Upload Document</h3>
        <form [formGroup]="form" (ngSubmit)="upload()" class="upload-form">
          @if (auth.isAdmin()) {
            <div class="field">
              <label>Employee (optional)</label>
              <select formControlName="employee_id">
                <option value="">Company-wide</option>
                @for (e of employees$ | async; track e.id) { <option [value]="e.id">{{ e.name }}</option> }
              </select>
            </div>
          }
          <div class="field">
            <label>Document Type</label>
            <select formControlName="document_type">
              @for (t of docTypes; track t.val) { <option [value]="t.val">{{ t.label }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Title</label>
            <input type="text" formControlName="title" placeholder="e.g. Employment Contract 2024" />
          </div>
          <div class="field">
            <label>File Name</label>
            <input type="text" formControlName="file_name" placeholder="document.pdf" />
          </div>
          <div class="field uf-wide">
            <label>File URL</label>
            <input type="url" formControlName="file_url" placeholder="https://storage.example.com/file.pdf" />
          </div>
          <div class="field uf-wide">
            <label>Description (optional)</label>
            <input type="text" formControlName="description" placeholder="Brief description…" />
          </div>
          @if (auth.isAdmin()) {
            <div class="field cf-row">
              <label class="check-label">
                <input type="checkbox" formControlName="is_confidential" />
                Mark as confidential (hidden from employee)
              </label>
            </div>
          }
          <div class="uf-wide">
            <button type="submit" class="btn btn-primary" [disabled]="uploading()">{{ uploading() ? 'Uploading…' : '⬆️ Upload' }}</button>
          </div>
        </form>
      </div>
    }

    @if (error()) { <div class="error-banner">{{ error() }}</div> }

    <!-- Filter bar (admin) -->
    @if (auth.isAdmin()) {
      <div class="filter-bar">
        <select class="filter-sel" (change)="onFilterChange($event)">
          <option value="">All types</option>
          @for (t of docTypes; track t.val) { <option [value]="t.val">{{ t.label }}</option> }
        </select>
      </div>
    }

    @if (loading()) {
      <div class="doc-grid">
        @for (n of [1,2,3,4]; track n) { <div class="skeleton"></div> }
      </div>
    } @else if (docs.length === 0) {
      <div class="card empty-state">
        <span class="empty-icon">📁</span>
        <p>No documents found.</p>
      </div>
    } @else {
      <div class="doc-grid">
        @for (d of docs; track d.id) {
          <div class="doc-card">
            <div class="doc-icon-wrap" [style.--dt]="docColor(d.document_type)">
              <span class="doc-icon">{{ docIcon(d.document_type) }}</span>
            </div>
            <div class="doc-info">
              <p class="doc-title">{{ d.title }}</p>
              <p class="doc-meta">
                {{ d.file_name }}
                @if (d.employee) { · {{ d.employee.name }} }
              </p>
              <div class="doc-tags">
                <span class="type-badge">{{ d.document_type | titlecase }}</span>
                @if (d.is_confidential) { <span class="badge badge-danger">Confidential</span> }
                <span class="doc-date">{{ d.uploaded_at | date:'MMM d, y' }}</span>
              </div>
            </div>
            <div class="doc-actions">
              <a [href]="d.file_url" target="_blank" class="btn btn-ghost btn-sm">⬇️ Download</a>
              @if (auth.isAdmin()) {
                <button class="btn btn-danger btn-sm" (click)="remove(d.id)">🗑</button>
              }
            </div>
          </div>
        }
      </div>
    }
  </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    h2 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -.03em; }
    p { margin: .25rem 0 0; color: var(--muted); font-size: .9rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow); }
    .card h3 { margin: 0 0 1rem; font-size: .95rem; font-weight: 700; }
    .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .65rem 1.25rem; border-radius: var(--radius); border: none; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .15s; text-decoration: none; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-soft); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn-sm { padding: .35rem .75rem; font-size: .78rem; border-radius: var(--radius-sm); }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .upload-form { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; }
    .uf-wide { grid-column: 1/-1; }
    .cf-row { grid-column: 1/-1; }
    .field { display: grid; gap: .4rem; }
    .field label { font-size: .82rem; font-weight: 600; color: var(--text-soft); }
    .field input[type=text], .field input[type=url], .field select { padding: .7rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); outline: none; transition: border-color .15s; width: 100%; }
    .field input:focus, .field select:focus { border-color: var(--primary); }
    .check-label { display: flex; align-items: center; gap: .6rem; font-size: .875rem; font-weight: 500; cursor: pointer; }
    .check-label input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--primary); }
    .error-banner { padding: .8rem 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .filter-bar { display: flex; gap: .75rem; }
    .filter-sel { padding: .6rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface); font-size: .875rem; outline: none; }
    .doc-grid { display: grid; gap: 1rem; }
    .skeleton { height: 80px; border-radius: var(--radius-lg); background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 3rem; }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: .5rem; }
    .doc-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow); display: flex; align-items: center; gap: 1rem; transition: all .15s; }
    .doc-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); border-color: rgba(99,102,241,.25); }
    .doc-icon-wrap { width: 52px; height: 52px; border-radius: 14px; background: color-mix(in srgb, var(--dt,#6366f1) 12%, transparent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .doc-icon { font-size: 1.5rem; }
    .doc-info { flex: 1; min-width: 0; }
    .doc-title { margin: 0; font-size: .95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-meta { margin: .2rem 0 .5rem; font-size: .78rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-tags { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .type-badge { padding: .2rem .55rem; background: var(--primary-light); color: var(--primary-text); border-radius: 99px; font-size: .7rem; font-weight: 600; text-transform: capitalize; }
    .doc-date { font-size: .72rem; color: var(--muted); margin-left: auto; }
    .doc-actions { display: flex; gap: .4rem; flex-shrink: 0; }
    @media (max-width: 900px) { .upload-form { grid-template-columns: 1fr; } .doc-card { flex-wrap: wrap; } }
  `],
})
export class DocumentsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private svc = inject(DocumentService);
  private empSvc = inject(EmployeeService);
  private fb = inject(NonNullableFormBuilder);

  docs: HrDocument[] = [];
  loading = signal(true);
  uploading = signal(false);
  error = signal('');
  showForm = false;
  filterType = '';

  readonly employees$: Observable<Employee[]> = this.empSvc.listEmployees();

  readonly docTypes = [
    { val: 'contract',    label: '📝 Contract' },
    { val: 'id_proof',    label: '🪪 ID Proof' },
    { val: 'payslip',     label: '💰 Payslip' },
    { val: 'hr_document', label: '📋 HR Document' },
    { val: 'certificate', label: '🏅 Certificate' },
    { val: 'other',       label: '📎 Other' },
  ];

  readonly form = this.fb.group({
    employee_id:    this.fb.control(''),
    document_type:  this.fb.control('other'),
    title:          this.fb.control('', [Validators.required]),
    file_name:      this.fb.control('', [Validators.required]),
    file_url:       this.fb.control('', [Validators.required]),
    description:    this.fb.control(''),
    is_confidential: this.fb.control(false),
  });

  docIcon(t: DocumentType): string {
    const m: Record<string, string> = { contract: '📝', id_proof: '🪪', payslip: '💰', hr_document: '📋', certificate: '🏅', other: '📎' };
    return m[t] ?? '📄';
  }
  docColor(t: DocumentType): string {
    const m: Record<string, string> = { contract: '#6366f1', id_proof: '#0284c7', payslip: '#16a34a', hr_document: '#d97706', certificate: '#8b5cf6', other: '#64748b' };
    return m[t] ?? '#64748b';
  }

  ngOnInit(): void { this.load(); }

  onFilterChange(e: Event): void {
    this.filterType = (e.target as HTMLSelectElement).value;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: d => { this.docs = d; this.loading.set(false); },
      error: () => { this.error.set('Failed to load documents.'); this.loading.set(false); },
    });
  }

  upload(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.uploading.set(true);
    const v = this.form.getRawValue();
    this.svc.create({ ...v, employee_id: v.employee_id || undefined }).subscribe({
      next: () => { this.uploading.set(false); this.showForm = false; this.form.reset({ document_type: 'other', is_confidential: false }); this.load(); },
      error: e => { this.error.set(e?.error?.message ?? 'Upload failed.'); this.uploading.set(false); },
    });
  }

  remove(id: string): void {
    if (!confirm('Delete this document?')) return;
    this.svc.remove(id).subscribe({ next: () => this.docs = this.docs.filter(d => d.id !== id) });
  }
}
