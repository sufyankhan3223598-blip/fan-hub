import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, inject, input, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { CategoryStore } from '../../core/services/stores';
import { CharacterCard, Paged } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent, PaginationComponent } from '../../shared/components/basics';
import { CharacterCardComponent } from '../../shared/components/cards';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [IconComponent, BreadcrumbsComponent, EmptyStateComponent, PaginationComponent, CharacterCardComponent, RealmStageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="char-hero">
      <app-realm-stage [slug]="cat() || 'comics'" [offsetX]="4.9" [scale]="0.88" [offsetY]="-0.08" />
      <div class="container-fh">
        <div class="char-hero-content">
          <app-breadcrumbs [items]="[{ label: 'Character Profiles' }]" />
          <span class="eyebrow mt-3">Character Profiles</span>
          <h1 class="display-lg mt-2">Legends of every realm</h1>
          <p class="lead">Hover a card to flip it and reveal stats. Filter by realm or fandom.</p>
        </div>
      </div>
    </section>
    <section class="container-fh pb-5">
      <div class="panel filters">
        <div class="input-icon flex-grow-1"><app-icon name="search" />
          <input class="input-fh" type="search" placeholder="Search characters or powers" (input)="onSearch($any($event.target).value)" aria-label="Search characters" /></div>

        <!-- Custom Fandom Dropdown (always opens downwards) -->
        <div class="prime-drop">
          <button type="button" class="prime-trigger" [class.open]="fandomOpen()" [class.active]="!!fandom()"
                  (click)="toggleFandom($event)" aria-haspopup="listbox" [attr.aria-expanded]="fandomOpen()">
            <span class="ico"><app-icon name="film" /></span>
            <span class="trigger-label">{{ fandom() || 'All fandoms' }}</span>
            <span class="chev"><app-icon name="chevron-down" /></span>
          </button>
          @if (fandomOpen()) {
            <div class="prime-menu" (click)="$event.stopPropagation()">
              <div class="menu-head">Filter Fandom</div>
              <div class="menu-list">
                <button type="button" class="menu-item" [class.selected]="!fandom()" (click)="selectFandom('')">
                  <span class="item-label">All fandoms</span>
                  @if (!fandom()) { <span class="check-ico"><app-icon name="check" /></span> }
                </button>
                @for (f of fandoms(); track f) {
                  <button type="button" class="menu-item" [class.selected]="fandom() === f" (click)="selectFandom(f)">
                    <span class="item-label">{{ f }}</span>
                    @if (fandom() === f) { <span class="check-ico"><app-icon name="check" /></span> }
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Custom Sort Dropdown (always opens downwards) -->
        <div class="prime-drop">
          <button type="button" class="prime-trigger" [class.open]="sortOpen()" [class.active]="sort() !== 'popular'"
                  (click)="toggleSort($event)" aria-haspopup="listbox" [attr.aria-expanded]="sortOpen()">
            <span class="ico"><app-icon name="sliders" /></span>
            <span class="trigger-label">{{ currentSortLabel() }}</span>
            <span class="chev"><app-icon name="chevron-down" /></span>
          </button>
          @if (sortOpen()) {
            <div class="prime-menu" (click)="$event.stopPropagation()">
              <div class="menu-head">Sort Characters</div>
              <div class="menu-list">
                @for (s of sortOptions; track s.v) {
                  <button type="button" class="menu-item" [class.selected]="sort() === s.v" (click)="selectSort(s.v)">
                    <span class="item-label">{{ s.l }}</span>
                    @if (sort() === s.v) { <span class="check-ico"><app-icon name="check" /></span> }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
      <div class="chip-row my-4">
        <button type="button" class="chip" [class.active]="!cat()" (click)="setCat('')">All realms</button>
        @for (c of cats.categories(); track c.id) {
          <button type="button" class="chip" [class.active]="cat() === c.slug" (click)="setCat(c.slug)">{{ c.name }}</button>
        }
      </div>
      @if (result(); as r) {
        @if (r.items.length) {
          <div class="grid-cards">@for (c of r.items; track c.id) { <app-character-card [c]="c" /> }</div>
          <app-pagination [page]="page()" [totalPages]="r.totalPages" (pageChange)="page.set($event)" />
        } @else { <app-empty-state icon="users" title="No characters found" message="Try a different realm or fandom." /> }
      } @else {
        <div class="grid-cards">@for (i of [1,2,3,4,5,6,7,8,9,10]; track i) { <div class="skeleton" style="aspect-ratio:3/4.45"></div> }</div>
      }
    </section>`,
  styles: [`
    .char-hero { position: relative; overflow: hidden; padding: calc(var(--nav-h) + 26px) 0 44px; min-height: 420px;
      background: radial-gradient(circle at 82% 40%, rgba(245, 200, 106, 0.16) 0%, rgba(124, 58, 237, 0.08) 35%, transparent 68%), var(--bg-0); }
    .char-hero .container-fh { position: relative; z-index: 1; }
    .char-hero-content { position: relative; z-index: 2; max-width: 650px; }
    .filters { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; padding: 18px 22px;
      background: linear-gradient(160deg, rgba(16, 16, 22, 0.85) 0%, rgba(10, 10, 14, 0.95) 100%);
      border: 1px solid rgba(245, 200, 106, 0.22); border-radius: 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      position: relative; z-index: 20;
    }

    .prime-drop {
      position: relative;
    }

    .prime-trigger {
      min-height: 46px;
      min-width: 175px;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 0 16px;
      border-radius: 12px;
      background: rgba(15, 13, 24, 0.85);
      border: 1px solid rgba(245, 200, 106, 0.22);
      color: #ffffff;
      font-family: var(--font-body);
      font-size: 0.92rem;
      cursor: pointer;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;

      .ico {
        font-size: 15px;
        color: #F5C86A;
        display: flex;
      }

      .trigger-label {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chev {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        transition: transform 0.25s;
        display: flex;
      }

      &:hover {
        border-color: rgba(245, 200, 106, 0.45);
        background: rgba(20, 17, 32, 0.9);
      }

      &.open, &.active {
        border-color: #F5C86A;
        background: rgba(24, 20, 38, 0.98);
        box-shadow: 0 0 0 3px rgba(245, 200, 106, 0.18), 0 0 16px rgba(245, 200, 106, 0.25);

        .chev {
          transform: rotate(180deg);
          color: #F5C86A;
        }
      }
    }

    .prime-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      min-width: 220px;
      max-width: 320px;
      background: linear-gradient(165deg, rgba(20, 17, 32, 0.98) 0%, rgba(10, 10, 16, 0.99) 100%);
      border: 1px solid rgba(245, 200, 106, 0.35);
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 200, 106, 0.15);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      z-index: 1050;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: charMenuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      .menu-head {
        padding: 10px 14px 8px;
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #F5C86A;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .menu-list {
        padding: 6px;
        overflow-y: auto;
        max-height: 250px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        &::-webkit-scrollbar {
          width: 5px;
        }
        &::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        &::-webkit-scrollbar-thumb {
          background: rgba(245, 200, 106, 0.35);
          border-radius: 4px;
          &:hover { background: #F5C86A; }
        }
      }

      .menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        font-family: var(--font-body);
        font-size: 0.88rem;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(245, 200, 106, 0.15);
          color: #ffffff;
        }

        &.selected {
          background: rgba(245, 200, 106, 0.22);
          color: #F5C86A;
          font-weight: 600;
        }

        .check-ico {
          color: #F5C86A;
          font-size: 14px;
          display: flex;
        }
      }
    }

    @keyframes charMenuIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    :host-context([data-theme='light']) {
      .filters {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(158, 116, 18, 0.28);
        box-shadow: 0 16px 40px rgba(25, 20, 10, 0.1), inset 0 1px 0 #ffffff;
      }

      .prime-trigger {
        background: #FFFFFF;
        border: 1px solid rgba(158, 116, 18, 0.25);
        color: #0E0F16;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

        .ico {
          color: #9E7412;
        }

        .chev {
          color: #8F93A7;
        }

        &:hover {
          border-color: #9E7412;
          background: #FAF8F2;
        }

        &.open, &.active {
          border-color: #9E7412;
          background: rgba(158, 116, 18, 0.08);
          color: #7A5B0B;
          box-shadow: 0 0 0 3px rgba(158, 116, 18, 0.15);

          .chev {
            color: #9E7412;
          }
        }
      }

      .prime-menu {
        background: rgba(255, 255, 255, 0.985);
        border: 1px solid rgba(158, 116, 18, 0.3);
        box-shadow: 0 20px 48px rgba(25, 20, 10, 0.15);

        .menu-head {
          color: #7A5B0B;
          border-bottom-color: rgba(158, 116, 18, 0.18);
        }

        .menu-list {
          &::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.04);
          }
          &::-webkit-scrollbar-thumb {
            background: rgba(158, 116, 18, 0.35);
            &:hover { background: #9E7412; }
          }
        }

        .menu-item {
          color: #282A37;

          &:hover {
            background: rgba(158, 116, 18, 0.08);
            color: #0E0F16;
          }

          &.selected {
            background: rgba(158, 116, 18, 0.14);
            color: #7A5B0B;
          }

          .check-ico {
            color: #9E7412;
          }
        }
      }
    }
  `]
})
export class CharactersComponent {
  private api = inject(ApiService);
  private host = inject(ElementRef<HTMLElement>);
  readonly cats = inject(CategoryStore);

  readonly category = input<string>('');
  readonly cat = signal('');
  readonly fandom = signal('');
  readonly search = signal('');
  readonly sort = signal('popular');
  readonly page = signal(1);
  readonly fandoms = signal<string[]>([]);
  readonly result = signal<Paged<CharacterCard> | null>(null);

  readonly fandomOpen = signal(false);
  readonly sortOpen = signal(false);

  readonly sortOptions = [
    { v: 'popular', l: 'Most popular' },
    { v: 'az', l: 'A-Z' },
    { v: 'strength', l: 'Strongest' },
    { v: 'latest', l: 'Newest' }
  ];

  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => { const c = this.category(); untracked(() => this.cat.set(c ?? '')); });
    effect(() => { const c = this.cat(); untracked(() => this.api.fandoms(c || undefined).subscribe(f => this.fandoms.set(f))); });
    effect(() => {
      const q = { category: this.cat(), fandom: this.fandom(), search: this.search(), sort: this.sort(), page: this.page(), pageSize: 10 };
      untracked(() => this.api.characters(q).subscribe(r => this.result.set(r)));
    });
  }

  currentSortLabel(): string {
    return this.sortOptions.find(s => s.v === this.sort())?.l || 'Most popular';
  }

  toggleFandom(e: Event): void {
    e.stopPropagation();
    this.sortOpen.set(false);
    this.fandomOpen.update(v => !v);
  }

  toggleSort(e: Event): void {
    e.stopPropagation();
    this.fandomOpen.set(false);
    this.sortOpen.update(v => !v);
  }

  selectFandom(f: string): void {
    this.fandom.set(f);
    this.page.set(1);
    this.fandomOpen.set(false);
  }

  selectSort(s: string): void {
    this.sort.set(s);
    this.sortOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.host.nativeElement.contains(e.target as Node)) {
      this.fandomOpen.set(false);
      this.sortOpen.set(false);
    }
  }

  setCat(slug: string): void {
    this.cat.set(slug);
    this.fandom.set('');
    this.page.set(1);
    this.fandomOpen.set(false);
    this.sortOpen.set(false);
  }

  onSearch(v: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.search.set(v);
      this.page.set(1);
    }, 300);
  }
}

