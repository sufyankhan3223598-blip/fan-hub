import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from './icon.component';
import { ModalComponent, onOutsideClick } from './basics';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { ItemType, RatingSummary } from '../../core/models/models';

@Component({
  selector: 'app-bookmark-button',
  standalone: true,
  imports: [IconComponent, ModalComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" [class]="variant() === 'full' ? 'btn-fh btn-ghost' : 'btn-icon ' + (small() ? 'sm' : '')"
      [class.active]="bookmarked() && variant() !== 'full'" (click)="toggle($event)"
      [attr.aria-pressed]="bookmarked()" [attr.aria-label]="bookmarked() ? 'Remove bookmark' : 'Bookmark'" [attr.title]="bookmarked() ? 'Bookmarked' : 'Bookmark'">
      <app-icon [name]="bookmarked() ? 'bookmark-filled' : 'bookmark'" />
      @if (variant() === 'full') { <span>{{ bookmarked() ? 'Saved' : 'Bookmark' }}</span> }
    </button>
    @if (variant() === 'full' && bookmarked()) {
      <button type="button" class="btn-fh btn-ghost" (click)="openNote()"><app-icon name="edit" /><span>{{ note() ? 'Edit note' : 'Add note' }}</span></button>
    }
    <app-modal [open]="noteOpen()" title="Personal note" size="sm" (closed)="noteOpen.set(false)">
      <label class="field"><span class="field-label">Note for "{{ title() }}"</span>
        <textarea class="textarea-fh" maxlength="1000" [(ngModel)]="draft" placeholder="Why did you save this? Rewatch plans, cosplay ideas..."></textarea>
        <span class="field-hint">{{ draft.length }}/1000</span>
      </label>
      <div modal-foot class="modal-foot">
        <button type="button" class="btn-fh btn-sm" (click)="noteOpen.set(false)">Cancel</button>
        <button type="button" class="btn-fh btn-sm btn-gold" (click)="saveNote()">Save note</button>
      </div>
    </app-modal>`,
  styles: [`:host { display: inline-flex; gap: 10px; flex-wrap: wrap; }`]
})
export class BookmarkButtonComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly itemType = input.required<ItemType>();
  readonly itemId = input.required<number>();
  readonly title = input<string>('');
  readonly variant = input<'icon' | 'full'>('icon');
  readonly small = input<boolean>(false);

  readonly lazy = input<boolean>(false);

  readonly bookmarked = signal(false);
  readonly bookmarkId = signal<number | null>(null);
  readonly note = signal<string | null>(null);
  readonly noteOpen = signal(false);
  draft = '';

  constructor() {
    effect(() => {
      const id = this.itemId(); const type = this.itemType();
      if (!this.auth.isLoggedIn() || this.lazy() || !id) return;
      this.api.bookmarkStatus(type, id).subscribe(s => {
        this.bookmarked.set(s.bookmarked); this.bookmarkId.set(s.bookmarkId ?? null); this.note.set(s.note ?? null);
      });
    });
  }

  toggle(e: Event): void {
    e.preventDefault(); e.stopPropagation();
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Members feature', 'Sign in to bookmark and add notes.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const id = this.bookmarkId();
    if (this.bookmarked() && id) {
      this.api.removeBookmark(id).subscribe(() => {
        this.bookmarked.set(false); this.bookmarkId.set(null); this.note.set(null);
        this.toast.info('Bookmark removed');
      });
    } else {
      this.api.addBookmark(this.itemType(), this.itemId()).subscribe(b => {
        this.bookmarked.set(true); this.bookmarkId.set(b.id); this.note.set(b.note ?? null);
        this.toast.success('Bookmarked', this.variant() === 'full' ? 'Add a personal note anytime.' : this.title());
      });
    }
  }

  openNote(): void { this.draft = this.note() ?? ''; this.noteOpen.set(true); }

  saveNote(): void {
    const id = this.bookmarkId();
    if (!id) return;
    this.api.updateNote(id, this.draft.trim() || null).subscribe(b => {
      this.note.set(b.note ?? null); this.noteOpen.set(false); this.toast.success('Note saved');
    });
  }
}

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="share-wrap">
      <button type="button" [class]="full() ? 'btn-fh btn-ghost' : 'btn-icon ' + (small() ? 'sm' : '')" (click)="toggle($event)" aria-haspopup="menu" [attr.aria-expanded]="open()" aria-label="Share">
        <app-icon name="share" />@if (full()) { <span>Share</span> }
      </button>
      @if (open()) {
        <div class="share-menu" role="menu">
          <button type="button" role="menuitem" (click)="copy()"><app-icon name="copy" /> Copy link</button>
          <a role="menuitem" [href]="whatsapp()" target="_blank" rel="noopener"><app-icon name="message-circle" /> WhatsApp</a>
          <a role="menuitem" [href]="xUrl()" target="_blank" rel="noopener"><span class="glyph">X</span> Post on X</a>
          <a role="menuitem" [href]="facebook()" target="_blank" rel="noopener"><app-icon name="users" /> Facebook</a>
        </div>
      }
    </div>`,
  styles: [`
    .share-wrap { position: relative; display: inline-flex; }
    .share-menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 50; min-width: 200px; padding: 8px; border-radius: 16px;
      background: var(--glass-strong); backdrop-filter: blur(16px); border: 1px solid var(--border-strong); box-shadow: var(--shadow); animation: pop .3s var(--ease-out); }
    .share-menu button, .share-menu a { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 10px; border: none;
      background: none; color: var(--text); font-family: var(--font-ui); font-weight: 600; cursor: pointer; text-align: left; font-size: .95rem; }
    .share-menu button:hover, .share-menu a:hover { background: var(--glass); color: var(--gold-2); }
    .glyph { width: 16px; text-align: center; font-weight: 800; font-family: var(--font-display); font-size: .85rem; }
    @keyframes pop { from { opacity: 0; transform: translateY(-6px) scale(.97); } }
  `]
})
export class ShareComponent implements OnDestroy {
  private toast = inject(ToastService);
  private host = inject(ElementRef<HTMLElement>);
  readonly title = input<string>('Fan Hub Plus');
  readonly path = input<string | null>(null);
  readonly full = input<boolean>(false);
  readonly small = input<boolean>(false);
  readonly open = signal(false);
  private off = onOutsideClick(this.host, () => this.open.set(false));

  readonly url = computed(() => this.path() ? `${location.origin}${this.path()}` : location.href);
  readonly whatsapp = computed(() => `https://wa.me/?text=${encodeURIComponent(this.url())}`);
  readonly xUrl = computed(() => `https://x.com/intent/tweet?url=${encodeURIComponent(this.url())}`);
  readonly facebook = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url())}`);

  toggle(e: Event): void { e.preventDefault(); e.stopPropagation(); this.open.update(v => !v); }
  async copy(): Promise<void> {
    try { await navigator.clipboard.writeText(this.url()); this.toast.success('Link copied', this.url()); }
    catch { this.toast.error('Copy failed', 'Your browser blocked clipboard access.'); }
    this.open.set(false);
  }
  ngOnDestroy(): void { this.off(); }
}

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rating">
      <div class="stars" role="radiogroup" aria-label="Your rating" (mouseleave)="hover.set(0)">
        @for (s of [1, 2, 3, 4, 5]; track s) {
          <button type="button" role="radio" [attr.aria-checked]="(summary()?.myStars ?? 0) === s" [attr.aria-label]="s + ' star' + (s > 1 ? 's' : '')"
            [class.on]="s <= (hover() || summary()?.myStars || 0)" [class.pop]="popped() === s" (mouseenter)="hover.set(s)" (click)="rate(s)">
            <app-icon [name]="s <= (hover() || summary()?.myStars || 0) ? 'star-filled' : 'star'" />
          </button>
        }
      </div>
      <div class="avg"><strong>{{ (summary()?.averageRating ?? 0).toFixed(1) }}</strong><span>{{ summary()?.ratingCount ?? 0 }} ratings</span></div>
      <div class="thumbs">
        <button type="button" class="thumb" [class.on]="summary()?.myThumb === 1" (click)="thumb(1)" aria-label="Thumbs up"><app-icon name="thumbs-up" /> {{ summary()?.likeCount ?? 0 }}</button>
        <button type="button" class="thumb down" [class.on]="summary()?.myThumb === -1" (click)="thumb(-1)" aria-label="Thumbs down"><app-icon name="thumbs-down" /> {{ summary()?.dislikeCount ?? 0 }}</button>
      </div>
    </div>`,
  styles: [`
    .rating { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .stars { display: flex; gap: 2px; }
    .stars button { background: none; border: none; padding: 4px; cursor: pointer; color: var(--muted); font-size: 24px; transition: transform .25s var(--ease-out), color .2s; }
    .stars button.on { color: var(--gold-2); filter: drop-shadow(0 0 6px rgba(245,200,106,.6)); }
    .stars button:hover { transform: scale(1.18); }
    .stars button.pop { animation: starPop .5s var(--ease-out); }
    @keyframes starPop { 40% { transform: scale(1.5) rotate(12deg); } }
    .avg { display: flex; flex-direction: column; line-height: 1.1; strong { font-family: var(--font-display); font-size: 1.4rem; } span { font-size: .78rem; color: var(--muted); } }
    .thumbs { display: flex; gap: 8px; }
    .thumb { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border-strong);
      background: var(--glass); color: var(--text-2); cursor: pointer; font-weight: 700; font-family: var(--font-ui); transition: all .25s; font-size: .95rem; }
    .thumb app-icon { font-size: 17px; }
    .thumb.on { border-color: var(--success); color: var(--success); background: rgba(34,197,94,.1); }
    .thumb.down.on { border-color: var(--danger); color: var(--danger); background: rgba(244,63,94,.1); }
  `]
})
export class RatingComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly itemType = input.required<'Content' | 'Media'>();
  readonly itemId = input.required<number>();
  readonly changed = output<RatingSummary>();
  readonly summary = signal<RatingSummary | null>(null);
  readonly hover = signal(0);
  readonly popped = signal(0);

  constructor() {
    effect(() => {
      const id = this.itemId(); const t = this.itemType();
      if (id) this.api.rating(t, id).subscribe(s => this.summary.set(s));
    });
  }

  private guard(): boolean {
    if (this.auth.isLoggedIn()) return true;
    this.toast.info('Members feature', 'Sign in to rate content.');
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }

  rate(stars: number): void {
    if (!this.guard()) return;
    this.popped.set(stars);
    setTimeout(() => this.popped.set(0), 500);
    this.api.rate(this.itemType(), this.itemId(), stars, null).subscribe(s => { this.summary.set(s); this.changed.emit(s); this.toast.success('Thanks for rating!', `You gave ${stars} star${stars > 1 ? 's' : ''}.`); });
  }

  thumb(v: 1 | -1): void {
    if (!this.guard()) return;
    const next = this.summary()?.myThumb === v ? 0 : v;
    this.api.rate(this.itemType(), this.itemId(), null, next).subscribe(s => { this.summary.set(s); this.changed.emit(s); });
  }
}
