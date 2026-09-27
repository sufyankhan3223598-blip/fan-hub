import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject, input } from '@angular/core';
import { ThemeService } from '../services/ui.services';

@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  readonly revealDelay = input<number>(0);
  private io?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    node.style.transitionDelay = `${this.revealDelay()}ms`;
    if (!('IntersectionObserver' in window)) { node.classList.add('in'); return; }
    this.io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { node.classList.add('in'); this.io?.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.io.observe(node);
  }
  ngOnDestroy(): void { this.io?.disconnect(); }
}

@Directive({ selector: '[appTilt]', standalone: true, host: { class: 'tilt' } })
export class TiltDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly tiltMax = input<number>(10);
  private raf = 0;
  private cleanup: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (this.theme.reduceMotion() || !window.matchMedia('(hover: hover)').matches) return;
    const node = this.el.nativeElement as HTMLElement;
    this.zone.runOutsideAngular(() => {
      const move = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(() => {
          node.style.setProperty('--ry', `${(px - 0.5) * this.tiltMax() * 2}deg`);
          node.style.setProperty('--rx', `${(0.5 - py) * this.tiltMax() * 2}deg`);
          node.style.setProperty('--gx', `${px * 100}%`);
          node.style.setProperty('--gy', `${py * 100}%`);
          node.classList.add('tilting');
        });
      };
      const leave = () => {
        cancelAnimationFrame(this.raf);
        node.style.setProperty('--rx', '0deg');
        node.style.setProperty('--ry', '0deg');
        node.classList.remove('tilting');
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerleave', leave);
      this.cleanup.push(() => node.removeEventListener('pointermove', move), () => node.removeEventListener('pointerleave', leave));
    });
  }
  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.cleanup.forEach(f => f()); }
}

@Directive({ selector: '[appMagnetic]', standalone: true })
export class MagneticDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly strength = input<number>(0.3);
  private cleanup: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (this.theme.reduceMotion() || !window.matchMedia('(hover: hover)').matches) return;
    const node = this.el.nativeElement as HTMLElement;
    this.zone.runOutsideAngular(() => {
      const move = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * this.strength();
        const y = (e.clientY - (r.top + r.height / 2)) * this.strength();
        node.style.transform = `translate(${x}px, ${y}px)`;
      };
      const leave = () => {
        node.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
        node.style.transform = '';
        setTimeout(() => (node.style.transition = ''), 600);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerleave', leave);
      this.cleanup.push(() => node.removeEventListener('pointermove', move), () => node.removeEventListener('pointerleave', leave));
    });
  }
  ngOnDestroy(): void { this.cleanup.forEach(f => f()); }
}

export function splitChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars: HTMLElement[] = [];
  text.split(' ').forEach((word, wi, words) => {
    const w = document.createElement('span');
    w.className = 'split-word';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'split-char';
      c.textContent = ch;
      w.appendChild(c);
      chars.push(c);
    }
    el.appendChild(w);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

@Directive({ selector: '[appCountUp]', standalone: true })
export class CountUpDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  readonly appCountUp = input<number>(0);
  readonly suffix = input<string>('');
  private io?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    const target = this.appCountUp();
    const run = () => {
      const start = performance.now();
      const dur = 1600;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        node.textContent = Math.round(target * eased).toLocaleString() + this.suffix();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    node.textContent = '0' + this.suffix();
    this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { run(); this.io?.disconnect(); } }, { threshold: 0.4 });
    this.io.observe(node);
  }
  ngOnDestroy(): void { this.io?.disconnect(); }
}
