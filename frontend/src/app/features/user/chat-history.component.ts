import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService, UiService } from '../../core/services/ui.services';
import { ChatSession } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmDialogComponent, EmptyStateComponent, SpinnerComponent } from '../../shared/components/basics';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [DatePipe, IconComponent, ConfirmDialogComponent, EmptyStateComponent, SpinnerComponent, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-shell>
      <div class="dash-tilt">
        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
          <div><span class="eyebrow">Assistant</span><h1 class="display-md mt-2 mb-0">Chat history</h1></div>
          <div class="d-flex gap-2">
            <button type="button" class="btn-fh btn-gold" (click)="ui.openChat()"><app-icon name="bot" /> New chat</button>
            @if (sessions()?.length) { <button type="button" class="btn-fh btn-danger" (click)="confirm.set(true)"><app-icon name="trash" /> Clear history</button> }
          </div>
        </div>
        @if (sessions(); as s) {
          @if (!s.length) { <app-empty-state icon="bot" title="No conversations yet" message="Ask the assistant about fandoms, events, merchandise or site features." /> }
          @else {
            <div class="ch">
              <aside class="ch-list">
                @for (x of s; track x.sessionId) {
                  <button type="button" [class.on]="active()?.sessionId === x.sessionId" (click)="activeId.set(x.sessionId)">
                    <strong>{{ x.preview }}</strong><small>{{ x.lastMessageAt | date: 'MMM d, h:mm a' }} &middot; {{ x.messageCount }} messages</small>
                  </button>
                }
              </aside>
              <section class="ch-thread panel" aria-live="polite">
                @if (active(); as a) {
                  <div class="panel-title"><h3>Session from {{ a.startedAt | date: 'medium' }}</h3></div>
                  @for (m of a.messages; track m.id) {
                    <div class="msg me"><p>{{ m.message }}</p><small>{{ m.createdAt | date: 'shortTime' }}</small></div>
                    <div class="msg bot"><span class="bot-ic"><app-icon name="bot" /></span><div><p>{{ m.response }}</p><small>Intent: {{ m.intent }}</small></div></div>
                  }
                }
              </section>
            </div>
          }
        } @else { <app-spinner /> }
      </div>
      <app-confirm [open]="confirm()" title="Clear chat history?" message="All saved conversations will be permanently deleted." confirmText="Clear" (confirm)="clear()" (cancel)="confirm.set(false)" />
    </app-user-shell>`,
  styles: [`
    .ch { display: grid; grid-template-columns: 320px 1fr; gap: 20px; @media (max-width: 991px) { grid-template-columns: 1fr; } }
    .ch-list { display: flex; flex-direction: column; gap: 8px; max-height: 640px; overflow-y: auto;
      button { text-align: left; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text); cursor: pointer; display: flex; flex-direction: column; gap: 4px; transition: all .25s;
        strong { font-family: var(--font-ui); font-size: .95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } small { color: var(--muted); font-size: .78rem; }
        &:hover { border-color: var(--border-strong); } &.on { border-color: var(--gold); box-shadow: inset 3px 0 0 var(--gold); } } }
    .ch-thread { max-height: 640px; overflow-y: auto; }
    .msg { margin-bottom: 14px; p { margin: 0; white-space: pre-line; } small { display: block; margin-top: 4px; font-size: .74rem; color: var(--muted); }
      &.me { margin-left: auto; max-width: 75%; padding: 10px 14px; border-radius: 16px 16px 4px 16px; background: linear-gradient(135deg, var(--violet), #5b2bc4); color: #fff; small { color: rgba(255,255,255,.7); } }
      &.bot { display: flex; gap: 10px; max-width: 85%; > div { padding: 10px 14px; border-radius: 16px 16px 16px 4px; background: var(--bg-2); border: 1px solid var(--border); } } }
    .bot-ic { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(212,175,55,.15); color: var(--gold-2); }
  `]
})
export class ChatHistoryComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly ui = inject(UiService);
  readonly sessions = signal<ChatSession[] | null>(null);
  readonly activeId = signal<string | null>(null);
  readonly confirm = signal(false);
  readonly active = computed<ChatSession | null>(() => { const s = this.sessions() ?? []; return s.find(x => x.sessionId === this.activeId()) ?? s[0] ?? null; });

  constructor() { this.api.chatHistory().subscribe(s => this.sessions.set(s)); }
  clear(): void { this.api.clearChatHistory().subscribe(() => { this.sessions.set([]); this.confirm.set(false); this.toast.info('Chat history cleared'); }); }
}
