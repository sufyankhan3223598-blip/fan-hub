import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent } from '../../shared/components/basics';
import { ContentBrowserComponent } from '../../shared/components/content-browser.component';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';
import { AssetPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, ContentBrowserComponent, RealmStageComponent, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="explore-hero">
      <app-realm-stage mode="galaxy" [offsetX]="5.15" [scale]="1.22" [offsetY]="-0.02" />
      <div class="container-fh">
        <div class="explore-hero-content">
          <app-breadcrumbs [items]="[{ label: 'Explorer' }]" />
          <span class="eyebrow mt-3">Fandom Content Explorer</span>
          <h1 class="display-lg mt-2">Search every realm</h1>
          <p class="lead">Filter by category, genre, release year, popularity and content type, then sort by latest, most popular or A-Z.
            @if (!auth.isLoggedIn()) { Visitors can use basic search; members unlock every filter. }</p>
          <div class="realm-row">
            @for (c of cats.categories(); track c.id) {
              <a [routerLink]="['/realm', c.slug]" class="realm-pill" [style.--accent]="c.accentColor">
                <img [src]="c.hoverImageUrl | asset" alt="" loading="lazy" />
                <span><app-icon [name]="icons[c.slug] || 'sparkles'" /> {{ c.name }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </section>
    <section class="container-fh pb-5">
      <app-content-browser />
    </section>`,
  styles: [`
    .explore-hero { position: relative; padding: calc(var(--nav-h) + 24px) 0 48px; overflow: hidden; min-height: 520px;
      background: radial-gradient(circle at 84% 48%, rgba(139,92,246,.38) 0%, rgba(56,189,248,.15) 32%, transparent 70%), var(--bg-0); }
    .explore-hero .container-fh { position: relative; z-index: 1; }
    .explore-hero-content { position: relative; z-index: 2; max-width: 650px; }
    .realm-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; max-width: 660px; }
    .realm-pill { position: relative; overflow: hidden; display: flex; align-items: center; height: 52px; padding: 0 16px; border-radius: 14px; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); color: #fff; min-width: 145px;
      img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; transition: transform .6s var(--ease-out), opacity .3s; }
      span { position: relative; display: flex; gap: 8px; align-items: center; font-family: var(--font-ui); font-weight: 700; letter-spacing: .06em; text-shadow: 0 2px 8px #000; font-size: 0.95rem; }
      &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7,7,12,.85), transparent); }
      span { z-index: 1; } &:hover { color: #fff; border-color: var(--accent); img { transform: scale(1.1); opacity: .8; } } }

    :host-context([data-theme='light']) {
      .realm-pill {
        border-color: color-mix(in srgb, var(--accent) 55%, rgba(0,0,0,0.15));
        &::after { background: linear-gradient(90deg, rgba(247,245,240,0.92) 0%, rgba(247,245,240,0.4) 65%, transparent); }
        span { color: #0E0F16; text-shadow: 0 1px 2px rgba(255,255,255,0.9); }
        &:hover { span { color: #000; } }
      }
    }
  `]
})
export class ExploreComponent {
  readonly cats = inject(CategoryStore);
  readonly auth = inject(AuthService);
  readonly icons = REALM_ICONS;
}
