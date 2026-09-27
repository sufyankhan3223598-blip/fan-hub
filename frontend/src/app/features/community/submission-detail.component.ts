import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Submission } from '../../core/models/models';
import { BreadcrumbsComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { ShareComponent } from '../../shared/components/actions';
import { AssetPipe, InitialsPipe, RichAssetsPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [DatePipe, BreadcrumbsComponent, LockedComponent, SpinnerComponent, ShareComponent, AssetPipe, InitialsPipe, RichAssetsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh" style="max-width:900px">
      @if (s(); as s) {
        <app-breadcrumbs [items]="[{ label: 'Fan Creations', url: '/community' }, { label: s.title }]" />
        <div [style.--accent]="s.accentColor" class="mt-3">
          @if (s.status !== 'Approved') { <span class="status" [class]="'status ' + s.status.toLowerCase()">{{ s.status }}</span> }
          <span class="eyebrow d-flex mt-2">{{ s.categoryName }} &middot; {{ s.submissionType }}</span>
          <h1 class="display-md mt-2">{{ s.title }}</h1>
          <div class="d-flex align-items-center gap-3 my-3">
            <span class="avatar">{{ s.authorName | initials }}</span>
            <div><strong>{{ s.authorName }}</strong><div class="text-muted-fh small">{{ s.createdAt | date: 'longDate' }} &middot; {{ s.viewCount }} views</div></div>
            <div class="ms-auto"><app-share [title]="s.title" [path]="'/community/' + s.id" /></div>
          </div>
          @if (s.imageUrl) { <img class="hero-img" [src]="s.imageUrl | asset" [alt]="s.title" /> }
          <p class="lead">{{ s.summary }}</p>
          <div class="rich-text" [innerHTML]="s.body | richAssets"></div>
          @if (!auth.isLoggedIn()) { <app-locked title="Read the full creation" [returnUrl]="'/community/' + s.id" /> }
          @if (s.reviewNote && s.status !== 'Approved') { <div class="panel mt-4"><strong>Review note:</strong> {{ s.reviewNote }}</div> }
        </div>
      } @else { <app-spinner /> }
    </div></div>`,
  styles: [`.hero-img { width: 100%; border-radius: var(--r-lg); margin: 10px 0 24px; border: 1px solid var(--border); }`]
})
export class SubmissionDetailComponent {
  private api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly id = input.required<string>();
  readonly s = signal<Submission | null>(null);
  constructor() {
    effect(() => { const id = Number(this.id()); untracked(() => this.api.submission(id).subscribe(s => this.s.set(s))); });
  }
}
