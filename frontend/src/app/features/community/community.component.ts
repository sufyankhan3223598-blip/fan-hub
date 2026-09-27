import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryStore } from '../../core/services/stores';
import { Paged, Submission } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent, PaginationComponent } from '../../shared/components/basics';
import { AssetPipe, InitialsPipe } from '../../core/pipes/pipes';
import { TiltDirective } from '../../core/directives/directives';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, EmptyStateComponent, PaginationComponent, AssetPipe, InitialsPipe, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh">
      <app-breadcrumbs [items]="[{ label: 'Fan Creations' }]" />
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-3 mb-4">
        <div><span class="eyebrow">Community</span><h1 class="display-lg mt-2">Fan creations</h1>
          <p class="lead m-0">Articles, fan art, cosplay builds, theories and reviews by members - every post reviewed by the admin team.</p></div>
        <a [routerLink]="auth.isLoggedIn() ? '/submit' : '/login'" class="btn-fh btn-gold"><app-icon name="upload" /> Submit your creation</a>
      </div>
      <div class="chip-row mb-4">
        <button type="button" class="chip" [class.active]="!cat()" (click)="cat.set(''); page.set(1)">All realms</button>
        @for (c of cats.categories(); track c.id) { <button type="button" class="chip" [class.active]="cat() === c.slug" (click)="cat.set(c.slug); page.set(1)">{{ c.name }}</button> }
      </div>
      @if (result(); as r) {
        @if (r.items.length) {
          <div class="fan-creations-grid">
            @for (s of r.items; track s.id) {
              <a class="sub-card" [routerLink]="['/community', s.id]" appTilt [tiltMax]="5" [style.--accent]="s.accentColor">
                <div class="sc-media">
                  @if (s.imageUrl) {
                    <img [src]="s.imageUrl | asset" [alt]="s.title" loading="lazy" />
                  }
                  <span class="tag-badge" [style.--tag-color]="s.accentColor">{{ s.submissionType }}</span>
                </div>
                <div class="sc-body">
                  <span class="card-eyebrow">{{ s.categoryName }}</span>
                  <h3 class="card-title">{{ s.title }}</h3>
                  <p class="card-desc">{{ s.summary }}</p>
                  <div class="sc-author">
                    <span class="avatar" style="width:30px;height:30px;font-size:.75rem">{{ s.authorName | initials }}</span>
                    <span>{{ s.authorName }} &middot; {{ s.reviewedAt ?? s.createdAt | date: 'mediumDate' }}</span>
                  </div>
                </div>
              </a>
            }
          </div>
          <app-pagination [page]="page()" [totalPages]="r.totalPages" (pageChange)="page.set($event)" />
        } @else { <app-empty-state icon="feather" title="No approved creations here yet" message="Be the first to submit one." /> }
      } @else { <div class="skeleton" style="height:300px"></div> }
    </div></div>`,
  styles: [`
    .fan-creations-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: stretch;

      @media (max-width: 992px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .sub-card {
      --rx: 0deg;
      --ry: 0deg;
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: var(--r-lg);
      overflow: hidden;
      background: var(--bg-1);
      border: 1px solid var(--border);
      color: var(--text);
      transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
      transition: transform 0.4s var(--ease-out), border-color 0.3s, box-shadow 0.3s;

      &:hover {
        border-color: var(--accent);
        box-shadow: 0 12px 32px -8px color-mix(in srgb, var(--accent) 30%, transparent);
        color: var(--text);
      }
    }

    .sc-media {
      position: relative;
      width: 100%;
      height: 220px;
      background: var(--bg-2);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        transition: transform 0.5s ease;
      }

      .tag-badge {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 2;
      }
    }

    .sub-card:hover .sc-media img {
      transform: scale(1.05);
    }

    .sc-body {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;

      .card-eyebrow {
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 6px;
      }

      .card-title {
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 10px;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.7em;
      }

      .card-desc {
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.5;
        margin-bottom: 20px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        flex: 1;
      }

      .sc-author {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.82rem;
        color: var(--text-2);
        margin-top: auto;
      }
    }
  `]
})
export class CommunityComponent {
  private api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly cats = inject(CategoryStore);
  readonly cat = signal('');
  readonly page = signal(1);
  readonly result = signal<Paged<Submission> | null>(null);
  constructor() {
    effect(() => { const q = { category: this.cat(), page: this.page(), pageSize: 9 }; untracked(() => this.api.approvedSubmissions(q).subscribe(r => this.result.set(r))); });
  }
}
