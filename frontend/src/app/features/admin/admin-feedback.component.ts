import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { Feedback, Paged } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, ModalComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';
import { AdminGrid } from './admin-grid';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [DatePipe, FormsModule, IconComponent, ConfirmDialogComponent, EmptyStateComponent, ModalComponent, PaginationComponent, SpinnerComponent, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <div class="admin-head"><div><span class="eyebrow">Support</span><h1 class="display-md">Feedback</h1><p>Bug reports, suggestions and queries from visitors and members.</p></div></div>
      <div class="panel grid-toolbar">
        <div class="tabs-fh">@for (s of statuses; track s) { <button type="button" [class.active]="(filters()['status'] ?? '') === s" (click)="setFilter('status', s)">{{ s || 'All' }}</button> }</div>
        <div class="input-icon"><app-icon name="search" /><input class="input-fh" type="text" placeholder="Search subject, name, email" (input)="onSearch($any($event.target).value)" autocomplete="off" aria-label="Search feedback" /></div>
        <app-admin-select
          [options]="typeFilterOptions"
          [value]="filters()['type'] ?? ''"
          placeholder="All types"
          ariaLabel="Filter by type"
          (valueChange)="setFilter('type', $event)" />
      </div>
      <div class="panel p-2">
        @if (rows(); as rows) {
          @if (rows.length) {
            <div class="table-wrap"><table class="table-fh">
              <thead><tr>
                <th class="sortable" [class.sorted]="sort() === 'type'" (click)="sortBy('type')">Type <app-icon [name]="sortIcon('type')" /></th>
                <th class="sortable" [class.sorted]="sort() === 'subject'" (click)="sortBy('subject')">Subject <app-icon [name]="sortIcon('subject')" /></th>
                <th>From</th>
                <th class="sortable" [class.sorted]="sort() === 'status'" (click)="sortBy('status')">Status <app-icon [name]="sortIcon('status')" /></th>
                <th class="sortable" [class.sorted]="sort() === 'createdAt'" (click)="sortBy('createdAt')">Received <app-icon [name]="sortIcon('createdAt')" /></th><th></th></tr></thead>
              <tbody>
                @for (f of rows; track f.id) {
                  <tr>
                    <td><span class="ftype" [class]="'ftype ' + f.type.toLowerCase()">{{ f.type }}</span></td>
                    <td class="wrap"><button type="button" class="linkish" (click)="open(f)"><strong>{{ f.subject }}</strong><small class="d-block text-muted-fh">{{ f.message.slice(0, 80) }}{{ f.message.length > 80 ? '...' : '' }}</small></button></td>
                    <td>{{ f.name }}<small class="d-block text-muted-fh">{{ f.email }}</small></td>
                    <td><span [class]="'status ' + cls(f.status)">{{ f.status }}</span></td>
                    <td>{{ f.createdAt | date: 'mediumDate' }}</td>
                    <td><div class="row-actions"><button type="button" class="btn-icon sm" (click)="open(f)" aria-label="Open" title="Open"><app-icon name="edit" /></button><button type="button" class="btn-icon sm" (click)="toDelete.set([f.id])" aria-label="Delete" title="Delete"><app-icon name="trash" /></button></div></td>
                  </tr>
                }
              </tbody>
            </table></div>
            <div class="grid-foot"><span>{{ rangeText() }}</span><app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="goPage($event)" /></div>
          } @else { <app-empty-state icon="message" title="Inbox zero" message="No feedback matches this filter." /> }
        } @else { <app-spinner /> }
      </div>
    </div>

    <app-modal [open]="!!current()" [title]="current()?.subject ?? ''" (closed)="current.set(null)">
      @if (current(); as f) {
        <div class="d-flex gap-2 flex-wrap align-items-center mb-3"><span [class]="'ftype ' + f.type.toLowerCase()">{{ f.type }}</span><span class="text-muted-fh">{{ f.name }} &lt;{{ f.email }}&gt; &middot; {{ f.createdAt | date: 'medium' }}</span></div>
        <p class="msg">{{ f.message }}</p>
        @if (f.pageUrl) { <p class="small text-muted-fh">Page: {{ f.pageUrl }}</p> }
        <span class="field-label d-block mb-2">Status</span>
        <div class="chip-row mb-3">@for (s of workflow; track s) { <button type="button" class="chip" [class.active]="status === s" (click)="status = s">{{ s }}</button> }</div>
        <label class="field"><span class="field-label">Internal note</span><textarea class="textarea-fh" [(ngModel)]="adminNote" rows="3" maxlength="1000"></textarea></label>
        <a class="btn-fh btn-sm" [href]="'mailto:' + f.email + '?subject=Re: ' + f.subject"><app-icon name="mail" /> Reply by email</a>
      }
      <div modal-foot class="modal-foot"><button type="button" class="btn-fh btn-sm" (click)="current.set(null)">Cancel</button><button type="button" class="btn-fh btn-sm btn-gold" (click)="save()">Save</button></div>
    </app-modal>
    <app-confirm [open]="!!toDelete()" title="Delete feedback?" [message]="'Delete ' + (toDelete()?.length ?? 0) + ' item(s)?'" (confirm)="remove()" (cancel)="toDelete.set(null)" />`,
  styles: [`
    .linkish { background: none; border: none; padding: 0; text-align: left; cursor: pointer; color: var(--text); max-width: 360px; }
    td.wrap { white-space: normal; min-width: 260px; }
    .tabs-fh { flex: none; }
    .ftype { font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: var(--bg-3);
      &.bug { color: #fb7185; } &.suggestion { color: #4ade80; } &.query { color: #22d3ee; } }
    .msg { white-space: pre-line; padding: 14px; border-radius: 14px; background: var(--bg-2); border: 1px solid var(--border); }
  `]
})
export class AdminFeedbackComponent extends AdminGrid<Feedback> {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly statuses = ['Open', 'In Review', 'Resolved', 'Closed', ''];
  readonly workflow = ['Open', 'In Review', 'Resolved', 'Closed'];
  readonly current = signal<Feedback | null>(null);
  readonly toDelete = signal<number[] | null>(null);
  status = 'Open';
  adminNote = '';

  readonly typeFilterOptions: AdminSelectOption[] = [
    { value: '', label: 'All types' },
    { value: 'Bug', label: 'Bug' },
    { value: 'Suggestion', label: 'Suggestion' },
    { value: 'Query', label: 'Query' }
  ];

  constructor() { super('createdAt'); this.load(); }
  protected fetch(q: Record<string, unknown>): Observable<Paged<Feedback>> { return this.api.adminFeedback(q); }

  cls(s: string): string { return s.toLowerCase().replace(' ', '-'); }
  open(f: Feedback): void { this.status = f.status; this.adminNote = f.adminNote ?? ''; this.current.set(f); }
  save(): void {
    const f = this.current(); if (!f) return;
    this.api.adminUpdateFeedback(f.id, this.status, this.adminNote.trim() || null).subscribe(() => { this.toast.success('Feedback updated'); this.current.set(null); this.load(); });
  }
  bulkStatus(s: string): void { this.api.adminBulkFeedback(this.ids(), s).subscribe(() => { this.toast.success(`Marked ${s}`); this.load(); }); }
  remove(): void {
    const ids = this.toDelete(); if (!ids) return;
    this.http.post(`${environment.apiUrl}/admin/feedback/bulk-delete`, { ids }).subscribe(() => { this.toast.success('Deleted'); this.toDelete.set(null); this.load(); });
  }
}
