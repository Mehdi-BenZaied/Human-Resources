import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="page">
    <div class="page-header">
      <div>
        <h2>{{ auth.isAdmin() ? 'Announcements' : 'Company Announcements' }}</h2>
        <p>{{ auth.isAdmin() ? 'Send and manage announcements to all employees.' : 'Stay up to date with the latest company news.' }}</p>
      </div>
      @if (auth.isAdmin()) {
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? '✕ Cancel' : '📢 New Announcement' }}
        </button>
      }
    </div>

    @if (auth.isAdmin() && showForm) {
      <div class="card compose-card">
        <h3>Compose Announcement</h3>
        <form [formGroup]="form" (ngSubmit)="create()" class="compose-form">
          <div class="field">
            <label>Title</label>
            <input type="text" formControlName="title" placeholder="Brief subject line" />
            @if (form.controls.title.touched && form.controls.title.invalid) {
              <span class="field-error">Title is required.</span>
            }
          </div>
          <div class="cf-row">
            <div class="field">
              <label>Type</label>
              <select formControlName="type">
                @for (t of notifTypes; track t.val) { <option [value]="t.val">{{ t.label }}</option> }
              </select>
            </div>
            <div class="field">
              <label>Audience</label>
              <select formControlName="audience_role">
                <option value="">Everyone</option>
                <option value="employee">Employees only</option>
                <option value="admin">Admins only</option>
              </select>
            </div>
            <div class="field">
              <label>Expires</label>
              <input type="date" formControlName="expires_at" />
            </div>
          </div>
          <div class="field">
            <label>Message</label>
            <textarea formControlName="message" rows="4" placeholder="Write your announcement…"></textarea>
            @if (form.controls.message.touched && form.controls.message.invalid) {
              <span class="field-error">Message is required.</span>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="sending()">{{ sending() ? 'Sending…' : '📢 Send Announcement' }}</button>
        </form>
      </div>
    }

    @if (error()) { <div class="error-banner">{{ error() }}</div> }

    @if (loading()) {
      <div class="skeletons">
        @for (n of [1,2,3]; track n) { <div class="skeleton"></div> }
      </div>
    } @else if (notifications.length === 0) {
      <div class="card empty-state">
        <span class="empty-icon">🔔</span>
        <p>No announcements yet.</p>
      </div>
    } @else {
      <div class="notif-list">
        @for (n of notifications; track n.id) {
          <div class="notif-card" [class.unpublished]="!n.is_published">
            <div class="notif-type-bar" [style.background]="typeColor(n.type)"></div>
            <div class="notif-body">
              <div class="notif-top">
                <div class="notif-left">
                  <span class="notif-type-badge" [style.background]="typeBg(n.type)" [style.color]="typeColor(n.type)">
                    {{ typeIcon(n.type) }} {{ n.type | titlecase }}
                  </span>
                  @if (!n.is_published) { <span class="badge badge-muted">Draft</span> }
                  @if (n.audience_role) { <span class="badge badge-info">{{ n.audience_role }}s only</span> }
                </div>
                @if (auth.isAdmin()) {
                  <div class="notif-admin-btns">
                    <button class="btn btn-ghost btn-sm" (click)="togglePublish(n)">
                      {{ n.is_published ? 'Unpublish' : 'Publish' }}
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="remove(n.id)">🗑</button>
                  </div>
                }
              </div>
              <h3 class="notif-title">{{ n.title }}</h3>
              <p class="notif-msg">{{ n.message }}</p>
              <div class="notif-footer">
                <span>{{ n.created_by_user?.name ?? 'HR Team' }}</span>
                <span>{{ n.created_at | date:'MMMM d, yyyy' }}</span>
                @if (n.expires_at) { <span>Expires {{ n.expires_at | date:'MMM d' }}</span> }
              </div>
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
    .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .65rem 1.25rem; border-radius: var(--radius); border: none; font-weight: 600; font-size: .9rem; cursor: pointer; transition: all .15s; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
    .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text-soft); }
    .btn-ghost:hover { background: var(--surface-hover); }
    .btn-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .btn-sm { padding: .35rem .75rem; font-size: .78rem; border-radius: var(--radius-sm); }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .compose-card h3 { margin: 0 0 1.25rem; }
    .compose-form { display: grid; gap: 1rem; }
    .cf-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
    .field { display: grid; gap: .4rem; }
    .field label { font-size: .82rem; font-weight: 600; color: var(--text-soft); }
    .field input, .field select, .field textarea { padding: .75rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface-muted); outline: none; transition: border-color .15s; resize: vertical; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,.12); background: var(--surface); }
    .field-error { font-size: .78rem; color: var(--danger); font-weight: 500; }
    .error-banner { padding: .8rem 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(220,38,38,.2); }
    .skeletons { display: grid; gap: 1rem; }
    .skeleton { height: 120px; border-radius: var(--radius-lg); background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 3rem; }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: .5rem; }
    .notif-list { display: grid; gap: .85rem; }
    .notif-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); display: flex; overflow: hidden; transition: box-shadow .15s; }
    .notif-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,.08); }
    .notif-card.unpublished { opacity: .65; }
    .notif-type-bar { width: 5px; flex-shrink: 0; }
    .notif-body { flex: 1; padding: 1.25rem; display: grid; gap: .75rem; }
    .notif-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .notif-left { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .notif-type-badge { padding: .2rem .65rem; border-radius: 99px; font-size: .72rem; font-weight: 700; }
    .notif-admin-btns { display: flex; gap: .4rem; }
    .notif-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text); }
    .notif-msg { margin: 0; color: var(--text-soft); font-size: .9rem; line-height: 1.6; }
    .notif-footer { display: flex; gap: 1rem; font-size: .75rem; color: var(--muted); flex-wrap: wrap; }
    @media (max-width: 900px) { .cf-row { grid-template-columns: 1fr; } }
  `],
})
export class NotificationsPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private svc = inject(NotificationService);
  private fb = inject(NonNullableFormBuilder);

  notifications: Notification[] = [];
  loading = signal(true);
  sending = signal(false);
  error = signal('');
  showForm = false;

  readonly notifTypes = [
    { val: 'announcement',  label: '📢 Announcement' },
    { val: 'holiday',       label: '🌴 Holiday' },
    { val: 'policy_update', label: '📋 Policy Update' },
    { val: 'system',        label: '⚙️ System' },
  ];

  readonly form = this.fb.group({
    title:         this.fb.control('', [Validators.required]),
    message:       this.fb.control('', [Validators.required, Validators.minLength(5)]),
    type:          this.fb.control('announcement'),
    audience_role: this.fb.control(''),
    expires_at:    this.fb.control(''),
  });

  typeColor(t: NotificationType): string {
    const m: Record<string, string> = { announcement: '#6366f1', holiday: '#16a34a', policy_update: '#d97706', leave_update: '#0284c7', system: '#64748b' };
    return m[t] ?? '#64748b';
  }
  typeBg(t: NotificationType): string {
    const m: Record<string, string> = { announcement: '#eef2ff', holiday: '#f0fdf4', policy_update: '#fffbeb', leave_update: '#f0f9ff', system: '#f8fafc' };
    return m[t] ?? '#f8fafc';
  }
  typeIcon(t: NotificationType): string {
    const m: Record<string, string> = { announcement: '📢', holiday: '🌴', policy_update: '📋', leave_update: '🏖', system: '⚙️' };
    return m[t] ?? '🔔';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: n => { this.notifications = n; this.loading.set(false); },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }

  create(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending.set(true);
    const v = this.form.getRawValue();
    this.svc.create({ ...v, audience_role: v.audience_role || null, expires_at: v.expires_at || null }).subscribe({
      next: () => { this.sending.set(false); this.showForm = false; this.form.reset({ type: 'announcement' }); this.load(); },
      error: e => { this.error.set(e?.error?.message ?? 'Failed.'); this.sending.set(false); },
    });
  }

  togglePublish(n: Notification): void {
    this.svc.update(n.id, { is_published: !n.is_published }).subscribe({ next: () => this.load() });
  }

  remove(id: string): void {
    if (!confirm('Delete this announcement?')) return;
    this.svc.remove(id).subscribe({ next: () => this.notifications = this.notifications.filter(n => n.id !== id) });
  }
}
