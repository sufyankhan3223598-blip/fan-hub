import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { CategoryStore } from '../../core/services/stores';
import { Genre, Paged, Tag, TimelineItem } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, ModalComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { RichEditorComponent } from '../../shared/components/rich-editor.component';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';
import { AssetPipe } from '../../core/pipes/pipes';
import { AdminGrid } from './admin-grid';
import { FieldDef, FilterDef, RESOURCES, ResourceConfig } from './admin-resources';

type Row = { id: number } & Record<string, unknown>;

@Component({
  selector: 'app-admin-crud',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink, IconComponent,
    ConfirmDialogComponent, EmptyStateComponent, ModalComponent,
    PaginationComponent, SpinnerComponent, RichEditorComponent,
    AssetPipe, AdminSelectComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-crud.component.html',
  styleUrl: './admin-crud.component.scss'
})
export class AdminCrudComponent extends AdminGrid<Row> {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly cats = inject(CategoryStore);


  readonly resource = input<string>('contents');
  readonly embedded = input<boolean>(false);
  readonly cfg = computed<ResourceConfig | null>(() => RESOURCES[this.resource()] ?? null);

  readonly allTags = signal<Tag[]>([]);
  readonly allGenres = signal<Genre[]>([]);
  readonly tagSearch = signal('');
  readonly genreSearch = signal('');

  readonly filteredTags = computed(() => {
    const q = this.tagSearch().trim().toLowerCase();
    if (!q) return this.allTags();
    return this.allTags().filter(t => t.name.toLowerCase().includes(q));
  });

  readonly filteredGenres = computed(() => {
    const q = this.genreSearch().trim().toLowerCase();
    if (!q) return this.allGenres();
    return this.allGenres().filter(g => g.name.toLowerCase().includes(q));
  });

  readonly editing = signal<{ id: number | null } | null>(null);
  readonly saving = signal(false);
  readonly uploading = signal<string | null>(null);
  readonly errors = signal<Record<string, string>>({});
  readonly toDelete = signal<number[] | null>(null);
  form: Record<string, any> = {};

  constructor() {
    super('CreatedAt');
    effect(() => {
      const c = this.cfg();
      untracked(() => {
        if (!c) { this.rows.set([]); return; }
        this.sort.set(c.defaultSort); this.dir.set(c.defaultSort === 'SortOrder' || c.defaultSort === 'Name' ? 'asc' : 'desc');
        this.filters.set({}); this.search.set(''); this.page.set(1); this.rows.set(null); this.editing.set(null);
        this.load();
        if (c.fields.some(f => f.type === 'tags') && !this.allTags().length) this.api.tags().subscribe(t => this.allTags.set(t));
        if (c.fields.some(f => f.type === 'genres') && !this.allGenres().length) this.api.genres().subscribe(g => this.allGenres.set(g));
      });
    });
  }

  protected fetch(q: Record<string, unknown>): Observable<Paged<Row>> { return this.api.adminList<Row>(this.resource(), q); }


  val(row: Row, key: string): any { return row[key]; }
  publicUrl(row: Row): string | null { return this.cfg()?.publicUrl?.(row) ?? null; }
  imageOf(row: Row): string | null { return (row['imageUrl'] as string) || null; }


  create(): void {
    const c = this.cfg(); if (!c) return;
    this.form = structuredClone(c.defaults);
    for (const f of c.fields) if (this.form[f.key] === undefined) this.form[f.key] = this.emptyValue(f);
    if (!this.form['categoryId'] && c.fields.some(f => f.key === 'categoryId' && f.required)) this.form['categoryId'] = this.cats.categories()[0]?.id ?? null;
    this.toLocalDates();
    this.errors.set({});
    this.editing.set({ id: null });
  }

  edit(row: Row): void {
    this.api.adminGet<Record<string, any>>(this.resource(), row.id).subscribe(d => {
      this.form = { ...d };
      this.toLocalDates();
      this.errors.set({});
      this.editing.set({ id: row.id });
    });
  }

  duplicate(row: Row): void {
    const c = this.cfg(); if (!c) return;
    this.api.adminGet<Record<string, any>>(this.resource(), row.id).subscribe(d => {
      this.form = { ...d, id: 0, slug: '' };
      this.form[c.titleKey] = `${d[c.titleKey]} (copy)`;
      this.toLocalDates();
      this.errors.set({});
      this.editing.set({ id: null });
    });
  }

  private emptyValue(f: FieldDef): unknown {
    switch (f.type) {
      case 'checkbox': return false;
      case 'number': return f.required ? 0 : null;
      case 'tags': case 'genres': case 'timeline': case 'gallery': return [];
      case 'color': return '#D4AF37';
      case 'category': return null;
      default: return '';
    }
  }

  private toLocalDates(): void {
    for (const f of this.cfg()?.fields ?? []) {
      if ((f.type === 'datetime' || f.type === 'date') && this.form[f.key]) {
        const d = new Date(this.form[f.key]);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
        this.form[f.key] = f.type === 'date' ? local.slice(0, 10) : local.slice(0, 16);
      }
    }
  }

  private validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of this.cfg()?.fields ?? []) {
      const v = this.form[f.key];
      const empty = v === null || v === undefined || (typeof v === 'string' && !v.replace(/<[^>]+>/g, '').trim()) || (Array.isArray(v) && f.required && !v.length);
      if (f.required && empty && f.type !== 'checkbox') errs[f.key] = `${f.label} is required.`;
      else if (f.type === 'number' && v !== null && v !== '' && v !== undefined) {
        if (f.min !== undefined && v < f.min) errs[f.key] = `Minimum is ${f.min}.`;
        if (f.max !== undefined && v > f.max) errs[f.key] = `Maximum is ${f.max}.`;
      } else if (f.maxLength && typeof v === 'string' && v.length > f.maxLength) errs[f.key] = `Maximum ${f.maxLength} characters.`;
      else if (f.type === 'url' && v && !/^(https?:\/\/|\/)/.test(v)) errs[f.key] = 'Use a full https:// URL or a relative path.';
    }
    if (this.form['startDate'] && this.form['endDate'] && new Date(this.form['endDate']) < new Date(this.form['startDate'])) errs['endDate'] = 'End must be after start.';
    this.errors.set(errs);
    return !Object.keys(errs).length;
  }

  save(): void {
    const c = this.cfg(), e = this.editing();
    if (!c || !e) return;
    if (!this.validate()) { this.toast.error('Please fix the highlighted fields'); return; }
    const body: Record<string, any> = { ...this.form };
    for (const f of c.fields) {
      if ((f.type === 'datetime' || f.type === 'date') && body[f.key]) body[f.key] = new Date(body[f.key]).toISOString();
      if (f.type === 'number' && (body[f.key] === '' || body[f.key] === undefined)) body[f.key] = null;
      if (f.type === 'timeline') body[f.key] = (body[f.key] as TimelineItem[]).filter(t => t.title?.trim()).map((t, i) => ({ ...t, sortOrder: i }));
      if (f.type === 'gallery') body[f.key] = (body[f.key] as string[]).filter(u => u?.trim());
    }
    body['id'] = e.id ?? 0;
    this.saving.set(true);
    const req = e.id ? this.api.adminUpdate(c.resource, e.id, body) : this.api.adminCreate(c.resource, body);
    req.subscribe({
      next: () => {
        this.saving.set(false); this.editing.set(null);
        this.toast.success(e.id ? 'Changes saved' : `New ${c.singular} created`);
        if (c.resource === 'categories') this.cats.load(true);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }


  filterOptions(f: any): AdminSelectOption[] {
    const list: AdminSelectOption[] = [{ value: '', label: f.label }];
    if (f.key === 'categoryId') {
      for (const cat of this.cats.categories()) {
        list.push({ value: String(cat.id), label: cat.name });
      }
    } else if (f.options) {
      for (const o of f.options) {
        list.push({ value: o.v, label: o.l });
      }
    }
    return list;
  }

  fieldSelectOptions(f: any): AdminSelectOption[] {
    return (f.options || []).map((o: string) => ({ value: o, label: o }));
  }

  categoryFieldOptions(): AdminSelectOption[] {
    return this.cats.categories().map(c => ({ value: c.id, label: c.name }));
  }

  toggleId(key: string, id: number): void { const a: number[] = this.form[key] ?? []; this.form[key] = a.includes(id) ? a.filter(x => x !== id) : [...a, id]; }
  hasId(key: string, id: number): boolean { return (this.form[key] ?? []).includes(id); }
  addTimeline(): void { this.form['timeline'] = [...(this.form['timeline'] ?? []), { dateLabel: '', title: '', description: '' }]; }
  removeAt(key: string, i: number): void { this.form[key] = (this.form[key] as unknown[]).filter((_, j) => j !== i); }
  moveTimeline(i: number, d: number): void {
    const a = [...(this.form['timeline'] as TimelineItem[])]; const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; this.form['timeline'] = a;
  }
  addGallery(url = ''): void { this.form['galleryUrls'] = [...(this.form['galleryUrls'] ?? []), url]; }
  setGallery(i: number, v: string): void { const a = [...this.form['galleryUrls']]; a[i] = v; this.form['galleryUrls'] = a; }

  upload(e: Event, key: string, gallery = false): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { this.toast.error('Images only', 'Please upload an image file.'); return; }
    this.uploading.set(key);
    this.api.adminUpload(file, this.resource()).subscribe({
      next: r => { if (gallery) this.addGallery(r.url); else this.form[key] = r.url; this.uploading.set(null); this.toast.success('Image uploaded'); },
      error: () => this.uploading.set(null)
    });
  }

  uploadMedia(e: Event, key: string): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(key);
    this.toast.info('Uploading media...', `Uploading ${file.name}...`);
    this.api.adminUploadMedia(file, 'media').subscribe({
      next: r => {
        this.form[key] = r.url;
        this.uploading.set(null);
        this.toast.success('Media uploaded', 'File uploaded! Media URL set.');
      },
      error: err => {
        this.uploading.set(null);
        this.toast.error('Upload failed', err.error?.message || 'Could not upload media file.');
      }
    });
  }


  remove(): void {
    const ids = this.toDelete(); const c = this.cfg(); if (!ids || !c) return;
    const req = ids.length === 1 ? this.api.adminDelete(c.resource, ids[0]) : this.api.adminBulkDelete(c.resource, ids);
    req.subscribe({
      next: () => { this.toast.success('Deleted', `${ids.length} ${c.singular}(s) removed.`); this.toDelete.set(null); if (c.resource === 'categories') this.cats.load(true); this.load(); },
      error: () => this.toDelete.set(null)
    });
  }
}
