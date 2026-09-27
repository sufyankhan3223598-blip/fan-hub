import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Analytics, NamedSeries } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SpinnerComponent } from '../../shared/components/basics';
import { AreaChartComponent, BarChartComponent, DonutChartComponent } from '../../shared/components/charts';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';
import { CountUpDirective } from '../../core/directives/directives';

function iso(d: Date): string { return d.toISOString().slice(0, 10); }

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, SpinnerComponent, AreaChartComponent, BarChartComponent, DonutChartComponent, AssetPipe, CompactNumberPipe, CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <div class="admin-head">
        <div><span class="eyebrow">Insights</span><h1 class="display-md">Analytics</h1><p>Usage statistics for the selected period.</p></div>
        <div class="range panel">
          @for (p of presets; track p.d) { <button type="button" class="chip" [class.active]="preset() === p.d" (click)="setPreset(p.d)">{{ p.l }}</button> }
          <label><span class="sr-only">From</span><input class="input-fh" type="date" [(ngModel)]="from" [max]="to" (change)="preset.set(0); load()" /></label>
          <span class="text-muted-fh">to</span>
          <label><span class="sr-only">To</span><input class="input-fh" type="date" [(ngModel)]="to" [min]="from" (change)="preset.set(0); load()" /></label>
          <button type="button" class="btn-fh btn-sm" (click)="exportCsv()" [disabled]="!a()"><app-icon name="download" /> CSV</button>
        </div>
      </div>
      @if (a(); as a) {
        <div class="kpi-grid">
          @for (k of totals(); track k.label) {
            <div class="kpi" [style.--accent]="k.color"><span class="kpi-icon"><app-icon [name]="k.icon" /></span><span class="kpi-label">{{ k.label }}</span><span class="kpi-value" [appCountUp]="k.value"></span><span class="text-muted-fh small">{{ a.labels.length }} days</span></div>
          }
        </div>
        <div class="dash-grid mt-4">
          <div class="panel span-12">
            <div class="panel-title"><h3>Daily trend</h3>
              <div class="tabs-fh">@for (m of metrics; track m.key) { <button type="button" [class.active]="metric() === m.key" (click)="metric.set(m.key)">{{ m.label }}</button> }</div></div>
            <app-area-chart [series]="series()" [labels]="a.labels" ariaLabel="Daily trend for selected metric" />
          </div>
          <div class="panel span-4"><div class="panel-title"><h3>Popular categories</h3></div><app-donut-chart [slices]="a.popularCategories" centerLabel="Views" /></div>
          <div class="panel span-4"><div class="panel-title"><h3>Views by section</h3></div><app-bar-chart [slices]="a.viewsByType" /></div>
          <div class="panel span-4"><div class="panel-title"><h3>Chatbot intents</h3></div><app-donut-chart [slices]="a.chatbotIntents" centerLabel="Queries" /></div>
          <div class="panel span-6">
            <div class="panel-title"><h3>Most viewed</h3></div>
            @for (t of a.mostViewed; track t.itemType + t.itemId; let i = $index) {
              <a class="rank" [routerLink]="t.url"><b>{{ i + 1 }}</b><img [src]="t.imageUrl | asset" alt="" /><span><strong>{{ t.title }}</strong><small>{{ t.itemType }} &middot; {{ t.categoryName }}</small></span><em>{{ t.views | compact }} views</em></a>
            } @empty { <p class="text-muted-fh">No views in this period.</p> }
          </div>
          <div class="panel span-6">
            <div class="panel-title"><h3>Most viewed merchandise</h3></div>
            @for (t of a.mostViewedMerchandise; track t.itemId; let i = $index) {
              <a class="rank" [routerLink]="t.url"><b>{{ i + 1 }}</b><img [src]="t.imageUrl | asset" alt="" /><span><strong>{{ t.title }}</strong><small>{{ t.categoryName }}</small></span><em>{{ t.views | compact }} views</em></a>
            } @empty { <p class="text-muted-fh">No merchandise views in this period.</p> }
          </div>
          <div class="panel span-6"><div class="panel-title"><h3>Feedback by type</h3></div><app-bar-chart [slices]="a.feedbackByType" /></div>
          <div class="panel span-6">
            <div class="panel-title"><h3>Top chatbot FAQs</h3><a routerLink="/admin/chatbot" class="link-arrow">Knowledge base <app-icon name="arrow-right" /></a></div>
            @for (f of a.topFaqs; track f.question) { <div class="faq-row"><span>{{ f.question }}</span><b>{{ f.hits }}</b></div> }
          </div>
        </div>
      } @else { <app-spinner label="Crunching numbers" /> }
    </div>`,
  styles: [`
    .range { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px; .input-fh { height: 38px; width: 150px; padding: 0 10px; } }
    .rank { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); color: var(--text);
      b { width: 24px; color: var(--gold-2); font-family: var(--font-display); } img { width: 40px; height: 52px; border-radius: 8px; object-fit: cover; }
      span { flex: 1; min-width: 0; display: flex; flex-direction: column; strong { font-family: var(--font-ui); } small { color: var(--muted); } } em { font-style: normal; color: var(--muted); font-size: .85rem; white-space: nowrap; }
      &:hover { color: var(--gold-2); } }
    .faq-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); font-size: .92rem; b { color: var(--cyan); } }

    :host-context([data-theme='light']) {
      .admin-head {
        h1 { color: #0E0F16 !important; }
        p { color: #565A6E !important; }
        .eyebrow { color: #9E7412 !important; }
      }
      .panel {
        background: #FFFFFF !important;
        border: 1px solid rgba(158, 116, 18, 0.22) !important;
        box-shadow: 0 12px 28px rgba(25, 20, 10, 0.06), inset 0 1px 0 #ffffff !important;
      }
      .panel-title h3 {
        color: #0E0F16 !important;
      }
      .range.panel {
        background: #FFFFFF !important;
        border: 1px solid rgba(158, 116, 18, 0.25) !important;

        .input-fh {
          background: #FAF8F2 !important;
          border-color: rgba(158, 116, 18, 0.25) !important;
          color: #0E0F16 !important;
        }
      }
      .rank {
        border-bottom-color: rgba(24, 22, 18, 0.1) !important;
        color: #0E0F16 !important;
        b { color: #9E7412 !important; }
        span strong { color: #0E0F16 !important; }
        span small { color: #565A6E !important; }
        em { color: #565A6E !important; }
      }
      .faq-row {
        border-bottom-color: rgba(24, 22, 18, 0.1) !important;
        span { color: #0E0F16 !important; }
        b { color: #0284C7 !important; }
      }
    }
  `]
})
export class AdminAnalyticsComponent {
  private api = inject(ApiService);
  readonly presets = [{ d: 7, l: '7 days' }, { d: 30, l: '30 days' }, { d: 90, l: '90 days' }];
  readonly metrics = [
    { key: 'views', label: 'Views', color: '#D4AF37' }, { key: 'activeUsers', label: 'Active users', color: '#22C55E' },
    { key: 'newUsers', label: 'New users', color: '#7C3AED' }, { key: 'chatbotQueries', label: 'Chatbot', color: '#22D3EE' }
  ] as const;
  readonly a = signal<Analytics | null>(null);
  readonly preset = signal(30);
  readonly metric = signal<'views' | 'activeUsers' | 'newUsers' | 'chatbotQueries'>('views');
  from = iso(new Date(Date.now() - 29 * 864e5));
  to = iso(new Date());

  readonly totals = computed(() => {
    const a = this.a(); if (!a) return [];
    return [
      { label: 'Active users', value: a.totalActiveUsers, icon: 'users', color: '#22C55E' },
      { label: 'Page views', value: a.totalViews, icon: 'eye', color: '#D4AF37' },
      { label: 'Chatbot queries', value: a.totalChatbotQueries, icon: 'bot', color: '#22D3EE' },
      { label: 'New users', value: a.totalNewUsers, icon: 'sparkles', color: '#7C3AED' }
    ];
  });
  readonly series = computed<NamedSeries[]>(() => {
    const a = this.a(); if (!a) return [];
    const m = this.metrics.find(x => x.key === this.metric())!;
    return [{ name: m.label, color: m.color, values: a[m.key] }];
  });

  constructor() { this.load(); }

  setPreset(days: number): void {
    this.preset.set(days);
    this.from = iso(new Date(Date.now() - (days - 1) * 864e5));
    this.to = iso(new Date());
    this.load();
  }
  load(): void { this.a.set(null); this.api.adminAnalytics(this.from, this.to).subscribe(a => this.a.set(a)); }

  exportCsv(): void {
    const a = this.a(); if (!a) return;
    const rows = [['Date', 'Views', 'Active users', 'New users', 'Chatbot queries'], ...a.labels.map((l, i) => [l, a.views[i], a.activeUsers[i], a.newUsers[i], a.chatbotQueries[i]])];
    const blob = new Blob([rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fanhubplus-analytics-${this.from}-to-${this.to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
