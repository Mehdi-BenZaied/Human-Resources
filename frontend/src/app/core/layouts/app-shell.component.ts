import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';

interface NavItem { path: string; label: string; icon: string; adminOnly?: boolean; employeeOnly?: boolean }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="sidebar-brand">
            <div class="brand-mark">HR</div>
            <div>
              <p class="brand-name">HR Portal</p>
              <p class="brand-sub">{{ auth.isAdmin() ? 'Admin Console' : 'Employee Portal' }}</p>
            </div>
          </div>

          <nav class="nav">
            <p class="nav-section">{{ auth.isAdmin() ? 'Management' : 'My Workspace' }}</p>
            @for (item of visibleNavArray; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>

        <div class="sidebar-bottom">
          @if (auth.currentUser()) {
            <div class="user-card">
              <div class="user-avatar">{{ auth.currentUser()!.name.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <p class="user-name">{{ auth.currentUser()!.name }}</p>
                <p class="user-role">{{ auth.currentUser()!.role }}</p>
              </div>
            </div>
          }
          <button class="logout-btn" (click)="logout()">↩ Logout</button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <h1 class="page-title">{{ activeLabel }}</h1>
          <div class="topbar-right">
            @if (auth.isAdmin()) {
              <span class="role-badge admin">Admin</span>
            } @else {
              <span class="role-badge employee">Employee</span>
            }
            <span class="status-pill connected">
              <span class="dot"></span> Live
            </span>
          </div>
        </header>
        <main class="content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .shell { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }

    /* Sidebar */
    .sidebar {
      display: flex; flex-direction: column; justify-content: space-between;
      background: #0f0c29;
      background: linear-gradient(180deg, #1a1740 0%, #0f0c29 100%);
      padding: 1.25rem; overflow-y: auto; position: sticky; top: 0; height: 100vh;
    }
    .sidebar-top { display: flex; flex-direction: column; gap: 2rem; }

    .sidebar-brand { display: flex; align-items: center; gap: 0.75rem; padding: 0.25rem 0; }
    .brand-mark {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 800; color: #fff;
      box-shadow: 0 4px 12px rgba(99,102,241,.4);
    }
    .brand-name { margin: 0; font-size: 1rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .brand-sub { margin: 0.1rem 0 0; font-size: 0.7rem; color: rgba(255,255,255,.4); }

    .nav { display: flex; flex-direction: column; gap: 0.2rem; }
    .nav-section {
      margin: 0 0 0.5rem 0.5rem; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,.25);
    }
    .nav-link {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem;
      border-radius: 10px; color: rgba(255,255,255,.55); font-size: 0.875rem;
      font-weight: 500; transition: all .15s; border: 1px solid transparent;
    }
    .nav-link:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.9); }
    .nav-link.active {
      background: rgba(99,102,241,.2); color: #a5b4fc;
      border-color: rgba(99,102,241,.3); font-weight: 600;
    }
    .nav-icon { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }

    /* Sidebar bottom */
    .sidebar-bottom {
      display: flex; flex-direction: column; gap: 0.75rem;
      padding-top: 1rem; border-top: 1px solid rgba(255,255,255,.07);
    }
    .user-card { display: flex; align-items: center; gap: 0.7rem; padding: 0.4rem 0.5rem; }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; color: #fff;
    }
    .user-name { margin: 0; font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { margin: 0.1rem 0 0; font-size: 0.7rem; color: rgba(255,255,255,.4); text-transform: capitalize; }
    .logout-btn {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.9rem;
      border-radius: 10px; border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.04); color: rgba(255,255,255,.45);
      font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all .15s;
    }
    .logout-btn:hover { background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.25); color: #fca5a5; }

    /* Topbar */
    .main { min-width: 0; display: flex; flex-direction: column; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.75rem; background: rgba(255,255,255,.8); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
    }
    .page-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
    .topbar-right { display: flex; align-items: center; gap: 0.6rem; }

    .role-badge {
      padding: 0.3rem 0.7rem; border-radius: 99px;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .role-badge.admin { background: #ede9fe; color: #5b21b6; }
    .role-badge.employee { background: #e0f2fe; color: #075985; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.7rem; border-radius: 99px;
      font-size: 0.72rem; font-weight: 600;
      background: #f0fdf4; color: #16a34a; border: 1px solid rgba(22,163,74,.2);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .content { flex: 1; padding: 1.75rem; min-width: 0; }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; flex-direction: row; padding: 1rem; overflow-x: auto; }
      .sidebar-top { flex-direction: row; gap: 1rem; align-items: center; }
      .sidebar-bottom { flex-direction: row; padding-top: 0; border-top: none; border-left: 1px solid rgba(255,255,255,.08); padding-left: 1rem; }
      .nav { flex-direction: row; } .nav-section { display: none; }
      .brand-sub, .user-info { display: none; }
    }
  `],
})
export class AppShellComponent {
  private readonly allNav: NavItem[] = [
    { path: '/dashboard',      label: 'Dashboard',       icon: '📊' },
    { path: '/employees',      label: 'Employees',       icon: '👥', adminOnly: true },
    { path: '/departments',    label: 'Departments',     icon: '🏢', adminOnly: true },
    { path: '/attendance',     label: 'Attendance',      icon: '⏰' },
    { path: '/leave-requests', label: 'Leave',           icon: '🏖' },
    { path: '/payroll',        label: 'Payroll',         icon: '💰' },
    { path: '/recruitment',    label: 'Recruitment',     icon: '🎯', adminOnly: true },
    { path: '/notifications',  label: 'Announcements',   icon: '🔔' },
    { path: '/documents',      label: 'Documents',       icon: '📁' },
  ];

  readonly visibleNav = computed(() =>
    this.allNav.filter(item => {
      if (item.adminOnly && !this.auth.isAdmin()) return false;
      if (item.employeeOnly && this.auth.isAdmin()) return false;
      return true;
    })
  );

  get visibleNavArray() {
    return this.visibleNav();
  }

  get activeLabel(): string {
    const seg = this.router.url.split('/')[1] ?? '';
    return this.allNav.find(n => n.path === `/${seg}`)?.label ?? 'Dashboard';
  }

  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  logout(): void { this.auth.logout(); void this.router.navigate(['/login']); }
}
