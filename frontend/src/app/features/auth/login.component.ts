import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthShellComponent } from './auth-shell';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heroType="captain-america" headline="Welcome Back, Avenger" copy="Sign in to continue your journey through the eight multiverse realms.">
      <div class="form-header">
        <span class="royal-eyebrow">
          <app-icon name="shield" /> ROYAL AUTHENTICATION
        </span>
        <h1 class="auth-title">Enter The Hub</h1>
        <p class="auth-subtitle">Access your personalized fandoms, bookmarks & community perks</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="royal-form">
        <label class="royal-field">
          <span class="field-label">Email Address</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="mail" /></span>
            <input class="input-fh royal-input" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
          </div>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error"><app-icon name="alert" /> Enter a valid email address.</span>
          }
        </label>

        <label class="royal-field">
          <span class="field-label">Password</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="lock" /></span>
            <input class="input-fh royal-input" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Enter your password" />
            <button type="button" class="btn-eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
              <app-icon [name]="show() ? 'eye-off' : 'eye'" />
            </button>
          </div>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error"><app-icon name="alert" /> Password is required.</span>
          }
        </label>

        <div class="form-sub-row">
          <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
        </div>

        @if (error()) {
          <div class="error-banner">
            <app-icon name="alert" />
            <span>{{ error() }}</span>
          </div>
        }

        <button type="submit" class="btn-fh btn-royal-submit" [disabled]="loading()">
          <span>{{ loading() ? 'AUTHENTICATING...' : 'SIGN IN TO HUB' }}</span>
        </button>

        <div class="resend-verification-row">
          <span>Unverified account?</span>
          <button type="button" class="btn-resend-link" (click)="resendVerification()">Resend verification email</button>
        </div>
      </form>

      <div class="demo-vault">
        <span class="demo-label">ONE-CLICK DEMO ACCESS</span>
        <div class="demo-buttons">
          <button type="button" class="demo-chip" (click)="fill('admin@fanhubplus.com', 'Admin@123')">
            <app-icon name="shield" />
            <span>Superadmin</span>
          </button>
          <button type="button" class="demo-chip" (click)="fill('ayesha@fanhubplus.com', 'User@123')">
            <app-icon name="user" />
            <span>Member</span>
          </button>
        </div>
      </div>

      <div class="auth-bottom-link">
        <span>New to the Multiverse?</span>
        <a routerLink="/register">Create a free account</a>
      </div>
    </app-auth-shell>`,
  styles: [`
    .form-header {
      margin-bottom: 24px;

      .royal-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #F5C86A;
        text-shadow: 0 0 10px rgba(245, 200, 106, 0.35);
        margin-bottom: 6px;

        app-icon { font-size: 13px; }
      }

      .auth-title {
        font-family: var(--font-display);
        font-size: 2.1rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        color: #ffffff;
        margin: 4px 0 6px;
      }

      .auth-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.88rem;
        line-height: 1.4;
        margin: 0;
      }
    }

    .royal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .royal-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .field-label {
        font-family: var(--font-ui);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #F5C86A !important;
        text-shadow: 0 0 10px rgba(245, 200, 106, 0.25);
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;

        .input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 16px;
          pointer-events: none;
          transition: color 0.2s ease;
          display: grid;
          place-items: center;
        }

        .royal-input {
          width: 100%;
          padding: 13px 44px 13px 42px;
          border-radius: 12px;
          background: #09090d !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          font-family: var(--font-ui);
          font-size: 0.95rem;
          transition: all 0.22s ease;

          &::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }

          &:focus {
            background: #0c0c11 !important;
            border-color: #F5C86A !important;
            box-shadow: 0 0 16px rgba(245, 200, 106, 0.25) !important;
            outline: none;

            & ~ .input-icon {
              color: #F5C86A;
            }
          }
        }

        .btn-eye {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
          transition: color 0.2s;

          &:hover {
            color: #F5C86A;
          }
        }
      }

      .field-error {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #EF4444;
        font-size: 0.76rem;
        font-weight: 600;
        margin-top: 2px;
      }
    }

    .form-sub-row {
      display: flex;
      justify-content: flex-end;

      .forgot-link {
        color: #F5C86A;
        font-size: 0.82rem;
        font-weight: 600;
        text-decoration: none;
        transition: opacity 0.2s;

        &:hover {
          text-decoration: underline;
          opacity: 0.9;
        }
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #FCA5A5;
      font-size: 0.85rem;
    }

    .btn-royal-submit {
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      background: linear-gradient(135deg, #F5C86A 0%, #D4AF37 50%, #B48528 100%) !important;
      border: none !important;
      color: #000000 !important;
      font-family: var(--font-ui);
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      box-shadow: 0 8px 24px rgba(245, 200, 106, 0.35) !important;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.22s ease !important;
      margin-top: 4px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(245, 200, 106, 0.55) !important;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .resend-verification-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;

      .btn-resend-link {
        background: transparent;
        border: none;
        color: #F5C86A;
        font-weight: 700;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
        transition: color 0.2s;

        &:hover {
          color: #ffffff;
        }
      }
    }

    .demo-vault {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);

      .demo-label {
        display: block;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.45);
        margin-bottom: 10px;
      }

      .demo-buttons {
        display: flex;
        gap: 10px;

        .demo-chip {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(245, 200, 106, 0.22);
          color: rgba(255, 255, 255, 0.85);
          font-family: var(--font-ui);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;

          app-icon {
            color: #F5C86A;
            font-size: 14px;
          }

          &:hover {
            background: rgba(245, 200, 106, 0.12);
            border-color: rgba(245, 200, 106, 0.5);
            color: #ffffff;
            transform: translateY(-1px);
          }
        }
      }
    }

    .auth-bottom-link {
      margin-top: 20px;
      text-align: center;
      font-size: 0.88rem;
      color: rgba(255, 255, 255, 0.6);

      a {
        color: #F5C86A;
        font-weight: 700;
        margin-left: 6px;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly returnUrl = input<string>('');
  readonly show = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  fill(e: string, p: string): void { this.form.setValue({ email: e, password: p }); }

  resendVerification(): void {
    const email = this.form.controls.email.value.trim();
    if (!email) {
      this.toast.warning('Email Required', 'Please enter your email address above to resend verification.');
      return;
    }
    this.auth.resendVerificationByEmail(email).subscribe({
      next: r => {
        this.toast.success('Verification Email Sent!', r.message || 'Please check your inbox (and spam folder) for the verification link.');
      },
      error: err => {
        this.toast.info('Verification Processed', err?.error?.message ?? 'If an account exists, a verification link has been sent to your email.');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: r => {
        this.loading.set(false);
        if (!r.user.emailVerified) {
          this.toast.warning('Email Not Verified', 'Please check your email to verify your account. A verification link is waiting on your dashboard.');
        } else {
          this.toast.success(`Welcome back, ${r.user.fullName.split(' ')[0]}!`);
        }
        this.router.navigateByUrl(this.returnUrl() || (r.user.role === 'Admin' ? '/admin' : '/dashboard'), {
          state: { emailVerificationNeeded: !r.user.emailVerified }
        });
      },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message ?? 'Sign in failed.'); }
    });
  }
}
