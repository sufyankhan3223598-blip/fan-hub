import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { UiService } from '../../core/services/ui.services';
import { ChatHistoryItem, Paged } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { EmptyStateComponent, PaginationComponent, SpinnerComponent } from '../../shared/components/basics';
import { AdminCrudComponent } from './admin-crud.component';
import { AdminSelectComponent, AdminSelectOption } from '../../shared/components/admin-select.component';
import { AdminGrid } from './admin-grid';

type Query = ChatHistoryItem & { userName?: string | null };

@Component({
  selector: 'app-admin-chatbot',
  standalone: true,
  imports: [DatePipe, IconComponent, EmptyStateComponent, PaginationComponent, SpinnerComponent, AdminCrudComponent, AdminSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash-tilt">
      <div class="admin-head">
        <div><span class="eyebrow">Assistant</span><h1 class="display-md">Chatbot</h1><p>Keep the knowledge base current and review what fans ask.</p></div>
        <button type="button" class="btn-fh" (click)="ui.openChat()"><app-icon name="bot" /> Test the assistant</button>
      </div>
      <div class="tabs-fh mb-3">
        <button type="button" [class.active]="tab() === 'faqs'" (click)="tab.set('faqs')"><app-icon name="help" /> Knowledge base</button>
        <button type="button" [class.active]="tab() === 'log'" (click)="showLog()"><app-icon name="message" /> Query log</button>
      </div>
      @if (tab() === 'faqs') { <app-admin-crud resource="faqs" [embedded]="true" /> }
      @else {
        <div class="panel grid-toolbar">
          <div class="input-icon"><app-icon name="search" /><input class="input-fh" type="search" placeholder="Search questions" (input)="onSearch($any($event.target).value)" aria-label="Search queries" /></div>
          <app-admin-select
            [options]="intentOptions"
            [value]="filters()['type'] ?? ''"
            placeholder="All intents"
            ariaLabel="Filter by intent"
            (valueChange)="setFilter('type', $event)" />
        </div>
        <div class="panel p-2">
          @if (rows(); as rows) {
            @if (rows.length) {
              <div class="table-wrap"><table class="table-fh">
                <thead><tr><th>Question</th><th>Response</th><th>Intent</th><th>User</th><th>Asked</th></tr></thead>
                <tbody>
                  @for (q of rows; track q.id) {
                    <tr><td class="q wrap"><strong>{{ q.message }}</strong></td><td class="r wrap">{{ q.response }}</td>
                      <td><span class="intent">{{ q.intent }}</span></td><td>{{ q.userName || 'Visitor' }}</td><td>{{ q.createdAt | date: 'MMM d, h:mm a' }}</td></tr>
                  }
                </tbody>
              </table></div>
              <div class="grid-foot"><span>{{ rangeText() }}</span><app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="goPage($event)" /></div>
            } @else { <app-empty-state icon="bot" title="No queries yet" message="Questions asked through the assistant appear here." /> }
          } @else { <app-spinner /> }
        </div>
      }
    </div>`,
  styles: [`
    .tabs-fh { display: inline-flex; }
    .wrap { white-space: normal; } .q { min-width: 220px; color: var(--text); } .r { max-width: 420px; font-size: .86rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .intent { font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; background: rgba(34,211,238,.12); color: var(--cyan); }
  `]
})
export class AdminChatbotComponent extends AdminGrid<Query> {
  private api = inject(ApiService);
  readonly ui = inject(UiService);
  readonly tab = signal<'faqs' | 'log'>('faqs');
  readonly intents = ['Faq', 'Recommend', 'Search', 'Category', 'Onboarding', 'Greeting', 'Llm', 'Fallback'];
  readonly intentOptions: AdminSelectOption[] = [
    { value: '', label: 'All intents' },
    ...['Faq', 'Recommend', 'Search', 'Category', 'Onboarding', 'Greeting', 'Llm', 'Fallback'].map(i => ({ value: i, label: i }))
  ];
  private logLoaded = false;

  constructor() { super('createdAt'); }
  protected fetch(q: Record<string, unknown>): Observable<Paged<Query>> { return this.api.adminChatQueries(q) as Observable<Paged<Query>>; }
  showLog(): void { this.tab.set('log'); if (!this.logLoaded) { this.logLoaded = true; this.load(); } }
}
