import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { CharacterDetail } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent, ShareComponent } from '../../shared/components/actions';
import { CharacterCardComponent, DualImageCardComponent } from '../../shared/components/cards';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';
import { TiltDirective } from '../../core/directives/directives';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [IconComponent, BreadcrumbsComponent, LockedComponent, SpinnerComponent, BookmarkButtonComponent, ShareComponent,
    CharacterCardComponent, TiltDirective, AssetPipe, CompactNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (c(); as c) {
      <section class="cd-hero" [style.--accent]="c.accentColor">
        <div class="container-fh position-relative">
          <app-breadcrumbs [items]="[{ label: 'Characters', url: '/characters' }, { label: c.categoryName, url: '/realm/' + c.categorySlug }, { label: c.name }]" />
          <div class="row g-5 align-items-center mt-1">
            <div class="col-lg-5">
              <div class="holo-card" appTilt [tiltMax]="14">
                <img [src]="c.imageUrl | asset" [alt]="c.name" />
                <span class="holo-glare"></span>
                <div class="holo-foot"><span>{{ c.fandom }}</span><strong>{{ c.role }}</strong></div>
              </div>
            </div>
            <div class="col-lg-7">
              <span class="eyebrow">{{ c.fandom }} &middot; {{ c.categoryName }}</span>
              <h1 class="display-lg mt-2">{{ c.name }}</h1>
              <blockquote class="quote">"{{ c.quote }}"</blockquote>
              <p class="power"><app-icon name="zap" /> <strong>Signature power:</strong> {{ c.power }}</p>
              <div class="stats-block">
                <svg viewBox="0 0 200 200" class="radar" aria-label="Stat radar chart" role="img">
                  @for (r of [1, 0.75, 0.5, 0.25]; track r) { <polygon [attr.points]="ring(r)" class="grid" /> }
                  <polygon [attr.points]="shape()" class="shape" />
                  @for (a of axes; track a.label; let i = $index) {
                    <text [attr.x]="100 + Math.cos(angle(i)) * 92" [attr.y]="100 + Math.sin(angle(i)) * 92 + 4" text-anchor="middle">{{ a.label }}</text>
                  }
                </svg>
                <div class="stat-bars">
                  @for (s of stats(); track s.label) {
                    <div class="sb"><span>{{ s.label }}</span><div class="bar"><i [style.width.%]="s.value"></i></div><b>{{ s.value }}</b></div>
                  }
                </div>
              </div>
              <div class="d-flex gap-2 flex-wrap mt-3">
                <app-bookmark-button itemType="Character" [itemId]="c.id" [title]="c.name" variant="full" />
                <app-share [title]="c.name" [path]="'/characters/' + c.slug" [full]="true" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="container-fh pb-5">
        <div class="panel bio-panel">
          <div class="panel-title">
            <h3>Biography</h3>
            <span class="sub"><app-icon name="eye" /> {{ c.viewCount | compact }} views</span>
          </div>
          <p class="lead">{{ c.bio }}</p>
          @if (c.locked) {
            <app-locked title="Full profile for members" [returnUrl]="'/characters/' + c.slug" />
          }
        </div>
        @if (c.related.length) {
          <h3 class="mt-5 mb-3" style="letter-spacing:.1em;text-transform:uppercase;font-size:1.1rem">Related characters</h3>
          <div class="grid-cards-5">
            @for (r of c.related; track r.id) {
              <app-character-card [c]="r" />
            }
          </div>
        }
      </section>
    } @else { <div class="page"><app-spinner label="Loading profile" /></div> }`,
  styles: [`
    .cd-hero { position: relative; overflow: hidden; padding: calc(var(--nav-h) + 30px) 0 60px;
      background: radial-gradient(circle at 20% 40%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 50%), var(--bg-0); }
    .holo-card { --rx: 0deg; --ry: 0deg; --gx: 50%; --gy: 50%; position: relative; aspect-ratio: 3/4; border-radius: 24px; overflow: hidden; max-width: 380px; margin: 0 auto;
      transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .5s var(--ease-out);
      border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 40px 80px -30px var(--accent);
      img { width: 100%; height: 100%; object-fit: cover; } }
    .holo-glare { position: absolute; inset: 0; background: radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,.35), transparent 40%),
      linear-gradient(115deg, transparent 30%, rgba(34,211,238,.18) 45%, rgba(236,72,153,.18) 55%, transparent 70%); mix-blend-mode: overlay; }
    .holo-foot { position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 20px 18px; background: linear-gradient(0deg, rgba(7,7,12,.9), transparent); color: #fff; display: flex; flex-direction: column;
      span { font-size: .72rem; letter-spacing: .2em; text-transform: uppercase; color: var(--accent); font-family: var(--font-ui); font-weight: 700; } strong { font-family: var(--font-display); } }
    .quote { font-size: 1.25rem; font-style: italic; color: var(--text); border-left: 3px solid var(--accent); padding-left: 16px; margin: 18px 0; }
    .power app-icon { color: var(--accent); }
    .stats-block { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center; margin-top: 10px; @media (max-width: 560px) { grid-template-columns: 1fr; } }
    .radar { width: 200px; height: 200px; overflow: visible; .grid { fill: none; stroke: var(--border-strong); } .shape { fill: color-mix(in srgb, var(--accent) 35%, transparent); stroke: var(--accent); stroke-width: 2; filter: drop-shadow(0 0 8px var(--accent)); }
      text { fill: var(--muted); font-size: 10px; font-family: var(--font-ui); font-weight: 700; letter-spacing: .1em; } }
    .stat-bars { display: flex; flex-direction: column; gap: 12px; }
    .sb { display: grid; grid-template-columns: 90px 1fr 36px; align-items: center; gap: 10px; font-family: var(--font-ui); font-weight: 700; font-size: .85rem; letter-spacing: .08em;
      span { color: var(--muted); text-transform: uppercase; } b { text-align: right; }
      .bar { height: 8px; border-radius: 999px; background: var(--bg-3); overflow: hidden; i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), var(--gold-2)); animation: grow 1.2s var(--ease-out); } } }
    @keyframes grow { from { width: 0; } }

    .bio-panel {
      margin-top: 24px;
      padding: 28px 32px;
      border-radius: 20px;
      background: var(--bg-1);
      border: 1px solid var(--border);
      width: 100%;

      .panel-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);

        h3 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: #fff;
        }

        .sub {
          color: var(--muted);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      .lead {
        font-size: 1rem;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.85);
        margin-bottom: 18px;
      }
    }

    .grid-cards-5 {
      display: grid;
      gap: clamp(14px, 2vw, 22px);
      grid-template-columns: repeat(5, minmax(0, 1fr));
      @media (max-width: 1200px) {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
      @media (max-width: 640px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
    }
  `]
})
export class CharacterDetailComponent {
  protected readonly Math = Math;
  private api = inject(ApiService);
  private title = inject(Title);
  readonly slug = input.required<string>();
  readonly c = signal<CharacterDetail | null>(null);
  readonly axes = [{ label: 'STR' }, { label: 'INT' }, { label: 'AGI' }, { label: 'CHA' }];
  readonly stats = computed(() => {
    const c = this.c();
    return c ? [{ label: 'Strength', value: c.strength }, { label: 'Intelligence', value: c.intelligence }, { label: 'Agility', value: c.agility }, { label: 'Charisma', value: c.charisma }] : [];
  });

  constructor() {
    effect(() => {
      const s = this.slug();
      untracked(() => { this.c.set(null); this.api.character(s).subscribe(c => { this.c.set(c); this.title.setTitle(`${c.name} | Fan Hub Plus`); }); });
    });
  }

  angle(i: number): number { return -Math.PI / 2 + (i / 4) * Math.PI * 2; }
  ring(r: number): string { return [0, 1, 2, 3].map(i => `${100 + Math.cos(this.angle(i)) * 80 * r},${100 + Math.sin(this.angle(i)) * 80 * r}`).join(' '); }
  shape(): string { return this.stats().map((s, i) => `${100 + Math.cos(this.angle(i)) * 80 * (s.value / 100)},${100 + Math.sin(this.angle(i)) * 80 * (s.value / 100)}`).join(' '); }
}
