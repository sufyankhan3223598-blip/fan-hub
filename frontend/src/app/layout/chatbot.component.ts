import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../shared/components/icon.component';
import { ApiService } from '../core/services/api.service';
import { AuthService, store } from '../core/services/auth.service';
import { UiService } from '../core/services/ui.services';
import { ChatSuggestion } from '../core/models/models';
import { AssetPipe } from '../core/pipes/pipes';

interface ChatMsg { from: 'bot' | 'user'; text: string; quick?: string[]; suggestions?: ChatSuggestion[]; step?: number | null; time: Date; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [IconComponent, FormsModule, RouterLink, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {
  readonly ui = inject(UiService);
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  readonly scroller = viewChild<ElementRef<HTMLDivElement>>('scroller');

  readonly messages = signal<ChatMsg[]>([]);
  readonly typing = signal(false);
  readonly step = signal<number | null>(null);
  draft = '';
  private sessionId = this.session();

  constructor() {
    effect(() => {
      if (this.ui.chatOpen() && this.messages().length === 0) this.greet();
      const pre = this.ui.chatPrefill();
      if (this.ui.chatOpen() && pre) { this.ui.chatPrefill.set(null); setTimeout(() => this.send(pre), 250); }
    });
  }

  private session(): string {
    let id = store.get('fhp.chat');
    if (!id) { id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-zA-Z0-9-]/g, ''); store.set('fhp.chat', id); }
    return id;
  }

  private greet(): void {
    const name = this.auth.firstName();
    this.messages.set([{
      from: 'bot', time: new Date(),
      text: name ? `Hi ${name}! I'm the Fan Hub Plus assistant. Ask me anything or let me recommend something new.` :
        `Hi! I'm the Fan Hub Plus assistant. I can answer questions, recommend content and guide you through the platform.`,
      quick: ['Guide me through Fan Hub Plus', 'Recommend something', 'Find events near me', 'How do bookmarks work?']
    }]);
  }

  send(text?: string): void {
    const msg = (text ?? this.draft).trim();
    if (!msg || this.typing()) return;
    this.draft = '';
    this.messages.update(m => [...m, { from: 'user', text: msg, time: new Date() }]);
    this.typing.set(true);
    this.scroll();
    const started = Date.now();
    this.api.chat(msg, this.sessionId).subscribe({
      next: r => {

        setTimeout(() => {
          this.typing.set(false);
          this.step.set(r.onboardingStep ?? null);
          this.messages.update(m => [...m, { from: 'bot', text: r.reply, quick: r.quickReplies, suggestions: r.suggestions, step: r.onboardingStep, time: new Date() }]);
          this.scroll();
        }, Math.max(0, 650 - (Date.now() - started)));
      },
      error: () => {
        this.typing.set(false);
        this.messages.update(m => [...m, { from: 'bot', text: 'I could not reach the server. Please try again in a moment.', time: new Date() }]);
      }
    });
  }

  open(url: string): void { this.router.navigateByUrl(url); if (window.innerWidth < 640) this.ui.chatOpen.set(false); }

  reset(): void {
    store.remove('fhp.chat');
    this.sessionId = this.session();
    this.step.set(null);
    this.greet();
  }

  private scroll(): void {
    setTimeout(() => { const el = this.scroller()?.nativeElement; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, 40);
  }
}
