import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService, ToastService } from '../../core/services/ui.services';
import { Slice, NamedSeries, Tag, TimelineItem } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, CountdownComponent, EmptyStateComponent, LogoComponent, ModalComponent, PaginationComponent, SectionHeadComponent, SpinnerComponent } from '../../shared/components/basics';
import { DualImageCardComponent, TimelineComponent } from '../../shared/components/cards';
import { AreaChartComponent, BarChartComponent, DonutChartComponent, SparklineComponent } from '../../shared/components/charts';
import { RichEditorComponent } from '../../shared/components/rich-editor.component';
import { TiltDirective } from '../../core/directives/directives';

@Component({
  selector: 'app-ui-kit',
  standalone: true,
  imports: [FormsModule, IconComponent, ConfirmDialogComponent, CountdownComponent, EmptyStateComponent, LogoComponent, ModalComponent, PaginationComponent, SectionHeadComponent, SpinnerComponent,
    DualImageCardComponent, TimelineComponent, AreaChartComponent, BarChartComponent, DonutChartComponent, SparklineComponent, RichEditorComponent, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page container-fh">
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-5">
        <div><span class="eyebrow">Design system</span><h1 class="display-lg mt-2 mb-0">UI kit</h1><p class="text-muted-fh mt-2 mb-0">Tokens and components used across Fan Hub Plus.</p></div>
        <button type="button" class="btn-fh" (click)="theme.theme.set(theme.theme() === 'dark' ? 'light' : 'dark')"><app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" /> {{ theme.theme() === 'dark' ? 'Light' : 'Dark' }} theme</button>
      </div>

      <section class="kit">
        <h2>Color tokens</h2>
        <div class="swatches">
          @for (c of colors; track c.v) { <div class="sw"><span [style.background]="'var(' + c.v + ')'"></span><strong>{{ c.l }}</strong><code>{{ c.v }}</code></div> }
        </div>
        <h3 class="mt-4">Realm accents</h3>
        <div class="swatches">
          @for (c of realms; track c.n) { <div class="sw"><span [style.background]="c.c"></span><strong>{{ c.n }}</strong><code>{{ c.c }}</code></div> }
        </div>
      </section>

      <section class="kit">
        <h2>Typography</h2>
        <p class="display-xl mb-2">Display XL</p>
        <p class="display-lg mb-2">Display large</p>
        <p class="display-md mb-2">Display medium</p>
        <span class="eyebrow">Eyebrow label</span>
        <p class="lead mt-2">Lead paragraph - Inter for comfortable long-form reading across every realm.</p>
        <p>Body text with a <a href="#" (click)="$event.preventDefault()">text link</a>, <span class="text-gold">gold accent</span> and <span class="gradient-text">gradient text</span>.</p>
      </section>

      <section class="kit">
        <h2>Buttons</h2>
        <div class="row-demo">
          <button type="button" class="btn-fh btn-gold">Primary</button><button type="button" class="btn-fh">Default</button><button type="button" class="btn-fh btn-ghost">Ghost</button>
          <button type="button" class="btn-fh btn-violet">Violet</button><button type="button" class="btn-fh btn-danger">Danger</button><button type="button" class="btn-fh" disabled>Disabled</button>
          <button type="button" class="btn-fh btn-gold btn-sm"><app-icon name="plus" /> Small</button><button type="button" class="btn-fh btn-gold btn-lg">Large <app-icon name="arrow-right" /></button>
          <button type="button" class="btn-icon" aria-label="Bookmark"><app-icon name="bookmark" /></button><button type="button" class="btn-icon sm" aria-label="Share"><app-icon name="share" /></button>
          <button type="button" class="btn-play" aria-label="Play"><app-icon name="play" /></button><a href="#" class="link-arrow" (click)="$event.preventDefault()">Link arrow <app-icon name="arrow-right" /></a>
        </div>
      </section>

      <section class="kit">
        <h2>Forms</h2>
        <div class="row g-3">
          <div class="col-md-6"><label class="field"><span class="field-label">Text input</span><input class="input-fh" placeholder="Placeholder" /><span class="field-hint">Helper text</span></label></div>
          <div class="col-md-6"><label class="field"><span class="field-label">With icon</span><span class="input-icon"><app-icon name="search" /><input class="input-fh" placeholder="Search" /></span></label></div>
          <div class="col-md-6"><label class="field"><span class="field-label">Select</span><select class="select-fh"><option>Anime</option><option>Movies</option></select></label></div>
          <div class="col-md-6"><label class="field"><span class="field-label">Invalid</span><input class="input-fh" value="x" /><span class="field-error">This field is required.</span></label></div>
          <div class="col-12"><label class="field"><span class="field-label">Textarea</span><textarea class="textarea-fh" rows="2"></textarea></label></div>
          <div class="col-12"><span class="field-label d-block mb-2">Rich text editor</span><app-rich-editor [(ngModel)]="rich" /></div>
          <div class="col-md-6 d-flex gap-4 flex-wrap align-items-center">
            <label class="check"><input type="checkbox" checked /> Checkbox</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="toggle" /><span class="track"></span><span class="label">Toggle</span></label>
          </div>
          <div class="col-md-6"><input class="range-fh" type="range" aria-label="Range" /></div>
        </div>
        <h3 class="mt-4">Chips, tabs, tags and status</h3>
        <div class="chip-row mb-3"><button type="button" class="chip active">Active chip</button><button type="button" class="chip">Chip</button><button type="button" class="chip"><app-icon name="flame" /> With icon</button></div>
        <div class="tabs-fh mb-3"><button type="button" class="active">Overview</button><button type="button">Media</button><button type="button">Characters</button></div>
        <div class="row-demo">
          @for (t of tags; track t.id) { <span class="tag-badge" [style.--tag-color]="t.color">{{ t.name }}</span> }
          <span class="status pending">Pending</span><span class="status approved">Approved</span><span class="status rejected">Rejected</span><span class="status closed">Closed</span>
        </div>
      </section>

      <section class="kit">
        <h2>Cards</h2>
        <div class="cards-demo">
          <app-dual-card image="/media/images/content/akira-a.webp" hoverImage="/media/images/content/akira-b.webp" title="Dual-image card" eyebrow="Anime / 2024" accent="#E11D48" link="/ui-kit" [tags]="tags" [rating]="4.6" />
          <app-dual-card image="/media/images/content/arcane-a.webp" hoverImage="/media/images/content/arcane-b.webp" title="Slide effect" eyebrow="TV Shows" accent="#3B82F6" link="/ui-kit" effect="slide" />
          <app-dual-card image="/media/images/content/aespa-armageddon-a.webp" hoverImage="/media/images/content/aespa-armageddon-b.webp" title="Flip effect" eyebrow="K-Pop" accent="#EC4899" link="/ui-kit" effect="flip" badge="New" />
          <div class="panel tilt-demo" appTilt><app-logo [size]="56" /><h4 class="mt-3">Tilt panel</h4><p class="text-muted-fh mb-0">Glass surface with 3D tilt on hover.</p></div>
        </div>
      </section>

      <section class="kit">
        <h2>Data visualization</h2>
        <div class="dash-grid">
          <div class="panel span-8"><div class="panel-title"><h3>Area chart</h3></div><app-area-chart [series]="series" [labels]="labels" [stacked]="true" /></div>
          <div class="panel span-4"><div class="panel-title"><h3>Donut</h3></div><app-donut-chart [slices]="slices" /></div>
          <div class="panel span-6"><div class="panel-title"><h3>Bars</h3></div><app-bar-chart [slices]="slices" /></div>
          <div class="panel span-6"><div class="panel-title"><h3>KPI + sparkline</h3></div>
            <div class="kpi" style="--accent:#22D3EE"><span class="kpi-icon"><app-icon name="activity" /></span><span class="kpi-label">Active users</span><span class="kpi-value">1,284</span><span class="kpi-change up">+12% vs last week</span><app-sparkline [values]="series[0].values" color="#22D3EE" /></div></div>
        </div>
      </section>

      <section class="kit">
        <h2>Feedback &amp; overlays</h2>
        <div class="row-demo mb-3">
          <button type="button" class="btn-fh btn-sm" (click)="toast.success('Saved', 'Everything is in order.')">Success toast</button>
          <button type="button" class="btn-fh btn-sm" (click)="toast.error('Something failed', 'Please try again.')">Error toast</button>
          <button type="button" class="btn-fh btn-sm" (click)="toast.info('Heads up', 'Informational message.')">Info toast</button>
          <button type="button" class="btn-fh btn-sm" (click)="modal.set(true)">Open modal</button>
          <button type="button" class="btn-fh btn-sm btn-danger" (click)="confirm.set(true)">Confirm dialog</button>
        </div>
        <div class="row g-3">
          <div class="col-md-4 panel"><app-spinner label="Loading" /></div>
          <div class="col-md-4 panel"><app-empty-state icon="compass" title="Empty state" message="Nothing matches your filters." /></div>
          <div class="col-md-4 panel"><div class="skeleton skeleton-line" style="width:70%"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line" style="width:40%"></div>
            <div class="mt-3"><app-countdown [target]="countdownTarget" /></div></div>
        </div>
        <div class="mt-3"><app-pagination [page]="page()" [totalPages]="8" (pageChange)="page.set($event)" /></div>
      </section>

      <section class="kit">
        <h2>Timeline &amp; section head</h2>
        <app-section-head eyebrow="Section" title="Section heading" link="/ui-kit" linkText="View all" />
        <app-timeline [items]="timeline" />
      </section>
    </div>

    <app-modal [open]="modal()" title="Modal dialog" (closed)="modal.set(false)">
      <p>Modals trap focus, close on Escape or backdrop click, and support a sticky footer.</p>
      <div modal-foot class="modal-foot"><button type="button" class="btn-fh btn-sm" (click)="modal.set(false)">Close</button><button type="button" class="btn-fh btn-sm btn-gold" (click)="modal.set(false)">Confirm</button></div>
    </app-modal>
    <app-confirm [open]="confirm()" (confirm)="confirm.set(false); toast.success('Confirmed')" (cancel)="confirm.set(false)" />`,
  styles: [`
    .kit { padding: 36px 0; border-top: 1px solid var(--border); h2 { font-size: 1.3rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 20px; } h3 { font-size: 1rem; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; } }
    .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .sw { display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-1);
      span { height: 56px; border-radius: 10px; border: 1px solid var(--border); } strong { font-family: var(--font-ui); font-size: .9rem; } code { font-size: .75rem; color: var(--muted); } }
    .row-demo { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .cards-demo { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; align-items: start; }
    .tilt-demo { padding: 28px; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .col-md-4.panel { padding: 20px; }
  `]
})
export class UiKitComponent {
  readonly theme = inject(ThemeService);
  readonly toast = inject(ToastService);
  readonly modal = signal(false);
  readonly confirm = signal(false);
  readonly page = signal(3);
  rich = '<p>Try <b>bold</b>, <i>italic</i>, lists and links.</p>';
  toggle = true;
  readonly countdownTarget = new Date(Date.now() + 12 * 864e5 + 5 * 36e5).toISOString();
  readonly colors = [
    { l: 'Background 0', v: '--bg-0' }, { l: 'Background 1', v: '--bg-1' }, { l: 'Background 2', v: '--bg-2' }, { l: 'Background 3', v: '--bg-3' },
    { l: 'Text', v: '--text' }, { l: 'Muted', v: '--muted' }, { l: 'Gold', v: '--gold' }, { l: 'Gold light', v: '--gold-2' },
    { l: 'Violet', v: '--violet' }, { l: 'Cyan', v: '--cyan' }, { l: 'Success', v: '--success' }, { l: 'Warning', v: '--warning' }
  ];
  readonly realms = [
    { n: 'Anime', c: '#E11D48' }, { n: 'Gaming', c: '#22C55E' }, { n: 'Movies', c: '#F59E0B' }, { n: 'TV Shows', c: '#3B82F6' },
    { n: 'K-Pop', c: '#EC4899' }, { n: 'Comics', c: '#FACC15' }, { n: 'Manga', c: '#E5E7EB' }, { n: 'Cosplay', c: '#A855F7' }
  ];
  readonly tags: Tag[] = [{ id: 1, name: 'Shonen', slug: 'shonen', color: '#E11D48' }, { id: 2, name: 'Sci-Fi', slug: 'sci-fi', color: '#22D3EE' }, { id: 3, name: 'Award winner', slug: 'award', color: '#D4AF37' }];
  readonly labels = Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`);
  readonly series: NamedSeries[] = [
    { name: 'Views', color: '#D4AF37', values: [12, 18, 15, 22, 28, 24, 30, 34, 29, 38, 42, 40, 47, 52] },
    { name: 'Members', color: '#7C3AED', values: [4, 6, 5, 8, 9, 8, 11, 12, 10, 14, 15, 16, 18, 20] }
  ];
  readonly slices: Slice[] = [{ label: 'Anime', value: 42, color: '#E11D48' }, { label: 'Gaming', value: 28, color: '#22C55E' }, { label: 'Movies', value: 20, color: '#F59E0B' }, { label: 'K-Pop', value: 10, color: '#EC4899' }];
  readonly timeline: TimelineItem[] = [
    { dateLabel: '1997', title: 'Origins', description: 'The first chapter is published and a fandom is born.' },
    { dateLabel: '2004', title: 'Global breakout', description: 'An animated adaptation takes the story worldwide.' },
    { dateLabel: '2024', title: 'New era', description: 'A modern remake introduces a new generation of fans.' }
  ];
}
