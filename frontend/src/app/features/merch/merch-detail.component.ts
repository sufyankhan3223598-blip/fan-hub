import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { Merch } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, LockedComponent, SpinnerComponent } from '../../shared/components/basics';
import { BookmarkButtonComponent, ShareComponent } from '../../shared/components/actions';
import { TiltDirective } from '../../core/directives/directives';
import { AssetPipe, CompactNumberPipe } from '../../core/pipes/pipes';

@Component({
  selector: 'app-merch-detail',
  standalone: true,
  imports: [IconComponent, BreadcrumbsComponent, LockedComponent, SpinnerComponent, BookmarkButtonComponent, ShareComponent, TiltDirective, AssetPipe, CompactNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh">
      @if (m(); as m) {
        <div [style.--accent]="m.accentColor">
          <app-breadcrumbs [items]="[{ label: 'Merchandise', url: '/merchandise' }, { label: m.categoryName, url: '/realm/' + m.categorySlug }, { label: m.name }]" />
          <div class="row g-5 mt-1">
            <div class="col-lg-7">
              <div class="main-img" appTilt [tiltMax]="6"><img [src]="(m.images[active()]?.imageUrl ?? m.imageUrl) | asset" [alt]="m.name" /></div>
              <div class="thumbs">
                @for (im of m.images; track im.imageUrl; let i = $index) {
                  <button type="button" [class.on]="i === active()" (click)="active.set(i)" [attr.aria-label]="im.caption"><img [src]="im.imageUrl | asset" alt="" /></button>
                }
              </div>
              @if (m.locked) { <app-locked title="Full gallery for members" [returnUrl]="'/merchandise/' + m.slug" /> }
            </div>
            <div class="col-lg-5">
              <span class="eyebrow">{{ m.fandom }} &middot; {{ m.categoryName }}</span>
              <h1 class="display-md mt-2">{{ m.name }}</h1>
              <div class="chip-row my-3">@for (t of m.tags; track t.id) { <span class="tag-badge" [style.--tag-color]="t.color">{{ t.name }}</span> }
                @if (m.isUpcoming) { <span class="tag-badge" style="--tag-color:#22D3EE">Coming soon</span> }</div>
              <p class="lead">{{ m.description }}</p>
              <div class="facts">
                <div><span>Manufacturer</span><strong>{{ m.manufacturer }}</strong></div>
                <div><span>Views</span><strong>{{ m.viewCount | compact }}</strong></div>
                <div><span>Popularity</span><strong>{{ m.popularityScore }}</strong></div>
              </div>
              <div class="notice"><app-icon name="info" /> Display only - Fan Hub Plus does not sell merchandise or process payments.</div>
              <div class="d-flex gap-2 flex-wrap mt-3">
                <app-bookmark-button itemType="Merchandise" [itemId]="m.id" [title]="m.name" variant="full" />
                <app-share [title]="m.name" [path]="'/merchandise/' + m.slug" [full]="true" />
              </div>
            </div>
          </div>
        </div>
      } @else { <app-spinner /> }
    </div></div>`,
  styles: [`
    .main-img { --rx: 0deg; --ry: 0deg; border-radius: var(--r-xl); overflow: hidden; border: 1px solid var(--border-strong); transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry)); transition: transform .5s var(--ease-out);
      img { width: 100%; max-height: 640px; object-fit: cover; } }
    .thumbs { display: flex; gap: 10px; margin: 14px 0; button { width: 90px; height: 110px; border-radius: 12px; overflow: hidden; border: 2px solid transparent; padding: 0; cursor: pointer; background: none; opacity: .6; transition: all .25s; }
      button.on, button:hover { border-color: var(--accent); opacity: 1; } img { width: 100%; height: 100%; object-fit: cover; } }
    .facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; div { padding: 12px; border-radius: 14px; background: var(--glass); border: 1px solid var(--border); }
      span { display: block; font-size: .7rem; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); font-family: var(--font-ui); font-weight: 700; } strong { font-family: var(--font-ui); } }
    .notice { display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 14px; border: 1px dashed var(--border-strong); color: var(--text-2); font-size: .9rem; app-icon { color: var(--cyan); } }
  `]
})
export class MerchDetailComponent {
  private api = inject(ApiService);
  private title = inject(Title);
  readonly slug = input.required<string>();
  readonly m = signal<Merch | null>(null);
  readonly active = signal(0);
  constructor() {
    effect(() => { const s = this.slug(); untracked(() => { this.m.set(null); this.active.set(0); this.api.merchItem(s).subscribe(m => { this.m.set(m); this.title.setTitle(`${m.name} | Fan Hub Plus`); }); }); });
  }
}
