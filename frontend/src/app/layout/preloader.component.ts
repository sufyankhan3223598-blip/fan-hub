import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, inject, output, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { ThemeService } from '../core/services/ui.services';

export const PRELOAD_ASSETS = ['/models/xbot.glb', '/models/robot.glb', '/models/soldier.glb', '/models/michelle.glb'];

@Component({
  selector: 'app-preloader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preloader.component.html',
  styleUrl: './preloader.component.scss'
})
export class PreloaderComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly done = output<void>();
  readonly root = viewChild.required<ElementRef<HTMLDivElement>>('root');
  readonly percent = signal(0);
  readonly phase = signal<'charging' | 'transform' | 'exit'>('charging');
  readonly rocks = Array.from({ length: 9 }, (_, i) => ({
    x: 120 + i * 70 + (i % 2 ? 18 : -10), size: 10 + ((i * 7) % 14), rot: (i * 47) % 360
  }));
  readonly sparks = Array.from({ length: 26 }, (_, i) => ({ x: 380 + Math.cos(i * 1.7) * (60 + (i % 5) * 18), y: 300 + Math.sin(i * 2.3) * 90, d: (i % 7) * 0.25 }));
  readonly winds = Array.from({ length: 12 }, (_, i) => ({ y: 120 + i * 32, w: 60 + (i * 37) % 140, d: (i % 6) * 0.3, left: i % 2 === 0 }));

  private tl?: gsap.core.Timeline;
  private finished = false;
  private raf = 0;
  private lastP = -1;


  private crackEls: SVGPathElement[] = [];
  private rockEls: SVGPolygonElement[] = [];
  private auraEl?: SVGElement;
  private windEls: SVGLineElement[] = [];
  private sparkEls: SVGCircleElement[] = [];
  private hairEl?: SVGPathElement;
  private rimEls: SVGElement[] = [];
  private boltEls: SVGPolylineElement[] = [];
  private shockwaveEl?: SVGCircleElement;
  private flashEl?: HTMLDivElement;
  private stageEl?: HTMLDivElement;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const el = this.root().nativeElement;


      this.crackEls = Array.from(el.querySelectorAll<SVGPathElement>('.crack'));
      this.rockEls = Array.from(el.querySelectorAll<SVGPolygonElement>('.rock'));
      this.auraEl = el.querySelector<SVGElement>('.aura') ?? undefined;
      const auraInner = el.querySelector<SVGElement>('.aura-inner');
      const warrior = el.querySelector<SVGElement>('.warrior');
      this.windEls = Array.from(el.querySelectorAll<SVGLineElement>('.wind'));
      this.sparkEls = Array.from(el.querySelectorAll<SVGCircleElement>('.spark'));
      this.hairEl = el.querySelector<SVGPathElement>('.hair') ?? undefined;
      this.rimEls = Array.from(el.querySelectorAll<SVGElement>('.rim'));
      this.boltEls = Array.from(el.querySelectorAll<SVGPolylineElement>('.bolt'));
      this.shockwaveEl = el.querySelector<SVGCircleElement>('.shockwave') ?? undefined;
      this.flashEl = el.querySelector<HTMLDivElement>('.flash') ?? undefined;
      this.stageEl = el.querySelector<HTMLDivElement>('.stage') ?? undefined;


      this.crackEls.forEach(c => {
        c.style.strokeDasharray = '400';
        c.style.strokeDashoffset = '400';
      });
      this.rockEls.forEach(r => {
        r.style.opacity = '0';
        r.style.transform = 'translateY(0px)';
      });
      if (this.auraEl) {
        this.auraEl.style.transform = 'scale(0.55)';
        this.auraEl.style.opacity = '0.35';
        this.auraEl.style.transformOrigin = '50% 80%';
      }
      this.windEls.forEach(w => w.style.opacity = '0');
      this.sparkEls.forEach(s => s.style.opacity = '0');

      if (warrior) {
        gsap.to(warrior, { y: -4, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      }
      if (auraInner) {
        gsap.to(auraInner, { scaleY: 1.08, duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 90%' });
      }

      this.warmupAssets();

      const duration = this.theme.reduceMotion() ? 500 : 1800;
      const start = performance.now();

      const tick = (now: number) => {
        if (this.finished) return;
        const elapsed = now - start;
        const timeRatio = Math.min(1, Math.max(0, elapsed / duration));


        const eased = 1 - Math.pow(1 - timeRatio, 1.8);
        const p = Math.min(100, Math.round(eased * 100));


        if (p !== this.lastP) {
          this.lastP = p;
          this.zone.run(() => this.percent.set(p));
        }


        this.applyCharge(p / 100);

        if (timeRatio >= 1 || p >= 100) {
          if (this.stageEl) this.stageEl.style.transform = 'none';
          this.zone.run(() => this.percent.set(100));
          this.transform();
          return;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }


  private warmupAssets(): void {
    let loaded = 0;
    const total = PRELOAD_ASSETS.length;
    PRELOAD_ASSETS.forEach(url => {
      fetch(url)
        .then(() => { loaded++; })
        .catch(() => { loaded++; });
    });
  }

  private applyCharge(pNorm: number): void {
    const offset = Math.max(0, 400 - 400 * Math.min(1, pNorm * 1.3));
    this.crackEls.forEach(c => c.style.strokeDashoffset = `${offset.toFixed(1)}`);

    this.rockEls.forEach((r, i) => {
      const k = Math.max(0, pNorm - i * 0.06);
      r.style.transform = `translateY(${-k * (70 + (i % 3) * 40)}px) rotate(${k * 90 * (i % 2 ? 1 : -1)}deg)`;
      r.style.opacity = `${Math.min(1, k * 3)}`;
    });

    if (this.auraEl) {
      this.auraEl.style.transform = `scale(${0.55 + pNorm * 0.65})`;
      this.auraEl.style.opacity = `${0.35 + pNorm * 0.5}`;
    }

    const windOp = pNorm > 0.3 ? `${(pNorm - 0.3) * 1.3}` : '0';
    this.windEls.forEach(w => w.style.opacity = windOp);

    const sparkOp = pNorm > 0.45 ? '1' : '0';
    this.sparkEls.forEach(s => s.style.opacity = sparkOp);


    if (pNorm > 0.65 && this.stageEl && !this.theme.reduceMotion()) {
      const sx = (Math.random() - 0.5) * 3;
      const sy = (Math.random() - 0.5) * 2;
      this.stageEl.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    }
  }


  private transform(): void {
    if (this.finished) return;
    this.finished = true;
    cancelAnimationFrame(this.raf);
    this.zone.run(() => this.phase.set('transform'));
    const reduce = this.theme.reduceMotion();
    this.tl = gsap.timeline({ onComplete: () => this.exit() });
    this.tl

      .to(this.hairEl ?? {}, { fill: '#00E5FF', duration: 0.1 }, 0)
      .to(this.rimEls, { stroke: '#E0F7FF', duration: 0.1 }, '<')
      .to(this.auraEl ?? {}, { scale: reduce ? 1.15 : 1.7, opacity: 1, duration: 0.28, ease: 'expo.out' }, '<')
      .to(this.boltEls, { opacity: 1, duration: 0.03, stagger: { each: 0.03, repeat: 2, yoyo: true } }, '<')
      .fromTo(this.shockwaveEl ?? {}, { scale: 0.2, opacity: 0.95 }, { scale: reduce ? 1 : 5, opacity: 0, duration: 0.35, ease: 'expo.out', transformOrigin: '50% 50%' }, '<0.04')
      .to(this.flashEl ?? {}, { opacity: 0.75, duration: 0.16, ease: 'power2.in' }, '<0.08')
      .to({}, { duration: 0.06 });
  }

  private exit(): void {
    this.zone.run(() => this.phase.set('exit'));
    const el = this.root()?.nativeElement;
    if (!el) {
      this.zone.run(() => this.done.emit());
      return;
    }
    gsap.to(el, {
      opacity: 0, duration: 0.28, ease: 'power2.out',
      onComplete: () => this.zone.run(() => this.done.emit())
    });
  }

  skip(): void {
    cancelAnimationFrame(this.raf);
    this.tl?.kill();
    this.finished = true;
    this.zone.run(() => {
      this.percent.set(100);
      this.done.emit();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.tl?.kill();
    gsap.killTweensOf(this.root()?.nativeElement?.querySelectorAll('*') ?? []);
  }
}
