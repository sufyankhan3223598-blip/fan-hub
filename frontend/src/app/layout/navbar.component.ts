import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter } from 'rxjs/operators';
import { IconComponent } from '../shared/components/icon.component';
import { LogoComponent, onOutsideClick } from '../shared/components/basics';
import { AuthService } from '../core/services/auth.service';
import { ThemeService, UiService } from '../core/services/ui.services';
import { ApiService } from '../core/services/api.service';
import { SearchResult } from '../core/models/models';
import { CategoryStore, NotificationStore, REALM_ICONS } from '../core/services/stores';
import { AssetPipe, InitialsPipe, TimeAgoPipe } from '../core/pipes/pipes';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent, AssetPipe, InitialsPipe, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly ui = inject(UiService);
  readonly cats = inject(CategoryStore);
  readonly notes = inject(NotificationStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  readonly icons = REALM_ICONS;

  readonly scrolled = signal(false);
  readonly hidden = signal(false);
  readonly mega = signal(false);
  readonly menu = signal<'none' | 'user' | 'bell' | 'display'>('none');
  readonly drawer = signal(false);


  readonly searchBarOpen = signal(false);
  readonly searchTerm = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  readonly searchLoading = signal(false);
  readonly searchInputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private searchSubject$ = new Subject<string>();

  private lastY = 0;
  private off = onOutsideClick(this.host, () => {
    this.menu.set('none');
    this.mega.set(false);
    this.searchBarOpen.set(false);
  });

  readonly links = [
    { label: 'Explore', url: '/explore' },
    { label: 'Media', url: '/media' },
    { label: 'Characters', url: '/characters' },
    { label: 'Articles', url: '/articles' },
    { label: 'Events', url: '/events' },
    { label: 'Merchandise', url: '/merchandise' }
  ];

  constructor() {
    effect(() => { if (this.auth.isLoggedIn()) this.notes.refresh(); });

    this.searchSubject$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(t => {
        this.searchTerm.set(t);
        if (t.trim().length < 2) {
          this.searchLoading.set(false);
          return of([] as SearchResult[]);
        }
        this.searchLoading.set(true);
        return this.api.search(t).pipe(catchError(() => of([] as SearchResult[])));
      })
    ).subscribe(res => {
      this.searchResults.set(res);
      this.searchLoading.set(false);
    });

    effect(() => {
      if (this.searchBarOpen()) {
        setTimeout(() => this.searchInputEl()?.nativeElement?.focus(), 60);
      }
    });
  }

  ngOnInit(): void {
    this.cats.load();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.drawer.set(false);
      this.mega.set(false);
      this.menu.set('none');
      this.searchBarOpen.set(false);
      document.body.style.overflow = '';
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.scrolled.set(y > 30);
    this.hidden.set(y > 400 && y > this.lastY + 4 && !this.mega() && this.menu() === 'none');
    if (y < this.lastY - 4) this.hidden.set(false);
    this.lastY = y;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.searchBarOpen.update(v => !v);
    }
    if (e.key === 'Escape') {
      this.mega.set(false);
      this.menu.set('none');
      this.drawer.set(false);
      this.closeSearch();
    }
  }

  toggleSearch(e: Event): void {
    e.stopPropagation();
    this.menu.set('none');
    this.mega.set(false);
    this.searchBarOpen.update(v => !v);
  }

  onSearchInput(val: string): void {
    this.searchSubject$.next(val);
  }

  onSearchKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.closeSearch();
    if (e.key === 'Enter') this.submitSearch();
  }

  submitSearch(): void {
    const term = this.searchTerm().trim();
    if (term) {
      this.closeSearch();
      this.router.navigate(['/explore'], { queryParams: { q: term } });
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.searchInputEl()?.nativeElement?.focus();
  }

  closeSearch(): void {
    this.searchBarOpen.set(false);
    this.searchTerm.set('');
    this.searchResults.set([]);
  }

  toggleMenu(m: 'user' | 'bell' | 'display', e: Event): void {
    e.stopPropagation();
    this.mega.set(false);
    this.searchBarOpen.set(false);
    this.menu.update(cur => (cur === m ? 'none' : m));
  }

  toggleDrawer(): void {
    this.drawer.update(v => !v);
    document.body.style.overflow = this.drawer() ? 'hidden' : '';
  }

  openNotification(id: number, url?: string | null): void {
    this.notes.markRead(id);
    this.menu.set('none');
    if (url) this.router.navigateByUrl(url);
  }

  logout(): void { this.menu.set('none'); this.auth.logout(); }

  ngOnDestroy(): void { this.off(); document.body.style.overflow = ''; }
}
