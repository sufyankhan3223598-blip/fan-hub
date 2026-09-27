import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { Feedback } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent } from '../../shared/components/basics';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, IconComponent, BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><div class="container-fh">
      <app-breadcrumbs [items]="[{ label: 'Feedback' }]" />
      <div class="row g-4 mt-2">
        <div class="col-lg-7">
          <div class="panel">
            <span class="eyebrow">Feedback &amp; analytics</span>
            <h1 class="display-md mt-2">Help us level up</h1>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <span class="field-label d-block mb-2 mt-3">Type</span>
              <div class="type-cards" role="radiogroup" aria-label="Feedback type">
                @for (t of types; track t.v) {
                  <label class="type-card" [class.on]="form.controls.type.value === t.v" [style.--c]="t.c">
                    <input type="radio" formControlName="type" [value]="t.v" /><app-icon [name]="t.icon" /><strong>{{ t.v }}</strong><small>{{ t.hint }}</small>
                  </label>
                }
              </div>
              <label class="field mt-3"><span class="field-label">Subject</span>
                <input class="input-fh" formControlName="subject" maxlength="200" [placeholder]="placeholder()" />
                @if (form.controls.subject.touched && form.controls.subject.invalid) { <span class="field-error">Please add a subject.</span> }
              </label>
              <label class="field"><span class="field-label">{{ form.controls.type.value === 'Bug' ? 'What happened? Steps to reproduce' : form.controls.type.value === 'Suggestion' ? 'Describe your idea' : 'Your question' }}</span>
                <textarea class="textarea-fh" formControlName="message" maxlength="2000" rows="6"></textarea>
                <span class="field-hint">{{ form.controls.message.value.length || 0 }}/2000</span>
                @if (form.controls.message.touched && form.controls.message.invalid) { <span class="field-error">Please write at least 10 characters.</span> }
              </label>
              @if (form.controls.type.value === 'Bug') {
                <label class="field"><span class="field-label">Page where it happened (optional)</span><input class="input-fh" formControlName="pageUrl" placeholder="/events" /></label>
              }
              <button type="submit" class="btn-fh btn-gold" [disabled]="sending()"><app-icon name="send" /> {{ sending() ? 'Sending...' : 'Send feedback' }}</button>
            </form>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="panel">
            <div class="panel-title"><h3>Your reports</h3><span class="sub">{{ mine().length }}</span></div>
            @for (f of mine(); track f.id) {
              <div class="fb-row">
                <div class="d-flex justify-content-between gap-2"><strong>{{ f.subject }}</strong><span class="status" [class]="'status ' + f.status.toLowerCase().replace(' ', '-')">{{ f.status }}</span></div>
                <small class="text-muted-fh">{{ f.type }} &middot; {{ f.createdAt | date: 'mediumDate' }}</small>
                @if (f.adminNote) { <p class="note"><app-icon name="shield" /> {{ f.adminNote }}</p> }
              </div>
            } @empty { <p class="text-muted-fh">You haven't sent any feedback yet.</p> }
          </div>
        </div>
      </div>
    </div></div>`,
  styles: [`
    .type-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; @media (max-width: 560px) { grid-template-columns: 1fr; } }
    .type-card { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--glass); cursor: pointer; transition: all .25s;
      input { position: absolute; opacity: 0; } app-icon { font-size: 22px; color: var(--c); } small { color: var(--muted); font-size: .78rem; }
      &.on { border-color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); box-shadow: 0 10px 30px -18px var(--c); } &:focus-within { outline: 2px solid var(--cyan); } }
    .fb-row { padding: 12px 0; border-bottom: 1px solid var(--border); .note { margin: 6px 0 0; font-size: .85rem; color: var(--text-2); } }
  `]
})
export class FeedbackComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  readonly mine = signal<Feedback[]>([]);
  readonly sending = signal(false);
  readonly types = [
    { v: 'Bug', icon: 'alert', c: '#F43F5E', hint: 'Something is broken' },
    { v: 'Suggestion', icon: 'sparkles', c: '#22C55E', hint: 'An idea or improvement' },
    { v: 'Query', icon: 'help', c: '#22D3EE', hint: 'A question for the team' }
  ];
  readonly form = this.fb.nonNullable.group({
    type: ['Bug', Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    pageUrl: ['']
  });

  constructor() { this.load(); }
  load(): void { this.api.myFeedback().subscribe(f => this.mine.set(f)); }
  placeholder(): string { return ({ Bug: 'e.g. Map pins overlap on mobile', Suggestion: 'e.g. Add a dark fantasy collection', Query: 'e.g. How are events added?' } as Record<string, string>)[this.form.controls.type.value]; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending.set(true);
    this.api.sendFeedback(this.form.getRawValue()).subscribe({
      next: () => { this.sending.set(false); this.toast.success('Feedback sent', 'Thanks! The admin team will review it.'); this.form.reset({ type: this.form.controls.type.value, subject: '', message: '', pageUrl: '' }); this.load(); },
      error: () => this.sending.set(false)
    });
  }
}
