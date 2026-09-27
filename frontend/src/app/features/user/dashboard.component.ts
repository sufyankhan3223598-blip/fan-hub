import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService, UiService } from '../../core/services/ui.services';
import { Dashboard } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { SpinnerComponent } from '../../shared/components/basics';
import { AreaChartComponent, DonutChartComponent, SparklineComponent } from '../../shared/components/charts';
import { DualImageCardComponent } from '../../shared/components/cards';
import { AssetPipe, InitialsPipe, TimeAgoPipe } from '../../core/pipes/pipes';
import { CountUpDirective } from '../../core/directives/directives';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, SpinnerComponent, AreaChartComponent, DonutChartComponent, SparklineComponent, DualImageCardComponent, AssetPipe, InitialsPipe, TimeAgoPipe, CountUpDirective, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly ui = inject(UiService);
  readonly auth = inject(AuthService);
  readonly d = signal<Dashboard | null>(null);
  readonly devLink = signal<string | null>(
    (history.state as { devLink?: string } | undefined)?.devLink ??
    (inject(Router).getCurrentNavigation()?.extras.state as { devLink?: string } | undefined)?.devLink ??
    null
  );
  readonly kpiIcons: Record<string, string> = { bookmarks: 'bookmark', ratings: 'star', submissions: 'feather', streak: 'flame' };
  readonly kpiColors: Record<string, string> = { bookmarks: '#D4AF37', ratings: '#38BDF8', submissions: '#22D3EE', streak: '#F43F5E' };
  readonly activityIcons: Record<string, string> = { View: 'eye', Bookmark: 'bookmark', Rating: 'star', Login: 'login', Submission: 'feather', Feedback: 'message', Profile: 'user', Note: 'edit', Register: 'sparkles', Security: 'shield' };

  constructor() {
    this.api.dashboard().subscribe(d => {
      this.d.set(d);
      this.auth.setUser(d.user);
      if (!d.user.emailVerified && (history.state as { emailVerificationNeeded?: boolean })?.emailVerificationNeeded) {
        this.toast.warning('Email Verification Required', 'Please verify your email address to secure your account and unlock community features.');
      }
    });
  }

  resend(): void {
    this.auth.resendVerification().subscribe(r => {
      this.toast.success('Verification Email Sent!', r.message || 'Please check your inbox (and spam folder) for the verification link.');
      if (r.devLink) this.devLink.set(r.devLink);
    });
  }

  devPath(link: string): string { try { const u = new URL(link, location.origin); return u.pathname + u.search; } catch { return link; } }
}
