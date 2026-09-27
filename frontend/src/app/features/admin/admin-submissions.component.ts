import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { CategoryStore } from '../../core/services/stores';
import { Paged, Submission } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, ModalComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';
import { AssetPipe, RichAssetsPipe } from '../../core/pipes/pipes';
import { AdminGrid } from './admin-grid';

@Component({
  selector: 'app-admin-submissions',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, FormsModule, IconComponent, ConfirmDialogComponent, EmptyStateComponent, ModalComponent, PaginationComponent, SpinnerComponent, AssetPipe, RichAssetsPipe, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <div class="admin-head"><div><span class="eyebrow">Moderation</span><h1 class="display-md">Fan submissions</h1><p>Approve community content before it goes public.</p></div></div>
      <div class="panel grid-toolbar">
        <div class="tabs-fh">@for (s of statuses; track s) { <button type="button" [class.active]="(filters()['status'] ?? '') === s" (click)="setFilter('status', s)">{{ s || 'All' }}</button> }</div>
        <div class="input-icon"><app-icon name="search" /><input class="input-fh" type="text" placeholder="Search title or author" (input)="onSearch($any($event.target).value)" autocomplete="off" aria-label="Search submissions" /></div>
        <app-admin-select
          [options]="categoryOptions()"
          [value]="filters()['categoryId'] ?? ''"
          placeholder="All realms"
          ariaLabel="Filter by realm"
          (valueChange)="setFilter('categoryId', $event)" />
      </div>
      <div class="panel p-2">
        @if (rows(); as rows) {
          @if (rows.length) {
            <div class="table-wrap"><table class="table-fh">
              <thead><tr>
                <th class="sortable" [class.sorted]="sort() === 'title'" (click)="sortBy('title')">Submission <app-icon [name]="sortIcon('title')" /></th>
                <th>Author</th><th>Realm</th>
                <th class="sortable" [class.sorted]="sort() === 'status'" (click)="sortBy('status')">Status <app-icon [name]="sortIcon('status')" /></th>
                <th class="sortable" [class.sorted]="sort() === 'createdAt'" (click)="sortBy('createdAt')">Submitted <app-icon [name]="sortIcon('createdAt')" /></th><th></th></tr></thead>
              <tbody>
                @for (s of rows; track s.id) {
                  <tr>
                    <td><button type="button" class="cell-title linkish" (click)="preview.set(s)">@if (s.imageUrl) { <img class="thumb" [src]="s.imageUrl | asset" alt="" /> }<span><strong>{{ s.title }}</strong><small>{{ s.submissionType }}</small></span></button></td>
                    <td>{{ s.authorName }}</td>
                    <td><span class="dot" [style.background]="s.accentColor"></span>{{ s.categoryName }}</td>
                    <td><span [class]="'status ' + (s.status | lowercase)">{{ s.status }}</span></td>
                    <td>{{ s.createdAt | date: 'mediumDate' }}</td>
                    <td><div class="row-actions">
                      <button type="button" class="btn-icon sm" (click)="preview.set(s)" aria-label="Preview" title="Preview"><app-icon name="eye" /></button>
                      @if (s.status !== 'Approved') { <button type="button" class="btn-icon sm" (click)="openReview([s.id], 'Approved')" aria-label="Approve" title="Approve"><app-icon name="check" /></button> }
                      @if (s.status !== 'Rejected') { <button type="button" class="btn-icon sm" (click)="openReview([s.id], 'Rejected')" aria-label="Reject" title="Reject"><app-icon name="x" /></button> }
                      <button type="button" class="btn-icon sm" (click)="toDelete.set([s.id])" aria-label="Delete" title="Delete"><app-icon name="trash" /></button>
                    </div></td>
                  </tr>
                }
              </tbody>
            </table></div>
            <div class="grid-foot"><span>{{ rangeText() }}</span><app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="goPage($event)" /></div>
          } @else { <app-empty-state icon="inbox" title="Nothing to moderate" message="No submissions match this filter." /> }
        } @else { <app-spinner /> }
      </div>
    </div>

    <app-modal [open]="!!preview()" [title]="preview()?.title ?? ''" size="lg" (closed)="preview.set(null)">
      @if (preview(); as p) {
        <div class="d-flex gap-2 flex-wrap mb-3"><span [class]="'status ' + (p.status | lowercase)">{{ p.status }}</span><span class="text-muted-fh">{{ p.submissionType }} &middot; {{ p.categoryName }} &middot; by {{ p.authorName }} &middot; {{ p.createdAt | date: 'medium' }}</span></div>
        @if (p.imageUrl) { <img class="pv-img" [src]="p.imageUrl | asset" alt="" /> }
        <p class="lead">{{ p.summary }}</p>
        <div class="rich-text" [innerHTML]="p.body | richAssets"></div>
        @if (p.reviewNote) { <p class="mt-3 text-muted-fh"><strong>Review note:</strong> {{ p.reviewNote }}</p> }
      }
      <div modal-foot class="modal-foot">
        <button type="button" class="btn-fh btn-sm" (click)="openReview([preview()!.id], 'Rejected')"><app-icon name="x" /> Reject</button>
        <button type="button" class="btn-fh btn-sm btn-gold" (click)="openReview([preview()!.id], 'Approved')"><app-icon name="check" /> Approve</button>
      </div>
    </app-modal>

    <app-modal [open]="!!reviewing()" [title]="(reviewing()?.status === 'Approved' ? 'Approve ' : 'Reject ') + (reviewing()?.ids?.length ?? 0) + ' submission(s)'" size="sm" (closed)="reviewing.set(null)">
      <label class="field"><span class="field-label">Note to the author (optional)</span>
        <textarea class="textarea-fh" [(ngModel)]="note" maxlength="500" rows="3" [placeholder]="reviewing()?.status === 'Approved' ? 'Great work - featured in the gallery.' : 'Explain what should change.'"></textarea></label>
      <div modal-foot class="modal-foot"><button type="button" class="btn-fh btn-sm" (click)="reviewing.set(null)">Cancel</button><button type="button" class="btn-fh btn-sm btn-gold" (click)="confirmReview()">Confirm</button></div>
    </app-modal>
    <app-confirm [open]="!!toDelete()" title="Delete submissions?" [message]="'Delete ' + (toDelete()?.length ?? 0) + ' submission(s) permanently?'" (confirm)="remove()" (cancel)="toDelete.set(null)" />`,
  styles: [`
    .linkish { background: none; border: none; padding: 0; text-align: left; cursor: pointer; color: inherit; }
    .tabs-fh { flex: none; }
    .pv-img { width: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; margin-bottom: 18px; border: 1px solid rgba(212, 175, 55, 0.25); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .lead { font-size: 1.05rem; line-height: 1.6; color: #e2e8f0; margin-bottom: 14px; }
    :host-context([data-theme='light']) {
      .lead { color: #0E0F16; }
    }
  `]
})
export class AdminSubmissionsComponent extends AdminGrid<Submission> {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly cats = inject(CategoryStore);
  readonly statuses = ['Pending', 'Approved', 'Rejected', ''];
  readonly preview = signal<Submission | null>(null);
  readonly reviewing = signal<{ ids: number[]; status: 'Approved' | 'Rejected' } | null>(null);
  readonly toDelete = signal<number[] | null>(null);
  note = '';

  readonly categoryOptions = computed<AdminSelectOption[]>(() => [
    { value: '', label: 'All realms' },
    ...this.cats.categories().map(c => ({ value: String(c.id), label: c.name }))
  ]);

  constructor() { super('createdAt'); this.filters.set({ status: 'Pending' }); this.load(); }
  protected fetch(q: Record<string, unknown>): Observable<Paged<Submission>> { return this.api.adminSubmissions(q); }

  openReview(ids: number[], status: 'Approved' | 'Rejected'): void { this.note = ''; this.preview.set(null); this.reviewing.set({ ids, status }); }
  confirmReview(): void {
    const r = this.reviewing(); if (!r) return;
    this.api.adminReview(r.ids, r.status, this.note.trim() || null).subscribe(() => {
      this.toast.success(`${r.ids.length} submission(s) ${r.status.toLowerCase()}`, 'Authors have been notified.');
      this.reviewing.set(null); this.load();
    });
  }
  remove(): void {
    const ids = this.toDelete(); if (!ids) return;
    this.http.post(`${environment.apiUrl}/admin/submissions/bulk-delete`, { ids }).subscribe(() => { this.toast.success('Deleted'); this.toDelete.set(null); this.load(); });
  }
}
