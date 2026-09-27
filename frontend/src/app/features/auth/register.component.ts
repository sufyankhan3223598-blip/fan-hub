import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { IconComponent } from '../../shared/components/icon.component';
import { LogoComponent } from '../../shared/components/basics';
import { AuthShellComponent } from './auth-shell';

export function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v = String(c.value ?? '');
  return v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) ? null : { weak: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, LogoComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell heroType="ironman" headline="Claim Your Multiverse Passport" copy="Pick your realms and we'll tune recommendations, live events and your dashboard to your passions.">
      @if (step() === 'otp') {
        <div class="verify-confirmation-card">
          <div class="verify-icon-orb">
            <app-icon name="shield" />
          </div>
          <span class="royal-eyebrow">
            <app-icon name="sparkles" /> SECURITY VERIFICATION
          </span>
          <h2 class="verify-title">Enter Verification Code</h2>
          <p class="verify-text">
            We sent a 6-digit OTP code to:<br />
            <strong class="verify-email-highlight">{{ f.email.value }}</strong>
          </p>
          <p class="verify-instruction">
            Please enter the 6-digit OTP code below to confirm your email and create your account.
          </p>

          <div class="otp-input-wrap">
            <input class="input-fh royal-input royal-otp-input" type="text" maxlength="6" inputmode="numeric"
              autocomplete="one-time-code" placeholder="• • • • • •" [value]="otp()" (input)="onOtpInput($event)" />
          </div>

          @if (otpError()) {
            <div class="error-banner">
              <app-icon name="alert" />
              <span>{{ otpError() }}</span>
            </div>
          }

          <button type="button" class="btn-fh btn-royal-submit verify-confirm-btn" [disabled]="loading() || otp().length < 6" (click)="confirmOtp()">
            <span>{{ loading() ? 'VERIFYING & CREATING ACCOUNT...' : 'CONFIRM & ACTIVATE ACCOUNT' }}</span>
          </button>

          <div class="verify-btn-group">
            <button type="button" class="btn-fh btn-secondary-auth" [disabled]="resendCountdown() > 0 || resending()" (click)="resendOtp()">
              <app-icon name="mail" />
              <span>{{ resendCountdown() > 0 ? 'Resend code in ' + resendCountdown() + 's' : 'Resend Verification Code' }}</span>
            </button>
            <button type="button" class="btn-fh btn-ghost-auth" (click)="step.set('form')">
              <span>&larr; Back to Registration Details</span>
            </button>
          </div>
        </div>
      } @else {
        <div class="form-header">
          <div class="auth-brand-emblem text-center mb-3">
            <app-logo [size]="64" />
          </div>
          <span class="royal-eyebrow">
            <app-icon name="sparkles" /> JOIN THE MULTIVERSE
          </span>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Unlock unlimited access to fan lore, forums, chat, and realm events</p>
        </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="royal-form">
        <label class="royal-field">
          <span class="field-label">Full Name</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="user" /></span>
            <input class="input-fh royal-input" formControlName="fullName" autocomplete="name" placeholder="John Doe" />
          </div>
          @if (f.fullName.touched && f.fullName.invalid) {
            <span class="field-error"><app-icon name="alert" /> Enter your full name (2+ characters).</span>
          }
        </label>

        <label class="royal-field">
          <span class="field-label">Email Address</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="mail" /></span>
            <input class="input-fh royal-input" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" />
          </div>
          @if (f.email.touched && f.email.invalid) {
            <span class="field-error"><app-icon name="alert" /> Enter a valid email address.</span>
          }
        </label>

        <label class="royal-field">
          <span class="field-label">Password</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="lock" /></span>
            <input class="input-fh royal-input" [type]="showPw() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="Min. 8 characters" />
            <button type="button" class="btn-eye" (click)="showPw.set(!showPw())" [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">
              <app-icon [name]="showPw() ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <div class="strength-track">
            <div class="strength-bar" [style.width.%]="strength() * 25" [class]="'s' + strength()"></div>
          </div>
          <span class="field-hint">Include upper, lower, number & special character.</span>
          @if (f.password.touched && f.password.invalid) {
            <span class="field-error"><app-icon name="alert" /> Password does not meet security requirements.</span>
          }
        </label>

        <label class="royal-field">
          <span class="field-label">Confirm Password</span>
          <div class="input-wrap">
            <span class="input-icon"><app-icon name="shield" /></span>
            <input class="input-fh royal-input" [type]="showPw() ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password" placeholder="Confirm your password" />
          </div>
          @if (f.confirmPassword.touched && f.confirmPassword.value !== f.password.value) {
            <span class="field-error"><app-icon name="alert" /> Passwords do not match.</span>
          }
        </label>

        <div class="realms-picker">
          <div class="realms-label-row">
            <span class="field-label">Favorite Realms (Optional)</span>
            <span class="realms-count">{{ picked().length }} selected</span>
          </div>
          <div class="chip-grid">
            @for (c of cats.categories(); track c.id) {
              <button type="button" class="realm-chip" [class.active]="picked().includes(c.id)" [style.--realm-color]="c.accentColor" (click)="toggle(c.id)">
                <app-icon [name]="icons[c.slug] || 'sparkles'" />
                <span>{{ c.name }}</span>
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <div class="error-banner">
            <app-icon name="alert" />
            <span>{{ error() }}</span>
          </div>
        }

        <button type="submit" class="btn-fh btn-royal-submit" [disabled]="loading()">
          <span>{{ loading() ? 'CREATING PASSPORT...' : 'CREATE FREE ACCOUNT' }}</span>
        </button>
      </form>

      <div class="auth-bottom-link">
        <span>Already a member?</span>
        <a routerLink="/login">Sign in</a>
      </div>
      }
    </app-auth-shell>`,
  styles: [`
    .form-header {
      margin-bottom: 22px;

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
      gap: 15px;
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

        &:focus-within {
          .input-icon {
            color: #F5C86A;
          }
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 16px;
          pointer-events: none;
          transition: color 0.2s ease;
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .royal-input {
          width: 100%;
          padding: 12px 44px 12px 42px;
          border-radius: 12px;
          background: #09090d !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          font-family: var(--font-ui);
          font-size: 0.95rem;
          transition: all 0.22s ease;

          &::-ms-reveal,
          &::-ms-clear {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }

          &::placeholder {
            color: rgba(255, 255, 255, 0.3);
          }

          &:focus {
            background: #0c0c11 !important;
            border-color: #F5C86A !important;
            box-shadow: 0 0 16px rgba(245, 200, 106, 0.25) !important;
            outline: none;
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
          z-index: 2;

          &:hover {
            color: #F5C86A;
          }
        }
      }

      .strength-track {
        height: 4px;
        border-radius: 99px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
        margin-top: 4px;

        .strength-bar {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
          background: #EF4444;

          &.s2 { background: #F59E0B; }
          &.s3 { background: #38BDF8; }
          &.s4 { background: #10B981; box-shadow: 0 0 8px #10B981; }
        }
      }

      .field-hint {
        font-size: 0.74rem;
        color: rgba(255, 255, 255, 0.45);
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

    .realms-picker {
      margin-top: 4px;

      .realms-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .field-label {
          font-family: var(--font-ui);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #F5C86A !important;
          text-shadow: 0 0 10px rgba(245, 200, 106, 0.25);
        }

        .realms-count {
          font-size: 0.72rem;
          color: #F5C86A;
          font-weight: 700;
        }
      }

      .chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;

        .realm-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: rgba(255, 255, 255, 0.78);
          font-family: var(--font-ui);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;

          .realm-chip-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--realm-color, #F5C86A);
            opacity: 0.5;
            transition: opacity 0.2s;
          }

          app-icon {
            font-size: 13px;
          }

          &:hover {
            background: rgba(245, 200, 106, 0.08);
            border-color: rgba(245, 200, 106, 0.3);
            color: #ffffff;
            transform: translateY(-1px);

            .realm-chip-dot {
              opacity: 1;
            }
          }

          &.active {
            background: rgba(245, 200, 106, 0.16);
            border-color: #F5C86A;
            color: #F5C86A;
            box-shadow: 0 0 10px rgba(245, 200, 106, 0.25);

            .realm-chip-dot {
              opacity: 1;
              box-shadow: 0 0 6px var(--realm-color, #F5C86A);
            }
          }
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

    .verify-confirmation-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 14px 4px;

      .verify-icon-orb {
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: rgba(245, 200, 106, 0.12);
        border: 2px solid #F5C86A;
        box-shadow: 0 0 25px rgba(245, 200, 106, 0.35);
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        color: #F5C86A;
        font-size: 28px;
        animation: pulseVerifyOrb 2.5s infinite ease-in-out;
      }

      .verify-title {
        font-family: var(--font-display);
        font-size: 1.85rem;
        font-weight: 900;
        color: #ffffff;
        margin: 6px 0 10px;
      }

      .verify-text {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        margin: 0 0 8px;

        .verify-email-highlight {
          color: #F5C86A;
          font-weight: 700;
        }
      }

      .verify-instruction {
        font-size: 0.84rem;
        color: rgba(255, 255, 255, 0.55);
        line-height: 1.4;
        margin: 0 0 20px;
      }

      .otp-input-wrap {
        width: 100%;
        margin-bottom: 18px;

        .royal-otp-input {
          font-size: 1.85rem !important;
          letter-spacing: 0.35em !important;
          text-align: center !important;
          font-weight: 900 !important;
          font-family: var(--font-display) !important;
          color: #F5C86A !important;
          padding: 14px 18px !important;
          border-color: rgba(245, 200, 106, 0.45) !important;
          background: #07070a !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;

          &::placeholder {
            letter-spacing: 0.25em;
            color: rgba(255, 255, 255, 0.2);
          }

          &:focus {
            border-color: #F5C86A !important;
            box-shadow: 0 0 22px rgba(245, 200, 106, 0.35) !important;
          }
        }
      }

      .verify-confirm-btn {
        width: 100%;
        margin-bottom: 16px !important;
      }

      .verify-btn-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin-top: 6px;

        .btn-secondary-auth {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          &:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: #F5C86A;
            color: #F5C86A;
          }
        }

        .btn-ghost-auth {
          width: 100%;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.88rem;
          cursor: pointer;
          padding: 8px;
          transition: color 0.2s;

          &:hover {
            color: #F5C86A;
            text-decoration: underline;
          }
        }
      }
    }

    @keyframes pulseVerifyOrb {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(245, 200, 106, 0.3); }
      50% { transform: scale(1.06); box-shadow: 0 0 32px rgba(245, 200, 106, 0.55); }
    }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly cats = inject(CategoryStore);
  readonly icons = REALM_ICONS;
  readonly picked = signal<number[]>([]);
  readonly loading = signal(false);
  readonly showPw = signal(false);
  readonly error = signal('');


  readonly step = signal<'form' | 'otp'>('form');
  readonly otp = signal<string>('');
  readonly otpError = signal<string>('');
  readonly resendCountdown = signal<number>(0);
  readonly resending = signal<boolean>(false);
  private countdownTimer: any = null;

  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPassword]],
    confirmPassword: ['', Validators.required]
  });
  readonly f = this.form.controls;
  private pw = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  readonly strength = computed(() => { const v = this.pw(); return [v.length >= 8, /[A-Z]/.test(v) && /[a-z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length; });

  toggle(id: number): void { this.picked.update(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id])); }

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = (input.value || '').replace(/\D/g, '').slice(0, 6);
    this.otp.set(clean);
    input.value = clean;
    this.otpError.set('');
  }

  private startCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.resendCountdown.set(60);
    this.countdownTimer = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        clearInterval(this.countdownTimer);
        this.resendCountdown.set(0);
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }

  submit(): void {
    if (this.form.invalid || this.f.password.value !== this.f.confirmPassword.value) {
      this.form.markAllAsTouched();
      this.error.set(this.f.password.errors?.['weak'] ? 'Password is too weak.' : 'Please correct the errors in the form.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const formVal = this.form.getRawValue();

    this.auth.sendRegistrationOtp(formVal.email, formVal.fullName).subscribe({
      next: res => {
        this.loading.set(false);
        this.step.set('otp');
        this.startCountdown();
        this.toast.success('Verification Code Sent', `We sent a 6-digit code to ${formVal.email}`);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to send verification code. Please try again.');
      }
    });
  }

  resendOtp(): void {
    if (this.resendCountdown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.otpError.set('');
    const formVal = this.form.getRawValue();

    this.auth.sendRegistrationOtp(formVal.email, formVal.fullName).subscribe({
      next: res => {
        this.resending.set(false);
        this.startCountdown();
        this.toast.success('Code Resent', `A new verification code was sent to ${formVal.email}`);
      },
      error: err => {
        this.resending.set(false);
        this.otpError.set(err?.error?.message ?? 'Failed to resend verification code.');
      }
    });
  }

  confirmOtp(): void {
    const code = this.otp().trim();
    if (code.length < 6) {
      this.otpError.set('Please enter a 6-digit code.');
      return;
    }

    this.loading.set(true);
    this.otpError.set('');
    const formVal = this.form.getRawValue();

    this.auth.registerWithOtp({
      fullName: formVal.fullName,
      email: formVal.email,
      password: formVal.password,
      confirmPassword: formVal.confirmPassword,
      otp: code,
      categoryIds: this.picked()
    }).subscribe({
      next: r => {
        this.loading.set(false);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.toast.success('Account Activated!', 'Welcome to FanHub+. Your email is verified.');
        this.router.navigateByUrl('/dashboard');
      },
      error: err => {
        this.loading.set(false);
        this.otpError.set(err?.error?.message ?? 'Invalid or expired verification code.');
      }
    });
  }
}
