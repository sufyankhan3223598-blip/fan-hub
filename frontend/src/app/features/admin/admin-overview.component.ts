import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { AdminOverview } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SpinnerComponent } from '../../shared/components/basics';
import { AreaChartComponent, DonutChartComponent, SparklineComponent } from '../../shared/components/charts';
import { EventMapComponent } from '../../shared/components/map.component';
import { AssetPipe, CompactNumberPipe, InitialsPipe, TimeAgoPipe } from '../../core/pipes/pipes';
import { CountUpDirective } from '../../core/directives/directives';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    DatePipe, RouterLink, IconComponent, SpinnerComponent,
    AreaChartComponent, DonutChartComponent, SparklineComponent,
    EventMapComponent, AssetPipe, CompactNumberPipe, InitialsPipe,
    TimeAgoPipe, CountUpDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <!-- Royal Control Panel Header -->
      <div class="admin-head royal-head">
        <div>
          <span class="eyebrow royal-eyebrow">
            <app-icon name="crown" /> ROYAL CONTROL PANEL
          </span>
          <h1 class="admin-overview-title">Executive Overview</h1>
          <p class="admin-sub">
            <span class="live-dot-beacon"></span>
            Real-time platform telemetry for {{ today | date: 'fullDate' }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn-fh btn-sm btn-royal-glass" (click)="load()" title="Reload telemetry">
            <app-icon name="refresh" /> Refresh
          </button>
          <a routerLink="/admin/analytics" class="btn-fh btn-sm btn-royal-gold">
            <app-icon name="chart" /> Full analytics
          </a>
        </div>
      </div>

      @if (d(); as d) {
        <!-- Top 6 Royal KPI Cards -->
        <div class="kpi-grid six">
          @for (k of d.kpis; track k.key) {
            <div class="royal-kpi" [style.--accent]="meta[k.key]?.color || '#F5C86A'">
              <div class="kpi-top">
                <span class="kpi-label">{{ k.label }}</span>
                <span class="kpi-icon-badge">
                  <app-icon [name]="meta[k.key]?.icon || 'activity'" />
                </span>
              </div>

              <div class="kpi-body">
                <span class="kpi-value" [appCountUp]="k.value"></span>
                @if (k.change !== 0) {
                  <span class="kpi-pill" [class.up]="k.change > 0" [class.down]="k.change < 0">
                    <app-icon [name]="k.change > 0 ? 'arrow-up-right' : 'chevron-down'" />
                    {{ k.change > 0 ? '+' : '' }}{{ k.change }}%
                  </span>
                } @else if (meta[k.key]?.link) {
                  <a class="kpi-action-link" [routerLink]="meta[k.key]!.link">
                    Review now <app-icon name="arrow-right" />
                  </a>
                }
              </div>

              @if (k.trend.length) {
                <div class="kpi-spark-wrap">
                  <app-sparkline [values]="k.trend" [color]="meta[k.key]?.color || '#F5C86A'" />
                </div>
              }
            </div>
          }
        </div>

        <!-- Charts Grid -->
        <div class="dash-grid mt-4">
          <!-- 30-Day Traffic Trajectory Chart -->
          <div class="panel royal-panel span-8">
            <div class="panel-title">
              <div class="title-with-icon">
                <span class="panel-icon-halo"><app-icon name="activity" /></span>
                <div>
                  <h3>Traffic by section</h3>
                  <span class="sub">30-day realistic audience trajectory across multiverse realms</span>
                </div>
              </div>
            </div>
            <app-area-chart [series]="d.trafficSeries" [labels]="d.trafficLabels" [stacked]="true" ariaLabel="Stacked daily views by section" />
          </div>

          <!-- Popular Realms Donut Chart -->
          <div class="panel royal-panel span-4">
            <div class="panel-title">
              <div class="title-with-icon">
                <span class="panel-icon-halo"><app-icon name="pie" /></span>
                <div>
                  <h3>Popular realms</h3>
                  <span class="sub">30-day view share</span>
                </div>
              </div>
            </div>
            <app-donut-chart [slices]="d.popularCategories" centerLabel="Views" />
          </div>

          <!-- Top Content Table -->
          <div class="panel royal-panel span-7">
            <div class="panel-title">
              <div class="title-with-icon">
                <span class="panel-icon-halo"><app-icon name="star" /></span>
                <div>
                  <h3>Top content</h3>
                  <span class="sub">Highest rated & most viewed items</span>
                </div>
              </div>
            </div>
            <div class="table-wrap">
              <table class="table-fh royal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Realm</th>
                    <th>Views</th>
                    <th>Popularity</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of d.topContent; track t.itemType + t.itemId; let i = $index) {
                    <tr>
                      <td>
                        <span class="rank-badge" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                          {{ i + 1 }}
                        </span>
                      </td>
                      <td>
                        <a class="cell-title" [routerLink]="t.url">
                          <img class="thumb" [src]="t.imageUrl | asset" alt="" />
                          <span>
                            <strong>{{ t.title }}</strong>
                            <small>{{ t.itemType }}</small>
                          </span>
                        </a>
                      </td>
                      <td>
                        <span class="realm-tag" [style.--accent]="t.accentColor">
                          <span class="dot" [style.background]="t.accentColor"></span>
                          {{ t.categoryName }}
                        </span>
                      </td>
                      <td>
                        <strong class="view-num">{{ t.views | compact }}</strong>
                      </td>
                      <td>
                        <div class="score royal-score">
                          <span [style.width.%]="t.popularityScore" [style.background]="t.accentColor"></span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Live Activity Feed -->
          <div class="panel royal-panel span-5">
            <div class="panel-title">
              <div class="title-with-icon">
                <span class="panel-icon-halo"><app-icon name="zap" /></span>
                <div>
                  <h3>Live activity</h3>
                  <span class="sub">Real-time user actions</span>
                </div>
              </div>
              <span class="live-pill"><i class="radar-ping-dot"></i> Auto-refresh</span>
            </div>
            <ul class="feed royal-feed">
              @for (a of d.liveActivity; track a.id) {
                <li>
                  <span class="avatar sm royal-avatar">
                    @if (a.userAvatarUrl) {
                      <img [src]="a.userAvatarUrl | asset" alt="" />
                    } @else {
                      {{ a.userName | initials }}
                    }
                  </span>
                  <div>
                    <span><strong>{{ a.userName || 'Visitor' }}</strong> {{ a.description }}</span>
                    <small>{{ a.activityType }} &middot; {{ a.createdAt | timeAgo }}</small>
                  </div>
                </li>
              } @empty {
                <li class="text-muted-fh">No activity recorded yet.</li>
              }
            </ul>
          </div>

          <!-- Events Worldwide Map -->
          <div class="panel royal-panel span-12">
            <div class="panel-title">
              <div class="title-with-icon">
                <span class="panel-icon-halo"><app-icon name="globe" /></span>
                <div>
                  <h3>Events worldwide</h3>
                  <span class="sub">Multiverse conventions, premiere screenings & fan meetups</span>
                </div>
              </div>
              <a routerLink="/admin/manage/events" class="link-arrow">
                Manage events <app-icon name="arrow-right" />
              </a>
            </div>
            <div class="map-box"><app-event-map [events]="d.events" /></div>
          </div>

        </div>
      } @else {
        <app-spinner label="Connecting to Royal Control Panel" />
      }
    </div>`,
  styles: [`



    .royal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 22px;
      gap: 16px;
      flex-wrap: wrap;

      .royal-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #F5C86A;
        margin-bottom: 4px;
        filter: drop-shadow(0 0 6px rgba(245, 200, 106, 0.4));
      }

      .admin-overview-title {
        font-family: var(--font-display, var(--font-ui));
        font-size: 2.1rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin: 2px 0 4px;
        background: linear-gradient(135deg, #ffffff 40%, #FFE29F 80%, #F5C86A 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.15;
      }

      .admin-sub {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        color: rgba(255, 255, 255, 0.65);
        margin: 0;

        .live-dot-beacon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 10px #10B981;
          animation: beaconPulse 1.8s infinite;
        }
      }
    }

    @keyframes beaconPulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }

    .btn-royal-glass {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(245, 200, 106, 0.25);
      color: #ffffff;
      padding: 7px 15px;
      border-radius: 999px;
      font-weight: 600;
      transition: all 0.22s ease;

      &:hover {
        background: rgba(245, 200, 106, 0.12);
        border-color: #F5C86A;
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      }
    }

    .btn-royal-gold {
      background: linear-gradient(135deg, #FFE29F 0%, #F5C86A 50%, #C8961E 100%);
      color: #0d0c15;
      padding: 7px 18px;
      border-radius: 999px;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 4px 16px rgba(245, 200, 106, 0.45);
      transition: all 0.22s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      &:hover {
        background: linear-gradient(135deg, #FFF0CA 0%, #FFD078 50%, #DBA829 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 22px rgba(245, 200, 106, 0.65);
        color: #0b0a06;
      }
    }




    .royal-kpi {
      position: relative;
      padding: 16px 18px 12px;
      border-radius: 18px;
      background: linear-gradient(150deg, #0d0d10 0%, #050507 100%);
      border: 1px solid rgba(245, 200, 106, 0.18);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;


      &::before {
        content: '';
        position: absolute;
        top: -30px;
        right: -30px;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%);
        pointer-events: none;
        z-index: 0;
      }

      &:hover {
        transform: translateY(-2px);
        border-color: var(--accent);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65), 0 0 25px -6px var(--accent);
      }

      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        position: relative;
        z-index: 1;

        .kpi-label {
          font-family: var(--font-ui);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.58);
        }

        .kpi-icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 28%, transparent), rgba(255, 255, 255, 0.03));
          border: 1px solid color-mix(in srgb, var(--accent) 45%, rgba(255, 255, 255, 0.12));
          color: var(--accent);
          font-size: 16px;
          box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 30%, transparent);
          flex: none;
        }
      }

      .kpi-body {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
        position: relative;
        z-index: 1;

        .kpi-value {
          font-family: 'Inter', var(--font-ui), sans-serif !important;
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          line-height: 1.1;
        }

        .kpi-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          font-family: var(--font-mono, monospace);

          &.up {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.45);
            color: #34D399;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
          }

          &.down {
            background: rgba(244, 63, 94, 0.15);
            border: 1px solid rgba(244, 63, 94, 0.45);
            color: #FB7185;
            box-shadow: 0 0 8px rgba(244, 63, 94, 0.2);
          }
        }

        .kpi-action-link {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          transition: transform 0.2s ease;

          &:hover {
            transform: translateX(3px);
            filter: drop-shadow(0 0 6px var(--accent));
          }
        }
      }

      .kpi-spark-wrap {
        margin-top: 4px;
        position: relative;
        z-index: 1;
      }
    }




    .royal-panel {
      position: relative;
      border-radius: 22px;
      padding: 22px 24px;
      background: linear-gradient(160deg, #0b0b0e 0%, #050507 100%);
      border: 1px solid rgba(245, 200, 106, 0.2);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      overflow: hidden;


      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 10%;
        right: 10%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 200, 106, 0.6), #ffffff, rgba(245, 200, 106, 0.6), transparent);
        pointer-events: none;
      }

      .panel-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        gap: 12px;

        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;

          .panel-icon-halo {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: radial-gradient(circle, rgba(245, 200, 106, 0.25), rgba(245, 200, 106, 0.05));
            border: 1px solid rgba(245, 200, 106, 0.45);
            color: #F5C86A;
            font-size: 18px;
            box-shadow: 0 0 14px rgba(245, 200, 106, 0.25);
            flex: none;
          }

          h3 {
            font-family: var(--font-ui);
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #ffffff;
            margin: 0;
            line-height: 1.2;
          }

          .sub {
            font-size: 0.78rem;
            color: rgba(255, 255, 255, 0.52);
            margin-top: 1px;
          }
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34D399;
          font-size: 0.75rem;
          font-weight: 700;

          .radar-ping-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10B981;
            box-shadow: 0 0 8px #10B981;
            animation: pulseDot 1.6s infinite;
          }
        }
      }
    }

    @keyframes pulseDot {
      50% { opacity: 0.3; }
    }




    .royal-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;

      th {
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #9aa2b2;
        padding: 12px 14px;
        border-bottom: 2px solid rgba(245, 200, 106, 0.4);
        background: rgba(14, 14, 20, 0.98);

        &:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
      }

      td {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.11);
        vertical-align: middle;

        &:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
      }

      tbody tr {
        background: rgba(9, 9, 13, 0.6);
        &:nth-child(even) {
          background: rgba(18, 18, 26, 0.75);
        }
        &:hover td {
          background: rgba(245, 200, 106, 0.08) !important;
        }
        &:last-child td {
          border-bottom: none;
        }
      }

      .rank-badge {
        display: inline-grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.7);
        font-family: var(--font-mono, monospace);
        font-size: 0.75rem;
        font-weight: 800;

        &.gold {
          background: linear-gradient(135deg, #FFE29F, #F5C86A);
          color: #0b0a06;
          box-shadow: 0 0 10px rgba(245, 200, 106, 0.6);
        }

        &.silver {
          background: linear-gradient(135deg, #E2E8F0, #94A3B8);
          color: #0b0a06;
          box-shadow: 0 0 8px rgba(226, 232, 240, 0.5);
        }

        &.bronze {
          background: linear-gradient(135deg, #FDBA74, #C2410C);
          color: #ffffff;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
        }
      }

      .realm-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          box-shadow: 0 0 6px currentColor;
        }
      }

      .view-num {
        font-family: var(--font-mono, monospace);
        font-size: 0.88rem;
        color: #F5C86A;
      }

      .royal-score {
        width: 90px;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;

        span {
          display: block;
          height: 100%;
          border-radius: 999px;
          box-shadow: 0 0 8px currentColor;
        }
      }
    }




    .royal-feed {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 440px;
      overflow-y: auto;

      li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 8px;
        border-radius: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        font-size: 0.88rem;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        div {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;

          strong {
            color: #ffffff;
            font-family: var(--font-ui);
          }

          small {
            color: rgba(255, 255, 255, 0.45);
            font-size: 0.74rem;
            margin-top: 1px;
          }
        }
      }
    }

    .royal-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #18181b 0%, #09090b 100%);
      border: 1.5px solid rgba(245, 200, 106, 0.5);
      box-shadow: 0 0 8px rgba(245, 200, 106, 0.25);
      font-size: 0.8rem;
      font-weight: 700;
      color: #FFE699;
      flex: none;
      display: grid;
      place-items: center;
      overflow: hidden;

      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .royal-q-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 8px;
      transition: all 0.22s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(245, 200, 106, 0.25);
        transform: translateY(-1px);
      }

      > div {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;

        strong {
          color: #ffffff;
          font-family: var(--font-ui);
          font-size: 0.92rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        small {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.76rem;
          margin-top: 1px;
        }
      }

      .q-actions {
        display: flex;
        gap: 6px;

        .ok {
          border-color: rgba(16, 185, 129, 0.4);
          color: #34D399;
          &:hover { background: #10B981; color: #0d0c15; box-shadow: 0 0 12px #10B981; }
        }

        .no {
          border-color: rgba(244, 63, 94, 0.4);
          color: #FB7185;
          &:hover { background: #F43F5E; color: #ffffff; box-shadow: 0 0 12px #F43F5E; }
        }
      }
    }

    .ftype {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);

      &.bug { color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.3); }
      &.suggestion { color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
      &.query { color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }
    }

    .map-box { --map-h: 380px; border-radius: 16px; overflow: hidden; }

    :host-context([data-theme='light']) {
      .admin-overview-title {
        background: none !important;
        -webkit-text-fill-color: initial !important;
        color: #0E0F16 !important;
      }
      .admin-sub {
        color: #565A6E !important;
      }
      .btn-royal-glass {
        background: #FAF8F2 !important;
        border-color: rgba(158, 116, 18, 0.3) !important;
        color: #0E0F16 !important;
        &:hover { background: #FFFFFF !important; border-color: #9E7412 !important; }
      }
      .btn-royal-gold {
        background: linear-gradient(135deg, #B88B1E 0%, #9E7412 100%) !important;
        color: #FFFFFF !important;
        box-shadow: 0 4px 14px rgba(158, 116, 18, 0.25) !important;
      }
      .royal-kpi {
        background: #FFFFFF !important;
        border: 1px solid rgba(158, 116, 18, 0.22) !important;
        box-shadow: 0 10px 24px rgba(25, 20, 10, 0.07), inset 0 1px 0 #ffffff !important;

        .kpi-top .kpi-label {
          color: #565A6E !important;
        }
        .kpi-top .kpi-icon-badge {
          background: rgba(158, 116, 18, 0.1) !important;
          border-color: rgba(158, 116, 18, 0.3) !important;
          color: #9E7412 !important;
        }
        .kpi-body .kpi-value {
          color: #0E0F16 !important;
        }
        .kpi-action-link {
          color: #9E7412 !important;
        }
      }
      .royal-panel {
        background: #FFFFFF !important;
        border: 1px solid rgba(158, 116, 18, 0.22) !important;
        box-shadow: 0 14px 34px rgba(25, 20, 10, 0.08), inset 0 1px 0 #ffffff !important;

        &::before {
          background: linear-gradient(90deg, transparent, rgba(158, 116, 18, 0.45), transparent) !important;
        }
        .panel-title .title-with-icon h3 {
          color: #0E0F16 !important;
        }
        .panel-title .title-with-icon .panel-icon-halo {
          background: rgba(158, 116, 18, 0.1) !important;
          border-color: rgba(158, 116, 18, 0.35) !important;
          color: #9E7412 !important;
        }
        .panel-title p {
          color: #565A6E !important;
        }
      }
      .royal-feed-item {
        strong { color: #0E0F16 !important; }
        small { color: #565A6E !important; }
      }
      .royal-q-row {
        background: #FAF8F2 !important;
        border-color: rgba(158, 116, 18, 0.18) !important;
        strong { color: #0E0F16 !important; }
        small { color: #565A6E !important; }
      }
    }
  `]
})
export class AdminOverviewComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly today = new Date();
  readonly d = signal<AdminOverview | null>(null);

  readonly meta: Record<string, { icon: string; color: string; link?: string }> = {
    users: { icon: 'users', color: '#F5C86A' },
    active: { icon: 'activity', color: '#10B981' },
    content: { icon: 'layers', color: '#38BDF8' },
    pending: { icon: 'inbox', color: '#F59E0B', link: '/admin/submissions' },
    chatbot: { icon: 'bot', color: '#06B6D4' },
    feedback: { icon: 'message', color: '#F43F5E', link: '/admin/feedback' }
  };

  constructor() {
    this.load();

    const timer = setInterval(() => {
      this.api.adminOverview().subscribe(d => {
        this.d.update(o => (o ? { ...o, liveActivity: d.liveActivity, kpis: d.kpis } : d));
      });
    }, 30000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  load(): void {
    this.api.adminOverview().subscribe(d => this.d.set(d));
  }

  review(id: number, status: 'Approved' | 'Rejected'): void {
    this.api.adminReview([id], status, null).subscribe(() => {
      this.toast.success(`Submission ${status.toLowerCase()}`);
      this.d.update(o => (o ? { ...o, moderationQueue: o.moderationQueue.filter(s => s.id !== id) } : o));
    });
  }
}
