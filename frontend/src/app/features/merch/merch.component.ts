import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { MerchGroup, Tag } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent, ModalComponent, SpinnerComponent } from '../../shared/components/basics';
import { DualImageCardComponent } from '../../shared/components/cards';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';
import { Merch } from '../../core/models/models';

@Component({
  selector: 'app-merch',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, EmptyStateComponent, ModalComponent, SpinnerComponent, DualImageCardComponent, AssetPipe, CompactNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page merch-page"><div class="container-fh">
      <app-breadcrumbs [items]="[{ label: 'Merchandise Showcase' }]" />
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-3 mb-4">
        <div>
          <span class="eyebrow vault-eyebrow"><app-icon name="shield" /> Merchandise Showcase &amp; Resource Library</span>
          <h1 class="display-lg mt-2">Collector's vault</h1>
          <p class="lead m-0">Figures, replicas, apparel and artbooks from every realm. Discovery only - Fan Hub Plus never sells or processes payments.</p>
        </div>
        <a routerLink="/merchandise/upcoming" class="btn-vault-upcoming"><app-icon name="clock" /> Upcoming releases</a>
      </div>
      <div class="vault-bar">
        <div class="vault-tabs">
          <button type="button" [class.active]="by() === 'category'" (click)="by.set('category')"><app-icon name="layers" /> By realm</button>
          <button type="button" [class.active]="by() === 'fandom'" (click)="by.set('fandom')"><app-icon name="tag" /> By fandom</button>
        </div>
        <div class="chip-row">
          <button type="button" class="chip" [class.active]="!tag()" (click)="tag.set('')">All tags</button>
          @for (t of tags(); track t.id) { <button type="button" class="chip" [class.active]="tag() === t.slug" (click)="tag.set(t.slug)">{{ t.name }}</button> }
        </div>
      </div>
      @if (!groups()) { <app-spinner label="Opening the vault" /> }
      @else if (filtered().length === 0) { <app-empty-state icon="tag" title="No items with this tag" /> }
      @else {
        @for (g of filtered(); track g.key) {
          <section class="group" [style.--accent]="g.accentColor">
            <div class="group-head">
              <h2>{{ g.label }}</h2>
              <span class="badge-count">{{ g.items.length }} item{{ g.items.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="grid-cards">
              @for (m of g.items; track m.id; let i = $index) {
                <app-dual-card [image]="m.imageUrl" [hoverImage]="m.hoverImageUrl" [title]="m.name" [subtitle]="m.manufacturer" [eyebrow]="m.fandom"
                  [accent]="m.accentColor" [link]="'/merchandise/' + m.slug" [tags]="m.tags" [views]="m.viewCount" [badge]="m.isUpcoming ? 'Coming soon' : ''"
                  itemType="Merchandise" [itemId]="m.id" [effect]="i % 2 ? 'flip' : 'slide'" [showQuickView]="true" (quickView)="quick.set(m)" />
              }
            </div>
          </section>
        }
      }
    </div></div>
    <app-modal [open]="!!quick()" [title]="quick()?.name ?? ''" size="lg" (closed)="quick.set(null)">
      @if (quick(); as q) {
        <div class="qv">
          <div class="gallery">@for (im of q.images; track im.imageUrl) { <img [src]="im.imageUrl | asset" [alt]="im.caption" /> }</div>
          <div>
            <span class="eyebrow">{{ q.fandom }}</span>
            <p class="mt-2">{{ q.description }}</p>
            <div class="chip-row mb-3">@for (t of q.tags; track t.id) { <span class="tag-badge">{{ t.name }}</span> }</div>
            <p class="text-muted-fh small"><app-icon name="eye" /> {{ q.viewCount | compact }} views &middot; by {{ q.manufacturer }}</p>
            <a class="btn-fh btn-gold btn-sm" [routerLink]="'/merchandise/' + q.slug" (click)="quick.set(null)">View gallery <app-icon name="arrow-right" /></a>
          </div>
        </div>
      }
    </app-modal>`,
  styles: [`
    .merch-page {
      min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, rgba(245, 200, 106, 0.08) 0%, transparent 45%), var(--bg-0);
      padding-top: calc(var(--nav-h) + 24px);
      padding-bottom: 60px;
    }
    .vault-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #F5C86A;
    }
    .btn-vault-upcoming {
      background: linear-gradient(135deg, rgba(245, 200, 106, 0.16) 0%, rgba(245, 200, 106, 0.05) 100%);
      border: 1px solid rgba(245, 200, 106, 0.45);
      color: #F5C86A;
      padding: 12px 24px;
      border-radius: 14px;
      font-family: var(--font-ui);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.88rem;
      box-shadow: 0 4px 20px rgba(245, 200, 106, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      transition: all 0.3s var(--ease-out);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;

      &:hover {
        background: linear-gradient(135deg, #F5C86A 0%, #D4AF37 100%);
        color: #050508;
        box-shadow: 0 8px 30px rgba(245, 200, 106, 0.4);
        transform: translateY(-2px);
      }
    }
    .vault-bar {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      align-items: center;
      padding: 18px 24px;
      margin-bottom: 36px;
      background: linear-gradient(160deg, rgba(17, 17, 24, 0.85) 0%, rgba(9, 9, 13, 0.95) 100%);
      border: 1px solid rgba(245, 200, 106, 0.22);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      position: relative;
      backdrop-filter: blur(16px);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 20%;
        right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 200, 106, 0.6), transparent);
      }
    }
    .vault-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.45);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);

      button {
        background: transparent;
        border: none;
        color: var(--muted);
        padding: 8px 18px;
        border-radius: 10px;
        font-family: var(--font-ui);
        font-weight: 700;
        font-size: 0.85rem;
        letter-spacing: 0.06em;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.25s var(--ease-out);

        &.active {
          background: rgba(245, 200, 106, 0.15);
          color: #F5C86A;
          box-shadow: 0 2px 10px rgba(245, 200, 106, 0.2);
          border: 1px solid rgba(245, 200, 106, 0.35);
        }
        &:hover:not(.active) {
          color: #ffffff;
        }
      }
    }
    .group { margin-bottom: 50px; }
    .group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 80px;
        height: 2px;
        background: var(--accent, #F5C86A);
        box-shadow: 0 0 12px var(--accent, #F5C86A);
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text);
      }

      .badge-count {
        font-family: var(--font-ui);
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.1em;
        color: var(--accent, #F5C86A);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid color-mix(in srgb, var(--accent, #F5C86A) 35%, transparent);
        padding: 5px 14px;
        border-radius: 20px;
        text-transform: uppercase;
      }
    }
    .qv { display: grid; grid-template-columns: 1.2fr 1fr; gap: 22px; @media (max-width: 700px) { grid-template-columns: 1fr; } }
    .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; img { width: 100%; border-radius: 12px; aspect-ratio: 2/3; object-fit: cover; } img:first-child { grid-column: span 2; aspect-ratio: 4/3; } }

    :host-context([data-theme='light']) {
      .vault-bar {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(158, 116, 18, 0.28);
        box-shadow: 0 16px 45px rgba(25, 20, 10, 0.12), inset 0 1px 0 #ffffff;
      }
      .vault-tabs {
        background: #EFECE3;
        border: 1px solid rgba(158, 116, 18, 0.18);
        button {
          color: #565A6E;
          &.active {
            background: #FFFFFF;
            color: #835E0B;
            border-color: #9E7412;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          &:hover:not(.active) {
            color: #0E0F16;
          }
        }
      }
      .btn-vault-upcoming {
        background: linear-gradient(135deg, rgba(158, 116, 18, 0.12) 0%, rgba(158, 116, 18, 0.04) 100%);
        border-color: rgba(158, 116, 18, 0.4);
        color: #835E0B;
        &:hover {
          background: linear-gradient(135deg, #B88B1E 0%, #9E7412 100%);
          color: #ffffff;
        }
      }
    }
  `]
})
export class MerchComponent {
  private api = inject(ApiService);
  readonly by = signal<'category' | 'fandom'>('category');
  readonly tag = signal('');
  readonly tags = signal<Tag[]>([]);
  readonly groups = signal<MerchGroup[] | null>(null);
  readonly quick = signal<Merch | null>(null);
  readonly filtered = computed(() => {
    const t = this.tag();
    return (this.groups() ?? []).map(g => ({ ...g, items: t ? g.items.filter(i => i.tags.some(x => x.slug === t)) : g.items })).filter(g => g.items.length);
  });
  constructor() {
    this.api.tags().subscribe(t => this.tags.set(t.filter(x => ['limited-edition', 'pre-order', 'collectible', 'exclusive', 'new-arrival', 'official', 'fan-favorite'].includes(x.slug))));
    effect(() => { const by = this.by(); untracked(() => { this.groups.set(null); this.api.merchGrouped(by).subscribe(g => this.groups.set(g)); }); });
  }
}
