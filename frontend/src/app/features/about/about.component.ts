import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { SiteStats } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';
import { SitemapComponent } from '../../shared/components/sitemap.component';
import { CountUpDirective, RevealDirective } from '../../core/directives/directives';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, IconComponent, RealmStageComponent, SitemapComponent, CountUpDirective, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="about-hero">
      <app-realm-stage mode="portal" [offsetX]="2.4" />
      <div class="container-fh hero-copy">
        <span class="eyebrow">About the platform</span>
        <h1 class="display-xl mt-3">One nexus.<br /><span class="gradient-text">Every fandom.</span></h1>
        <p class="lead mt-3">Fan Hub Plus by Fandom Universe brings anime, gaming, movies, TV shows, K-pop, comics, manga and cosplay together in a single immersive destination - built by fans, for fans.</p>
        <div class="d-flex gap-3 flex-wrap mt-4">
          <a routerLink="/explore" class="btn-fh btn-gold btn-lg">Start exploring <app-icon name="arrow-right" /></a>
          @if (auth.isLoggedIn()) { <a routerLink="/dashboard" class="btn-fh btn-lg">My dashboard</a> } @else { <a routerLink="/register" class="btn-fh btn-lg">Join free</a> }
        </div>
      </div>
    </section>

    <section class="section container-fh">
      <div class="stats" appReveal>
        @for (s of statItems(); track s.label) {
          <div class="stat"><app-icon [name]="s.icon" /><b [appCountUp]="s.value"></b><span>{{ s.label }}</span></div>
        }
      </div>
    </section>

    <section class="section container-fh">
      <div class="row g-5 align-items-center">
        <div class="col-lg-5" appReveal>
          <span class="eyebrow">Our mission</span>
          <h2 class="display-md mt-2">A home for every kind of fan</h2>
          <p class="mt-3 text-muted-fh">Fandoms are scattered across dozens of apps, forums and feeds. Fan Hub Plus gathers the stories, characters, media, merchandise and events you care about into one place, then personalizes it around your favorite universes.</p>
          <p class="text-muted-fh">Visitors can explore everything freely. Members unlock full media playback, bookmarks with personal notes, ratings, a personal dashboard, fan submissions and a saved assistant history.</p>
        </div>
        <div class="col-lg-7">
          <div class="pillars">
            @for (p of pillars; track p.title; let i = $index) {
              <div class="pillar" appReveal [style.animation-delay.ms]="i * 60"><span><app-icon [name]="p.icon" /></span><h4>{{ p.title }}</h4><p>{{ p.text }}</p></div>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="section container-fh">
      <span class="eyebrow">The multiverse</span>
      <h2 class="display-md mt-2 mb-4">Eight realms</h2>
      <div class="realms">
        @for (c of cats.categories(); track c.id) {
          <a class="realm" [routerLink]="['/realm', c.slug]" [style.--accent]="c.accentColor" appReveal>
            <app-icon [name]="icons[c.slug] || 'sparkles'" /><strong>{{ c.name }}</strong><small>{{ c.tagline }}</small>
          </a>
        }
      </div>
    </section>

    <section class="section container-fh" id="sitemap">
      <span class="eyebrow">Navigate</span>
      <h2 class="display-md mt-2 mb-2">Sitemap</h2>
      <p class="text-muted-fh mb-4">Every page of Fan Hub Plus. Hover a branch to light up its constellation.</p>
      <app-sitemap />
    </section>

    <section class="section container-fh">
      <div class="cta panel" appReveal>
        <div><h3>Have a question or an idea?</h3><p class="text-muted-fh mb-0">Read the FAQ, ask the assistant, or send us feedback - every message is reviewed by the team.</p></div>
        <div class="d-flex gap-2 flex-wrap"><a routerLink="/faq" class="btn-fh"><app-icon name="help" /> FAQ</a><a routerLink="/feedback" class="btn-fh btn-gold"><app-icon name="message" /> Send feedback</a></div>
      </div>
    </section>`,
  styles: [`
    .about-hero { position: relative; min-height: min(86vh, 780px); display: flex; align-items: center; overflow: hidden; isolation: isolate; padding-top: var(--nav-h);
      background: radial-gradient(circle at 70% 50%, rgba(124,58,237,.18), transparent 55%), var(--bg-0);
      app-realm-stage { z-index: -1; } }
    .hero-copy { max-width: 720px; margin-left: max(16px, calc((100vw - 1320px) / 2)); .lead { max-width: 560px; text-shadow: 0 2px 20px var(--bg-0); } }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .stat { padding: 22px; border-radius: 20px; background: var(--bg-1); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;
      app-icon { color: var(--gold); font-size: 22px; } b { font-family: var(--font-display); font-size: 2.2rem; line-height: 1; margin-top: 8px; } span { color: var(--muted); font-size: .85rem; letter-spacing: .08em; text-transform: uppercase; font-family: var(--font-ui); font-weight: 600; } }
    .pillars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; @media (max-width: 576px) { grid-template-columns: 1fr; } }
    .pillar { padding: 22px; border-radius: 20px; background: var(--bg-1); border: 1px solid var(--border); transition: border-color .3s, transform .3s;
      span { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: rgba(212,175,55,.12); color: var(--gold-2); font-size: 20px; }
      h4 { margin: 14px 0 6px; font-size: 1.05rem; } p { margin: 0; color: var(--muted); font-size: .92rem; }
      &:hover { border-color: var(--gold); transform: translateY(-3px); } }
    .realms { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
    .realm { display: flex; flex-direction: column; gap: 4px; padding: 20px; border-radius: 18px; border: 1px solid var(--border); background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 14%, transparent), var(--bg-1) 60%); color: var(--text); transition: all .3s;
      app-icon { color: var(--accent); font-size: 26px; margin-bottom: 8px; } strong { font-family: var(--font-ui); font-size: 1.1rem; } small { color: var(--muted); }
      &:hover { border-color: var(--accent); transform: translateY(-3px); color: var(--text); } }
    .cta { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; padding: 30px; h3 { margin: 0 0 6px; } }
  `]
})
export class AboutComponent {
  readonly cats = inject(CategoryStore);
  readonly auth = inject(AuthService);
  readonly icons = REALM_ICONS;
  readonly stats = signal<SiteStats | null>(null);
  readonly pillars = [
    { icon: 'compass', title: 'Discover', text: 'Browse titles, characters, media and articles with filters, search and personalized recommendations.' },
    { icon: 'play', title: 'Watch & listen', text: 'Trailers, explainers, soundtracks and podcasts in a built-in gallery with ratings.' },
    { icon: 'map-pin', title: 'Meet up', text: 'Conventions, premieres and meetups worldwide on an interactive map with nearby search.' },
    { icon: 'feather', title: 'Create', text: 'Publish fan art, cosplay builds, theories and reviews to the moderated community gallery.' },
    { icon: 'bookmark', title: 'Collect', text: 'Bookmark anything with private notes and track your fandom journey on your dashboard.' },
    { icon: 'bot', title: 'Ask', text: 'An assistant that answers FAQs, recommends content and guides new members.' }
  ];
  readonly statItems = signal<{ icon: string; label: string; value: number }[]>([]);

  constructor() {
    inject(ApiService).stats().subscribe(s => {
      this.stats.set(s);
      this.statItems.set([
        { icon: 'layers', label: 'Realms', value: s.categories }, { icon: 'film', label: 'Titles', value: s.contents },
        { icon: 'users', label: 'Characters', value: s.characters }, { icon: 'play', label: 'Media', value: s.media },
        { icon: 'tag', label: 'Collectibles', value: s.merchandise }, { icon: 'map-pin', label: 'Events', value: s.events },
        { icon: 'user', label: 'Members', value: s.members }
      ]);
    });
  }
}
