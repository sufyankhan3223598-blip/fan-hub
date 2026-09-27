import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CategoryStore } from '../../core/services/stores';
import { ArticleCard, Paged } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent, PaginationComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent } from '../../shared/components/actions';
import { TiltDirective, RevealDirective } from '../../core/directives/directives';
import { AssetPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, EmptyStateComponent, PaginationComponent, BookmarkButtonComponent, TiltDirective, RevealDirective, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page articles-page">
      <div class="container-fh">
        <app-breadcrumbs [items]="[{ label: 'Featured Articles' }]" />
        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mt-3 mb-4">
          <div>
            <span class="eyebrow articles-eyebrow"><app-icon name="sparkles" /> Featured Articles Hub</span>
            <h1 class="display-lg mt-2">Stories from the multiverse</h1>
          </div>
          <div class="d-flex gap-3 align-items-center">
            <a routerLink="/events/highlights" class="btn-article-action btn-event-highlights">
              <app-icon name="sparkles" /> Event highlights
            </a>
            <a routerLink="/community" class="btn-article-action btn-fan-creations">
              <app-icon name="feather" /> Fan creations
            </a>
          </div>
        </div>
        <div class="articles-filter-bar">
          <button type="button" class="chip" [class.active]="!cat()" (click)="cat.set(''); page.set(1)">All</button>
          @for (c of cats.categories(); track c.id) {
            <button type="button" class="chip" [class.active]="cat() === c.slug" (click)="cat.set(c.slug); page.set(1)">
              {{ c.name }}
            </button>
          }
        </div>

        @if (result(); as r) {
          @if (r.items.length) {
            @if (page() === 1 && r.items[0]; as lead) {
              <a class="lead-story" [routerLink]="['/articles', lead.slug]" [style.--accent]="lead.accentColor">
                <img [src]="lead.imageUrl | asset" [alt]="lead.title" />
                <div class="ls-body">
                  <span class="eyebrow">{{ lead.categoryName }} &middot; Featured</span>
                  <h2>{{ lead.title }}</h2>
                  <p>{{ lead.excerpt }}</p>
                  <span class="ls-meta">{{ lead.authorName }} &middot; {{ lead.publishedAt | date: 'mediumDate' }} &middot; {{ lead.readMinutes }} min read</span>
                </div>
              </a>
            }
            <div class="grid-cards wide mt-4">
              @for (a of (page() === 1 ? r.items.slice(1) : r.items); track a.id; let i = $index) {
                <article class="art-card" appTilt [tiltMax]="5" appReveal [revealDelay]="i * 70" [style.--accent]="a.accentColor">
                  <a [routerLink]="['/articles', a.slug]" class="ac-media">
                    <img class="a" [src]="a.imageUrl | asset" [alt]="a.title" loading="lazy" />
                    <img class="b" [src]="a.hoverImageUrl | asset" alt="" loading="lazy" />
                  </a>
                  <div class="ac-body">
                    <span class="card-eyebrow">{{ a.categoryName }}</span>
                    <h3><a [routerLink]="['/articles', a.slug]">{{ a.title }}</a></h3>
                    <p>{{ a.excerpt }}</p>
                    <div class="ac-foot"><span>{{ a.publishedAt | date: 'mediumDate' }} &middot; {{ a.readMinutes }} min</span>
                      <app-bookmark-button itemType="Article" [itemId]="a.id" [title]="a.title" [small]="true" [lazy]="true" /></div>
                  </div>
                </article>
              }
            </div>
            <app-pagination [page]="page()" [totalPages]="r.totalPages" (pageChange)="page.set($event)" />
          } @else { <app-empty-state icon="book-open" title="No articles yet" /> }
        } @else { <div class="skeleton" style="height:420px"></div> }
      </div>
    </div>`,
  styles: [`
    .articles-page {
      min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.09) 0%, rgba(245, 200, 106, 0.05) 30%, transparent 55%), var(--bg-0);
      padding-top: calc(var(--nav-h) + 24px);
      padding-bottom: 60px;
    }
    .articles-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #F5C86A;
    }
    .btn-article-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 14px;
      font-family: var(--font-ui);
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
      transition: all 0.3s var(--ease-out);

      &.btn-event-highlights {
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid rgba(56, 189, 248, 0.35);
        color: #38BDF8;
        box-shadow: 0 4px 15px rgba(56, 189, 248, 0.12);

        &:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38BDF8;
          box-shadow: 0 6px 25px rgba(56, 189, 248, 0.28);
          transform: translateY(-2px);
        }
      }

      &.btn-fan-creations {
        background: rgba(245, 200, 106, 0.08);
        border: 1px solid rgba(245, 200, 106, 0.35);
        color: #F5C86A;
        box-shadow: 0 4px 15px rgba(245, 200, 106, 0.12);

        &:hover {
          background: rgba(245, 200, 106, 0.2);
          border-color: #F5C86A;
          box-shadow: 0 6px 25px rgba(245, 200, 106, 0.28);
          transform: translateY(-2px);
        }
      }
    }
    .articles-filter-bar {
      background: linear-gradient(160deg, rgba(17, 17, 24, 0.8) 0%, rgba(9, 9, 13, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 18px;
      border-radius: 16px;
      margin-bottom: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      backdrop-filter: blur(12px);
    }
    :host-context([data-theme='light']) .articles-filter-bar {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(158, 116, 18, 0.28);
      box-shadow: 0 16px 40px rgba(25, 20, 10, 0.1), inset 0 1px 0 #ffffff;
    }
    .lead-story {
      position: relative;
      display: block;
      border-radius: 24px;
      overflow: hidden;
      min-height: 460px;
      color: #fff;
      border: 1px solid rgba(245, 200, 106, 0.28);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 15%;
        right: 15%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 200, 106, 0.8), transparent);
        z-index: 2;
      }

      img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 1.2s var(--ease-out);
      }
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(5, 5, 8, 0.95) 25%, rgba(5, 5, 8, 0.45) 65%, transparent 100%);
      }
      &:hover img {
        transform: scale(1.05);
      }
    }
    .ls-body {
      position: relative;
      z-index: 1;
      max-width: 640px;
      padding: clamp(28px, 5vw, 60px);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 460px;

      h2 {
        color: #fff;
        font-size: clamp(1.8rem, 4vw, 3rem);
        text-transform: uppercase;
        margin: 12px 0;
      }
      p {
        color: rgba(255, 255, 255, 0.85);
        font-size: 1.05rem;
        line-height: 1.6;
      }
      .ls-meta {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.88rem;
      }
    }
    .art-card {
      --rx: 0deg;
      --ry: 0deg;
      border-radius: 20px;
      overflow: hidden;
      background: linear-gradient(160deg, #101016 0%, #09090d 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));
      transition: transform .5s var(--ease-out), border-color .3s, box-shadow .3s;

      &:hover {
        border-color: var(--accent, #F5C86A);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.85), 0 0 20px color-mix(in srgb, var(--accent, #F5C86A) 25%, transparent);
      }
    }
    .ac-media {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
      display: block;

      img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity .6s, transform .8s var(--ease-out);
      }
      .b { opacity: 0; }
      &:hover .b { opacity: 1; }
      &:hover .a { transform: scale(1.06); }
    }
    .ac-body {
      padding: 18px 20px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;

      h3 {
        font-size: 1.15rem;
        margin: 6px 0 8px;
        a { color: var(--text); }
      }
      p {
        font-size: 0.92rem;
        color: var(--muted);
        flex: 1;
      }
    }
    .card-eyebrow {
      font-family: var(--font-ui);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent, #F5C86A);
    }
    .ac-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      color: var(--muted);
    }

    :host-context([data-theme='light']) {
      .art-card {
        background: #FFFFFF;
        border: 1px solid rgba(158, 116, 18, 0.22);
        box-shadow: 0 10px 24px rgba(25, 20, 10, 0.08);

        .ac-body h3 a {
          color: #0E0F16;
          &:hover { color: var(--accent, #9E7412); }
        }
        .ac-body p {
          color: #565A6E;
        }
        .ac-foot {
          color: #8F93A7;
        }
      }
      .btn-article-action.btn-fan-creations {
        color: #7A5B0B;
        border-color: rgba(158, 116, 18, 0.4);
        background: rgba(158, 116, 18, 0.08);
      }
      .btn-article-action.btn-event-highlights {
        color: #0284C7;
        border-color: rgba(2, 132, 199, 0.4);
        background: rgba(2, 132, 199, 0.08);
      }
    }
  `]
})
export class ArticlesComponent {
  private api = inject(ApiService);
  readonly cats = inject(CategoryStore);
  readonly cat = signal('');
  readonly page = signal(1);
  readonly result = signal<Paged<ArticleCard> | null>(null);

  constructor() {
    effect(() => {
      const q = { category: this.cat(), page: this.page(), pageSize: 9 };
      untracked(() => this.api.articles(q).subscribe(r => this.result.set(r)));
    });
  }
}
