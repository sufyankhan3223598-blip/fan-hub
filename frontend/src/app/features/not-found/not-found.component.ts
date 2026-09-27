import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon.component';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';
import { UiService } from '../../core/services/ui.services';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, IconComponent, RealmStageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf">
      <app-realm-stage mode="portal" [offsetX]="0" />
      <div class="nf-copy">
        <span class="code">404</span>
        <h1 class="display-lg">Lost in the multiverse</h1>
        <p class="lead">This portal leads nowhere. The page may have moved, or the link is incomplete.</p>
        <div class="d-flex gap-3 justify-content-center flex-wrap mt-4">
          <a routerLink="/" class="btn-fh btn-gold"><app-icon name="home" /> Return home</a>
          <button type="button" class="btn-fh" (click)="back()"><app-icon name="arrow-left" /> Go back</button>
          <button type="button" class="btn-fh btn-ghost" (click)="ui.searchOpen.set(true)"><app-icon name="search" /> Search</button>
        </div>
        <div class="links mt-4"><a routerLink="/explore">Explore</a><a routerLink="/events">Events</a><a routerLink="/about" fragment="sitemap">Sitemap</a><a routerLink="/faq">FAQ</a></div>
      </div>
    </section>`,
  styles: [`
    .nf { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; isolation: isolate; text-align: center; padding: calc(var(--nav-h) + 20px) 16px 40px;
      background: radial-gradient(circle at 50% 45%, rgba(124,58,237,.2), transparent 60%), var(--bg-0); app-realm-stage { z-index: -1; opacity: .45; } }
    .nf::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(ellipse 40% 45% at 50% 50%, rgba(5,5,12,.78), transparent 75%); pointer-events: none; }
    .nf-copy { max-width: 640px; }
    .code { font-family: var(--font-display); font-size: clamp(6rem, 22vw, 12rem); font-weight: 800; line-height: .9; display: block;
      background: linear-gradient(180deg, var(--gold-2), rgba(212,175,55,.1)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .lead { color: var(--text-2); text-shadow: 0 2px 16px var(--bg-0); }
    .links { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; a { color: var(--muted); font-family: var(--font-ui); font-weight: 600; letter-spacing: .08em; text-transform: uppercase; font-size: .85rem; &:hover { color: var(--gold-2); } } }
  `]
})
export class NotFoundComponent {
  readonly ui = inject(UiService);
  private location = inject(Location);
  back(): void { this.location.back(); }
}
