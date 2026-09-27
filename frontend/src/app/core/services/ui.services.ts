import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { store } from './auth.service';

export type Theme = 'dark' | 'light';
export type FontSize = 'sm' | 'md' | 'lg';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private doc = inject(DOCUMENT);
  private systemReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  readonly theme = signal<Theme>((store.get('fhp.theme') as Theme) || 'dark');
  readonly fontSize = signal<FontSize>((store.get('fhp.font') as FontSize) || 'md');
  readonly userReduceMotion = signal<boolean>(store.get('fhp.motion') === 'reduce');
  readonly reduceMotion = computed(() => this.userReduceMotion() || !!this.systemReduced);
  readonly isMobile = signal<boolean>(typeof window !== 'undefined' && (window.innerWidth < 768 || navigator.maxTouchPoints > 1 && window.innerWidth < 1024));

  constructor() {
    effect(() => {
      const t = this.theme();
      const f = this.fontSize();
      const m = this.userReduceMotion();
      const root = this.doc.documentElement;
      root.setAttribute('data-theme', t);
      root.setAttribute('data-font', f);
      root.classList.toggle('reduce-motion', this.reduceMotion());
      store.set('fhp.theme', t);
      store.set('fhp.font', f);
      store.set('fhp.motion', m ? 'reduce' : 'full');
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.isMobile.set(window.innerWidth < 768), { passive: true });
    }
  }

  setTheme(t: Theme): void {
    this.theme.set(t);
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  stepFont(dir: -1 | 0 | 1): void {
    if (dir === 0) { this.fontSize.set('md'); return; }
    const order: FontSize[] = ['sm', 'md', 'lg'];
    const i = Math.min(2, Math.max(0, order.indexOf(this.fontSize()) + dir));
    this.fontSize.set(order[i]);
  }

  apply(prefs: { theme?: string; fontSize?: string; reduceMotion?: boolean }): void {
    if (prefs.theme === 'dark' || prefs.theme === 'light') this.theme.set(prefs.theme);
    if (prefs.fontSize === 'sm' || prefs.fontSize === 'md' || prefs.fontSize === 'lg') this.fontSize.set(prefs.fontSize);
    if (typeof prefs.reduceMotion === 'boolean') this.userReduceMotion.set(prefs.reduceMotion);
  }
}

export interface Toast { id: number; kind: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(kind: Toast['kind'], title: string, message?: string, ms = 4200): void {
    const t: Toast = { id: ++this.seq, kind, title, message };
    this.toasts.update(list => [...list.slice(-3), t]);
    setTimeout(() => this.dismiss(t.id), ms);
  }
  success(title: string, message?: string): void { this.show('success', title, message); }
  error(title: string, message?: string): void { this.show('error', title, message, 6000); }
  info(title: string, message?: string): void { this.show('info', title, message); }
  warning(title: string, message?: string): void { this.show('warning', title, message); }
  dismiss(id: number): void { this.toasts.update(list => list.filter(t => t.id !== id)); }
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = signal(0);
  readonly active = computed(() => this.pending() > 0);
  readonly routeLoading = signal(false);
  start(): void {
    this.pending.update(n => n + 1);
    setTimeout(() => this.stop(), 8000);
  }
  stop(): void { this.pending.update(n => Math.max(0, n - 1)); }
}

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly searchOpen = signal(false);
  readonly chatOpen = signal(false);
  readonly chatPrefill = signal<string | null>(null);
  readonly preloaderDone = signal(false);
  readonly homeSceneReady = signal(false);

  openChat(message?: string): void {
    if (message) this.chatPrefill.set(message);
    this.chatOpen.set(true);
  }
}
