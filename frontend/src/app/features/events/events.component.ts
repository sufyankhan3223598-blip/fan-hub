import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { FanEvent } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, EmptyStateComponent } from '../../shared/components/basics';
import { EventMapComponent } from '../../shared/components/map.component';
import { BookmarkButtonComponent } from '../../shared/components/actions';
import { AssetPipe } from '../../core/pipes/pipes';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';

interface DayCell { date: Date; inMonth: boolean; events: FanEvent[]; today?: boolean; }

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, EmptyStateComponent, EventMapComponent, BookmarkButtonComponent, AssetPipe, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly events = signal<FanEvent[]>([]);
  readonly cities = signal<string[]>([]);
  readonly city = signal('');
  readonly type = signal('');
  readonly me = signal<{ lat: number; lng: number } | null>(null);
  readonly radius = signal(0);
  readonly locating = signal(false);
  readonly selected = signal<FanEvent | null>(null);
  readonly view = signal<'calendar' | 'list'>('calendar');
  readonly month = signal(this.startOfMonth(new Date()));
  readonly types = ['Convention', 'Meetup', 'Screening', 'Premiere'];
  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly cityOptions = computed<AdminSelectOption[]>(() => [
    { value: '', label: 'All cities' },
    ...this.cities().map(c => ({ value: c, label: c }))
  ]);

  readonly radiusOptions: AdminSelectOption[] = [
    { value: 0, label: 'Any distance' },
    { value: 100, label: 'Within 100 km' },
    { value: 500, label: 'Within 500 km' },
    { value: 2000, label: 'Within 2,000 km' }
  ];

  resetFilters(): void {
    this.city.set('');
    this.type.set('');
    this.clearNear();
  }

  readonly days = computed<DayCell[]>(() => {
    const m = this.month();
    const first = new Date(m);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first); start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toDateString();
      const events = this.events().filter(e => {
        const s = new Date(e.startDate), en = new Date(e.endDate);
        s.setHours(0, 0, 0, 0); en.setHours(23, 59, 59, 0);
        return d >= s && d <= en;
      });
      return { date: d, inMonth: d.getMonth() === m.getMonth(), events, today: key === new Date().toDateString() } as DayCell;
    });
  });
  readonly monthEvents = computed(() => this.events().filter(e => { const s = new Date(e.startDate); return s.getMonth() === this.month().getMonth() && s.getFullYear() === this.month().getFullYear(); }));

  constructor() {
    this.api.eventCities().subscribe(c => this.cities.set(c));
    effect(() => {
      const me = this.me();
      const q = { city: this.city(), type: this.type(), lat: me?.lat, lng: me?.lng, radiusKm: me && this.radius() ? this.radius() : null };
      untracked(() => this.api.events(q).subscribe(e => {
        this.events.set(e);
        if (!me && e.length && !this.selected()) {

          this.month.set(this.startOfMonth(new Date(e[0].startDate)));
        }
      }));
    });
  }

  nearMe(): void {
    if (!('geolocation' in navigator)) { this.toast.error('Location unavailable', 'Your browser does not support GPS location.'); return; }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      p => { this.locating.set(false); this.city.set(''); this.me.set({ lat: p.coords.latitude, lng: p.coords.longitude }); this.view.set('list'); this.toast.success('Showing events near you', 'Sorted by distance.'); },
      err => { this.locating.set(false); this.toast.warning('Location permission needed', err.message || 'Allow location access to find nearby events.'); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }
  clearNear(): void { this.me.set(null); this.radius.set(0); }
  shiftMonth(n: number): void { const m = new Date(this.month()); m.setMonth(m.getMonth() + n); this.month.set(this.startOfMonth(m)); }
  pick(e: FanEvent): void { this.selected.set(e); }
  private startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
  dayKey(d: Date): string { return d.toISOString(); }
}
