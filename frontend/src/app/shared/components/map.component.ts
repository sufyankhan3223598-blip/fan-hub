import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { FanEvent } from '../../core/models/models';
import { ThemeService } from '../../core/services/ui.services';

@Component({
  selector: 'app-event-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-wrap">
      <div #map class="map" role="region" aria-label="Event map"></div>
      <div class="map-switch-bar">
        <button type="button" class="sw-btn" [class.active]="provider() === 'google'" (click)="setProvider('google')">
          Google Maps
        </button>
        <button type="button" class="sw-btn" [class.active]="provider() === 'satellite'" (click)="setProvider('satellite')">
          Satellite
        </button>
        <button type="button" class="sw-btn" [class.active]="provider() === 'dark'" (click)="setProvider('dark')">
          Dark Mode
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .map-wrap { position: relative; width: 100%; }
    .map { width: 100%; height: var(--map-h, 520px); border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border-strong); background: var(--bg-2); z-index: 0; }
    .map-switch-bar {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 1000;
      display: flex;
      gap: 6px;
      padding: 4px;
      border-radius: 12px;
      background: rgba(10, 10, 16, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    }
    .sw-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 7px 13px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-ui);

      &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.12);
      }

      &.active {
        background: linear-gradient(135deg, #F5C86A, #D4AF37);
        color: #000000;
        box-shadow: 0 0 12px rgba(245, 200, 106, 0.45);
      }
    }
    :host ::ng-deep .fh-pin { width: 18px; height: 18px; border-radius: 50%; background: var(--pin, #D4AF37); border: 3px solid #fff;
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--pin, #D4AF37) 30%, transparent), 0 0 22px var(--pin, #D4AF37); }
    :host ::ng-deep .fh-pin.hl::after { content: ''; position: absolute; inset: -10px; border-radius: 50%; border: 2px solid var(--pin, #D4AF37); animation: pinPulse 1.8s infinite; }
    :host ::ng-deep .fh-me { width: 16px; height: 16px; border-radius: 50%; background: #22D3EE; border: 3px solid #fff; box-shadow: 0 0 0 10px rgba(34,211,238,.25); }
    :host ::ng-deep .leaflet-popup-content-wrapper { background: var(--bg-1); color: var(--text); border-radius: 16px; border: 1px solid var(--border-strong); box-shadow: var(--shadow); }
    :host ::ng-deep .leaflet-popup-tip { background: var(--bg-1); }
    :host ::ng-deep .leaflet-popup-content { margin: 12px 14px; font-family: var(--font-body); }
    :host ::ng-deep .pop h4 { margin: 0 0 4px; font-family: var(--font-ui); font-size: 1rem; }
    :host ::ng-deep .pop p { margin: 0 0 8px; font-size: .82rem; color: var(--muted); }
    :host ::ng-deep .pop a { font-family: var(--font-ui); font-weight: 700; letter-spacing: .08em; text-transform: uppercase; font-size: .78rem; }
    :host ::ng-deep .leaflet-control-zoom a { background: var(--bg-1); color: var(--text); border-color: var(--border); }
    :host ::ng-deep .leaflet-container { background: #0b0c10; font-family: var(--font-body); }
    :host ::ng-deep .leaflet-tile-pane { filter: none; }
    @keyframes pinPulse { from { transform: scale(.6); opacity: 1; } to { transform: scale(1.8); opacity: 0; } }
  `]
})
export class EventMapComponent implements AfterViewInit, OnDestroy {
  private theme = inject(ThemeService);
  private router = inject(Router);
  readonly events = input<FanEvent[]>([]);
  readonly me = input<{ lat: number; lng: number } | null>(null);
  readonly focus = input<FanEvent | null>(null);
  readonly selected = output<FanEvent>();
  readonly host = viewChild.required<ElementRef<HTMLDivElement>>('map');

  readonly provider = signal<'google' | 'satellite' | 'dark'>('google');

  private map?: L.Map;
  private tiles?: L.TileLayer;
  private layer = L.layerGroup();
  private meMarker?: L.Marker;

  constructor() {
    effect(() => { const ev = this.events(); if (this.map) this.renderPins(ev); });
    effect(() => { const t = this.theme.theme(); if (this.map && this.provider() === 'dark') this.updateTiles(); });
    effect(() => { const m = this.me(); if (this.map && m) this.showMe(m); });
    effect(() => { const f = this.focus(); if (this.map && f) this.map.flyTo([f.latitude, f.longitude], 11, { duration: 1.2 }); });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.host().nativeElement, { zoomControl: true, worldCopyJump: true, scrollWheelZoom: false, attributionControl: true })
      .setView([30, 20], 2);
    this.updateTiles();
    this.layer.addTo(this.map);
    this.renderPins(this.events());
    const m = this.me();
    if (m) this.showMe(m);
    setTimeout(() => this.map?.invalidateSize(), 300);
    window.addEventListener('resize', this.onResize);
  }

  setProvider(p: 'google' | 'satellite' | 'dark'): void {
    this.provider.set(p);
    this.updateTiles();
  }

  private onResize = (): void => { this.map?.invalidateSize(); };

  private updateTiles(): void {
    if (!this.map) return;
    this.tiles?.remove();
    const p = this.provider();
    let url = '';
    let attr = '';
    let maxZoom = 20;
    let sub: string | string[] = 'abc';

    if (p === 'google') {
      url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attr = '&copy; Google Maps';
      sub = '0123';
    } else if (p === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attr = '&copy; Google Maps Satellite';
      sub = '0123';
    } else {
      const isLight = this.theme.theme() === 'light';
      url = isLight
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attr = '&copy; OpenStreetMap contributors &copy; CARTO';
      sub = 'abcd';
    }

    this.tiles = L.tileLayer(url, {
      maxZoom,
      subdomains: sub,
      attribution: attr
    }).addTo(this.map);
  }

  private renderPins(events: FanEvent[]): void {
    this.layer.clearLayers();
    for (const e of events) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="fh-pin ${e.isHighlight ? 'hl' : ''}" style="--pin:${e.accentColor}"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      });
      const date = new Date(e.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const marker = L.marker([e.latitude, e.longitude], { icon, title: e.title, keyboard: true })
        .bindPopup(`<div class="pop"><h4>${escapeHtml(e.title)}</h4><p>${escapeHtml(e.city)} &middot; ${date}${e.distanceKm != null ? ' &middot; ' + e.distanceKm + ' km' : ''}</p><a href="/events/${e.slug}" data-slug="${e.slug}">View event</a></div>`);
      marker.on('click', () => this.selected.emit(e));
      marker.on('popupopen', ev => {
        const a = (ev.popup.getElement() as HTMLElement | undefined)?.querySelector('a[data-slug]');
        a?.addEventListener('click', (click: Event) => { click.preventDefault(); this.router.navigate(['/events', e.slug]); });
      });
      this.layer.addLayer(marker);
    }
  }

  private showMe(m: { lat: number; lng: number }): void {
    if (!this.map) return;
    this.meMarker?.remove();
    this.meMarker = L.marker([m.lat, m.lng], { icon: L.divIcon({ className: '', html: '<div class="fh-me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) })
      .addTo(this.map).bindPopup('You are here');
    this.map.flyTo([m.lat, m.lng], 5, { duration: 1.4 });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.map?.remove();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
