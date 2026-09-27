import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { BookmarkButtonComponent, ShareComponent } from './actions';
import { TiltDirective } from '../../core/directives/directives';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';
import { CharacterCard, ItemType, Tag, TimelineItem } from '../../core/models/models';

@Component({
  selector: 'app-dual-card',
  standalone: true,
  imports: [RouterLink, IconComponent, BookmarkButtonComponent, ShareComponent, TiltDirective, AssetPipe, CompactNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="dual-card" appTilt [tiltMax]="8" [class]="'dual-card ' + effect() + ' ' + aspect()" [style.--accent]="accent()"
      [attr.data-cursor]="'view'">
      <a class="media" [routerLink]="link()" [attr.aria-label]="title()">
        <img class="img-a" [src]="image() | asset" [alt]="title()" loading="lazy" decoding="async" />
        <img class="img-b" [src]="(hoverImage() || image()) | asset" alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <span class="glare"></span>
        @if (badge()) { <span class="badge-corner">{{ badge() }}</span> }
        @if (tags().length) {
          <div class="tags">@for (t of tags().slice(0, 2); track t.id) { <span class="tag-badge" [style.--tag-color]="t.color">{{ t.name }}</span> }</div>
        }
        @if (locked()) { <span class="lock-chip"><app-icon name="lock" /> Members</span> }
      </a>
      <div class="actions" (click)="$event.stopPropagation()">
        @if (itemType() && itemId()) { <app-bookmark-button [itemType]="itemType()!" [itemId]="itemId()!" [title]="title()" [small]="true" [lazy]="true" /> }
        <app-share [title]="title()" [path]="link()" [small]="true" />
        @if (showQuickView()) {
          <button type="button" class="btn-icon sm" (click)="quickView.emit()" aria-label="Quick view"><app-icon name="eye" /></button>
        }
      </div>
      <div class="body">
        @if (eyebrow()) { <span class="card-eyebrow">{{ eyebrow() }}</span> }
        <h3 class="card-title"><a [routerLink]="link()">{{ title() }}</a></h3>
        @if (subtitle()) { <p class="card-sub">{{ subtitle() }}</p> }
        <div class="card-meta">
          @if (rating() !== null) { <span class="rate"><app-icon name="star-filled" /> {{ rating()!.toFixed(1) }}</span> }
          @if (views() !== null) { <span><app-icon name="eye" /> {{ views() | compact }}</span> }
          @if (meta()) { <span>{{ meta() }}</span> }
        </div>
      </div>
    </article>`,
  styleUrl: './cards.scss'
})
export class DualImageCardComponent {
  readonly image = input<string>('');
  readonly hoverImage = input<string>('');
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly eyebrow = input<string>('');
  readonly accent = input<string>('#D4AF37');
  readonly link = input<string>('/');
  readonly tags = input<Tag[]>([]);
  readonly badge = input<string>('');
  readonly meta = input<string>('');
  readonly rating = input<number | null>(null);
  readonly views = input<number | null>(null);
  readonly itemType = input<ItemType | null>(null);
  readonly itemId = input<number | null>(null);
  readonly locked = input<boolean>(false);
  readonly effect = input<'fade' | 'slide' | 'flip'>('fade');
  readonly aspect = input<'poster' | 'wide' | 'square'>('poster');
  readonly showQuickView = input<boolean>(false);
  readonly quickView = output<void>();
}

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [RouterLink, IconComponent, AssetPipe, BookmarkButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flip-card" [class.flipped]="flipped()" [style.--accent]="c().accentColor"
         (mouseenter)="onHover(true)" (mouseleave)="onHover(false)">
      <div class="flip-inner">
        <div class="face front">
          <a class="front-link" [routerLink]="['/characters', c().slug]" [attr.aria-label]="'View profile for ' + c().name"></a>
          <img [src]="c().imageUrl | asset" [alt]="c().name" loading="lazy" />
          <div class="front-info">
            <span class="card-eyebrow">{{ c().fandom }}</span>
            <h3><a [routerLink]="['/characters', c().slug]" (click)="$event.stopPropagation()">{{ c().name }}</a></h3>
            <span class="role">{{ c().role }}</span>
          </div>
          <button type="button" class="flip-btn btn-icon sm" (click)="toggleFlip($event)" aria-label="Show stats"><app-icon name="refresh" /></button>
        </div>
        <div class="face back">
          <img class="back-bg" [src]="(c().hoverImageUrl || c().imageUrl) | asset" alt="" aria-hidden="true" loading="lazy" />
          <div class="back-content">
            <span class="card-eyebrow">{{ c().categoryName }}</span>
            <h3>{{ c().name }}</h3>
            <p class="power"><app-icon name="zap" /> {{ c().power }}</p>
            <div class="stats">
              @for (s of stats(); track s.label) {
                <div class="stat"><span>{{ s.label }}</span><div class="bar"><i [style.width.%]="flipped() ? s.value : 0"></i></div><b>{{ s.value }}</b></div>
              }
            </div>
            <div class="back-actions" (click)="$event.stopPropagation()">
              <a class="btn-fh btn-gold btn-sm profile-btn" [routerLink]="['/characters', c().slug]" (click)="$event.stopPropagation()">Profile <app-icon name="arrow-right" /></a>
              <app-bookmark-button itemType="Character" [itemId]="c().id" [title]="c().name" [small]="true" [lazy]="true" (click)="$event.stopPropagation()" />
              <button type="button" class="flip-back-btn btn-icon sm" (click)="toggleFlip($event)" aria-label="Flip back to front"><app-icon name="refresh" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  styleUrl: './character-card.scss'
})
export class CharacterCardComponent {
  readonly c = input.required<CharacterCard>();
  readonly flipped = signal(false);
  readonly stats = computed(() => [
    { label: 'STR', value: this.c().strength }, { label: 'INT', value: this.c().intelligence },
    { label: 'AGI', value: this.c().agility }, { label: 'CHA', value: this.c().charisma }
  ]);

  onHover(isHovering: boolean): void {
    this.flipped.set(isHovering);
  }

  toggleFlip(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.flipped.set(!this.flipped());
  }
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (t of items(); track $index; let i = $index) {
        <li class="tl-item" [style.transition-delay.ms]="i * 90">
          <span class="tl-dot"><app-icon name="sparkles" /></span>
          <div class="tl-card">
            <span class="tl-date">{{ t.dateLabel }}</span>
            <h4>{{ t.title }}</h4>
            <p>{{ t.description }}</p>
          </div>
        </li>
      }
    </ol>`,
  styles: [`
    .timeline { list-style: none; margin: 0; padding: 0 0 0 34px; position: relative; }
    .timeline::before { content: ''; position: absolute; left: 13px; top: 6px; bottom: 6px; width: 2px;
      background: linear-gradient(var(--accent, var(--gold)), var(--violet), transparent); box-shadow: 0 0 12px var(--accent, var(--gold)); }
    .tl-item { position: relative; margin-bottom: 22px; animation: tlIn .8s var(--ease-out) both; }
    .tl-item:nth-child(2) { animation-delay: .1s } .tl-item:nth-child(3) { animation-delay: .2s } .tl-item:nth-child(4) { animation-delay: .3s } .tl-item:nth-child(5) { animation-delay: .4s } .tl-item:nth-child(6) { animation-delay: .5s }
    .tl-dot { position: absolute; left: -34px; top: 10px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
      background: var(--bg-1); border: 2px solid var(--accent, var(--gold)); color: var(--accent, var(--gold-2)); font-size: 13px; box-shadow: 0 0 16px color-mix(in srgb, var(--accent, var(--gold)) 60%, transparent); }
    .tl-card { padding: 16px 20px; border-radius: 16px; background: var(--glass); border: 1px solid var(--border); transition: transform .3s var(--ease-out), border-color .3s; }
    .tl-card:hover { transform: translateX(6px); border-color: var(--accent, var(--gold)); }
    .tl-date { font-family: var(--font-display); font-size: .82rem; color: var(--accent, var(--gold-2)); letter-spacing: .12em; }
    h4 { margin: 6px 0; font-size: 1.1rem; } p { margin: 0; font-size: .95rem; }
    @keyframes tlIn { from { opacity: 0; transform: translateX(-20px); } }
  `]
})
export class TimelineComponent {
  readonly items = input<TimelineItem[]>([]);
}
