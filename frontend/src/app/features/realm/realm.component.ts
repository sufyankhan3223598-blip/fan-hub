import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { REALM_ICONS } from '../../core/services/stores';
import { Category, CharacterCard, Media } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, ModalComponent, SectionHeadComponent } from '../../shared/components/basics';
import { CharacterCardComponent, DualImageCardComponent } from '../../shared/components/cards';
import { ContentBrowserComponent } from '../../shared/components/content-browser.component';
import { RealmStageComponent } from '../../shared/components/realm-stage.component';
import { VideoPlayerComponent } from '../../shared/components/players';
import { AssetPipe } from '../../core/pipes/pipes';
import { RevealDirective } from '../../core/directives/directives';

@Component({
  selector: 'app-realm',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, ModalComponent, SectionHeadComponent, CharacterCardComponent, DualImageCardComponent,
    ContentBrowserComponent, RealmStageComponent, VideoPlayerComponent, AssetPipe, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cat(); as c) {
      <div [style.--accent]="c.accentColor">
        <section class="cine-hero">
          <div class="cine-bg"><img [src]="c.imageUrl | asset" [alt]="c.name + ' realm artwork'" /></div>
          <app-realm-stage class="cine-canvas" [slug]="c.slug" [offsetX]="3.4" />
          <div class="container-fh">
            <div class="cine-content">
              <app-breadcrumbs [items]="[{ label: 'Realms', url: '/explore' }, { label: c.name }]" />
              <h1 class="cine-title"><app-icon [name]="icons[c.slug] || 'sparkles'" /> {{ c.name }}</h1>
              <div class="meta-row">
                <span class="pill">Realm</span>
                <span>{{ c.contentCount }} titles</span><span class="sep"></span>
                <span>{{ c.characterCount }} characters</span><span class="sep"></span>
                <span>{{ c.mediaCount }} media</span><span class="sep"></span>
                <span>{{ c.merchandiseCount }} collectibles</span>
              </div>
              <p class="cine-synopsis"><strong>{{ c.tagline }}.</strong> {{ c.description }}</p>
              <div class="cine-actions">
                <button type="button" class="btn-play" (click)="playTeaser()" aria-label="Play realm teaser"><app-icon name="play" /></button>
                <button type="button" class="btn-icon" [class.active]="following()" (click)="follow()" [attr.aria-label]="following() ? 'Remove from interests' : 'Add to my interests'" [attr.title]="following() ? 'In your interests' : 'Add to interests'">
                  <app-icon [name]="following() ? 'check' : 'plus'" />
                </button>
                <a class="btn-icon" href="#browse" aria-label="Browse content" title="Browse"><app-icon name="info" /></a>
                <a class="btn-fh btn-ghost" routerLink="/characters" [queryParams]="{ category: c.slug }">Characters</a>
              </div>
            </div>
          </div>
        </section>

        <section class="container-fh section pt-4" id="browse">
          <app-section-head [eyebrow]="c.name + ' library'" title="Browse the realm" />
          <app-content-browser [category]="c.slug" [accent]="c.accentColor" />
        </section>

        @if (characters().length) {
          <section class="container-fh pb-5" appReveal>
            <app-section-head eyebrow="Legends" [title]="c.name + ' characters'" link="/characters" linkText="All characters" />
            <div class="grid-cards characters-grid">
              @for (ch of characters(); track ch.id) { <app-character-card [c]="ch" /> }
            </div>
          </section>
        }

        @if (media().length) {
          <section class="container-fh pb-5" appReveal>
            <app-section-head eyebrow="Watch & listen" [title]="c.name + ' media'" link="/media" linkText="Multimedia center" />
            <div class="grid-cards wide">
              @for (m of media(); track m.id) {
                <app-dual-card [image]="m.imageUrl" [hoverImage]="m.hoverImageUrl" [title]="m.title" [subtitle]="m.description" [eyebrow]="m.mediaType"
                  [accent]="c.accentColor" [link]="'/media/' + m.id" [tags]="m.tags" aspect="wide" itemType="Media" [itemId]="m.id" [views]="m.viewCount" [locked]="m.locked" />
              }
            </div>
          </section>
        }
      </div>

      <app-modal [open]="teaserOpen()" [title]="c.name + ' teaser'" size="lg" (closed)="teaserOpen.set(false)">
        @if (teaser(); as t) {
          @if (t.locked) {
            <p class="text-center">Media playback is for members. <a routerLink="/login">Sign in</a> to watch the teaser.</p>
          } @else {
            <app-video-player [url]="t.url ?? ''" [posterUrl]="t.imageUrl" [embedType]="t.embedType" [title]="t.title" [autoplay]="true" />
          }
        }
      </app-modal>
    } @else {
      <div class="page container-fh"><div class="skeleton" style="height:70vh"></div></div>
    }`
})
export class RealmComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private title = inject(Title);
  readonly slug = input.required<string>();
  readonly icons = REALM_ICONS;
  readonly cat = signal<Category | null>(null);
  readonly characters = signal<CharacterCard[]>([]);
  readonly media = signal<Media[]>([]);
  readonly teaserOpen = signal(false);
  readonly teaser = computed(() => this.media().find(m => m.mediaType === 'Trailer') ?? this.media()[0] ?? null);
  readonly following = computed(() => !!this.auth.user()?.categories.some(c => c.slug === this.slug()));

  constructor() {
    effect(() => {
      const s = this.slug();
      untracked(() => {
        this.cat.set(null);
        this.api.category(s).subscribe(c => { this.cat.set(c); this.title.setTitle(`${c.name} Realm | Fan Hub Plus`); });
        this.api.characters({ category: s, pageSize: 10 }).subscribe(r => this.characters.set(r.items));
        this.api.media({ category: s, pageSize: 6 }).subscribe(r => this.media.set(r.items));
      });
    });
  }

  playTeaser(): void { this.teaserOpen.set(true); }

  follow(): void {
    const u = this.auth.user();
    const c = this.cat();
    if (!u || !c) { this.toast.info('Members feature', 'Sign in to add realms to your interests.'); return; }
    const ids = u.categories.map(x => x.id);
    const next = this.following() ? ids.filter(id => id !== c.id) : [...ids, c.id];
    this.api.updateProfile({ fullName: u.fullName, bio: u.bio, favoriteFandoms: u.favoriteFandoms, categoryIds: next }).subscribe(user => {
      this.auth.setUser(user);
      this.toast.success(this.following() ? `${c.name} added to your interests` : `${c.name} removed from your interests`);
    });
  }
}
