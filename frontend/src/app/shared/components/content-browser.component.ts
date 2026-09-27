import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryStore } from '../../core/services/stores';
import { ContentCard, Genre, Paged } from '../../core/models/models';
import { IconComponent } from './icon.component';
import { DualImageCardComponent } from './cards';
import { EmptyStateComponent, PaginationComponent } from './basics';
import { ModalComponent, onOutsideClick } from './basics';
import { AssetPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-content-browser',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, DualImageCardComponent, EmptyStateComponent, PaginationComponent, ModalComponent, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-browser.component.html',
  styleUrl: './content-browser.component.scss'
})
export class ContentBrowserComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private host = inject(ElementRef<HTMLElement>);
  readonly auth = inject(AuthService);
  readonly cats = inject(CategoryStore);


  readonly category = input<string | null>(null);
  readonly accent = input<string>('#D4AF37');

  readonly search = signal('');
  readonly selectedCats = signal<string[]>([]);
  readonly selectedGenres = signal<string[]>([]);
  readonly types = signal<string[]>([]);
  readonly yearFrom = signal<number | null>(null);
  readonly yearTo = signal<number | null>(null);
  readonly minPopularity = signal(0);
  readonly sort = signal('popular');
  readonly page = signal(1);
  readonly genres = signal<Genre[]>([]);
  readonly result = signal<Paged<ContentCard> | null>(null);
  readonly loading = signal(true);
  readonly quick = signal<ContentCard | null>(null);


  readonly openDropdown = signal<'genre' | 'type' | 'sort' | 'filters' | 'category' | null>(null);

  readonly contentTypes = ['Video', 'Audio', 'Image', 'Article'];
  readonly sorts = [
    { v: 'popular', l: 'Most popular' },
    { v: 'latest', l: 'Latest releases' },
    { v: 'az', l: 'Alphabetical (A-Z)' },
    { v: 'rating', l: 'Top rated' }
  ];
  private search$ = new Subject<string>();


  readonly activeGenreLabel = computed(() => {
    const g = this.selectedGenres();
    if (g.length === 0) return 'All Genres';
    if (g.length === 1) return this.genreName(g[0]);
    return `${g.length} Genres`;
  });

  readonly activeTypeLabel = computed(() => {
    const t = this.types();
    if (t.length === 0) return 'All Types';
    if (t.length === 1) return t[0];
    return `${t.length} Types`;
  });

  readonly activeSortLabel = computed(() => this.sorts.find(s => s.v === this.sort())?.l ?? 'Most popular');

  readonly activeCatLabel = computed(() => {
    const c = this.selectedCats();
    if (c.length === 0) return 'All Realms';
    if (c.length === 1) return this.cats.categories().find(cat => cat.slug === c[0])?.name ?? c[0];
    return `${c.length} Realms`;
  });

  readonly hasAdvFilters = computed(() => !!this.yearFrom() || !!this.yearTo() || this.minPopularity() > 0);
  readonly advFilterCount = computed(() => (this.yearFrom() ? 1 : 0) + (this.yearTo() ? 1 : 0) + (this.minPopularity() > 0 ? 1 : 0));

  readonly activeCount = computed(() =>
    this.selectedGenres().length +
    this.types().length +
    (this.yearFrom() ? 1 : 0) +
    (this.yearTo() ? 1 : 0) +
    (this.minPopularity() ? 1 : 0) +
    (this.category() ? 0 : this.selectedCats().length)
  );

  private offOutsideClick = onOutsideClick(this.host, () => this.closeDropdown());

  constructor() {
    this.search$.pipe(debounceTime(300)).subscribe(v => { this.search.set(v); this.page.set(1); });
    this.route.queryParams.subscribe(params => {
      const q = (params['q'] ?? params['search'] ?? '').trim();
      if (q && q !== this.search()) {
        this.search.set(q);
        this.page.set(1);
      }
    });
    effect(() => {
      const c = this.category();
      untracked(() => this.api.genres(c ?? undefined).subscribe(g => this.genres.set(g)));
    });
    effect(() => {
      const q: Record<string, unknown> = {
        search: this.search(), page: this.page(), pageSize: this.category() ? 8 : 12,
        category: this.category() ?? this.selectedCats().join(','),
        genre: this.selectedGenres().join(','), type: this.types().join(','),
        yearFrom: this.yearFrom(), yearTo: this.yearTo(), minPopularity: this.minPopularity() || null, sort: this.sort()
      };
      this.auth.isLoggedIn();
      untracked(() => {
        this.loading.set(true);
        this.api.contents(q).subscribe({ next: r => { this.result.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
      });
    });
  }

  toggleDropdown(name: 'genre' | 'type' | 'sort' | 'filters' | 'category', event?: Event): void {
    event?.stopPropagation();
    this.openDropdown.update(cur => cur === name ? null : name);
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  selectSingleGenre(slug: string | null): void {
    this.selectedGenres.set(slug ? [slug] : []);
    this.page.set(1);
    this.closeDropdown();
  }

  selectSingleType(type: string | null): void {
    if (!type) {
      this.types.set([]);
    } else {
      this.types.set([type]);
    }
    this.page.set(1);
    this.closeDropdown();
  }

  selectSort(sortKey: string): void {
    this.sort.set(sortKey);
    this.page.set(1);
    this.closeDropdown();
  }

  selectSingleCategory(slug: string | null): void {
    if (!slug) {
      this.selectedCats.set([]);
    } else {
      this.selectedCats.set([slug]);
    }
    this.page.set(1);
    this.closeDropdown();
  }

  removeGenre(slug: string): void {
    this.selectedGenres.update(g => g.filter(x => x !== slug));
    this.page.set(1);
  }

  removeType(t: string): void {
    this.types.update(arr => arr.filter(x => x !== t));
    this.page.set(1);
  }

  removeCategory(c: string): void {
    this.selectedCats.update(arr => arr.filter(x => x !== c));
    this.page.set(1);
  }

  clearYearRange(): void {
    this.yearFrom.set(null);
    this.yearTo.set(null);
    this.page.set(1);
  }

  clearPopularity(): void {
    this.minPopularity.set(0);
    this.page.set(1);
  }

  clearSearch(): void {
    this.search.set('');
    this.page.set(1);
  }

  onSearch(v: string): void { this.search$.next(v); }

  toggle(list: 'cats' | 'genres' | 'types', v: string): void {
    const sig = list === 'cats' ? this.selectedCats : list === 'genres' ? this.selectedGenres : this.types;
    sig.update(a => (a.includes(v) ? a.filter(x => x !== v) : [...a, v]));
    this.page.set(1);
  }

  setGenreTab(slug: string | null): void { this.selectedGenres.set(slug ? [slug] : []); this.page.set(1); }

  setNum(sig: 'from' | 'to' | 'pop', v: string): void {
    const n = v === '' ? null : Number(v);
    if (sig === 'from') this.yearFrom.set(n); else if (sig === 'to') this.yearTo.set(n); else this.minPopularity.set(n ?? 0);
    this.page.set(1);
  }

  reset(): void {
    this.search.set('');
    this.selectedCats.set([]); this.selectedGenres.set([]); this.types.set([]); this.yearFrom.set(null); this.yearTo.set(null);
    this.minPopularity.set(0); this.sort.set('popular'); this.page.set(1);
  }

  goPage(p: number): void {
    this.page.set(p);
    document.querySelector('.prime-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  genreName(slug: string): string {
    return this.genres().find(g => g.slug === slug)?.name ?? slug;
  }
}
