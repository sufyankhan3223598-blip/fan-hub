import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { ArticleDetail } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent, ShareComponent } from '../../shared/components/actions';
import { AssetPipe, CompactNumberPipe, RichAssetsPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, LockedComponent, SpinnerComponent, BookmarkButtonComponent, ShareComponent, AssetPipe, CompactNumberPipe, RichAssetsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reading-bar" [style.width.%]="progress()" aria-hidden="true"></div>
    @if (a(); as a) {
      <article [style.--accent]="a.accentColor">
        <header class="art-hero">
          <img [src]="a.imageUrl | asset" [alt]="a.title" />
          <div class="container-fh art-head">
            <app-breadcrumbs [items]="[{ label: 'Articles', url: '/articles' }, { label: a.categoryName, url: '/realm/' + a.categorySlug }, { label: a.title }]" />
            <span class="eyebrow mt-3">{{ a.categoryName }}</span>
            <h1 class="display-lg mt-2">{{ a.title }}</h1>
            <p class="lead">{{ a.excerpt }}</p>
            <div class="meta-row"><span><app-icon name="feather" /> {{ a.authorName }}</span><span class="sep"></span><span>{{ a.publishedAt | date: 'longDate' }}</span><span class="sep"></span><span><app-icon name="clock" /> {{ a.readMinutes }} min read</span><span class="sep"></span><span><app-icon name="eye" /> {{ a.viewCount | compact }}</span></div>
          </div>
        </header>

        <!-- Premium Timeline Ribbon placed in the empty space above the text -->
        @if (a.timeline.length) {
          <div class="container-fh pt-4">
            <div class="timeline-ribbon">
              <div class="ribbon-header">
                <div class="d-flex align-items-center gap-2">
                  <span class="ribbon-eyebrow"><app-icon name="activity" /> FANDOM CHRONICLE</span>
                  <h3>Timeline Highlights</h3>
                </div>
                <span class="ribbon-count">{{ a.timeline.length }} Key Milestones</span>
              </div>
              <div class="ribbon-track-wrapper">
                <div class="ribbon-track">
                  @for (t of a.timeline; track t.id || $index; let i = $index) {
                    <div class="ribbon-node">
                      <div class="node-marker">
                        <span class="node-dot"></span>
                        <span class="node-year">{{ t.dateLabel }}</span>
                      </div>
                      <div class="node-content">
                        <h4>{{ t.title }}</h4>
                        <p>{{ t.description }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <div class="container-fh art-grid">
          <div class="art-main">
            <div class="rich-text" [innerHTML]="cleanBody() | richAssets"></div>
            @if (a.locked) { <app-locked title="Keep reading as a member" message="Sign in to read the full article and every timeline highlight." [returnUrl]="'/articles/' + a.slug" /> }
            <div class="d-flex gap-2 mt-4 flex-wrap">
              <app-bookmark-button itemType="Article" [itemId]="a.id" [title]="a.title" variant="full" />
              <app-share [title]="a.title" [path]="'/articles/' + a.slug" [full]="true" />
            </div>
          </div>
          <aside class="art-side">
            <!-- ONLY THE PICTURE on the right side -->
            @if (spotlight(); as sp) {
              <div class="side-picture-card">
                <div class="side-img-wrapper">
                  <img [src]="sp.src | asset" [alt]="sp.alt" loading="lazy" />
                </div>
                @if (sp.caption) {
                  <figcaption>{{ sp.caption }}</figcaption>
                }
              </div>
            }
          </aside>
        </div>
        @if (a.related.length) {
          <div class="container-fh pb-5">
            <h3 class="mb-3" style="letter-spacing:.1em;text-transform:uppercase;font-size:1.1rem">Keep reading</h3>
            <div class="related">
              @for (r of a.related; track r.id) {
                <a [routerLink]="['/articles', r.slug]" class="rel" [style.--accent]="r.accentColor">
                  <img [src]="r.imageUrl | asset" alt="" loading="lazy" /><span><small>{{ r.categoryName }}</small><strong>{{ r.title }}</strong></span>
                </a>
              }
            </div>
          </div>
        }
      </article>
    } @else { <div class="page"><app-spinner label="Loading article" /></div> }`,
  styles: [`
    .reading-bar { position: fixed; left: 0; top: 0; height: 3px; z-index: 1200; background: linear-gradient(90deg, #F5C86A, #22D3EE); box-shadow: 0 0 12px #F5C86A; transition: width .1s linear; }
    .art-hero {
      position: relative; min-height: 60vh; display: flex; align-items: flex-end; padding: calc(var(--nav-h) + 40px) 0 60px; overflow: hidden;
      > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; filter: brightness(0.65); transform: scale(1.03); }
      &::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 30%, transparent 20%, #050508 95%), linear-gradient(0deg, #050508 10%, rgba(5, 5, 8, 0.7) 60%, transparent 100%); }
    }
    .art-head { max-width: 860px; margin-left: 0; }
    .art-head .eyebrow { color: #F5C86A; font-weight: 800; letter-spacing: 0.18em; text-shadow: 0 0 10px rgba(245, 200, 106, 0.35); }
    .art-head h1 { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3rem); color: #ffffff; text-transform: uppercase; letter-spacing: -0.01em; margin: 12px 0 16px; }
    .art-head .lead { font-size: 1.15rem; color: rgba(255, 255, 255, 0.85); line-height: 1.6; }
    .art-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 380px;
      gap: 48px;
      padding-top: 40px;
      padding-bottom: 70px;
      align-items: start;
      @media (max-width: 991px) { grid-template-columns: 1fr; }
    }
    .art-side {
      position: sticky;
      top: calc(var(--nav-h) + 20px);
      align-self: start;
      max-height: calc(100vh - var(--nav-h) - 30px);
      overflow-y: auto;
      padding-right: 6px;
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 200, 106, 0.35) transparent;
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(245, 200, 106, 0.35); border-radius: 4px; }
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .timeline-ribbon {
      border-radius: 20px;
      background: radial-gradient(circle at 10% 20%, rgba(245, 200, 106, 0.08), transparent 50%),
                  linear-gradient(135deg, rgba(16, 16, 26, 0.95) 0%, rgba(9, 9, 14, 0.98) 100%);
      border: 1px solid rgba(245, 200, 106, 0.28);
      box-shadow: 0 16px 45px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 200, 106, 0.06);
      padding: 22px 26px;
      position: relative;
      overflow: hidden;

      &::before {
        content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 200, 106, 0.8), transparent);
      }
    }
    .ribbon-header {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
      margin-bottom: 22px; padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      .ribbon-eyebrow {
        font-family: var(--font-ui); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.2em;
        text-transform: uppercase; color: #F5C86A; display: flex; align-items: center; gap: 8px;
      }
      h3 {
        font-family: var(--font-display); font-size: clamp(1.15rem, 2vw, 1.4rem);
        text-transform: uppercase; letter-spacing: 0.06em; color: #ffffff; margin: 0;
      }
      .ribbon-count {
        font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
        padding: 4px 12px; border-radius: 999px;
        background: rgba(245, 200, 106, 0.12); color: #F5C86A; border: 1px solid rgba(245, 200, 106, 0.35);
      }
    }
    .ribbon-track-wrapper { position: relative; }
    .ribbon-track {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 18px;
      position: relative;
      z-index: 2;
      @media (max-width: 768px) { grid-template-columns: 1fr; gap: 14px; }
    }
    .ribbon-node {
      display: flex; flex-direction: column; gap: 10px;
      background: rgba(12, 12, 20, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 14px 16px;
      transition: all 0.3s ease;
      &:hover {
        border-color: rgba(245, 200, 106, 0.45);
        background: rgba(245, 200, 106, 0.06);
        transform: translateY(-3px);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
      }
    }
    .node-marker {
      display: flex; align-items: center; gap: 10px;
      .node-dot {
        width: 12px; height: 12px; border-radius: 50%;
        background: #F5C86A; box-shadow: 0 0 10px #F5C86A;
        border: 2px solid #09090e; flex-shrink: 0;
      }
      .node-year {
        font-family: var(--font-ui); font-size: 0.8rem; font-weight: 800; letter-spacing: 0.1em;
        color: #F5C86A; background: rgba(245, 200, 106, 0.15); padding: 2px 10px; border-radius: 6px;
      }
    }
    .node-content {
      h4 {
        font-family: var(--font-display); font-size: 0.95rem; color: #ffffff;
        margin: 0 0 6px; letter-spacing: 0.02em; line-height: 1.3;
      }
      p {
        font-size: 0.82rem; color: rgba(255, 255, 255, 0.72); margin: 0; line-height: 1.45;
      }
    }
    .side-picture-card {
      border-radius: 18px;
      overflow: hidden;
      background: #09090e;
      border: 1px solid rgba(245, 200, 106, 0.28);
      box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 200, 106, 0.08);
      padding: 12px;
      position: sticky;
      top: calc(var(--nav-h) + 20px);
      align-self: start;

      .side-img-wrapper {
        border-radius: 12px;
        overflow: hidden;
        background: #000;
        img {
          width: 100%; height: auto; max-height: 520px; object-fit: contain; display: block;
          transition: transform 0.4s var(--ease-out);
        }
        &:hover img { transform: scale(1.025); }
      }
      figcaption {
        font-size: 0.86rem; color: #94a3b8; font-style: italic; margin-top: 12px; text-align: center; line-height: 1.4;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        &::before, &::after { content: ''; width: 14px; height: 1px; background: rgba(245, 200, 106, 0.5); }
      }
    }
    .related { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .rel {
      display: flex; gap: 14px; align-items: center; padding: 12px; border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(12, 12, 20, 0.8); color: var(--text);
      transition: all 0.25s ease;
      img { width: 100px; height: 75px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
      span { display: flex; flex-direction: column; gap: 4px; }
      small { color: #F5C86A; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: .7rem; }
      strong { color: #ffffff; font-size: 0.92rem; line-height: 1.35; }
      &:hover { border-color: #F5C86A; background: rgba(245, 200, 106, 0.08); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
    }
  `]
})
export class ArticleDetailComponent {
  private api = inject(ApiService);
  private title = inject(Title);
  readonly slug = input.required<string>();
  readonly a = signal<ArticleDetail | null>(null);
  readonly progress = signal(0);

  readonly spotlight = computed(() => {
    const art = this.a();
    if (!art) return null;
    const m = art.body.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*?>[\s\S]*?(?:<figcaption>([\s\S]*?)<\/figcaption>)?[\s\S]*?<\/figure>/i);
    if (m) {
      return {
        src: m[1],
        alt: m[2] || art.title,
        caption: m[3] ? m[3].replace(/<[^>]+>/g, '').trim() : null
      };
    }
    return {
      src: art.hoverImageUrl || art.imageUrl,
      alt: art.title,
      caption: `${art.title} archive spotlight`
    };
  });

  readonly cleanBody = computed(() => {
    const art = this.a();
    if (!art) return '';
    return art.body.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
  });

  constructor() {
    effect(() => {
      const s = this.slug();
      untracked(() => {
        this.a.set(null);
        this.api.article(s).subscribe(a => {
          this.a.set(a);
          this.title.setTitle(`${a.title} | Fan Hub Plus`);
        });
      });
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const h = document.documentElement.scrollHeight - innerHeight;
    this.progress.set(h > 0 ? Math.min(100, (scrollY / h) * 100) : 0);
  }
}

