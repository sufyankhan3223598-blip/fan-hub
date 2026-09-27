import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryStore } from '../../core/services/stores';
import { Media, Paged, Tag } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { AudioPlayerComponent, VideoPlayerComponent } from '../../shared/components/players';
import { RatingComponent, BookmarkButtonComponent } from '../../shared/components/actions';
import { AssetPipe, CompactNumberPipe, DurationPipe, assetUrl } from '../../core/pipes/pipes';
import { SHOW_LOADER } from '../../core/interceptors/interceptors';
import { TiltDirective } from '../../core/directives/directives';

import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, EmptyStateComponent, PaginationComponent, SpinnerComponent, AudioPlayerComponent,
    VideoPlayerComponent, RatingComponent, BookmarkButtonComponent, AssetPipe, CompactNumberPipe, DurationPipe, TiltDirective, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media.component.html',
  styleUrl: './media.component.scss'
})
export class MediaComponent {
  private api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly cats = inject(CategoryStore);

  readonly kind = signal<'all' | 'video' | 'audio'>('all');
  readonly type = signal<string>('');
  readonly tag = signal<string>('');
  readonly category = signal<string>('');
  readonly sort = signal('popular');
  readonly page = signal(1);
  readonly result = signal<Paged<Media> | null>(null);
  readonly tags = signal<Tag[]>([]);
  readonly featured = signal<Media | null>(null);
  readonly loading = signal(false);
  readonly types = ['Trailer', 'Video', 'Explainer', 'Soundtrack', 'Podcast'];
  readonly audio = computed(() => (this.result()?.items ?? []).filter(m => this.isAudio(m)));
  readonly video = computed(() => (this.result()?.items ?? []).filter(m => !this.isAudio(m)));

  readonly typeOptions = computed<AdminSelectOption[]>(() => [
    { value: '', label: 'All types' },
    ...this.types.map(t => ({ value: t, label: t }))
  ]);

  readonly tagOptions = computed<AdminSelectOption[]>(() => [
    { value: '', label: 'All tags' },
    ...this.tags().map(t => ({ value: t.slug, label: t.name }))
  ]);

  readonly categoryOptions = computed<AdminSelectOption[]>(() => [
    { value: '', label: 'All realms' },
    ...this.cats.categories().map(c => ({ value: c.slug, label: c.name }))
  ]);

  readonly sortOptions: AdminSelectOption[] = [
    { value: 'popular', label: 'Most played' },
    { value: 'latest', label: 'Latest' },
    { value: 'rating', label: 'Top rated' },
    { value: 'az', label: 'A-Z' }
  ];

  constructor() {
    this.api.tags().subscribe(t => this.tags.set(t));
    effect(() => {
      const q = { type: this.type() || (this.kind() === 'all' ? '' : this.kind()), tag: this.tag(), category: this.category(), sort: this.sort(), page: this.page(), pageSize: 12 };
      this.auth.isLoggedIn();
      untracked(() => {
        this.loading.set(true);
        this.api.media(q).subscribe(r => {
          this.result.set(r);
          this.loading.set(false);
          if (!this.featured() || !r.items.some(m => m.id === this.featured()!.id)) this.featured.set(r.items.find(m => !this.isAudio(m)) ?? r.items[0] ?? null);
        });
      });
    });
  }

  isAudio(m: Media): boolean { return m.mediaType === 'Soundtrack' || m.mediaType === 'Podcast'; }
  select(m: Media): void {
    this.featured.set(m);

    this.api.mediaItem(m.id).subscribe(full => this.featured.set(full));
    document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  setKind(k: 'all' | 'video' | 'audio'): void { this.kind.set(k); this.type.set(''); this.page.set(1); }
  setType(t: string): void { this.type.set(t); this.page.set(1); }
  setTag(t: string): void { this.tag.set(t); this.page.set(1); }
  resetFilters(): void {
    this.type.set('');
    this.tag.set('');
    this.category.set('');
    this.sort.set('popular');
    this.page.set(1);
  }


  preview(e: Event, m: Media, on: boolean): void {
    const card = e.currentTarget as HTMLElement;
    const v = card.querySelector('video');
    if (!v) return;
    if (on && m.url && m.embedType === 'file') { if (!v.src) v.src = assetUrl(m.url); v.currentTime = 0; v.play().catch(() => undefined); }
    else v.pause();
  }
  readonly ctx = new HttpContext().set(SHOW_LOADER, true);
}
