import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { IconComponent } from '../shared/components/icon.component';
import { LogoComponent } from '../shared/components/basics';
import { ThemeService, UiService, LoadingService } from '../core/services/ui.services';
import { ApiService } from '../core/services/api.service';
import { SearchResult } from '../core/models/models';
import { AssetPipe } from '../core/pipes/pipes';

@Component({
  selector: 'app-cursor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enabled) {
      <div #ring class="c-ring" [class.hover]="state() !== ''" [class.label]="label() !== ''"><span>{{ label() }}</span></div>
      <div #dot class="c-dot"></div>
    }`,
  styles: [`
    .c-ring, .c-dot { position: fixed; left: 0; top: 0; pointer-events: none; z-index: 9999; border-radius: 50%; will-change: transform; }
    .c-ring { width: 38px; height: 38px; margin: -19px 0 0 -19px; border: 1.5px solid rgba(245,200,106,.75); box-shadow: 0 0 18px rgba(212,175,55,.35), inset 0 0 12px rgba(212,175,55,.2);
      display: grid; place-items: center; transition: width .35s var(--ease-out), height .35s var(--ease-out), margin .35s var(--ease-out), background .3s, border-color .3s; mix-blend-mode: normal; }
    .c-ring span { font-family: var(--font-ui); font-weight: 700; font-size: .62rem; letter-spacing: .2em; color: #0B0A06; opacity: 0; transition: opacity .2s; }
    .c-ring.hover { width: 58px; height: 58px; margin: -29px 0 0 -29px; border-color: var(--cyan); background: rgba(34,211,238,.08); }
    .c-ring.label { width: 76px; height: 76px; margin: -38px 0 0 -38px; background: var(--gold-2); border-color: var(--gold-2); }
    .c-ring.label span { opacity: 1; }
    .c-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: var(--gold-2); box-shadow: 0 0 10px var(--gold-2); }
  `]
})
export class CursorComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly enabled = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !this.theme.reduceMotion();
  readonly ring = viewChild<ElementRef<HTMLDivElement>>('ring');
  readonly dot = viewChild<ElementRef<HTMLDivElement>>('dot');
  readonly state = signal('');
  readonly label = computed(() => ({ play: 'PLAY', drag: 'DRAG', view: 'VIEW' } as Record<string, string>)[this.state()] ?? '');
  private raf = 0;
  private cleanup: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (!this.enabled) return;
    document.documentElement.classList.add('has-custom-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    this.zone.runOutsideAngular(() => {
      const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
      const over = (e: PointerEvent) => {
        const t = (e.target as HTMLElement | null)?.closest?.('[data-cursor], a, button, [role="button"], input, select, textarea, label') as HTMLElement | null;
        const s = t ? (t.getAttribute('data-cursor') || (t.matches('input, textarea, select') ? '' : 'hover')) : '';
        if (s !== this.state()) this.zone.run(() => this.state.set(s));
      };
      const loop = () => {
        rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
        const r = this.ring()?.nativeElement, d = this.dot()?.nativeElement;
        if (r) r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        if (d) d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        this.raf = requestAnimationFrame(loop);
      };
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerover', over, { passive: true });
      this.cleanup.push(() => window.removeEventListener('pointermove', move), () => window.removeEventListener('pointerover', over));
      loop();
    });
  }
  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.cleanup.forEach(f => f()); }
}

@Component({
  selector: 'app-page-transition',
  standalone: true,
  imports: [LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="curtain" [class.on]="phase() === 'in'" [class.out]="phase() === 'out'" aria-hidden="true">
      <div class="panel top"></div><div class="panel bottom"></div>
      <div class="curtain-logo"><app-logo [size]="72" [spin]="true" /></div>
    </div>
    @if (loading.active()) { <div class="media-loader" role="status" aria-label="Loading media"><app-logo [size]="34" [spin]="true" /></div> }`,
  styles: [`
    .curtain { position: fixed; inset: 0; z-index: 8000; pointer-events: none; }
    .panel { position: absolute; left: 0; right: 0; height: 50.5%; background: var(--bg-0); transform: scaleY(0); transition: transform .45s var(--ease-in-out); }
    .panel.top { top: 0; transform-origin: top; border-bottom: 1px solid rgba(212,175,55,.4); }
    .panel.bottom { bottom: 0; transform-origin: bottom; border-top: 1px solid rgba(212,175,55,.4); }
    .curtain-logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%) scale(.6); opacity: 0; transition: all .35s var(--ease-out); }
    .curtain.on { pointer-events: all; }
    .curtain.on .panel { transform: scaleY(1); }
    .curtain.on .curtain-logo { opacity: 1; transform: translate(-50%,-50%) scale(1); transition-delay: .15s; }
    .curtain.out .panel { transform: scaleY(0); transition-delay: .1s; }
    .media-loader { position: fixed; right: 22px; bottom: 96px; z-index: 900; padding: 10px; border-radius: 50%; background: var(--glass-strong); border: 1px solid var(--border-strong); backdrop-filter: blur(10px); }
  `]
})
export class PageTransitionComponent implements OnInit {
  private router = inject(Router);
  private theme = inject(ThemeService);
  readonly loading = inject(LoadingService);
  readonly phase = signal<'idle' | 'in' | 'out'>('idle');
  private first = true;
  private startedAt = 0;

  ngOnInit(): void {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        if (this.first || this.theme.reduceMotion()) return;
        const from = this.router.url.split('?')[0].split('#')[0];
        const to = e.url.split('?')[0].split('#')[0];
        if (from === to) return;
        this.startedAt = performance.now();
        this.phase.set('in');
        this.loading.routeLoading.set(true);

        setTimeout(() => {
          if (this.phase() === 'in') {
            this.phase.set('out');
            setTimeout(() => this.phase.set('idle'), 400);
            this.loading.routeLoading.set(false);
          }
        }, 2000);
      }
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.loading.routeLoading.set(false);
        if (this.first) { this.first = false; return; }
        if (this.phase() !== 'in') return;
        const wait = Math.max(0, 350 - (performance.now() - this.startedAt));
        setTimeout(() => { this.phase.set('out'); setTimeout(() => this.phase.set('idle'), 400); }, wait);
      }
    });
  }
}

@Component({
  selector: 'app-search-palette',
  standalone: true,
  imports: [IconComponent, RouterLink, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.searchOpen()) {
      <div class="modal-backdrop-fh" (click)="close()">
        <div class="palette" role="dialog" aria-modal="true" aria-label="Search" (click)="$event.stopPropagation()">
          <div class="p-input">
            <app-icon name="search" />
            <input #q type="search" placeholder="Search titles, characters, events, merchandise..." (input)="term$.next(q.value)" (keydown)="onKey($event)" aria-label="Search" />
            <kbd>Esc</kbd>
          </div>
          <div class="p-results">
            @if (loading()) { <p class="p-hint">Searching the multiverse...</p> }
            @for (r of results(); track r.type + r.id; let i = $index) {
              <a class="p-item" [class.active]="i === active()" [routerLink]="r.url" (click)="close()" (mouseenter)="active.set(i)">
                <img [src]="r.imageUrl | asset" alt="" />
                <span><strong>{{ r.title }}</strong><small>{{ r.subtitle }}</small></span>
                <em>{{ r.type }}</em>
              </a>
            } @empty {
              @if (!loading()) { <p class="p-hint">{{ term().length < 2 ? 'Type at least 2 characters. Try "Frieren", "Tokyo" or "Light Stick".' : 'No results found.' }}</p> }
            }
          </div>
          <div class="p-foot"><a routerLink="/explore" (click)="close()">Open advanced Explorer <app-icon name="arrow-right" /></a></div>
        </div>
      </div>
    }`,
  styles: [`
    .modal-backdrop-fh { align-items: flex-start; padding-top: 12vh; }
    .palette { width: 100%; max-width: 640px; border-radius: 22px; background: var(--bg-1); border: 1px solid var(--border-strong); box-shadow: var(--shadow); overflow: hidden; animation: modalIn .4s var(--ease-out); }
    .p-input { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--border);
      app-icon { font-size: 20px; color: var(--gold-2); } input { flex: 1; border: none; background: none; outline: none; color: var(--text); font-size: 1.1rem; }
      kbd { font-size: .72rem; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border-strong); color: var(--muted); } }
    .p-results { max-height: 52vh; overflow-y: auto; padding: 8px; }
    .p-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; color: var(--text);
      img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex: none; }
      span { display: flex; flex-direction: column; flex: 1; min-width: 0; strong { font-family: var(--font-ui); } small { color: var(--muted); } }
      em { font-style: normal; font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: var(--gold-2); }
      &.active { background: var(--glass); outline: 1px solid var(--border-strong); } }
    .p-hint { padding: 20px; text-align: center; color: var(--muted); margin: 0; }
    .p-foot { padding: 12px 20px; border-top: 1px solid var(--border); a { display: inline-flex; gap: 6px; align-items: center; font-family: var(--font-ui); font-weight: 700; letter-spacing: .06em; } }
  `]
})
export class SearchPaletteComponent {
  readonly ui = inject(UiService);
  private api = inject(ApiService);
  private router = inject(Router);
  readonly input = viewChild<ElementRef<HTMLInputElement>>('q');
  readonly term$ = new Subject<string>();
  readonly term = signal('');
  readonly results = signal<SearchResult[]>([]);
  readonly loading = signal(false);
  readonly active = signal(0);

  constructor() {
    this.term$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(t => {
        this.term.set(t);
        if (t.trim().length < 2) { this.loading.set(false); return of([] as SearchResult[]); }
        this.loading.set(true);
        return this.api.search(t).pipe(catchError(() => of([] as SearchResult[])));
      })
    ).subscribe(r => { this.results.set(r); this.loading.set(false); this.active.set(0); });

    effect(() => { if (this.ui.searchOpen()) setTimeout(() => this.input()?.nativeElement.focus(), 30); });
  }

  onKey(e: KeyboardEvent): void {
    const n = this.results().length;
    if (e.key === 'Escape') this.close();
    if (!n) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.update(i => (i + 1) % n); }
    if (e.key === 'ArrowUp') { e.preventDefault(); this.active.update(i => (i - 1 + n) % n); }
    if (e.key === 'Enter') { const r = this.results()[this.active()]; if (r) { this.router.navigateByUrl(r.url); this.close(); } }
  }

  close(): void { this.ui.searchOpen.set(false); this.results.set([]); this.term.set(''); }
}
