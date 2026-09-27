import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AssetPipe, InitialsPipe } from '../../core/pipes/pipes';

export interface AdminResourceLink { url: string; label: string; icon: string; }

export const ADMIN_MANAGE_LINKS: AdminResourceLink[] = [
  { url: '/admin/manage/contents', label: 'Content catalog', icon: 'film' },
  { url: '/admin/manage/media', label: 'Media gallery', icon: 'play' },
  { url: '/admin/manage/characters', label: 'Characters', icon: 'users' },
  { url: '/admin/manage/articles', label: 'Articles', icon: 'file-text' },
  { url: '/admin/manage/merchandise', label: 'Merchandise', icon: 'tag' },
  { url: '/admin/manage/upcoming', label: 'Upcoming releases', icon: 'calendar' },
  { url: '/admin/manage/events', label: 'Events', icon: 'map-pin' },
  { url: '/admin/manage/categories', label: 'Categories', icon: 'layers' },
  { url: '/admin/manage/genres', label: 'Genres', icon: 'grid' },
  { url: '/admin/manage/tags', label: 'Tags', icon: 'tag' }
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AssetPipe, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-fh dash-shell admin-shell">
        <aside class="dash-side royal-side" aria-label="Admin navigation">
          <div class="who royal-who">
            <span class="avatar mini-royal-avatar">
              @if (auth.user()?.avatarUrl) {
                <img [src]="auth.user()?.avatarUrl | asset" alt="" />
              } @else {
                {{ auth.user()?.fullName | initials }}
              }
            </span>
            <div class="who-meta">
              <strong>{{ auth.user()?.fullName }}</strong>
              <span class="royal-tag"><app-icon name="crown" /> SUPERADMIN</span>
            </div>
          </div>

          <span class="side-label">TELEMETRY & CONTROL</span>
          @for (l of monitor; track l.url) {
            <a [routerLink]="l.url" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: l.url === '/admin' }" [attr.title]="l.label" class="side-link">
              <span class="side-icon"><app-icon [name]="l.icon" /></span>
              <span>{{ l.label }}</span>
            </a>
          }

          <span class="side-label">MULTIVERSE CATALOG</span>
          @for (l of manage; track l.url) {
            <a [routerLink]="l.url" routerLinkActive="active" [attr.title]="l.label" class="side-link">
              <span class="side-icon"><app-icon [name]="l.icon" /></span>
              <span>{{ l.label }}</span>
            </a>
          }

          <span class="side-label">PUBLIC REALM</span>
          <a routerLink="/" title="View website" class="side-link">
            <span class="side-icon"><app-icon name="globe" /></span>
            <span>View live website</span>
          </a>
          <a routerLink="/ui-kit" title="UI kit" class="side-link">
            <span class="side-icon"><app-icon name="palette" /></span>
            <span>Design system kit</span>
          </a>
        </aside>
        <div class="dash-main"><router-outlet /></div>
    </div>`,
  styles: [`
    .royal-side {
      background: linear-gradient(180deg, #09090c 0%, #050507 100%) !important;
      border: 1px solid rgba(245, 200, 106, 0.22) !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
      border-radius: 20px !important;
    }

    .royal-who {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 10px 14px;
      border-bottom: 1px solid rgba(245, 200, 106, 0.18);
      margin-bottom: 8px;
      position: relative;

      .mini-royal-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #18181b 0%, #08080a 100%);
        border: 1.5px solid #F5C86A;
        box-shadow: 0 0 12px rgba(245, 200, 106, 0.35);
        display: grid;
        place-items: center;
        overflow: hidden;
        color: #FFE699;
        font-weight: 800;
        font-size: 0.9rem;
        flex: none;

        img { width: 100%; height: 100%; object-fit: cover; }
      }

      .who-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;

        strong {
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .royal-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #F5C86A;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 1px;

          app-icon { font-size: 10px; }
        }
      }
    }

    .side-label {
      font-family: var(--font-ui);
      font-size: 0.78rem !important;
      font-weight: 900 !important;
      letter-spacing: 0.16em !important;
      text-transform: uppercase;
      color: #F5C86A !important;
      padding: 16px 10px 6px !important;
      margin-top: 6px;
      display: flex !important;
      align-items: center;
      gap: 8px;
      text-shadow: 0 0 12px rgba(245, 200, 106, 0.4);

      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(245, 200, 106, 0.45), transparent);
      }
    }

    .side-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 11px;
      border-radius: 12px;
      border: 1px solid transparent;
      color: rgba(255, 255, 255, 0.75);
      font-family: var(--font-ui);
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.22s ease;
      margin-bottom: 2px;

      .side-icon {
        width: 26px;
        height: 26px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        transition: all 0.2s ease;
        flex: none;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
        transform: translateX(2px);

        .side-icon {
          color: #F5C86A;
          border-color: rgba(245, 200, 106, 0.3);
          background: rgba(245, 200, 106, 0.12);
        }
      }

      &.active {
        background: linear-gradient(90deg, rgba(245, 200, 106, 0.16) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
        border-color: rgba(245, 200, 106, 0.3) !important;
        color: #ffffff !important;
        box-shadow: inset 2.5px 0 0 #F5C86A, 0 4px 14px rgba(0, 0, 0, 0.4) !important;

        .side-icon {
          color: #F5C86A;
          background: rgba(245, 200, 106, 0.2);
          border-color: rgba(245, 200, 106, 0.45);
          box-shadow: 0 0 10px rgba(245, 200, 106, 0.35);
        }
      }
    }

    .collapse-btn { display: none; }

    @media (min-width: 992px) {
      .collapse-btn {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 9px;
        border: 1px solid rgba(245, 200, 106, 0.25);
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        flex: none;
        transition: all 0.2s ease;

        &:hover {
          background: #F5C86A;
          color: #0b0a06;
          border-color: #F5C86A;
        }
      }

      .collapsed { grid-template-columns: 78px 1fr; }
      .collapsed .dash-side a span, .collapsed .side-label, .collapsed .who div { display: none; }
      .collapsed .who { flex-direction: column; }
      .collapsed .dash-side a { justify-content: center; }
    }

    @media (max-width: 991px) { .who { display: none; } }

    :host-context([data-theme='light']) {
      .royal-side {
        background: rgba(255, 255, 255, 0.96) !important;
        border: 1px solid rgba(158, 116, 18, 0.28) !important;
        box-shadow: 0 16px 40px rgba(25, 20, 10, 0.08), inset 0 1px 0 #ffffff !important;
      }

      .royal-who {
        border-bottom-color: rgba(158, 116, 18, 0.18);

        .mini-royal-avatar {
          background: #FAF8F2;
          border-color: #9E7412;
          box-shadow: 0 0 12px rgba(158, 116, 18, 0.25);
          color: #7A5B0B;
        }

        .who-meta {
          strong {
            color: #0E0F16;
          }
          .royal-tag {
            color: #9E7412;
          }
        }
      }

      .side-label {
        color: #7A5B0B !important;
        text-shadow: none !important;

        &::after {
          background: linear-gradient(90deg, rgba(158, 116, 18, 0.35), transparent);
        }
      }

      .side-link {
        color: #282A37;

        .side-icon {
          background: #FAF8F2;
          border-color: rgba(158, 116, 18, 0.2);
          color: #565A6E;
        }

        &:hover {
          background: rgba(158, 116, 18, 0.08);
          color: #0E0F16;

          .side-icon {
            color: #9E7412;
            border-color: #9E7412;
            background: rgba(158, 116, 18, 0.15);
          }
        }

        &.active {
          background: rgba(158, 116, 18, 0.12) !important;
          border-color: rgba(158, 116, 18, 0.35) !important;
          color: #7A5B0B !important;
          box-shadow: inset 3px 0 0 #9E7412, 0 4px 14px rgba(25, 20, 10, 0.06) !important;

          .side-icon {
            color: #7A5B0B;
            background: rgba(158, 116, 18, 0.2);
            border-color: #9E7412;
            box-shadow: 0 0 10px rgba(158, 116, 18, 0.25);
          }
        }
      }

      .collapse-btn {
        background: #FAF8F2;
        border-color: rgba(158, 116, 18, 0.25);
        color: #0E0F16;
        &:hover {
          background: #9E7412;
          color: #ffffff;
        }
      }
    }
  `]
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = signal(false);
  readonly monitor: AdminResourceLink[] = [
    { url: '/admin', label: 'Overview', icon: 'dashboard' },
    { url: '/admin/analytics', label: 'Analytics', icon: 'chart' },
    { url: '/admin/users', label: 'Users', icon: 'users' },
    { url: '/admin/submissions', label: 'Fan submissions', icon: 'inbox' },
    { url: '/admin/feedback', label: 'Feedback', icon: 'message' },
    { url: '/admin/chatbot', label: 'Chatbot', icon: 'bot' }
  ];
  readonly manage = ADMIN_MANAGE_LINKS;
}
