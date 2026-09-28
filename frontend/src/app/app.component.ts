import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './layout/navbar.component';
import { FooterComponent } from './layout/footer.component';
import { ChatbotComponent } from './layout/chatbot.component';
import { PreloaderComponent } from './layout/preloader.component';
import { CursorComponent, PageTransitionComponent, SearchPaletteComponent } from './layout/overlays';
import { ToastContainerComponent } from './shared/components/basics';
import { AuthService } from './core/services/auth.service';
import { ThemeService, UiService } from './core/services/ui.services';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ChatbotComponent, PreloaderComponent, CursorComponent,
    PageTransitionComponent, SearchPaletteComponent, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    @if (showPreloader()) { <app-preloader (done)="onPreloaderDone()" /> }
    <app-navbar />
    <main id="main" tabindex="-1"><router-outlet /></main>
    @if (showFooter()) { <app-footer /> }
    <app-chatbot />
    <app-search-palette />
    <app-toasts />
    <app-page-transition />
    <app-cursor />
  `
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private ui = inject(UiService);
  private smooth = inject(SmoothScrollService);


  readonly showPreloader = signal(this.firstVisit());
  readonly showFooter = signal(true);

  constructor() {

    effect(() => {
      const u = this.auth.user();
      if (u) this.theme.apply({ theme: u.theme, fontSize: u.fontSize, reduceMotion: u.reduceMotion });
    });
    if (!this.showPreloader()) this.ui.preloaderDone.set(true);
  }

  ngOnInit(): void {
    this.smooth.init();
    this.auth.reloadMe().subscribe();
    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => {
      if (typeof document !== 'undefined') {
        document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(el => {
          try {
            el.pause();
          } catch {}
        });
        document.querySelectorAll<HTMLIFrameElement>('iframe').forEach(iframe => {
          try {
            if (iframe.src && (iframe.src.includes('youtube') || iframe.src.includes('vimeo'))) {
              iframe.src = 'about:blank';
            }
          } catch {}
        });
      }
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.showFooter.set(!url.startsWith('/admin'));
      if (!url.includes('#')) this.smooth.scrollTo(0, true);
    });
  }

  private firstVisit(): boolean {
    try {
      if (window.location.search.includes('loader') || window.location.search.includes('intro')) return true;
      if (sessionStorage.getItem('fhp.intro')) return false;
      sessionStorage.setItem('fhp.intro', '1');
      return true;
    } catch { return false; }
  }

  onPreloaderDone(): void {
    this.showPreloader.set(false);
    this.ui.preloaderDone.set(true);
  }
}

