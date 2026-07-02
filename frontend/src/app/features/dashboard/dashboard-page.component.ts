import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AdminStatsService, AdminStats } from '../../core/services/admin-stats.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveRequestService } from '../../core/services/leave-request.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification';
import { Employee } from '../../core/models/employee';
import { LeaveRequest } from '../../core/models/leave-request';
import { AttendanceSummary } from '../../core/models/attendance';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    @if (auth.isAdmin()) {
      <!-- ══════════ ADMIN DASHBOARD ══════════ -->
      <div class="page">
        @if (loading) { <div class="skeleton-full"></div> }
        @else if (error) { <div class="error-banner">{{ error }}</div> }
        @else {
          <!-- KPI Row -->
          <div class="kpi-row">
            @for (k of kpis; track k.label) {
              <div class="kpi" [style.--c]="k.color">
                <div class="kpi-left">
                  <span class="kpi-icon">{{ k.icon }}</span>
                  <div>
                    <p class="kpi-val">{{ k.value }}</p>
                    <p class="kpi-lbl">{{ k.label }}</p>
                  </div>
                </div>
                <a [routerLink]="k.link" class="kpi-action">View →</a>
              </div>
            }
          </div>

          <div class="dash-grid">
            <!-- Pending leave -->
            <div class="panel">
              <div class="panel-hdr">
                <h3>⏳ Pending Leave Requests</h3>
                <a routerLink="/leave-requests" class="link-sm">All →</a>
              </div>
              @if (pendingLeave.length === 0) {
                <p class="empty">All caught up ✓</p>
              } @else {
                @for (r of pendingLeave.slice(0,4); track r.id) {
                  <div class="list-row">
                    <div class="avatar-sm">{{ r.employee?.name?.charAt(0) }}</div>
                    <div class="list-info">
                      <p class="list-name">{{ r.employee?.name }}</p>
                      <p class="list-sub">{{ r.start_date | date:'MMM d' }} – {{ r.end_date | date:'MMM d' }} · {{ r.leave_type | titlecase }}</p>
                    </div>
                    <span class="badge badge-warning">pending</span>
                  </div>
                }
              }
            </div>

            <!-- Dept distribution -->
            <div class="panel">
              <div class="panel-hdr">
                <h3>🏢 Headcount by Department</h3>
                <a routerLink="/departments" class="link-sm">Manage →</a>
              </div>
              @for (d of deptBars; track d.name) {
                <div class="bar-row">
                  <span class="bar-lbl">{{ d.name }}</span>
                  <div class="bar-track"><div class="bar-fill" [style.width.%]="d.pct"></div></div>
                  <span class="bar-num">{{ d.count }}</span>
                </div>
              }
            </div>

            <!-- Recent employees -->
            <div class="panel panel-wide">
              <div class="panel-hdr">
                <h3>👥 Employee Overview</h3>
                <a routerLink="/employees" class="link-sm">All employees →</a>
              </div>
              <div class="emp-table-wrap">
                <table class="emp-table">
                  <thead><tr><th>Name</th><th>Title</th><th>Dept</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    @for (e of recentEmps; track e.id) {
                      <tr>
                        <td><div class="tc"><div class="av">{{ e.name.charAt(0) }}</div><span>{{ e.name }}</span></div></td>
                        <td class="muted">{{ e.title }}</td>
                        <td class="muted">{{ e.department?.name }}</td>
                        <td><span class="badge" [class.badge-success]="e.status==='active'" [class.badge-warning]="e.status==='on_leave'" [class.badge-muted]="e.status==='inactive'">{{ e.status }}</span></td>
                        <td><a [routerLink]="['/employees',e.id]" class="link-sm">View →</a></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Latest announcements -->
            <div class="panel">
              <div class="panel-hdr">
                <h3>🔔 Recent Announcements</h3>
                <a routerLink="/notifications" class="link-sm">Manage →</a>
              </div>
              @for (n of notifications.slice(0,3); track n.id) {
                <div class="notif-row">
                  <span class="notif-dot" [class]="'nd-'+n.type"></span>
                  <div>
                    <p class="notif-title">{{ n.title }}</p>
                    <p class="notif-date">{{ n.created_at | date:'MMM d, y' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

    } @else {
      <!-- ══════════ EMPLOYEE DASHBOARD ══════════ -->
      <div class="page">
        @if (loading) { <div class="skeleton-full"></div> }
        @else {
          <!-- Hero card -->
          <div class="emp-hero">
            <div class="emp-hero-avatar">{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</div>
            <div class="emp-hero-info">
              <h2>Good {{ greeting }}, {{ (auth.currentUser()?.name ?? '').split(' ')[0] }} 👋</h2>
              @if (myProfile) {
                <p>{{ myProfile.title }} · {{ myProfile.department?.name }}</p>
                <div class="emp-tags">
                  <span class="badge" [class.badge-success]="myProfile.status==='active'" [class.badge-warning]="myProfile.status==='on_leave'">{{ myProfile.status }}</span>
                  <span class="tag-chip">Since {{ myProfile.start_date | date:'MMM yyyy' }}</span>
                </div>
              }
            </div>
            <div class="emp-hero-actions">
              <a routerLink="/attendance" class="btn btn-primary">⏰ Check In/Out</a>
              <a routerLink="/leave-requests" class="btn btn-ghost">🏖 Request Leave</a>
            </div>
          </div>

          <div class="emp-grid">
            <!-- Attendance summary -->
            <div class="panel">
              <h3>📅 This Month's Attendance</h3>
              @if (attSummary) {
                <div class="att-grid">
                  <div class="att-stat att-present"><strong>{{ attSummary.present }}</strong><span>Present</span></div>
                  <div class="att-stat att-late"><strong>{{ attSummary.late }}</strong><span>Late</span></div>
                  <div class="att-stat att-absent"><strong>{{ attSummary.absent }}</strong><span>Absent</span></div>
                  <div class="att-stat att-leave"><strong>{{ attSummary.on_leave }}</strong><span>On Leave</span></div>                </div>
              }
              <a routerLink="/attendance" class="panel-footer-link">View full history →</a>
            </div>

            <!-- Leave summary -->
            <div class="panel">
              <div class="panel-hdr">
                <h3>🏖 My Leave Requests</h3>
                <a routerLink="/leave-requests" class="link-sm">All →</a>
              </div>
              @if (myLeave.length === 0) {
                <p class="empty">No leave requests yet.</p>
              } @else {
                @for (r of myLeave.slice(0,4); track r.id) {
                  <div class="leave-row">
                    <div>
                      <p class="leave-range">{{ r.start_date | date:'MMM d' }} – {{ r.end_date | date:'MMM d, y' }}</p>
                      <p class="leave-reason">{{ r.reason }}</p>
                    </div>
                    <span class="badge" [class.badge-warning]="r.status==='pending'" [class.badge-success]="r.status==='approved'" [class.badge-danger]="r.status==='rejected'">{{ r.status }}</span>
                  </div>
                }
              }
            </div>

            <!-- Announcements -->
            <div class="panel">
              <div class="panel-hdr">
                <h3>🔔 Announcements</h3>
                <a routerLink="/notifications" class="link-sm">All →</a>
              </div>
              @for (n of notifications.slice(0,4); track n.id) {
                <div class="notif-row">
                  <span class="notif-dot" [class]="'nd-'+n.type"></span>
                  <div>
                    <p class="notif-title">{{ n.title }}</p>
                    <p class="notif-date">{{ n.created_at | date:'MMM d, y' }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Quick links -->
            <div class="panel quick-links">
              <h3>⚡ Quick Access</h3>
              <div class="ql-grid">
                @for (q of quickLinks; track q.path) {
                  <a [routerLink]="q.path" class="ql-card">
                    <span class="ql-icon">{{ q.icon }}</span>
                    <span>{{ q.label }}</span>
                  </a>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .page { display: grid; gap: 1.25rem; }
    .error-banner { padding: 1rem; border-radius: var(--radius); background: var(--danger-bg); color: var(--danger); }
    .skeleton-full { height: 400px; border-radius: var(--radius-lg); background: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:1.5rem; box-shadow:var(--shadow); }
    .panel-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
    .panel-hdr h3 { margin:0; font-size:.95rem; font-weight:700; }
    .link-sm { font-size:.82rem; font-weight:600; color:var(--primary); }
    .link-sm:hover { text-decoration:underline; }
    .empty { color:var(--muted); font-size:.875rem; padding:.5rem 0; margin:0; }

    /* ── Admin KPI row ──────────────────────────────────────────────────── */
    .kpi-row { display:grid; gap:1rem; grid-template-columns:repeat(4,1fr); }
    .kpi {
      background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg);
      padding:1.25rem; box-shadow:var(--shadow);
      border-left:4px solid var(--c,var(--primary));
      display:flex; align-items:center; justify-content:space-between; gap:.75rem;
    }
    .kpi-left { display:flex; align-items:center; gap:.85rem; }
    .kpi-icon {
      font-size:1.4rem; width:44px; height:44px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      background:color-mix(in srgb,var(--c,var(--primary)) 10%,transparent);
      flex-shrink:0;
    }
    .kpi-val { margin:0; font-size:1.75rem; font-weight:800; letter-spacing:-.04em; }
    .kpi-lbl { margin:0; font-size:.75rem; color:var(--muted); font-weight:500; }
    .kpi-action { font-size:.78rem; font-weight:600; color:var(--primary); white-space:nowrap; }

    /* ── Admin grid ─────────────────────────────────────────────────────── */
    .dash-grid { display:grid; gap:1.25rem; grid-template-columns:repeat(2,1fr); }
    .panel-wide { grid-column:1/-1; }

    .list-row { display:flex; align-items:center; gap:.75rem; padding:.7rem; border-radius:var(--radius); border:1px solid var(--border); background:var(--surface-muted); margin-bottom:.5rem; }
    .list-row:last-child { margin-bottom:0; }
    .avatar-sm { width:32px; height:32px; border-radius:9px; background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; font-weight:700; font-size:.8rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .list-name { margin:0; font-size:.875rem; font-weight:600; }
    .list-sub { margin:.1rem 0 0; font-size:.75rem; color:var(--muted); }
    .list-info { flex:1; }

    .bar-row { display:flex; align-items:center; gap:.75rem; margin-bottom:.6rem; }
    .bar-row:last-child { margin-bottom:0; }
    .bar-lbl { font-size:.82rem; font-weight:500; color:var(--text-soft); width:120px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .bar-track { flex:1; height:8px; background:var(--surface-muted); border-radius:99px; overflow:hidden; }
    .bar-fill { height:100%; background:linear-gradient(90deg,#6366f1,#818cf8); border-radius:99px; transition:width .5s; min-width:4px; }
    .bar-num { font-size:.82rem; font-weight:700; color:var(--muted); width:20px; text-align:right; }

    .emp-table-wrap { overflow-x:auto; }
    .emp-table { width:100%; border-collapse:collapse; }
    .emp-table th { padding:.65rem 1rem; text-align:left; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); background:var(--surface-muted); border-bottom:1px solid var(--border); }
    .emp-table td { padding:.8rem 1rem; border-bottom:1px solid var(--border); font-size:.875rem; vertical-align:middle; }
    .emp-table tr:last-child td { border-bottom:none; }
    .emp-table tr:hover td { background:var(--surface-hover); }
    .tc { display:flex; align-items:center; gap:.6rem; font-weight:600; }
    .av { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#6366f1,#818cf8); color:#fff; font-weight:700; font-size:.75rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .muted { color:var(--muted); font-size:.85rem; }

    .notif-row { display:flex; align-items:flex-start; gap:.75rem; padding:.65rem 0; border-bottom:1px solid var(--border); }
    .notif-row:last-child { border-bottom:none; }
    .notif-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
    .nd-announcement { background:#6366f1; }
    .nd-holiday { background:#16a34a; }
    .nd-policy_update { background:#d97706; }
    .nd-leave_update { background:#0284c7; }
    .nd-system { background:#64748b; }
    .notif-title { margin:0; font-size:.875rem; font-weight:600; }
    .notif-date { margin:.1rem 0 0; font-size:.75rem; color:var(--muted); }

    /* ── Employee hero ──────────────────────────────────────────────────── */
    .emp-hero {
      background:linear-gradient(135deg,#1a1740 0%,#312e81 60%,#4c1d95 100%);
      border-radius:var(--radius-xl); padding:2rem;
      display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;
      box-shadow:var(--shadow-lg);
    }
    .emp-hero-avatar {
      width:72px; height:72px; border-radius:20px; flex-shrink:0;
      background:linear-gradient(135deg,#a78bfa,#818cf8); color:#fff;
      font-size:1.75rem; font-weight:800; display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,.25);
    }
    .emp-hero-info { flex:1; }
    .emp-hero-info h2 { margin:0; font-size:1.4rem; font-weight:800; color:#fff; letter-spacing:-.03em; }
    .emp-hero-info p { margin:.3rem 0 .6rem; color:rgba(255,255,255,.6); font-size:.9rem; }
    .emp-tags { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
    .tag-chip { padding:.25rem .65rem; border-radius:99px; background:rgba(255,255,255,.1); color:rgba(255,255,255,.75); font-size:.75rem; font-weight:500; }
    .emp-hero-actions { display:flex; flex-direction:column; gap:.5rem; }
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.35rem; padding:.7rem 1.25rem; border-radius:var(--radius); font-weight:600; font-size:.875rem; cursor:pointer; transition:all .15s; border:none; text-decoration:none; }
    .btn-primary { background:#fff; color:#312e81; }
    .btn-primary:hover { background:#f5f3ff; transform:translateY(-1px); }
    .btn-ghost { background:rgba(255,255,255,.1); color:rgba(255,255,255,.85); border:1px solid rgba(255,255,255,.2); }
    .btn-ghost:hover { background:rgba(255,255,255,.18); }

    /* ── Employee grid ──────────────────────────────────────────────────── */
    .emp-grid { display:grid; gap:1.25rem; grid-template-columns:repeat(2,1fr); }
    .panel h3 { margin:0 0 1rem; font-size:.95rem; font-weight:700; }

    .att-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.75rem; }
    .att-stat { padding:.85rem; border-radius:var(--radius); text-align:center; display:flex; flex-direction:column; gap:.2rem; }
    .att-stat strong { font-size:1.6rem; font-weight:800; }
    .att-stat span { font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
    .att-present { background:#f0fdf4; } .att-present strong,.att-present span { color:#16a34a; }
    .att-late { background:#fffbeb; } .att-late strong,.att-late span { color:#d97706; }
    .att-absent { background:#fef2f2; } .att-absent strong,.att-absent span { color:#dc2626; }
    .att-leave { background:#f0f9ff; } .att-leave strong,.att-leave span { color:#0284c7; }
    .panel-footer-link { display:block; margin-top:.75rem; font-size:.82rem; font-weight:600; color:var(--primary); text-align:center; }

    .leave-row { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.7rem; border-radius:var(--radius); border:1px solid var(--border); background:var(--surface-muted); margin-bottom:.5rem; }
    .leave-row:last-child { margin-bottom:0; }
    .leave-range { margin:0; font-size:.875rem; font-weight:600; }
    .leave-reason { margin:.1rem 0 0; font-size:.75rem; color:var(--muted); }

    .ql-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:.6rem; margin-top:.25rem; }
    .ql-card { display:flex; align-items:center; gap:.6rem; padding:.75rem; border-radius:var(--radius); border:1px solid var(--border); background:var(--surface-muted); font-size:.875rem; font-weight:600; transition:all .15s; }
    .ql-card:hover { border-color:var(--primary); background:var(--primary-light); color:var(--primary-text); }
    .ql-icon { font-size:1.1rem; }

    @media (max-width:1100px) { .kpi-row { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:900px) { .dash-grid,.emp-grid,.kpi-row { grid-template-columns:1fr; } .panel-wide { grid-column:auto; } .emp-hero { flex-direction:column; align-items:flex-start; } .emp-hero-actions { flex-direction:row; } }
  `],
})
export class DashboardPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private stats = inject(AdminStatsService);
  private empSvc = inject(EmployeeService);
  private leaveSvc = inject(LeaveRequestService);
  private attSvc = inject(AttendanceService);
  private notifSvc = inject(NotificationService);

  loading = true; error = '';
  adminStats: AdminStats | null = null;
  kpis: {label:string;value:number;icon:string;color:string;link:string}[] = [];
  pendingLeave: LeaveRequest[] = [];
  recentEmps: Employee[] = [];
  deptBars: {name:string;count:number;pct:number}[] = [];
  notifications: Notification[] = [];

  myProfile: Employee | null = null;
  myLeave: LeaveRequest[] = [];
  attSummary: AttendanceSummary | null = null;

  readonly quickLinks = [
    { path:'/attendance',     icon:'⏰', label:'Attendance' },
    { path:'/leave-requests', icon:'🏖', label:'Leave' },
    { path:'/payroll',        icon:'💰', label:'Payslips' },
    { path:'/documents',      icon:'📁', label:'Documents' },
  ];

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  ngOnInit(): void {
    if (this.auth.isAdmin()) this.loadAdmin();
    else this.loadEmployee();
  }

  private loadAdmin(): void {
    combineLatest([
      this.stats.get(),
      this.empSvc.listEmployees(),
      this.leaveSvc.listRequests(),
      this.notifSvc.list(),
    ]).subscribe({
      next: ([s, emps, leaves, notifs]) => {
        this.adminStats = s;
        this.kpis = [
          { label:'Total Employees',   value:s.totalEmployees,    icon:'👥', color:'#6366f1', link:'/employees' },
          { label:'Active',            value:s.activeEmployees,   icon:'✅', color:'#16a34a', link:'/employees' },
          { label:'Departments',       value:s.totalDepartments,  icon:'🏢', color:'#0284c7', link:'/departments' },
          { label:'Pending Approvals', value:s.pendingLeave,      icon:'⏳', color:'#ef4444', link:'/leave-requests' },
          { label:'Present Today',     value:s.todayAttendance,   icon:'⏰', color:'#0369a1', link:'/attendance' },
          { label:'Open Jobs',         value:s.pendingJobs,       icon:'🎯', color:'#8b5cf6', link:'/recruitment' },
        ];
        this.pendingLeave = leaves.filter(l => l.status === 'pending');
        this.recentEmps = emps.slice(0, 8);
        this.notifications = notifs.slice(0, 4);

        // Dept bars from employees
        const counts: Record<string,number> = {};
        emps.forEach(e => { const n = e.department?.name ?? '?'; counts[n] = (counts[n] ?? 0) + 1; });
        const max = Math.max(...Object.values(counts), 1);
        this.deptBars = Object.entries(counts).map(([name,count]) => ({ name, count, pct: (count/max)*100 }));
        this.loading = false;
      },
      error: () => { this.error = 'Could not load dashboard. Is the backend running?'; this.loading = false; },
    });
  }

  private loadEmployee(): void {
    combineLatest([
      this.empSvc.listEmployees(),
      this.leaveSvc.listRequests(),
      this.attSvc.summary(),
      this.notifSvc.list(),
    ]).subscribe({
      next: ([emps, leaves, att, notifs]) => {
        const email = this.auth.currentUser()?.email;
        this.myProfile = emps.find(e => e.email === email) ?? null;
        this.myLeave = leaves;
        this.attSummary = att;
        this.notifications = notifs;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
