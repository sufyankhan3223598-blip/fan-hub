import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { Bookmark } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, ModalComponent, SpinnerComponent } from '../../shared/components/basics';
import { ShareComponent } from '../../shared/components/actions';
import { AssetPipe } from '../../core/pipes/pipes';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IconComponent, ConfirmDialogComponent, EmptyStateComponent, ModalComponent, SpinnerComponent, ShareComponent, AssetPipe, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-shell>
      <div class="dash-tilt">
        <span class="eyebrow">Saved for later</span>
        <h1 class="display-md mt-2 mb-4">Bookmarks &amp; notes</h1>
        <div class="panel bar">
          <div class="tabs-fh">
            @for (t of types; track t.v) { <button type="button" [class.active]="type() === t.v" (click)="type.set(t.v)">{{ t.l }} <small>{{ count(t.v) }}</small></button> }
          </div>
          <div class="input-icon"><app-icon name="search" /><input class="input-fh" type="search" placeholder="Search titles & notes" (input)="search.set($any($event.target).value)" /></div>
        </div>
        @if (!all()) { <app-spinner /> }
        @else if (!list().length) { <app-empty-state icon="bookmark" title="No bookmarks here" message="Tap the bookmark icon on any card to save it."><a routerLink="/explore" class="btn-fh btn-sm">Explore content</a></app-empty-state> }
        @else {
          <div class="bm-list">
            @for (b of list(); track b.id) {
              <div class="bm-item">
                <a [routerLink]="b.url" class="bm-img"><img [src]="b.imageUrl | asset" [alt]="b.title" loading="lazy" /></a>
                <div class="bm-body">
                  <span class="type">{{ b.itemType }}</span>
                  <a [routerLink]="b.url" class="bm-title">{{ b.title }}</a>
                  @if (b.note) { <p class="note"><app-icon name="edit" /> {{ b.note }}</p> } @else { <p class="note empty">No note yet</p> }
                  <small>Saved {{ b.createdAt | date: 'mediumDate' }}@if (b.updatedAt) { &middot; edited {{ b.updatedAt | date: 'mediumDate' }} }</small>
                </div>
                <div class="bm-actions">
                  <button type="button" class="btn-icon sm" (click)="edit(b)" aria-label="Edit note" title="Edit note"><app-icon name="edit" /></button>
                  <app-share [title]="b.title" [path]="b.url" [small]="true" />
                  <button type="button" class="btn-icon sm" (click)="toDelete.set(b)" aria-label="Remove bookmark" title="Remove"><app-icon name="trash" /></button>
                </div>
              </div>
            }
          </div>
        }
      </div>
      <app-modal [open]="!!editing()" [title]="'Note: ' + (editing()?.title ?? '')" size="sm" (closed)="editing.set(null)">
        <textarea class="textarea-fh" [(ngModel)]="draft" maxlength="1000" placeholder="Your personal note"></textarea>
        <div modal-foot class="modal-foot"><button type="button" class="btn-fh btn-sm" (click)="editing.set(null)">Cancel</button><button type="button" class="btn-fh btn-sm btn-gold" (click)="saveNote()">Save</button></div>
      </app-modal>
      <app-confirm [open]="!!toDelete()" title="Remove bookmark?" [message]="'Remove ' + (toDelete()?.title ?? '') + ' and its note?'" confirmText="Remove" (confirm)="remove()" (cancel)="toDelete.set(null)" />
    </app-user-shell>`,
  styles: [`
    .bar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center; padding: 12px; margin-bottom: 20px; small { opacity: .6; margin-left: 4px; } .input-icon { min-width: 240px; } }
    .bm-list { display: flex; flex-direction: column; gap: 10px; }
    .bm-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 16px; align-items: center; padding: 12px; border-radius: 18px; background: var(--bg-1); border: 1px solid var(--border); transition: border-color .25s;
      &:hover { border-color: var(--gold); } @media (max-width: 560px) { grid-template-columns: 64px 1fr; .bm-actions { grid-column: span 2; } } }
    .bm-img img { width: 80px; height: 100px; object-fit: cover; border-radius: 12px; }
    .bm-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; small { color: var(--muted); font-size: .78rem; } }
    .type { font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--gold-2); font-family: var(--font-ui); font-weight: 700; }
    .bm-title { font-family: var(--font-ui); font-size: 1.1rem; font-weight: 700; color: var(--text); }
    .note { margin: 4px 0; font-size: .9rem; color: var(--text-2); &.empty { color: var(--muted); font-style: italic; } }
    .bm-actions { display: flex; gap: 6px; }
  `]
})
export class BookmarksComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly types = [{ v: '', l: 'All' }, { v: 'Content', l: 'Content' }, { v: 'Character', l: 'Characters' }, { v: 'Media', l: 'Media' }, { v: 'Article', l: 'Articles' }, { v: 'Merchandise', l: 'Merch' }, { v: 'Event', l: 'Events' }];
  readonly all = signal<Bookmark[] | null>(null);
  readonly type = signal('');
  readonly search = signal('');
  readonly editing = signal<Bookmark | null>(null);
  readonly toDelete = signal<Bookmark | null>(null);
  draft = '';
  readonly list = computed(() => {
    const q = this.search().toLowerCase();
    return (this.all() ?? []).filter(b => (!this.type() || b.itemType === this.type()) && (!q || b.title.toLowerCase().includes(q) || (b.note ?? '').toLowerCase().includes(q)));
  });

  constructor() { this.api.bookmarks().subscribe(b => this.all.set(b)); }
  count(t: string): number { return (this.all() ?? []).filter(b => !t || b.itemType === t).length; }
  edit(b: Bookmark): void { this.draft = b.note ?? ''; this.editing.set(b); }
  saveNote(): void {
    const b = this.editing(); if (!b) return;
    this.api.updateNote(b.id, this.draft.trim() || null).subscribe(u => { this.all.update(l => (l ?? []).map(x => (x.id === u.id ? u : x))); this.editing.set(null); this.toast.success('Note saved'); });
  }
  remove(): void {
    const b = this.toDelete(); if (!b) return;
    this.api.removeBookmark(b.id).subscribe(() => { this.all.update(l => (l ?? []).filter(x => x.id !== b.id)); this.toDelete.set(null); this.toast.info('Bookmark removed'); });
  }
}
