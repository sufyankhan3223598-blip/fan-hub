import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { AdminUser, Paged } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';
import { AssetPipe, InitialsPipe, TimeAgoPipe } from '../../core/pipes/pipes';
import { AdminGrid } from './admin-grid';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, IconComponent, ConfirmDialogComponent, EmptyStateComponent, PaginationComponent, SpinnerComponent, AssetPipe, InitialsPipe, TimeAgoPipe, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <div class="admin-head"><div><span class="eyebrow">People</span><h1 class="display-md">Users</h1><p>{{ total() }} registered accounts</p></div></div>
      <div class="panel grid-toolbar">
        <div class="input-icon"><app-icon name="search" /><input class="input-fh" type="text" placeholder="Search name or email" (input)="onSearch($any($event.target).value)" autocomplete="off" aria-label="Search users" /></div>
        <app-admin-select
          [options]="roleFilterOptions"
          [value]="filters()['type'] ?? ''"
          placeholder="All roles"
          ariaLabel="Filter by role"
          (valueChange)="setFilter('type', $event)" />
        <app-admin-select
          [options]="statusFilterOptions"
          [value]="filters()['status'] ?? ''"
          placeholder="Any status"
          ariaLabel="Filter by status"
          (valueChange)="setFilter('status', $event)" />
      </div>
      <div class="panel p-2">
        @if (rows(); as rows) {
          @if (rows.length) {
            <div class="table-wrap"><table class="table-fh">
              <thead><tr>
                <th class="sortable" [class.sorted]="sort() === 'fullName'" (click)="sortBy('fullName')">User <app-icon [name]="sortIcon('fullName')" /></th>
                <th>Role</th><th>Status</th><th>Activity</th>
                <th class="sortable" [class.sorted]="sort() === 'createdAt'" (click)="sortBy('createdAt')">Joined <app-icon [name]="sortIcon('createdAt')" /></th>
                <th class="sortable" [class.sorted]="sort() === 'lastActiveAt'" (click)="sortBy('lastActiveAt')">Last active <app-icon [name]="sortIcon('lastActiveAt')" /></th>
                <th></th></tr></thead>
              <tbody>
                @for (u of rows; track u.id) {
                  <tr>
                    <td><div class="cell-title"><span class="avatar">@if (u.avatarUrl) { <img [src]="u.avatarUrl | asset" alt="" /> } @else { {{ u.fullName | initials }} }</span><span><strong>{{ u.fullName }}</strong><small>{{ u.email }}</small></span></div></td>
                    <td>
                      <select class="select-fh role" [value]="u.role" (change)="setRole(u, $any($event.target).value)" [disabled]="u.id === me" aria-label="Role"><option>User</option><option>Admin</option></select>
                    </td>
                    <td><span class="status" [class.blocked]="u.isBlocked" [class.active]="!u.isBlocked">{{ u.isBlocked ? 'Blocked' : 'Active' }}</span>
                      @if (!u.emailVerified) { <small class="d-block text-muted-fh mt-1">Email unverified</small> }</td>
                    <td><small>{{ u.bookmarkCount }} bookmarks &middot; {{ u.submissionCount }} submissions</small></td>
                    <td>{{ u.createdAt | date: 'mediumDate' }}</td>
                    <td>{{ u.lastActiveAt ? (u.lastActiveAt | timeAgo) : 'Never' }}</td>
                    <td><div class="row-actions">
                      @if (u.id !== me) {
                        <button type="button" class="btn-icon sm" (click)="block([u.id], !u.isBlocked)" [attr.aria-label]="u.isBlocked ? 'Unblock' : 'Block'" [title]="u.isBlocked ? 'Unblock' : 'Block'"><app-icon [name]="u.isBlocked ? 'unlock' : 'lock'" /></button>
                        <button type="button" class="btn-icon sm" (click)="toDelete.set([u.id])" aria-label="Delete user" title="Delete"><app-icon name="trash" /></button>
                      } @else { <small class="text-muted-fh">You</small> }
                    </div></td>
                  </tr>
                }
              </tbody>
            </table></div>
            <div class="grid-foot"><span>{{ rangeText() }}</span><app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="goPage($event)" /></div>
          } @else { <app-empty-state icon="users" title="No users found" message="Try another search or filter." /> }
        } @else { <app-spinner /> }
      </div>
    </div>
    <app-confirm [open]="!!toDelete()" title="Delete users?" [message]="'Permanently delete ' + (toDelete()?.length ?? 0) + ' account(s) and their personal data?'" confirmText="Delete" (confirm)="remove()" (cancel)="toDelete.set(null)" />`,
  styles: [`
    .select-fh.role { min-height: 32px; height: 32px; width: 100px; padding: 0 8px; font-size: 0.85rem; }
    .cell-title .avatar { width: 34px; height: 34px; font-size: 0.82rem; }
    .status { font-size: 0.72rem; padding: 3px 9px; }

    :host-context([data-theme='light']) {
      .select-fh.role {
        background-color: #FAF8F2;
        border-color: rgba(158, 116, 18, 0.28);
        color: #0E0F16;
        font-weight: 600;
        &:hover {
          background-color: #FFFFFF;
          border-color: #9E7412;
        }
      }
      .cell-title strong {
        color: #0E0F16 !important;
      }
      .cell-title small {
        color: #565A6E !important;
      }
      .status {
        border-radius: 999px;
        font-weight: 700;
        &.active {
          background: rgba(34, 197, 94, 0.15);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        &.blocked {
          background: rgba(239, 68, 68, 0.15);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }
      }
    }
  `]
})
export class AdminUsersComponent extends AdminGrid<AdminUser> {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  readonly me = inject(AuthService).user()?.id ?? 0;
  readonly toDelete = signal<number[] | null>(null);

  readonly roleFilterOptions: AdminSelectOption[] = [
    { value: '', label: 'All roles' },
    { value: 'User', label: 'User' },
    { value: 'Admin', label: 'Admin' }
  ];

  readonly statusFilterOptions: AdminSelectOption[] = [
    { value: '', label: 'Any status' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'unverified', label: 'Unverified' }
  ];

  constructor() { super('createdAt'); this.dir.set('desc'); this.load(); }
  protected fetch(q: Record<string, unknown>): Observable<Paged<AdminUser>> { return this.api.adminUsers(q); }

  setRole(u: AdminUser, role: string): void { this.api.adminSetRole(u.id, role).subscribe(() => { this.toast.success('Role updated', `${u.fullName} is now ${role}.`); this.load(); }); }
  block(ids: number[], blocked: boolean): void {
    this.api.adminBlock(ids, blocked).subscribe(() => { this.toast.success(blocked ? 'User(s) blocked' : 'User(s) unblocked'); this.load(); });
  }
  remove(): void {
    const ids = this.toDelete(); if (!ids) return;
    this.http.post(`${environment.apiUrl}/admin/users/bulk-delete`, { ids }).subscribe(() => { this.toast.success('Deleted', `${ids.length} account(s) removed.`); this.toDelete.set(null); this.load(); });
  }
}
