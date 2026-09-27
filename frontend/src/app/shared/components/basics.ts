import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { ToastService } from '../../core/services/ui.services';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img src="/images/logo.png" alt="Fan Hub Plus" [attr.width]="size()" [attr.height]="size()" class="nexus-mark" [class.spin]="spin()" />
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .nexus-mark {
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(212, 175, 55, 0.45));
      border-radius: 50%;
      display: block;
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s;
    }
    :host(:hover) .nexus-mark {
      transform: scale(1.08) rotate(6deg);
      filter: drop-shadow(0 0 16px rgba(212, 175, 55, 0.8));
    }
    .spin { animation: logoSpin 16s linear infinite; }
    @keyframes logoSpin { to { transform: rotate(360deg); } }
  `]
})
export class LogoComponent {
  readonly size = input<number>(40);
  readonly spin = input<boolean>(false);
}

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="spinner-wrap" role="status" [attr.aria-label]="label()"><app-logo [size]="size()" [spin]="true" /><span>{{ label() }}</span></div>`,
  styles: [`
    .spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: var(--muted);
      font-family: var(--font-ui); letter-spacing: .2em; text-transform: uppercase; font-size: .78rem; }
  `]
})
export class SpinnerComponent {
  readonly size = input<number>(56);
  readonly label = input<string>('Loading');
}

export interface Crumb { label: string; url?: string; }

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="crumbs" aria-label="Breadcrumb">
      <a routerLink="/"><app-icon name="home" /></a>
      @for (c of items(); track c.label; let last = $last) {
        <app-icon name="chevron-right" />
        @if (c.url && !last) { <a [routerLink]="c.url">{{ c.label }}</a> }
        @else { <span class="current" aria-current="page">{{ c.label }}</span> }
      }
    </nav>`
})
export class BreadcrumbsComponent {
  readonly items = input<Crumb[]>([]);
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button type="button" [disabled]="page() <= 1" (click)="go(page() - 1)" aria-label="Previous page"><app-icon name="chevron-left" /></button>
        @for (p of pages(); track $index) {
          @if (p === 0) { <button type="button" disabled>...</button> }
          @else { <button type="button" [class.active]="p === page()" (click)="go(p)" [attr.aria-current]="p === page() ? 'page' : null">{{ p }}</button> }
        }
        <button type="button" [disabled]="page() >= totalPages()" (click)="go(page() + 1)" aria-label="Next page"><app-icon name="chevron-right" /></button>
      </nav>
    }`
})
export class PaginationComponent {
  readonly page = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly pageChange = output<number>();
  readonly pages = computed(() => {
    const t = this.totalPages(), c = this.page();
    const out: number[] = [];
    for (let i = 1; i <= t; i++) {
      if (i === 1 || i === t || Math.abs(i - c) <= 1) out.push(i);
      else if (out[out.length - 1] !== 0) out.push(0);
    }
    return out;
  });
  go(p: number): void { if (p >= 1 && p <= this.totalPages() && p !== this.page()) this.pageChange.emit(p); }
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="empty-state"><app-icon [name]="icon()" /><h4>{{ title() }}</h4><p>{{ message() }}</p><ng-content /></div>`
})
export class EmptyStateComponent {
  readonly icon = input<string>('compass');
  readonly title = input<string>('Nothing here yet');
  readonly message = input<string>('');
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="modal-backdrop-fh" (click)="onBackdrop($event)">
        <div class="modal-fh" [class.lg]="size() === 'lg'" [class.sm]="size() === 'sm'" role="dialog" aria-modal="true" [attr.aria-label]="title()" tabindex="-1" #dialog>
          <div class="modal-head">
            <h3>{{ title() }}</h3>
            <button type="button" class="btn-icon sm" (click)="closed.emit()" aria-label="Close dialog"><app-icon name="x" /></button>
          </div>
          <div class="modal-body"><ng-content /></div>
          <ng-content select="[modal-foot]" />
        </div>
      </div>
    }`
})
export class ModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape') onEsc(): void { if (this.open()) this.closed.emit(); }
  onBackdrop(e: MouseEvent): void { if (e.target === e.currentTarget) this.closed.emit(); }
}

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="title()" size="sm" (closed)="cancel.emit()">
      <p>{{ message() }}</p>
      <div modal-foot class="modal-foot">
        <button type="button" class="btn-fh btn-sm" (click)="cancel.emit()">Cancel</button>
        <button type="button" class="btn-fh btn-sm btn-danger" (click)="confirm.emit()">{{ confirmText() }}</button>
      </div>
    </app-modal>`
})
export class ConfirmDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Are you sure?');
  readonly message = input<string>('This action cannot be undone.');
  readonly confirmText = input<string>('Delete');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-item" [class]="'toast-item ' + t.kind" role="status">
          <app-icon [name]="t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'alert' : t.kind === 'warning' ? 'alert' : 'info'" />
          <div class="toast-text"><strong>{{ t.title }}</strong>@if (t.message) {<span>{{ t.message }}</span>}</div>
          <button type="button" (click)="toast.dismiss(t.id)" aria-label="Dismiss"><app-icon name="x" /></button>
        </div>
      }
    </div>`,
  styles: [`
    .toast-stack { position: fixed; top: calc(var(--nav-h) + 12px); right: 16px; z-index: 5000; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); }
    .toast-item { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: var(--glass-strong);
      backdrop-filter: blur(16px); border: 1px solid var(--border-strong); box-shadow: var(--shadow); animation: toastIn .5s var(--ease-out);
      border-left: 3px solid var(--cyan); }
    .toast-item.success { border-left-color: var(--success); } .toast-item.error { border-left-color: var(--danger); } .toast-item.warning { border-left-color: var(--warning); }
    .toast-item > app-icon { font-size: 20px; margin-top: 2px; color: var(--cyan); }
    .toast-item.success > app-icon { color: var(--success); } .toast-item.error > app-icon { color: var(--danger); } .toast-item.warning > app-icon { color: var(--warning); }
    .toast-text { flex: 1; display: flex; flex-direction: column; font-size: .92rem; strong { font-family: var(--font-ui); letter-spacing: .04em; } span { color: var(--text-2); } }
    button { background: none; border: none; color: var(--muted); cursor: pointer; padding: 2px; font-size: 16px; &:hover { color: var(--text); } }
    @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } }
  `]
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);
}

@Component({
  selector: 'app-countdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="countdown" [attr.aria-label]="'Releases in ' + parts().d + ' days'">
      @for (p of [['d', parts().d], ['h', parts().h], ['m', parts().m], ['s', parts().s]]; track p[0]) {
        <div class="cd-cell"><strong>{{ p[1] }}</strong><span>{{ p[0] }}</span></div>
      }
    </div>`,
  styles: [`
    .countdown { display: flex; gap: 8px; }
    .cd-cell { min-width: 52px; padding: 8px 6px; border-radius: 12px; background: rgba(7,7,12,.6); border: 1px solid var(--border-strong);
      backdrop-filter: blur(8px); text-align: center; display: flex; flex-direction: column; }
    :host-context([data-theme='light']) .cd-cell { background: rgba(255,255,255,.8); }
    strong { font-family: var(--font-display); font-size: 1.15rem; color: var(--text); line-height: 1.2; }
    span { font-family: var(--font-ui); font-size: .66rem; letter-spacing: .2em; text-transform: uppercase; color: var(--accent, var(--gold-2)); }
  `]
})
export class CountdownComponent implements OnInit, OnDestroy {
  readonly target = input.required<string>();
  private now = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;
  readonly parts = computed(() => {
    const diff = Math.max(0, new Date(this.target()).getTime() - this.now());
    const s = Math.floor(diff / 1000);
    return { d: Math.floor(s / 86400), h: String(Math.floor((s % 86400) / 3600)).padStart(2, '0'), m: String(Math.floor((s % 3600) / 60)).padStart(2, '0'), s: String(s % 60).padStart(2, '0') };
  });
  ngOnInit(): void { this.timer = setInterval(() => this.now.set(Date.now()), 1000); }
  ngOnDestroy(): void { clearInterval(this.timer); }
}

@Component({
  selector: 'app-locked',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="locked-panel">
      <app-icon name="lock" />
      <h4>{{ title() }}</h4>
      <p>{{ message() }}</p>
      <div class="d-flex gap-2 justify-content-center flex-wrap">
        <a class="btn-fh btn-gold btn-sm" routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }"><app-icon name="login" /> Login to unlock</a>
        <a class="btn-fh btn-ghost btn-sm" routerLink="/register">Join free</a>
      </div>
    </div>`
})
export class LockedComponent {
  readonly title = input<string>('Members-only content');
  readonly message = input<string>('Create a free account to unlock full details, media playback, bookmarks and ratings.');
  readonly returnUrl = input<string>('/');
}

@Component({
  selector: 'app-section-head',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section-head">
      <div><span class="eyebrow">{{ eyebrow() }}</span><h2 class="display-md">{{ title() }}</h2></div>
      @if (link()) { <a class="link-arrow" [routerLink]="link()">{{ linkText() }} <app-icon name="arrow-right" /></a> }
    </div>`
})
export class SectionHeadComponent {
  readonly eyebrow = input<string>('');
  readonly title = input<string>('');
  readonly link = input<string | null>(null);
  readonly linkText = input<string>('View all');
}

export function onOutsideClick(el: ElementRef<HTMLElement>, cb: () => void): () => void {
  const handler = (e: MouseEvent) => { if (!el.nativeElement.contains(e.target as Node)) cb(); };
  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
}
