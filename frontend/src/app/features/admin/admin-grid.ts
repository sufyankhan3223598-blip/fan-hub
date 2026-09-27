import { DestroyRef, computed, inject, signal } from '@angular/core';
import { Observable, Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Paged } from '../../core/models/models';

export abstract class AdminGrid<T extends { id: number }> {
  readonly rows = signal<T[] | null>(null);
  readonly total = signal(0);
  readonly totalPages = signal(1);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sort = signal('');
  readonly dir = signal<'asc' | 'desc'>('desc');
  readonly search = signal('');
  readonly filters = signal<Record<string, string | number | null>>({});
  readonly selected = signal<Set<number>>(new Set());
  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() => { const r = this.rows() ?? []; return r.length > 0 && r.every(x => this.selected().has(x.id)); });
  readonly loading = signal(false);
  private search$ = new Subject<string>();

  protected constructor(defaultSort: string) {
    this.sort.set(defaultSort);
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef))).subscribe(s => { this.search.set(s); this.page.set(1); this.load(); });
  }

  protected abstract fetch(q: Record<string, unknown>): Observable<Paged<T>>;

  load(): void {
    this.loading.set(true);
    this.fetch({ search: this.search(), sort: this.sort(), dir: this.dir(), page: this.page(), pageSize: this.pageSize(), ...this.filters() }).subscribe({
      next: p => {
        this.rows.set(p.items); this.total.set(p.total); this.totalPages.set(Math.max(1, p.totalPages)); this.loading.set(false);
        this.selected.set(new Set());
      },
      error: () => { this.rows.set([]); this.loading.set(false); }
    });
  }

  onSearch(v: string): void { this.search$.next(v.trim()); }
  setFilter(key: string, v: string | number | null): void { this.filters.update(f => ({ ...f, [key]: v === '' ? null : v })); this.page.set(1); this.load(); }
  sortBy(col: string): void {
    if (this.sort() === col) this.dir.set(this.dir() === 'asc' ? 'desc' : 'asc'); else { this.sort.set(col); this.dir.set('asc'); }
    this.load();
  }
  sortIcon(col: string): string { return this.sort() !== col ? 'sort' : this.dir() === 'asc' ? 'chevron-up' : 'chevron-down'; }
  goPage(p: number): void { this.page.set(p); this.load(); }
  setPageSize(n: number): void { this.pageSize.set(n); this.page.set(1); this.load(); }

  toggle(id: number): void { this.selected.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  toggleAll(): void { this.selected.set(this.allSelected() ? new Set() : new Set((this.rows() ?? []).map(r => r.id))); }
  ids(): number[] { return [...this.selected()]; }
  clearSelection(): void { this.selected.set(new Set()); }
  rangeText(): string {
    const start = (this.page() - 1) * this.pageSize() + 1;
    return this.total() ? `${start}-${Math.min(this.total(), start + this.pageSize() - 1)} of ${this.total()}` : '0 results';
  }
}
