import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NamedSeries, Slice } from '../../core/models/models';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrap">
      <div class="chart-canvas-container">
        <!-- Y-Axis labels -->
        <div class="y-axis-labels" aria-hidden="true">
          @for (t of yAxisTicks(); track t.y) {
            <span class="y-label" [style.top.px]="t.y">{{ t.val }}</span>
          }
        </div>

        <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" class="area-svg" role="img" [attr.aria-label]="ariaLabel()"
          (mousemove)="onMove($event)" (mouseleave)="onLeave()">
          <defs>
            @for (s of series(); track s.name; let i = $index) {
              <linearGradient [attr.id]="uid + 'grad' + i" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" [attr.stop-color]="s.color" stop-opacity="0.35" />
                <stop offset="60%" [attr.stop-color]="s.color" stop-opacity="0.10" />
                <stop offset="100%" [attr.stop-color]="s.color" stop-opacity="0.00" />
              </linearGradient>
              <filter [attr.id]="uid + 'glow' + i" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3.5" [attr.flood-color]="s.color" flood-opacity="0.4" />
              </filter>
            }
          </defs>

          <!-- Horizontal Grid Lines -->
          @for (g of gridLines(); track g) {
            <line [attr.x1]="0" [attr.x2]="W" [attr.y1]="g" [attr.y2]="g" class="grid-line" />
          }

          <!-- Filled Areas and Strokes -->
          @for (p of paths(); track p.name; let i = $index) {
            <path [attr.d]="p.area" [attr.fill]="'url(#' + uid + 'grad' + i + ')'" class="area-fill"
              [class.dimmed]="activeSeries() !== null && activeSeries() !== p.name"
              [style.animation-delay.ms]="i * 100" />
            <path [attr.d]="p.line" [attr.stroke]="p.color" class="curve-line"
              [class.dimmed]="activeSeries() !== null && activeSeries() !== p.name"
              [class.highlighted]="activeSeries() === p.name"
              [attr.filter]="'url(#' + uid + 'glow' + i + ')'"
              [style.animation-delay.ms]="i * 100" />
          }

          <!-- Crosshair and Hover Indicators -->
          @if (hoverIdx() >= 0) {
            <line [attr.x1]="xAt(hoverIdx())" [attr.x2]="xAt(hoverIdx())" y1="0" [attr.y2]="H" class="cursor-crosshair" />
            @for (p of paths(); track p.name) {
              <circle [attr.cx]="xAt(hoverIdx())" [attr.cy]="p.ys[hoverIdx()]" r="5.5" [attr.fill]="p.color" class="hover-dot" />
              <circle [attr.cx]="xAt(hoverIdx())" [attr.cy]="p.ys[hoverIdx()]" r="8" fill="none" [attr.stroke]="p.color" stroke-width="1.5" opacity="0.6" class="hover-dot-halo" />
            }
          }
        </svg>

        <!-- Floating Glass Tooltip -->
        @if (hoverIdx() >= 0) {
          <div class="tip glass-tooltip" [style.left.%]="(hoverIdx() / Math.max(1, labels().length - 1)) * 100">
            <div class="tip-header">
              <span class="tip-date">{{ labels()[hoverIdx()] }}</span>
              <span class="tip-total">Total: <strong>{{ totalAt(hoverIdx()) }}</strong> views</span>
            </div>
            <div class="tip-rows">
              @for (s of series(); track s.name) {
                <div class="tip-row" [class.highlight]="activeSeries() === s.name">
                  <span class="tip-swatch" [style.background]="s.color"></span>
                  <span class="tip-name">{{ s.name }}</span>
                  <span class="tip-val">{{ s.values[hoverIdx()] || 0 }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- X-Axis Labels -->
      <div class="x-labels">
        @for (l of tickLabels(); track $index) {
          <span>{{ l }}</span>
        }
      </div>

      <!-- Interactive Royal Legend -->
      <div class="legend-bar">
        @for (s of series(); track s.name) {
          <button type="button" class="legend-chip"
            [class.active]="activeSeries() === s.name"
            (mouseenter)="activeSeries.set(s.name)"
            (mouseleave)="activeSeries.set(null)">
            <span class="legend-dot" [style.background]="s.color" [style.box-shadow]="'0 0 8px ' + s.color"></span>
            <span class="legend-label">{{ s.name }}</span>
            <span class="legend-sum">{{ sumSeries(s) }}</span>
          </button>
        }
      </div>
    </div>`,
  styleUrl: './charts.scss'
})
export class AreaChartComponent {
  protected readonly Math = Math;
  readonly W = 640;
  readonly H = 230;
  readonly uid = 'ag' + Math.random().toString(36).slice(2, 7);
  readonly series = input<NamedSeries[]>([]);
  readonly labels = input<string[]>([]);
  readonly stacked = input<boolean>(false);
  readonly ariaLabel = input<string>('Traffic and Activity Area Chart');
  readonly hoverIdx = signal(-1);
  readonly activeSeries = signal<string | null>(null);

  private readonly max = computed(() => {
    const s = this.series();
    if (!s.length) return 1;
    const n = s[0].values.length;
    let m = 1;
    for (let i = 0; i < n; i++) {
      const v = this.stacked()
        ? s.reduce((a, x) => a + (x.values[i] ?? 0), 0)
        : Math.max(...s.map(x => x.values[i] ?? 0));
      m = Math.max(m, v);
    }
    return Math.max(10, Math.ceil(m * 1.15));
  });

  readonly gridLines = computed(() => [0.2, 0.45, 0.7, 0.95].map(f => this.H * f));

  readonly yAxisTicks = computed(() => {
    const m = this.max();
    return [
      { val: Math.round(m), y: this.H * 0.08 },
      { val: Math.round(m * 0.66), y: this.H * 0.38 },
      { val: Math.round(m * 0.33), y: this.H * 0.68 },
      { val: 0, y: this.H * 0.94 }
    ];
  });

  xAt(i: number): number {
    return (i / Math.max(1, this.labels().length - 1)) * this.W;
  }

  totalAt(idx: number): number {
    return this.series().reduce((acc, s) => acc + (s.values[idx] || 0), 0);
  }

  sumSeries(s: NamedSeries): number {
    return s.values.reduce((a, b) => a + (b || 0), 0);
  }

  readonly paths = computed(() => {
    const s = this.series();
    const n = s[0]?.values.length ?? 0;
    const base = new Array(n).fill(0);

    return s.map(ser => {
      const ys = ser.values.map((v, i) => {
        const top = this.stacked() ? base[i] + v : v;
        return this.H - (top / this.max()) * (this.H - 16) - 4;
      });

      const bottoms = this.stacked()
        ? base.map(b => this.H - (b / this.max()) * (this.H - 16) - 4)
        : new Array(n).fill(this.H);

      if (this.stacked()) {
        ser.values.forEach((v, i) => (base[i] += v));
      }

      const pts = ys.map((y, i) => [this.xAt(i), y] as [number, number]);
      const line = smoothMonotone(pts);
      const back = bottoms.map((y, i) => [this.xAt(i), y] as [number, number]).reverse();
      const area = `${line} L ${back.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')} Z`;

      return { name: ser.name, color: ser.color, line, area, ys };
    });
  });

  readonly tickLabels = computed(() => {
    const l = this.labels();
    const step = Math.max(1, Math.ceil(l.length / 7));
    return l.filter((_, i) => i % step === 0);
  });

  onMove(e: MouseEvent): void {
    const el = e.currentTarget as SVGElement;
    const r = el.getBoundingClientRect();
    const n = this.labels().length;
    if (!n) return;
    const rawIdx = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    this.hoverIdx.set(Math.max(0, Math.min(n - 1, rawIdx)));
  }

  onLeave(): void {
    this.hoverIdx.set(-1);
    this.activeSeries.set(null);
  }
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut-wrap">
      <div class="donut">
        <svg viewBox="0 0 160 160" role="img" [attr.aria-label]="ariaLabel()" class="donut-svg">
          <defs>
            <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Background Track -->
          <circle cx="80" cy="80" r="58" class="donut-track" />

          <!-- Colored Ring Arcs -->
          @for (a of arcs(); track a.label; let i = $index) {
            <circle cx="80" cy="80" r="58" fill="none"
              [attr.stroke]="a.color"
              stroke-width="15"
              stroke-linecap="round"
              [attr.stroke-dasharray]="a.len + ' ' + (C - a.len)"
              [attr.stroke-dashoffset]="-a.offset"
              class="donut-seg"
              [class.dim]="hover() !== -1 && hover() !== i"
              [class.hovered]="hover() === i"
              (mouseenter)="hover.set(i)"
              (mouseleave)="hover.set(-1)"
              [style.animation-delay.ms]="i * 70" />
          }
        </svg>

        <!-- Glass Center Hub with Gold Ring -->
        <div class="donut-center">
          @if (hover() >= 0) {
            <span class="hub-label" [style.color]="arcs()[hover()].color">{{ arcs()[hover()].label }}</span>
            <strong class="hub-val">{{ pct(arcs()[hover()].value) }}%</strong>
            <span class="hub-sub">{{ arcs()[hover()].value }} views</span>
          } @else {
            <span class="hub-label">Multiverse</span>
            <strong class="hub-val">{{ total() }}</strong>
            <span class="hub-sub">{{ centerLabel() }}</span>
          }
        </div>
      </div>

      <!-- High-End Interactive Legend with Percent Bars -->
      <ul class="donut-legend">
        @for (a of arcs(); track a.label; let i = $index) {
          <li (mouseenter)="hover.set(i)" (mouseleave)="hover.set(-1)"
              [class.active]="hover() === i"
              [class.dimmed]="hover() !== -1 && hover() !== i">
            <span class="legend-swatch" [style.background]="a.color" [style.box-shadow]="'0 0 8px ' + a.color"></span>
            <div class="legend-meta">
              <div class="legend-top">
                <span class="realm-name">{{ a.label }}</span>
                <span class="realm-val"><strong>{{ a.value }}</strong> <small>({{ pct(a.value) }}%)</small></span>
              </div>
              <div class="realm-bar-track">
                <div class="realm-bar-fill" [style.width.%]="pct(a.value)" [style.background]="a.color"></div>
              </div>
            </div>
          </li>
        }
      </ul>
    </div>`,
  styleUrl: './charts.scss'
})
export class DonutChartComponent {
  readonly R = 58;
  readonly C = 2 * Math.PI * 58;
  readonly slices = input<Slice[]>([]);
  readonly centerLabel = input<string>('Total');
  readonly ariaLabel = input<string>('Donut chart of realm distribution');
  readonly hover = signal(-1);
  readonly total = computed(() => this.slices().reduce((a, s) => a + s.value, 0));

  readonly arcs = computed(() => {
    const t = this.total() || 1;
    let off = 0;
    return this.slices().filter(s => s.value > 0).map(s => {
      const sliceLen = (s.value / t) * this.C;

      const len = Math.max(1, sliceLen - 4);
      const a = { ...s, len, offset: off };
      off += sliceLen;
      return a;
    });
  });

  pct(v: number): number {
    return Math.round((v / (this.total() || 1)) * 100);
  }
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="bars">
      @for (s of slices(); track s.label; let i = $index) {
        <li class="bar-row">
          <span class="bar-label">{{ s.label }}</span>
          <div class="bar-track">
            <i [style.width.%]="(s.value / max()) * 100"
               [style.background]="'linear-gradient(90deg, ' + s.color + ' 0%, #ffffff 160%)'"
               [style.box-shadow]="'0 0 10px ' + s.color"
               [style.animation-delay.ms]="i * 70"></i>
          </div>
          <b class="bar-value">{{ s.value }}</b>
        </li>
      }
    </ul>`,
  styleUrl: './charts.scss'
})
export class BarChartComponent {
  readonly slices = input<Slice[]>([]);
  readonly max = computed(() => Math.max(1, ...this.slices().map(s => s.value)));
}

@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" class="spark" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.32" />
          <stop offset="60%" [attr.stop-color]="color()" stop-opacity="0.10" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0.00" />
        </linearGradient>
      </defs>
      <path [attr.d]="area()" [attr.fill]="'url(#' + uid + ')'" />
      <path [attr.d]="line()" [attr.stroke]="color()" fill="none" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke" />

      <!-- Live Pulsing Endpoint Beacon -->
      @if (lastPt(); as pt) {
        <circle [attr.cx]="pt[0]" [attr.cy]="pt[1]" r="5" fill="none" [attr.stroke]="color()" stroke-width="1.2" class="spark-beacon-ring" />
        <circle [attr.cx]="pt[0]" [attr.cy]="pt[1]" r="2.8" [attr.fill]="color()" class="spark-beacon-dot" />
      }
    </svg>`,
  styles: [`
    :host { display: block; width: 100%; }
    .spark { width: 100%; height: 42px; overflow: visible; }
    .spark-beacon-ring {
      animation: beaconPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      transform-origin: center;
    }
    @keyframes beaconPing {
      0% { r: 2.8; opacity: 0.9; }
      100% { r: 7.5; opacity: 0; }
    }
  `]
})
export class SparklineComponent {
  readonly uid = 'sp' + Math.random().toString(36).slice(2, 7);
  readonly values = input<number[]>([]);
  readonly color = input<string>('#D4AF37');

  private pts = computed(() => {
    const raw = this.values();
    const v = raw.length ? raw : [0, 0];
    const max = Math.max(1, ...v), min = Math.min(...v);
    const range = Math.max(1, max - min);
    return v.map((x, i) => [
      (i / Math.max(1, v.length - 1)) * 100,
      30 - ((x - min) / range) * 23
    ] as [number, number]);
  });

  readonly line = computed(() => smoothMonotone(this.pts()));
  readonly area = computed(() => `${this.line()} L 100,36 L 0,36 Z`);
  readonly lastPt = computed(() => {
    const p = this.pts();
    return p.length ? p[p.length - 1] : null;
  });
}

function smoothMonotone(pts: [number, number][]): string {
  const n = pts.length;
  if (n <= 1) return pts.length === 1 ? `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` : '';
  if (n === 2) return `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} L ${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;

  const dxs: number[] = [];
  const dys: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    dxs.push(dx);
    dys.push(dy);
    ms.push(dx === 0 ? 0 : dy / dx);
  }

  const c1s: [number, number][] = [];
  const c2s: [number, number][] = [];

  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = dxs[i];

    let m1 = ms[i];
    let m2 = ms[i];

    if (i > 0) {
      m1 = ms[i - 1] * ms[i] <= 0 ? 0 : (ms[i - 1] + ms[i]) / 2;
    }
    if (i < n - 2) {
      m2 = ms[i] * ms[i + 1] <= 0 ? 0 : (ms[i] + ms[i + 1]) / 2;
    }

    c1s.push([p1[0] + dx / 3, p1[1] + (m1 * dx) / 3]);
    c2s.push([p2[0] - dx / 3, p2[1] - (m2 * dx) / 3]);
  }

  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    d += ` C ${c1s[i][0].toFixed(1)},${c1s[i][1].toFixed(1)} ${c2s[i][0].toFixed(1)},${c2s[i][1].toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}
