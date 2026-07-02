import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <!-- Left panel -->
      <div class="hero">
        <div class="hero-inner">
          <div class="logo-mark">
            <span>HR</span>
          </div>
          <h1>HR Portal</h1>
          <p class="hero-sub">
            Manage your workforce, departments, and leave requests — all in one place.
          </p>
          <div class="features">
            @for (f of features; track f.icon) {
              <div class="feature-row">
                <span class="feature-icon">{{ f.icon }}</span>
                <span>{{ f.label }}</span>
              </div>
            }
          </div>
          <div class="hero-decoration">
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="form-panel">
        <div class="form-panel-inner">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 480px;
    }

    /* ── Hero ───────────────────────────────────────────────────────────── */
    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(145deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
      max-width: 440px;
    }

    .logo-mark {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255,255,255,.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .logo-mark span {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .hero h1 {
      margin: 0 0 1rem;
      font-size: clamp(2.5rem, 4vw, 3.5rem);
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.05em;
      line-height: 1;
    }

    .hero-sub {
      margin: 0 0 2.5rem;
      color: rgba(255,255,255,.7);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .features {
      display: grid;
      gap: 1rem;
    }

    .feature-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      color: rgba(255,255,255,.85);
      font-size: 0.95rem;
      font-weight: 500;
    }

    .feature-icon {
      font-size: 1.2rem;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* decorative blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.25;
      pointer-events: none;
    }
    .blob-1 {
      width: 400px; height: 400px;
      background: #818cf8;
      top: -100px; right: -100px;
    }
    .blob-2 {
      width: 300px; height: 300px;
      background: #c084fc;
      bottom: -80px; left: -80px;
    }

    /* ── Form panel ──────────────────────────────────────────────────────── */
    .form-panel {
      background: #fafbff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border-left: 1px solid #e8eaf6;
    }

    .form-panel-inner {
      width: 100%;
      max-width: 380px;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
      .hero {
        padding: 2.5rem 1.5rem;
        min-height: auto;
      }
      .form-panel {
        border-left: none;
        border-top: 1px solid #e8eaf6;
        padding: 2rem 1.5rem;
      }
    }
  `],
})
export class AuthLayoutComponent {
  readonly features = [
    { icon: '👥', label: 'Employee directory with search & filters' },
    { icon: '🏢', label: 'Department management with headcount' },
    { icon: '📋', label: 'Leave request workflows' },
    { icon: '🔒', label: 'Role-based access control' },
  ];
}
