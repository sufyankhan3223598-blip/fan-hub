import { Injectable, NgZone, inject } from '@angular/core';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeService } from './ui.services';

gsap.registerPlugin(ScrollTrigger);

@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  lenis: Lenis | null = null;
  private tick = (time: number) => this.lenis?.raf(time * 1000);

  init(): void {
    if (this.lenis || this.theme.reduceMotion()) return;
    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      this.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(this.tick);
      gsap.ticker.lagSmoothing(0);
    });
  }

  scrollTo(target: number | string | HTMLElement, immediate = false): void {
    if (this.lenis) this.lenis.scrollTo(target as never, { immediate, offset: typeof target === 'number' ? 0 : -90 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
  }

  stop(): void { this.lenis?.stop(); }
  start(): void { this.lenis?.start(); }

  destroy(): void {
    gsap.ticker.remove(this.tick);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
