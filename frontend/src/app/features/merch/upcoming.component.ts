import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Upcoming } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, CountdownComponent, EmptyStateComponent, SpinnerComponent } from '../../shared/components/basics';
import { TiltDirective, RevealDirective } from '../../core/directives/directives';
import { AssetPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-upcoming',
  standalone: true,
  imports: [DatePipe, IconComponent, BreadcrumbsComponent, CountdownComponent, EmptyStateComponent, SpinnerComponent, TiltDirective, RevealDirective, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh">
      <app-breadcrumbs [items]="[{ label: 'Merchandise', url: '/merchandise' }, { label: 'Upcoming Releases' }]" />
      <span class="eyebrow mt-3 d-flex">Upcoming Releases</span>
      <h1 class="display-lg mt-2">The countdown is on</h1>
      <p class="lead">Anticipated anime, games, movies, shows, comics and merchandise drops. Dates marked "estimated" may change.</p>
      <div class="chip-row my-4">
        <button type="button" class="chip" [class.active]="!type()" (click)="type.set('')">All</button>
        @for (t of types(); track t) { <button type="button" class="chip" [class.active]="type() === t" (click)="type.set(t)">{{ t }}</button> }
      </div>
      @if (!items()) { <app-spinner /> }
      @else if (!filtered().length) { <app-empty-state icon="clock" title="Nothing scheduled" /> }
      @else {
        @if (filtered()[0]; as next) {
          <div class="next" [style.--accent]="next.accentColor">
            <img [src]="next.hoverImageUrl | asset" alt="" />
            <div class="next-body">
              <span class="eyebrow">Next up &middot; {{ next.releaseType }}</span>
              <h2>{{ next.title }}</h2>
              <p>{{ next.description }}</p>
              <app-countdown [target]="next.releaseDate" />
            </div>
          </div>
        }
        <div class="grid-cards wide mt-4">
          @for (u of filtered().slice(1); track u.id; let i = $index) {
            <article class="up" appTilt [tiltMax]="6" appReveal [revealDelay]="i * 60" [style.--accent]="u.accentColor">
              <div class="up-media"><img class="a" [src]="u.imageUrl | asset" [alt]="u.title" loading="lazy" /><img class="b" [src]="u.hoverImageUrl | asset" alt="" loading="lazy" />
                <div class="tags">@for (t of u.tags; track t.id) { <span class="tag-badge" [style.--tag-color]="t.color">{{ t.name }}</span> }</div></div>
              <div class="up-body">
                <span class="card-eyebrow">{{ u.categoryName }} &middot; {{ u.releaseType }}</span>
                <h3>{{ u.title }}</h3>
                <p class="date"><app-icon name="calendar" /> {{ u.releaseDate | date: 'longDate' }} @if (!u.isDateConfirmed) { <em>estimated</em> }</p>
                <p class="desc">{{ u.description }}</p>
                <app-countdown [target]="u.releaseDate" />
                <p class="studio">{{ u.studio }}</p>
              </div>
            </article>
          }
        </div>
      }
    </div></div>`,
  styles: [`
    .next { position: relative; border-radius: var(--r-xl); overflow: hidden; min-height: 380px; display: flex; align-items: flex-end; border: 1px solid var(--accent);
      > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; } &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7,7,12,.92), rgba(7,7,12,.2)); } }
    .next-body { position: relative; z-index: 1; padding: clamp(24px, 5vw, 50px); max-width: 640px; color: #fff; h2 { color: #fff; font-size: clamp(1.8rem, 4vw, 3rem); text-transform: uppercase; } p { color: rgba(255,255,255,.8); } }
    .up { --rx: 0deg; --ry: 0deg; border-radius: var(--r-lg); overflow: hidden; background: var(--bg-1); border: 1px solid var(--border); transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .5s var(--ease-out), border-color .3s, opacity .9s; &:hover { border-color: var(--accent); } }
    .up-media { position: relative; aspect-ratio: 16/10; overflow: hidden; img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .6s; } .b { opacity: 0; } &:hover .b { opacity: 1; }
      .tags { position: absolute; left: 12px; top: 12px; display: flex; gap: 6px; flex-wrap: wrap; } }
    .up-body { padding: 16px 18px 18px; h3 { font-size: 1.15rem; margin: 6px 0; } }
    .card-eyebrow { font-family: var(--font-ui); font-size: .72rem; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); }
    .date { color: var(--text-2); font-size: .9rem; em { font-style: normal; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: var(--warning); margin-left: 6px; } }
    .desc { font-size: .9rem; color: var(--muted); } .studio { margin: 10px 0 0; font-size: .8rem; color: var(--muted); }
  `]
})
export class UpcomingComponent {
  private api = inject(ApiService);
  readonly items = signal<Upcoming[] | null>(null);
  readonly type = signal('');
  readonly types = computed(() => [...new Set((this.items() ?? []).map(u => u.releaseType))]);
  readonly filtered = computed(() => (this.items() ?? []).filter(u => !this.type() || u.releaseType === this.type()));
  constructor() { this.api.upcoming().subscribe(u => this.items.set(u)); }
}
