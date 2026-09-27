import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthShellComponent } from './auth-shell';
import { strongPassword } from './register.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell headline="Forge a new key" copy="Choose a strong password. All other sessions will be signed out.">
      <span class="eyebrow">Reset password</span>
      <h1 class="display-md mt-2 mb-4">New password</h1>
      @if (!token()) { <p class="field-error">This link is missing its token. <a routerLink="/forgot-password">Request a new one</a>.</p> }
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label class="field"><span class="field-label">New password</span><input class="input-fh" type="password" formControlName="password" autocomplete="new-password" />
          <span class="field-hint">8+ characters with upper, lower, number and symbol.</span></label>
        <label class="field"><span class="field-label">Confirm password</span><input class="input-fh" type="password" formControlName="confirmPassword" autocomplete="new-password" /></label>
        @if (error()) { <p class="field-error">{{ error() }}</p> }
        <button type="submit" class="btn-fh btn-gold btn-block" [disabled]="loading() || !token()"><app-icon name="key" /> Reset password</button>
      </form>
    </app-auth-shell>`
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly token = input<string>('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({ password: ['', [Validators.required, strongPassword]], confirmPassword: ['', Validators.required] });
  submit(): void {
    const { password, confirmPassword } = this.form.getRawValue();
    if (this.form.invalid) { this.error.set('Password is too weak.'); return; }
    if (password !== confirmPassword) { this.error.set('Passwords do not match.'); return; }
    this.loading.set(true);
    this.auth.resetPassword(this.token(), password, confirmPassword).subscribe({
      next: r => { this.toast.success('Password reset', r.message); this.router.navigateByUrl('/login'); },
      error: e => { this.loading.set(false); this.error.set(e?.error?.message ?? 'Reset failed.'); }
    });
  }
}
