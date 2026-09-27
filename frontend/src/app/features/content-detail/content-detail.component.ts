import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ContentDetail, Media } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, LockedComponent, ModalComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent, RatingComponent, ShareComponent } from '../../shared/components/actions';
import { CharacterCardComponent, DualImageCardComponent } from '../../shared/components/cards';
import { AudioPlayerComponent, VideoPlayerComponent } from '../../shared/components/players';
import { AssetPipe, CompactNumberPipe, RichAssetsPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-content-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, LockedComponent, ModalComponent, BookmarkButtonComponent, RatingComponent, ShareComponent,
    CharacterCardComponent, DualImageCardComponent, AudioPlayerComponent, VideoPlayerComponent, AssetPipe, CompactNumberPipe, RichAssetsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-detail.component.html',
  styles: [`
    .detail-poster { width: 100%; max-width: 300px; border-radius: var(--r-lg); border: 1px solid var(--border-strong); box-shadow: var(--shadow); }
    .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 24px 0; }
    .fact { padding: 14px 16px; border-radius: 14px; background: var(--glass); border: 1px solid var(--border);
      span { display: block; font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); font-family: var(--font-ui); font-weight: 700; }
      strong { font-family: var(--font-ui); font-size: 1.05rem; } }
    .rate-panel { margin-top: 28px; }
    .row-scroll { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(190px, 220px); gap: 16px; overflow-x: auto; padding-bottom: 16px; }
    .ep-card { position: relative; } .ep-card .progress-fh { position: absolute; left: 16px; right: 16px; bottom: 96px; z-index: 5; }
    .tab-panel { animation: fadeIn .4s var(--ease-out); padding-top: 28px; }
    :host .cine-hero .cine-content { max-width: 820px; }
    :host .cine-hero .cine-title {
      font-size: clamp(1.45rem, 2.7vw, 2.25rem);
      line-height: 1.2;
      letter-spacing: 0.01em;
      margin: 12px 0 16px;
      max-width: 32ch;
      word-break: break-word;
    }
  `]
})
export class ContentDetailComponent {
  private api = inject(ApiService);
  private titleSvc = inject(Title);
  readonly auth = inject(AuthService);
  readonly slug = input.required<string>();
  readonly item = signal<ContentDetail | null>(null);
  readonly tab = signal<'overview' | 'media' | 'characters' | 'related'>('overview');
  readonly trailer = signal(false);
  readonly playing = signal<Media | null>(null);
  readonly error = signal(false);

  constructor() {
    effect(() => {
      const s = this.slug();
      untracked(() => {
        this.item.set(null);
        this.tab.set('overview');
        this.api.content(s).subscribe({
          next: c => { this.item.set(c); this.titleSvc.setTitle(`${c.title} | Fan Hub Plus`); },
          error: () => this.error.set(true)
        });
      });
    });
  }

  isAudio(m: Media): boolean { return m.mediaType === 'Soundtrack' || m.mediaType === 'Podcast'; }
  scrollTabs(): void { document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }
}
