import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/components/icon.component';
import { LogoComponent } from '../shared/components/basics';
import { CategoryStore, REALM_ICONS } from '../core/services/stores';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/ui.services';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer-glow" aria-hidden="true"></div>
      <div class="container-fh">
        <div class="footer-top">
          <div class="f-brand">
            <a routerLink="/" class="brand"><app-logo [size]="48" /><span>FAN HUB <b>PLUS</b></span></a>
            <p>One universe. Every fandom. Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga and Cosplay in one immersive hub.</p>
            <div class="f-actions">
              <a routerLink="/" fragment="sitemap" class="btn-fh btn-ghost btn-sm"><app-icon name="sitemap" /> Sitemap</a>
            </div>
          </div>
          <div class="f-col">
            <h4>Realms</h4>
            @for (c of cats.categories(); track c.id) {
              <a [routerLink]="['/realm', c.slug]">{{ c.name }}</a>
            }
          </div>
          <div class="f-col">
            <h4>Discover</h4>
            <a routerLink="/explore">Content Explorer</a>
            <a routerLink="/media">Multimedia Center</a>
            <a routerLink="/characters">Character Profiles</a>
            <a routerLink="/articles">Featured Articles</a>
            <a routerLink="/events/highlights">Event Highlights</a>
            <a routerLink="/events">Events Map & Calendar</a>
            <a routerLink="/merchandise">Merchandise Showcase</a>
            <a routerLink="/merchandise/upcoming">Upcoming Releases</a>
            <a routerLink="/community">Fan Creations</a>
          </div>
          <div class="f-col">
            <h4>{{ auth.isLoggedIn() ? 'Your hub' : 'Members' }}</h4>
            @if (auth.isLoggedIn()) {
              <a routerLink="/dashboard">Dashboard</a>
              <a routerLink="/profile">Profile & Settings</a>
              <a routerLink="/bookmarks">Bookmarks & Notes</a>
              <a routerLink="/submit">Submit Fan Content</a>
              <a routerLink="/submissions/mine">My Submissions</a>
              <a routerLink="/chat-history">Chat History</a>
              @if (auth.isAdmin()) { <a routerLink="/admin">Admin Control Panel</a> }
            } @else {
              <a routerLink="/login">Login</a>
              <a routerLink="/register">Create account</a>
              <a routerLink="/forgot-password">Forgot password</a>
            }
          </div>
          <div class="f-col">
            <h4>Help</h4>
            <a routerLink="/faq">FAQ</a>
            <a routerLink="/feedback">Feedback</a>
            <a routerLink="/about">About & Sitemap</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; {{ year }} Fan Hub Plus. Franchise names belong to their respective owners.</span>
          <span>Merchandise is shown for discovery only - no purchases or payments are processed.</span>
        </div>
      </div>
    </footer>`,
  styles: [`
    .footer { position: relative; overflow: hidden; border-top: 1px solid var(--border); background: #07070C; padding: 70px 0 30px; margin-top: 0; z-index: 10; }
    .footer-glow { position: absolute; left: 50%; top: -240px; width: 900px; height: 420px; transform: translateX(-50%);
      background: radial-gradient(closest-side, rgba(212,175,55,.16), rgba(124,58,237,.1), transparent); pointer-events: none; }
    .footer-top { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 32px; position: relative; }
    @media (max-width: 991px) { .footer-top { grid-template-columns: 1fr 1fr; } .f-brand { grid-column: 1 / -1; } }
    .brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text); font-family: var(--font-display); font-weight: 800; letter-spacing: .14em; b { color: var(--gold-2); } }
    .f-brand p { margin: 18px 0; max-width: 40ch; font-size: .95rem; }
    .f-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .f-col { display: flex; flex-direction: column; gap: 9px; }
    .f-col h4 { font-size: .8rem; letter-spacing: .22em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
    .f-col a { color: var(--text-2); font-size: .95rem; display: inline-flex; align-items: center; gap: 8px; transition: color .2s, transform .25s var(--ease-out); width: fit-content; }
    .f-col a app-icon { color: var(--accent, var(--gold)); font-size: 15px; }
    .f-col a:hover { color: var(--text); transform: translateX(4px); }
    .footer-bottom { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 50px; padding-top: 22px; border-top: 1px solid var(--border); color: var(--muted); font-size: .84rem; }

    :host-context([data-theme='light']) {
      .footer {
        background: #EDEAE1 !important;
        border-top: 1px solid rgba(158, 116, 18, 0.28) !important;
      }
      .footer-glow {
        background: radial-gradient(closest-side, rgba(158, 116, 18, 0.12), rgba(124, 58, 237, 0.04), transparent) !important;
      }
      .brand {
        color: #0E0F16 !important;
        span { color: #0E0F16 !important; }
        b { color: #9E7412 !important; }
      }
      .f-brand p {
        color: #282A37 !important;
      }
      .btn-ghost {
        background: #FFFFFF !important;
        border: 1px solid rgba(158, 116, 18, 0.3) !important;
        color: #0E0F16 !important;
        &:hover {
          background: #F5EEDB !important;
          color: #7A5B0B !important;
        }
      }
      .f-col h4 {
        color: #7A5B0B !important;
        font-weight: 700 !important;
      }
      .f-col a {
        color: #282A37 !important;
        &:hover {
          color: #9E7412 !important;
        }
      }
      .footer-bottom {
        border-top: 1px solid rgba(24, 22, 18, 0.12) !important;
        color: #565A6E !important;
      }
    }
  `]
})
export class FooterComponent {
  readonly cats = inject(CategoryStore);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly icons = REALM_ICONS;
  readonly year = new Date().getFullYear();
}
