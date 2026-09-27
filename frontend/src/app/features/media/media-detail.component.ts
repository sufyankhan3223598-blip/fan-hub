import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { Media } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { AudioPlayerComponent, VideoPlayerComponent } from '../../shared/components/players';
import { BookmarkButtonComponent, RatingComponent, ShareComponent } from '../../shared/components/actions';
import { DualImageCardComponent } from '../../shared/components/cards';
import { AssetPipe, CompactNumberPipe, DurationPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-media-detail',
  standalone: true,
  imports: [IconComponent, BreadcrumbsComponent, LockedComponent, SpinnerComponent, AudioPlayerComponent, VideoPlayerComponent, BookmarkButtonComponent,
    RatingComponent, ShareComponent, DualImageCardComponent, AssetPipe, CompactNumberPipe, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="container-fh">
        @if (m(); as m) {
          <div [style.--accent]="m.accentColor">
            <app-breadcrumbs [items]="[{ label: 'Multimedia', url: '/media' }, { label: m.categoryName, url: '/realm/' + m.categorySlug }, { label: m.title }]" />
            <div class="row g-4 mt-2">
              <div class="col-lg-8">
                @if (m.locked) {
                  <div class="locked-wrap"><img [src]="m.imageUrl | asset" alt="" /><app-locked title="Playback is for members" [returnUrl]="'/media/' + m.id" /></div>
                } @else if (m.mediaType === 'Soundtrack' || m.mediaType === 'Podcast') {
                  <img class="art" [src]="m.hoverImageUrl | asset" [alt]="m.title" />
                  <app-audio-player [url]="m.url ?? ''" [title]="m.title" [accent]="m.accentColor" />
                } @else {
                  <app-video-player [url]="m.url ?? ''" [posterUrl]="m.imageUrl" [embedType]="m.embedType" [title]="m.title" />
                }
              </div>
              <div class="col-lg-4">
                <div class="panel">
                  <span class="eyebrow">{{ m.categoryName }} &middot; {{ m.mediaType }}</span>
                  <h1 class="h2 mt-2" style="font-family:var(--font-display);text-transform:uppercase">{{ m.title }}</h1>
                  <p>{{ m.description }}</p>
                  <div class="meta-row mb-3"><span><app-icon name="clock" /> {{ m.durationSeconds | duration }}</span><span class="sep"></span><span><app-icon name="eye" /> {{ m.viewCount | compact }} plays</span></div>
                  <div class="chip-row mb-3">@for (t of m.tags; track t.id) { <span class="tag-badge" [style.--tag-color]="t.color">{{ t.name }}</span> }</div>
                  <app-rating itemType="Media" [itemId]="m.id" />
                  <div class="d-flex gap-2 mt-4 flex-wrap">
                    <app-bookmark-button itemType="Media" [itemId]="m.id" [title]="m.title" variant="full" />
                    <app-share [title]="m.title" [path]="'/media/' + m.id" [full]="true" />
                  </div>
                </div>
              </div>
            </div>
            @if (more().length) {
              <h3 class="mt-5 mb-3" style="letter-spacing:.1em;text-transform:uppercase;font-size:1.1rem">More from {{ m.categoryName }}</h3>
              <div class="grid-cards wide">
                @for (x of more(); track x.id) {
                  <app-dual-card [image]="x.imageUrl" [hoverImage]="x.hoverImageUrl" [title]="x.title" [eyebrow]="x.mediaType" [accent]="x.accentColor"
                    [link]="'/media/' + x.id" aspect="wide" [views]="x.viewCount" itemType="Media" [itemId]="x.id" [locked]="x.locked" />
                }
              </div>
            }
          </div>
        } @else { <app-spinner label="Loading media" /> }
      </div>
    </div>`,
  styles: [`.art { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--r-lg); margin-bottom: 14px; } .locked-wrap { position: relative; } .locked-wrap img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--r-lg); filter: brightness(.4) blur(3px); } .locked-wrap app-locked { position: absolute; inset: 10% 10%; } `]
})
export class MediaDetailComponent {
  private api = inject(ApiService);
  private title = inject(Title);
  readonly id = input.required<string>();
  readonly m = signal<Media | null>(null);
  readonly more = signal<Media[]>([]);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => {
        this.m.set(null);
        this.api.mediaItem(id).subscribe(m => {
          this.m.set(m);
          this.title.setTitle(`${m.title} | Fan Hub Plus`);
          this.api.media({ category: m.categorySlug, pageSize: 4 }).subscribe(r => this.more.set(r.items.filter(x => x.id !== m.id).slice(0, 3)));
        });
      });
    });
  }
}
