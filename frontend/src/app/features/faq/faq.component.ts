import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { UiService } from '../../core/services/ui.services';
import { Faq } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, SpinnerComponent } from '../../shared/components/basics';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink, IconComponent, BreadcrumbsComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh" style="max-width:980px">
      <app-breadcrumbs [items]="[{ label: 'FAQ' }]" />
      <span class="eyebrow mt-3 d-flex">Help center</span>
      <h1 class="display-lg mt-2">Frequently asked questions</h1>
      <div class="input-icon my-4"><app-icon name="search" /><input class="input-fh" type="search" placeholder="Search questions..." (input)="q.set($any($event.target).value)" aria-label="Search FAQ" /></div>
      <div class="chip-row mb-4">
        <button type="button" class="chip" [class.active]="!cat()" (click)="cat.set('')">All</button>
        @for (c of categories(); track c) { <button type="button" class="chip" [class.active]="cat() === c" (click)="cat.set(c)">{{ c }}</button> }
      </div>
      @if (!faqs()) { <app-spinner /> }
      <div class="faq-list">
        @for (f of filtered(); track f.id) {
          <div class="faq" [class.open]="open() === f.id">
            <button type="button" (click)="open.set(open() === f.id ? null : f.id)" [attr.aria-expanded]="open() === f.id">
              <span class="cat">{{ f.category }}</span><strong>{{ f.question }}</strong><app-icon name="chevron-down" />
            </button>
            <div class="ans"><p>{{ f.answer }}</p></div>
          </div>
        } @empty { @if (faqs()) { <p class="text-muted-fh">No matching questions. Ask the assistant instead.</p> } }
      </div>
      <div class="panel mt-5 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div><h3 class="m-0">Still need help?</h3><p class="m-0">Ask the Nexus assistant or send us feedback.</p></div>
        <div class="d-flex gap-2"><button type="button" class="btn-fh btn-gold" (click)="ui.openChat()"><app-icon name="bot" /> Ask the assistant</button><a routerLink="/feedback" class="btn-fh btn-ghost">Send feedback</a></div>
      </div>
    </div></div>`,
  styles: [`
    .faq-list { display: flex; flex-direction: column; gap: 10px; }
    .faq { border-radius: 16px; border: 1px solid var(--border); background: var(--bg-1); overflow: hidden; transition: border-color .3s;
      &.open { border-color: var(--gold); } button { width: 100%; display: flex; align-items: center; gap: 14px; padding: 18px 20px; border: none; background: none; color: var(--text); cursor: pointer; text-align: left; font-size: 1.02rem;
        strong { flex: 1; font-family: var(--font-ui); letter-spacing: .02em; } app-icon { transition: transform .35s var(--ease-out); color: var(--gold-2); } }
      &.open button app-icon { transform: rotate(180deg); }
      .cat { font-size: .66rem; letter-spacing: .16em; text-transform: uppercase; color: var(--cyan); font-family: var(--font-ui); font-weight: 700; min-width: 96px; }
      .ans { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s var(--ease-out); > p { overflow: hidden; margin: 0; padding: 0 20px; } }
      &.open .ans { grid-template-rows: 1fr; > p { padding-bottom: 18px; } } }
  `]
})
export class FaqComponent {
  private api = inject(ApiService);
  readonly ui = inject(UiService);
  readonly faqs = signal<Faq[] | null>(null);
  readonly q = signal('');
  readonly cat = signal('');
  readonly open = signal<number | null>(null);
  readonly categories = computed(() => [...new Set((this.faqs() ?? []).map(f => f.category))]);
  readonly filtered = computed(() => {
    const q = this.q().toLowerCase();
    return (this.faqs() ?? []).filter(f => (!this.cat() || f.category === this.cat()) && (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)));
  });
  constructor() { this.api.faqs().subscribe(f => this.faqs.set(f)); }
}
