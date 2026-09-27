import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/ui.services';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { IconComponent } from '../../shared/components/icon.component';
import { RichEditorComponent } from '../../shared/components/rich-editor.component';
import { AssetPipe } from '../../core/pipes/pipes';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-submit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, RichEditorComponent, AssetPipe, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-shell>
      <div class="dash-tilt">
        <span class="eyebrow">Community</span>
        <h1 class="display-md mt-2">Submit fan content</h1>
        <p class="text-muted-fh mb-4">Every submission is reviewed by an admin before it appears in the community gallery. You will get a notification when it is reviewed.</p>
        <form [formGroup]="form" (ngSubmit)="send()" class="row g-4" novalidate>
          <div class="col-xl-8">
            <div class="panel">
              <span class="field-label d-block mb-2">Type</span>
              <div class="chip-row mb-4">
                @for (t of types; track t.v) {
                  <button type="button" class="chip" [class.active]="form.value.submissionType === t.v" (click)="form.patchValue({ submissionType: t.v })"><app-icon [name]="t.i" /> {{ t.v }}</button>
                }
              </div>
              <label class="field"><span class="field-label">Title</span>
                <input class="input-fh" formControlName="title" maxlength="200" placeholder="A catchy, descriptive title" />
                @if (err('title')) { <span class="field-error">Title must be 5-200 characters.</span> }</label>
              <label class="field"><span class="field-label">Summary</span>
                <textarea class="textarea-fh" formControlName="summary" maxlength="500" rows="2" placeholder="One or two sentences shown on the card"></textarea>
                <span class="field-hint">{{ form.value.summary?.length || 0 }}/500</span>
                @if (err('summary')) { <span class="field-error">Summary is required.</span> }</label>
              <div class="field"><span class="field-label">Body</span>
                <app-rich-editor formControlName="body" placeholder="Write your article, theory or review. Describe your fan art or cosplay build..." label="Submission body" />
                @if (err('body')) { <span class="field-error">Body needs at least 30 characters.</span> }</div>
            </div>
          </div>
          <div class="col-xl-4">
            <div class="panel mb-4">
              <div class="panel-title"><h3>Realm</h3></div>
              <div class="realm-pick">
                @for (c of cats.categories(); track c.id) {
                  <button type="button" [class.on]="form.value.categoryId === c.id" [style.--accent]="c.accentColor" (click)="form.patchValue({ categoryId: c.id })"><app-icon [name]="icons[c.slug] || 'sparkles'" /><span>{{ c.name }}</span></button>
                }
              </div>
              @if (err('categoryId')) { <span class="field-error">Choose a realm.</span> }
            </div>
            <div class="panel mb-4">
              <div class="panel-title"><h3>Cover image</h3><span class="sub">Optional</span></div>
              <div class="drop" [class.over]="over()" (click)="file.click()" (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="drop($event)" role="button" tabindex="0" (keydown.enter)="file.click()">
                @if (form.value.imageUrl) { <img [src]="form.value.imageUrl | asset" alt="Cover preview" /> }
                @else if (uploading()) { <span>Uploading...</span> }
                @else { <app-icon name="image" /><span>Drop an image or click to upload<br /><small>JPG, PNG, WEBP up to 5 MB</small></span> }
              </div>
              <input #file type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" (change)="pick($event)" />
              @if (form.value.imageUrl) { <button type="button" class="btn-fh btn-sm btn-ghost mt-2" (click)="form.patchValue({ imageUrl: null })"><app-icon name="trash" /> Remove image</button> }
            </div>
            <button type="submit" class="btn-fh btn-gold btn-block btn-lg" [disabled]="busy()"><app-icon name="send" /> {{ busy() ? 'Submitting...' : 'Submit for review' }}</button>
            <a routerLink="/submissions/mine" class="btn-fh btn-block mt-2">View my submissions</a>
          </div>
        </form>
      </div>
    </app-user-shell>`,
  styles: [`
    .realm-pick { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
      button { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); cursor: pointer; font-family: var(--font-ui); font-weight: 600; font-size: .88rem; text-align: left; transition: all .25s;
        app-icon { color: var(--accent); } &:hover { border-color: var(--accent); } &.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--text); } } }
    .drop { min-height: 180px; border: 1.5px dashed var(--border-strong); border-radius: 16px; display: grid; place-items: center; text-align: center; color: var(--muted); cursor: pointer; overflow: hidden; transition: all .25s;
      app-icon { font-size: 28px; color: var(--gold); display: block; margin-bottom: 6px; } img { width: 100%; height: 220px; object-fit: cover; } &:hover, &.over { border-color: var(--gold); background: rgba(212,175,55,.05); } }
  `]
})
export class SubmitComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  readonly cats = inject(CategoryStore);
  readonly icons = REALM_ICONS;
  readonly types = [{ v: 'Article', i: 'file-text' }, { v: 'Fan Art', i: 'palette' }, { v: 'Cosplay', i: 'cosplay-mask' }, { v: 'Theory', i: 'compass' }, { v: 'Review', i: 'star' }];
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly over = signal(false);
  readonly form = inject(FormBuilder).group({
    submissionType: ['Article', Validators.required],
    categoryId: [0, Validators.min(1)],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    summary: ['', [Validators.required, Validators.maxLength(500)]],
    body: ['', [Validators.required, (c: { value: string | null }) => ((c.value ?? '').replace(/<[^>]+>/g, '').trim().length >= 30 ? null : { short: true })]],
    imageUrl: [null as string | null]
  });

  err(name: string): boolean { const c = this.form.get(name); return !!c && c.invalid && (c.touched || c.dirty); }

  pick(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.upload(f); (e.target as HTMLInputElement).value = ''; }
  drop(e: DragEvent): void { e.preventDefault(); this.over.set(false); const f = e.dataTransfer?.files?.[0]; if (f) this.upload(f); }
  private upload(f: File): void {
    if (!/^image\//.test(f.type)) { this.toast.error('Images only', 'Please upload a JPG, PNG, GIF or WebP.'); return; }
    this.uploading.set(true);
    this.api.uploadSubmissionImage(f).subscribe({ next: r => { this.form.patchValue({ imageUrl: r.url }); this.uploading.set(false); }, error: () => this.uploading.set(false) });
  }

  send(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toast.error('Please complete the form', 'Some fields need attention.'); return; }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.api.submit({ categoryId: v.categoryId!, title: v.title!, submissionType: v.submissionType!, summary: v.summary!, body: v.body!, imageUrl: v.imageUrl }).subscribe({
      next: () => { this.toast.success('Submitted for review', 'An admin will review it shortly.'); this.router.navigateByUrl('/submissions/mine'); },
      error: () => this.busy.set(false)
    });
  }
}
