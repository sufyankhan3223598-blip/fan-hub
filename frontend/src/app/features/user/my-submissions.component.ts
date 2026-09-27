import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Submission } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { EmptyStateComponent, SpinnerComponent } from '../../shared/components/basics';
import { AssetPipe } from '../../core/pipes/pipes';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, RouterLink, IconComponent, EmptyStateComponent, SpinnerComponent, AssetPipe, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-shell>
      <div class="dash-tilt">
        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div><span class="eyebrow">Community</span><h1 class="display-md mt-2 mb-0">My submissions</h1></div>
          <a routerLink="/submit" class="btn-fh btn-gold"><app-icon name="plus" /> New submission</a>
        </div>
        @if (list(); as l) {
          <div class="tabs-fh mb-4">
            @for (s of statuses; track s) { <button type="button" [class.active]="filter() === s" (click)="filter.set(s)">{{ s || 'All' }} <small>{{ count(s) }}</small></button> }
          </div>
          @for (s of shown(); track s.id) {
            <article class="sub" [style.--accent]="s.accentColor">
              @if (s.imageUrl) { <img [src]="s.imageUrl | asset" alt="" loading="lazy" /> } @else { <div class="ph"><app-icon name="feather" /></div> }
              <div class="sub-body">
                <div class="d-flex gap-2 align-items-center flex-wrap"><span class="status" [class]="'status ' + (s.status | lowercase)">{{ s.status }}</span><span class="kind">{{ s.submissionType }} &middot; {{ s.categoryName }}</span></div>
                <h3>@if (s.status === 'Approved') { <a [routerLink]="['/community', s.id]">{{ s.title }}</a> } @else { {{ s.title }} }</h3>
                <p>{{ s.summary }}</p>
                @if (s.reviewNote) { <div class="note"><app-icon name="message" /> <span><strong>Admin note:</strong> {{ s.reviewNote }}</span></div> }
                <small>Submitted {{ s.createdAt | date: 'medium' }}@if (s.reviewedAt) { &middot; reviewed {{ s.reviewedAt | date: 'mediumDate' }} }@if (s.status === 'Approved') { &middot; {{ s.viewCount }} views }</small>
              </div>
            </article>
          } @empty { <app-empty-state icon="feather" title="No submissions" message="Share an article, fan art, cosplay, theory or review with the community."><a routerLink="/submit" class="btn-fh btn-sm btn-gold">Submit content</a></app-empty-state> }
        } @else { <app-spinner /> }
      </div>
    </app-user-shell>`,
  styles: [`
    .tabs-fh small { opacity: .6; margin-left: 4px; }
    .sub { display: grid; grid-template-columns: 140px 1fr; gap: 18px; padding: 14px; margin-bottom: 12px; border-radius: 20px; background: var(--bg-1); border: 1px solid var(--border); border-left: 3px solid var(--accent);
      img, .ph { width: 140px; height: 140px; object-fit: cover; border-radius: 14px; } .ph { display: grid; place-items: center; font-size: 34px; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--bg-2)); } @media (max-width: 560px) { grid-template-columns: 1fr; img, .ph { width: 100%; height: 160px; } } }
    .sub-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; h3 { font-size: 1.2rem; margin: 4px 0 0; a { color: var(--text); } } p { margin: 0; color: var(--text-2); } small { color: var(--muted); } }
    .kind { font-size: .8rem; color: var(--muted); font-family: var(--font-ui); font-weight: 600; }
    .note { display: flex; gap: 8px; padding: 10px 12px; border-radius: 12px; background: var(--bg-2); border: 1px solid var(--border); font-size: .9rem; app-icon { color: var(--gold-2); } }
  `]
})
export class MySubmissionsComponent {
  readonly statuses = ['', 'Pending', 'Approved', 'Rejected'];
  readonly list = signal<Submission[] | null>(null);
  readonly filter = signal('');
  readonly shown = computed(() => (this.list() ?? []).filter(s => !this.filter() || s.status === this.filter()));
  constructor() { inject(ApiService).mySubmissions().subscribe(l => this.list.set(l)); }
  count(s: string): number { return (this.list() ?? []).filter(x => !s || x.status === s).length; }
}
