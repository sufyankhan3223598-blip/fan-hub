import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { FanEventDetail } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, CountdownComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent, ShareComponent } from '../../shared/components/actions';
import { EventMapComponent } from '../../shared/components/map.component';
import { AssetPipe, RichAssetsPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, CountdownComponent, LockedComponent, SpinnerComponent, BookmarkButtonComponent, ShareComponent, EventMapComponent, AssetPipe, RichAssetsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (e(); as e) {
      <div [style.--accent]="e.accentColor">
        <section class="cine-hero" style="min-height:70vh">
          <div class="cine-bg"><img [src]="e.imageUrl | asset" [alt]="e.title" /></div>
          <div class="container-fh"><div class="cine-content">
            <app-breadcrumbs [items]="[{ label: 'Events', url: '/events' }, { label: e.city }, { label: e.title }]" />
            <h1 class="cine-title">{{ e.title }}</h1>
            <div class="meta-row"><span class="pill">{{ e.eventType }}</span><span><app-icon name="calendar" /> {{ e.startDate | date: 'mediumDate' }} - {{ e.endDate | date: 'mediumDate' }}</span><span class="sep"></span><span><app-icon name="map-pin" /> {{ e.venue }}, {{ e.city }}, {{ e.country }}</span></div>
            <p class="cine-synopsis">{{ e.description }}</p>
            <app-countdown [target]="e.startDate" />
            <div class="cine-actions mt-4">
              @if (e.ticketUrl) { <a class="btn-fh btn-gold" [href]="e.ticketUrl" target="_blank" rel="noopener"><app-icon name="ticket" /> Get tickets</a> }
              @else { <a class="btn-fh btn-gold" routerLink="/login" [queryParams]="{ returnUrl: '/events/' + e.slug }"><app-icon name="lock" /> Login for tickets</a> }
              <app-bookmark-button itemType="Event" [itemId]="e.id" [title]="e.title" />
              <app-share [title]="e.title" [path]="'/events/' + e.slug" />
            </div>
          </div></div>
        </section>
        <section class="container-fh pb-5">
          <div class="detail-dashboard">
            <!-- TOP ROW: 2 equal-sized cards (Story on left, Nearby Events on right) -->
            <div class="detail-cards-row">
              <!-- CARD 1: THE STORY -->
              <div class="story-card panel">
                <div class="card-head">
                  <div class="head-title">
                    <div class="gold-icon-halo">
                      <app-icon name="book-open" class="head-icon" />
                    </div>
                    <div>
                      <span class="card-subtitle">Event Overview</span>
                      <h3>The Story</h3>
                    </div>
                  </div>
                  <span class="badge-category">{{ e.eventType }}</span>
                </div>
                <div class="card-body-content">
                  <div class="rich-text" [innerHTML]="e.story | richAssets"></div>
                  @if (e.locked) {
                    <app-locked title="Full story & tickets for members" [returnUrl]="'/events/' + e.slug" />
                  }
                </div>
              </div>

              <!-- CARD 2: NEARBY EVENTS -->
              <div class="nearby-card panel">
                <div class="card-head">
                  <div class="head-title">
                    <div class="gold-icon-halo">
                      <app-icon name="compass" class="head-icon" />
                    </div>
                    <div>
                      <span class="card-subtitle">Local Discovery</span>
                      <h3>Nearby Events</h3>
                    </div>
                  </div>
                  <span class="badge-count">{{ e.nearby.length }} Nearby</span>
                </div>
                <div class="card-body-content nearby-scroll">
                  @for (n of e.nearby; track n.id) {
                    <a class="near-card" [routerLink]="['/events', n.slug]" [style.--accent]="n.accentColor">
                      <div class="near-img-wrap">
                        <img [src]="n.imageUrl | asset" [alt]="n.title" loading="lazy" />
                      </div>
                      <div class="near-info">
                        <strong>{{ n.title }}</strong>
                        <div class="near-meta">
                          <span class="near-city"><app-icon name="map-pin" /> {{ n.city }}</span>
                          <span class="near-sep">&middot;</span>
                          <span class="near-date">{{ n.startDate | date: 'mediumDate' }}</span>
                          @if (n.distanceKm != null) {
                            <span class="near-dist-badge">{{ n.distanceKm }} km</span>
                          }
                        </div>
                      </div>
                      <span class="near-arrow"><app-icon name="arrow-right" /></span>
                    </a>
                  } @empty {
                    <div class="empty-near">
                      <app-icon name="map-pin" />
                      <p>No other events scheduled nearby right now.</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- BOTTOM ROW: Full Width Map (dono cards ke barabar width) -->
            <div class="detail-map-section panel">
              <div class="map-head">
                <div class="d-flex align-items-center gap-3">
                  <span class="radar-ping">
                    <span class="ping-circle"></span>
                    <span class="ping-dot"></span>
                  </span>
                  <div>
                    <span class="map-eyebrow">LOCATION & VENUE RADAR</span>
                    <h3 class="map-heading">Interactive Event Venue Map</h3>
                  </div>
                </div>
                <div class="venue-pill">
                  <app-icon name="map-pin" />
                  <span>{{ e.venue }}, {{ e.city }}, {{ e.country }}</span>
                </div>
              </div>
              <div class="map-frame">
                <app-event-map [events]="[e]" [focus]="e" style="--map-h: 420px" />
              </div>
            </div>
          </div>
        </section>
      </div>
    } @else { <div class="page"><app-spinner label="Loading event" /></div> }`,
  styles: [`
    .detail-dashboard {
      display: flex;
      flex-direction: column;
      gap: 32px;
      margin-top: 10px;
    }
    .detail-cards-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      align-items: stretch;
      @media (max-width: 991px) {
        grid-template-columns: 1fr;
      }
    }
    .story-card, .nearby-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: 22px;
      background: radial-gradient(circle at 10% 20%, rgba(245, 200, 106, 0.05), transparent 45%),
                  linear-gradient(135deg, rgba(16, 16, 26, 0.94) 0%, rgba(9, 9, 15, 0.98) 100%);
      border: 1px solid rgba(245, 200, 106, 0.22);
      box-shadow: 0 16px 45px -12px rgba(0, 0, 0, 0.75);
      padding: 24px 26px;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }
    .head-title {
      display: flex;
      align-items: center;
      gap: 14px;
      h3 {
        font-family: var(--font-display);
        font-size: 1.25rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #ffffff;
        margin: 0;
      }
      .card-subtitle {
        display: block;
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #F5C86A;
        margin-bottom: 2px;
      }
    }
    .gold-icon-halo {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(245, 200, 106, 0.12);
      border: 1px solid rgba(245, 200, 106, 0.35);
      box-shadow: 0 0 16px rgba(245, 200, 106, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F5C86A;
      font-size: 18px;
    }
    .badge-category, .badge-count {
      font-family: var(--font-ui);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(245, 200, 106, 0.12);
      color: #F5C86A;
      border: 1px solid rgba(245, 200, 106, 0.35);
    }
    .card-body-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .nearby-scroll {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 4px;
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 200, 106, 0.35) transparent;
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(245, 200, 106, 0.35); border-radius: 4px; }
    }
    .near-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(14, 14, 22, 0.75);
      color: var(--text);
      text-decoration: none;
      transition: all 0.25s ease;
      .near-img-wrap {
        width: 90px;
        height: 64px;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
        flex-shrink: 0;
        img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
      }
      .near-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
        strong {
          color: #ffffff;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .near-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: #94a3b8;
        flex-wrap: wrap;
        app-icon { font-size: 13px; color: #F5C86A; }
      }
      .near-dist-badge {
        font-size: 0.7rem;
        font-weight: 700;
        color: #38BDF8;
        background: rgba(56, 189, 248, 0.12);
        padding: 1px 6px;
        border-radius: 4px;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }
      .near-arrow {
        color: rgba(255, 255, 255, 0.4);
        transition: transform 0.2s, color 0.2s;
        font-size: 16px;
      }
      &:hover {
        border-color: rgba(245, 200, 106, 0.45);
        background: rgba(245, 200, 106, 0.08);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        .near-img-wrap img { transform: scale(1.06); }
        .near-arrow { color: #F5C86A; transform: translateX(3px); }
      }
    }
    .empty-near {
      padding: 30px 16px;
      text-align: center;
      color: #94a3b8;
      app-icon { font-size: 32px; color: #F5C86A; margin-bottom: 8px; opacity: 0.6; }
      p { margin: 0; font-size: 0.88rem; }
    }
    .detail-map-section {
      border-radius: 22px;
      background: radial-gradient(circle at 10% 20%, rgba(245, 200, 106, 0.05), transparent 45%),
                  linear-gradient(135deg, rgba(16, 16, 26, 0.94) 0%, rgba(9, 9, 15, 0.98) 100%);
      border: 1px solid rgba(245, 200, 106, 0.22);
      box-shadow: 0 16px 45px -12px rgba(0, 0, 0, 0.75);
      padding: 24px 26px;
      overflow: hidden;
    }
    .map-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }
    .map-eyebrow {
      display: block;
      font-family: var(--font-ui);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #F5C86A;
      margin-bottom: 2px;
    }
    .map-heading {
      font-family: var(--font-display);
      font-size: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #ffffff;
      margin: 0;
    }
    .radar-ping {
      position: relative;
      width: 14px;
      height: 14px;
      display: inline-block;
      .ping-dot {
        position: absolute; inset: 2px; border-radius: 50%;
        background: #F5C86A; box-shadow: 0 0 10px #F5C86A;
      }
      .ping-circle {
        position: absolute; inset: -4px; border-radius: 50%;
        border: 2px solid #F5C86A; opacity: 0.7;
        animation: radarPing 2s infinite cubic-bezier(0, 0, 0.2, 1);
      }
    }
    @keyframes radarPing {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .venue-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 999px;
      background: rgba(14, 14, 22, 0.8);
      border: 1px solid rgba(245, 200, 106, 0.3);
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.82rem;
      font-weight: 600;
      app-icon { color: #F5C86A; }
    }
    .map-frame {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(245, 200, 106, 0.25);
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.85);
    }
  `]
})
export class EventDetailComponent {
  private api = inject(ApiService);
  private title = inject(Title);
  readonly slug = input.required<string>();
  readonly e = signal<FanEventDetail | null>(null);
  constructor() {
    effect(() => { const s = this.slug(); untracked(() => { this.e.set(null); this.api.event(s).subscribe(e => { this.e.set(e); this.title.setTitle(`${e.title} | Fan Hub Plus`); }); }); });
  }
}
