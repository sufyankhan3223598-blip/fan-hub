import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthShellComponent } from './auth-shell';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, IconComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell headline="Confirm your identity" copy="Verified accounts keep the community safe.">
      <span class="eyebrow">Email verification</span>
      @switch (state()) {
        @case ('loading') { <h1 class="display-md mt-2">Verifying...</h1> }
        @case ('ok') { <h1 class="display-md mt-2"><app-icon name="check-circle" /> Verified</h1><p>{{ message() }}</p>
          <a class="btn-fh btn-gold" [routerLink]="auth.isLoggedIn() ? '/dashboard' : '/login'">Continue</a> }
        @default { <h1 class="display-md mt-2">Link problem</h1><p>{{ message() }}</p>
          @if (auth.isLoggedIn()) { <a class="btn-fh" routerLink="/dashboard">Resend from dashboard</a> } @else { <a class="btn-fh" routerLink="/login">Sign in</a> } }
      }
    </app-auth-shell>`
})
export class VerifyEmailComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly token = input<string>('');
  readonly state = signal<'loading' | 'ok' | 'error'>('loading');
  readonly message = signal('');
  ngOnInit(): void {
    if (!this.token()) { this.state.set('error'); this.message.set('The verification token is missing.'); return; }
    this.auth.verifyEmail(this.token()).subscribe({
      next: r => { this.state.set('ok'); this.message.set(r.message); },
      error: e => { this.state.set('error'); this.message.set(e?.error?.message ?? 'This link is invalid or has expired.'); }
    });
  }
}
