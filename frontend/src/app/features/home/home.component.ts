import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, OnInit, computed, effect, inject, signal, viewChild, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, UiService } from '../../core/services/ui.services';
import { SmoothScrollService } from '../../core/services/smooth-scroll.service';
import { REALM_ICONS } from '../../core/services/stores';
import { Category, ContentCard, Home } from '../../core/models/models';
import { HomeScene } from '../../core/three/home-scene';
import { IconComponent } from '../../shared/components/icon.component';
import { DualImageCardComponent } from '../../shared/components/cards';
import { GlobeComponent } from '../../shared/components/globe.component';
import { SitemapComponent } from '../../shared/components/sitemap.component';
import { SpinnerComponent } from '../../shared/components/basics';
import { MagneticDirective, splitChars } from '../../core/directives/directives';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent, DualImageCardComponent, GlobeComponent, SitemapComponent, SpinnerComponent,
    MagneticDirective, AssetPipe, CompactNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private zone = inject(NgZone);
  private smooth = inject(SmoothScrollService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly ui = inject(UiService);
  readonly icons = REALM_ICONS;

  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  readonly heroVideo = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');
  readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  readonly headline = viewChild<ElementRef<HTMLElement>>('headline');
  readonly sections = viewChildren<ElementRef<HTMLElement>>('scene');

  readonly data = signal<Home | null>(null);
  readonly activeScene = signal(0);
  readonly cover = signal(0);
  readonly sceneReady = signal(false);
  readonly webgl = !this.theme.reduceMotion() && this.hasWebGL();

  readonly realms = computed<Category[]>(() => this.data()?.categories ?? []);
  readonly trending = computed<ContentCard[]>(() => this.data()?.trending ?? []);
  readonly chapters = computed(() => [
    { label: 'Hero', idx: 0 },
    ...this.realms().map((r, i) => ({ label: r.name, idx: 1 + i })),
    { label: 'Trending', idx: 9 }, { label: 'Events', idx: 10 }
  ]);
  readonly progress = signal(0);

  private scene?: HomeScene;
  private triggers: ScrollTrigger[] = [];
  private triggered = new Set<number>();
  private cleanup: (() => void)[] = [];
  private coverDrag = { active: false, startX: 0, start: 0 };
  private coverScroll = 0;

  constructor() {

    effect(() => {
      if (this.ui.preloaderDone()) {
        queueMicrotask(() => {
          this.playIntro();
          const v = this.heroVideo()?.nativeElement;
          if (v && v.paused) {
            v.muted = true;
            v.play().catch(() => {});
          }
        });
      }
    });

    effect(() => {
      if (this.data() && this.sections().length > 5) setTimeout(() => this.setupScrollAnimations(), 60);
    });
  }

  ngOnInit(): void {
    this.api.home().subscribe(h => this.data.set(h));
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const canvas = this.canvas()?.nativeElement;
      if (this.webgl && canvas) {
        try {
          this.scene = new HomeScene(canvas, { lowPower: this.theme.isMobile() || (navigator.hardwareConcurrency ?? 8) <= 4 });
          this.scene.onReady = () => this.zone.run(() => this.sceneReady.set(true));
          this.scene.start();
          const onResize = () => { this.scene?.resize(); ScrollTrigger.refresh(); };
          const onMouse = (e: PointerEvent) => this.scene?.setMouse((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
          const onVisibility = () => (document.hidden ? this.scene?.stop() : this.scene?.start());
          window.addEventListener('resize', onResize);
          window.addEventListener('pointermove', onMouse, { passive: true });
          document.addEventListener('visibilitychange', onVisibility);
          this.cleanup.push(() => window.removeEventListener('resize', onResize), () => window.removeEventListener('pointermove', onMouse), () => document.removeEventListener('visibilitychange', onVisibility));
        } catch (err) {
          console.warn('WebGL HomeScene failed to initialize, falling back:', err);
        }
      }


      const v = this.heroVideo()?.nativeElement;
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.loop = true;

        const ensurePlay = () => {
          if (v.paused) {
            v.muted = true;
            v.play().catch(() => {});
          }
        };

        ensurePlay();
        v.addEventListener('loadeddata', ensurePlay);
        v.addEventListener('canplay', ensurePlay);
        v.addEventListener('canplaythrough', ensurePlay);


        const onEnded = () => {
          v.currentTime = 0;
          v.play().catch(() => {});
        };
        v.addEventListener('ended', onEnded);


        const onStalled = () => {
          v.play().catch(() => {});
        };
        v.addEventListener('waiting', ensurePlay);
        v.addEventListener('stalled', onStalled);


        let io: IntersectionObserver | null = null;
        if ('IntersectionObserver' in window) {
          io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
              if (e.isIntersecting) {
                ensurePlay();
              } else {
                if (!v.paused) v.pause();
              }
            });
          }, { threshold: 0.05 });
          io.observe(v);
        }


        const onDocVisible = () => {
          if (!document.hidden && window.scrollY < innerHeight * 1.1) {
            ensurePlay();
          }
        };
        document.addEventListener('visibilitychange', onDocVisible);


        const onUnlock = () => {
          ensurePlay();
          window.removeEventListener('pointerdown', onUnlock);
          window.removeEventListener('keydown', onUnlock);
          window.removeEventListener('scroll', onUnlock);
        };
        window.addEventListener('pointerdown', onUnlock, { passive: true, once: true });
        window.addEventListener('keydown', onUnlock, { passive: true, once: true });
        window.addEventListener('scroll', onUnlock, { passive: true, once: true });

        this.cleanup.push(
          () => v.removeEventListener('loadeddata', ensurePlay),
          () => v.removeEventListener('canplay', ensurePlay),
          () => v.removeEventListener('canplaythrough', ensurePlay),
          () => v.removeEventListener('ended', onEnded),
          () => v.removeEventListener('waiting', ensurePlay),
          () => v.removeEventListener('stalled', onStalled),
          () => io?.disconnect(),
          () => document.removeEventListener('visibilitychange', onDocVisible),
          () => window.removeEventListener('pointerdown', onUnlock),
          () => window.removeEventListener('keydown', onUnlock),
          () => window.removeEventListener('scroll', onUnlock)
        );
      }

      const onScroll = () => this.updateScene();
      window.addEventListener('scroll', onScroll, { passive: true });
      this.cleanup.push(() => window.removeEventListener('scroll', onScroll));
      this.updateScene();
    });
  }


  private updateScene(): void {
    const els = this.sections().map(s => s.nativeElement);
    if (!els.length) return;
    const y = window.scrollY + innerHeight * 0.35;
    let t = 0;
    for (const el of els) {
      const k = Number(el.dataset['scene']);
      const top = el.offsetTop, h = el.offsetHeight;
      if (y >= top) t = k + Math.min(0.999, (y - top) / Math.max(1, h));
    }
    t = Math.max(0, window.scrollY < 4 ? 0 : t);
    this.scene?.setSceneT(t);
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    const idx = Math.floor(t);
    if (idx !== this.activeScene()) this.zone.run(() => this.activeScene.set(idx));
    if (Math.abs(p - this.progress()) > 0.002) this.zone.run(() => this.progress.set(p));


    if (idx >= 1 && idx <= 8 && t - idx > 0.3 && !this.triggered.has(idx)) {
      this.triggered.add(idx);
      this.scene?.triggerAction(idx - 1);
    }

    const cf = els.find(e => e.dataset['scene'] === '9');
    if (cf && this.trending().length) {
      const local = (window.scrollY - cf.offsetTop) / Math.max(1, cf.offsetHeight - innerHeight);
      this.coverScroll = Math.min(1, Math.max(0, local)) * (this.trending().length - 1);
      if (!this.coverDrag.active) {
        const v = Math.round(this.coverScroll * 10) / 10;
        if (v !== this.cover()) this.zone.run(() => this.cover.set(v));
      }
    }
  }

  private introPlayed = false;

  private playIntro(): void {
    if (this.introPlayed) return;
    this.introPlayed = true;
    const reduce = this.theme.reduceMotion();
    this.zone.runOutsideAngular(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      if (this.scene && !reduce) {
        const proxy = { v: 1 };
        tl.to(proxy, { v: 0, duration: 2.4, ease: 'expo.out', onUpdate: () => this.scene?.setIntro(proxy.v) }, 0);
      }
    });
  }

  private setupScrollAnimations(): void {
    if (this.triggers.length > 2) return;
    this.zone.runOutsideAngular(() => {
      const reduce = this.theme.reduceMotion();
      const root = this.root().nativeElement;
      const q = gsap.utils.selector(root);
      if (!reduce) {
        q('.s-realm').forEach(sec => {
          const big = sec.querySelector('.realm-big');
          const cards = sec.querySelectorAll('.realm-card');
          const info = sec.querySelectorAll('.realm-info > *');
          const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 } });
          if (big) tl.fromTo(big, { xPercent: 18 }, { xPercent: -28, ease: 'none' }, 0);
          if (tl.scrollTrigger) this.triggers.push(tl.scrollTrigger);
          const tl2 = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 30%', scrub: 1 } });
          const isMobile = window.innerWidth <= 768;
          tl2.fromTo(info, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, ease: 'power2.out' }, 0)
            .fromTo(cards, isMobile ? { y: 25, opacity: 0 } : { x: 120, opacity: 0, rotateY: -20 }, isMobile ? { y: 0, opacity: 1, stagger: 0.06, ease: 'power2.out' } : { x: 0, opacity: 1, rotateY: 0, stagger: 0.08, ease: 'power2.out' }, 0.1);
          if (tl2.scrollTrigger) this.triggers.push(tl2.scrollTrigger);
          const tl3 = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'bottom 90%', end: 'bottom 30%', scrub: 1 } });
          tl3.to(sec.querySelectorAll('.realm-sticky > *'), { opacity: 0, y: -40, ease: 'none' });
          if (tl3.scrollTrigger) this.triggers.push(tl3.scrollTrigger);
        });

      }
      ScrollTrigger.refresh();
      this.updateScene();
    });
  }


  coverStyle(i: number): Record<string, string> {
    const d = i - this.cover();
    const abs = Math.abs(d);
    const x = d * (this.theme.isMobile() ? 150 : 230);
    const rot = Math.max(-55, Math.min(55, -d * 38));
    const z = -abs * 180;
    return {
      transform: `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg)`,
      opacity: abs > 3.5 ? '0' : String(1 - abs * 0.18),
      zIndex: String(100 - Math.round(abs * 10)),
      filter: abs > 0.5 ? `brightness(${1 - Math.min(0.6, abs * 0.2)})` : 'none'
    };
  }

  coverDown(e: PointerEvent): void {
    this.coverDrag = { active: true, startX: e.clientX, start: this.cover() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  coverMove(e: PointerEvent): void {
    if (!this.coverDrag.active) return;
    const n = this.trending().length - 1;
    this.cover.set(Math.max(0, Math.min(n, this.coverDrag.start - (e.clientX - this.coverDrag.startX) / 220)));
  }
  coverUp(): void {
    if (!this.coverDrag.active) return;
    this.coverDrag.active = false;
    this.cover.set(Math.round(this.cover()));
  }
  coverGo(dir: number): void {
    const n = this.trending().length - 1;
    this.cover.set(Math.max(0, Math.min(n, Math.round(this.cover()) + dir)));
  }

  jump(idx: number): void {
    const el = this.sections().map(s => s.nativeElement).find(s => Number(s.dataset['scene']) === idx);
    if (el) this.smooth.scrollTo(el.offsetTop + (idx >= 1 && idx <= 8 ? innerHeight * 0.3 : 0));
  }

  scrollToRealms(): void { this.jump(1); }

  month(d: string): string { return new Date(d).toLocaleDateString(undefined, { month: 'short' }); }

  featured(slug: string): ContentCard[] { return this.data()?.featuredByCategory[slug] ?? []; }

  private hasWebGL(): boolean {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }

  ngOnDestroy(): void {
    this.triggers.forEach(t => t.kill());
    this.cleanup.forEach(f => f());
    this.scene?.dispose();
  }
}
