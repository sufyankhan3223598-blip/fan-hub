import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AssetPipe, InitialsPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, AssetPipe, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-fh dash-shell">
      <aside class="dash-side royal-side" aria-label="Member navigation">
        <div class="royal-who">
          <span class="mini-royal-avatar">
            @if (auth.user()?.avatarUrl) {
              <img [src]="auth.user()!.avatarUrl | asset" alt="" />
            } @else {
              {{ auth.user()?.fullName | initials }}
            }
          </span>
          <div class="who-meta">
            <strong>{{ auth.user()?.fullName || 'Fan Member' }}</strong>
            <span class="royal-tag"><app-icon name="sparkles" /> Member Hub</span>
          </div>
        </div>

        <span class="side-label">My Hub</span>
        @for (l of links; track l.url) {
          <a class="side-link" [routerLink]="l.url" routerLinkActive="active" [attr.title]="l.label">
            <span class="side-icon"><app-icon [name]="l.icon" /></span>
            <span>{{ l.label }}</span>
          </a>
        }

        @if (auth.isAdmin()) {
          <span class="side-label">Admin</span>
          <a class="side-link" routerLink="/admin" title="Control panel">
            <span class="side-icon"><app-icon name="shield" /></span>
            <span>Control Panel</span>
          </a>
        }
      </aside>
      <div class="dash-main"><ng-content /></div>
    </div>`,
  styles: [`
    :host { display: block; }

    .royal-side {
      background: linear-gradient(180deg, #09090c 0%, #050507 100%) !important;
      border: 1px solid rgba(245, 200, 106, 0.22) !important;
      border-radius: 20px !important;
      padding: 14px 12px !important;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
      position: sticky;
      top: calc(var(--nav-h) + 16px);
      max-height: calc(100vh - var(--nav-h) - 30px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 200, 106, 0.4) transparent;

      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-thumb {
        background: rgba(245, 200, 106, 0.4);
        border-radius: 10px;
        &:hover { background: #F5C86A; }
      }
    }

    .royal-who {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px 14px;
      border-bottom: 1px solid rgba(245, 200, 106, 0.18);
      margin-bottom: 8px;

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
      padding: 9px 12px;
      border-radius: 12px;
      border: 1px solid transparent;
      color: rgba(255, 255, 255, 0.75);
      font-family: var(--font-ui);
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.22s ease;
      margin-bottom: 3px;

      .side-icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: grid;
        place-items: center;
        font-size: 15px;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.22s ease;
        flex: none;
      }

      &:hover {
        background: rgba(245, 200, 106, 0.08);
        border-color: rgba(245, 200, 106, 0.25);
        color: #ffffff;
        transform: translateX(3px);

        .side-icon {
          background: rgba(245, 200, 106, 0.15);
          border-color: rgba(245, 200, 106, 0.4);
          color: #F5C86A;
          box-shadow: 0 0 10px rgba(245, 200, 106, 0.3);
        }
      }

      &.active {
        background: linear-gradient(90deg, rgba(245, 200, 106, 0.18), rgba(245, 200, 106, 0.04));
        border: 1px solid rgba(245, 200, 106, 0.4);
        color: #F5C86A;
        box-shadow: 0 2px 12px rgba(245, 200, 106, 0.15);

        .side-icon {
          background: linear-gradient(135deg, #F5C86A, #B48528);
          border-color: #F5C86A;
          color: #000000;
          box-shadow: 0 0 12px rgba(245, 200, 106, 0.5);
          font-weight: 700;
        }
      }
    }

    @media (max-width: 991px) {
      .royal-side {
        position: static;
        display: flex;
        overflow-x: auto;
        gap: 6px;
        padding: 8px !important;
        max-height: none;
      }
      .side-link {
        flex: none;
        white-space: nowrap;
        margin-bottom: 0;
      }
    }

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
            background: rgba(158, 116, 18, 0.2);
            border-color: #9E7412;
            color: #7A5B0B;
            box-shadow: 0 0 10px rgba(158, 116, 18, 0.25);
          }
        }
      }
    }
  `]
})
export class UserShellComponent {
  readonly auth = inject(AuthService);
  readonly links = [
    { url: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { url: '/profile', label: 'Profile & settings', icon: 'user' },
    { url: '/bookmarks', label: 'Bookmarks & notes', icon: 'bookmark' },
    { url: '/submit', label: 'Submit content', icon: 'upload' },
    { url: '/submissions/mine', label: 'My submissions', icon: 'inbox' },
    { url: '/chat-history', label: 'Chat history', icon: 'bot' },
    { url: '/feedback', label: 'Feedback', icon: 'message' }
  ];
}
