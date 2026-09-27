import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthShellComponent } from './auth-shell';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell headline="Lost the key?" copy="We'll send a secure, time-limited reset link to your email.">
      <span class="eyebrow">Password recovery</span>
      <h1 class="display-md mt-2 mb-4">Forgot password</h1>
      @if (sent()) {
        <div class="panel"><p><app-icon name="check-circle" /> {{ sent() }}</p>
          @if (devLink()) { <p class="small">Development mode (SMTP not configured): <a [href]="devLink()">open the reset link</a></p> }</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="field"><span class="field-label">Email</span>
            <div class="input-icon"><app-icon name="mail" /><input class="input-fh" type="email" formControlName="email" /></div></label>
          <button type="submit" class="btn-fh btn-gold btn-block" [disabled]="loading() || form.invalid"><app-icon name="send" /> Send reset link</button>
        </form>
      }
      <p class="mt-4 mb-0 text-center"><a routerLink="/login">Back to sign in</a></p>
    </app-auth-shell>`
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  readonly loading = signal(false);
  readonly sent = signal('');
  readonly devLink = signal<string | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  submit(): void {
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: r => { this.loading.set(false); this.sent.set(r.message); this.devLink.set(r.devLink ? new URL(r.devLink, location.origin).pathname + new URL(r.devLink, location.origin).search : null); },
      error: () => this.loading.set(false)
    });
  }
}
