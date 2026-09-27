import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { AuthService } from '../../core/services/auth.service';

interface SiteNode { label: string; url: string; icon: string; branch: string; access?: 'public' | 'member' | 'admin'; x?: number; y?: number; }
interface Branch { key: string; label: string; icon: string; color: string; nodes: SiteNode[]; x?: number; y?: number; }

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sitemap" [class.has-focus]="focus() !== null">
      <svg class="links" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
        @for (b of layout(); track b.key) {
          <line x1="500" y1="320" [attr.x2]="b.x" [attr.y2]="b.y" [attr.stroke]="b.color" class="trunk" [class.lit]="focus() === b.key" />
          @for (n of b.nodes; track n.url) {
            <line [attr.x1]="b.x" [attr.y1]="b.y" [attr.x2]="n.x" [attr.y2]="n.y" [attr.stroke]="b.color" class="twig" [class.lit]="focus() === b.key" />
          }
        }
      </svg>
      <a routerLink="/" class="node root" style="left:50%;top:50%"><app-icon name="home" /><span>Home</span></a>
      @for (b of layout(); track b.key) {
        <div class="node branch" [style.left.%]="b.x! / 10" [style.top.%]="b.y! / 6.4" [style.--c]="b.color"
          (mouseenter)="focus.set(b.key)" (mouseleave)="focus.set(null)" [class.lit]="focus() === b.key">
          <app-icon [name]="b.icon" /><span>{{ b.label }}</span>
        </div>
        @for (n of b.nodes; track n.url; let i = $index) {
          <a class="node leaf" [routerLink]="n.url" [style.left.%]="n.x! / 10" [style.top.%]="n.y! / 6.4" [style.--c]="b.color"
            [class.lit]="focus() === b.key" (mouseenter)="focus.set(b.key)" (mouseleave)="focus.set(null)" [style.animation-delay.ms]="i * 40">
            <i></i><span>{{ n.label }}@if (n.access === 'member') { <em>members</em> } @if (n.access === 'admin') { <em>admin</em> }</span>
          </a>
        }
      }
    </div>
    <!-- Accessible / mobile list version -->
    <div class="sitemap-list">
      @for (b of layout(); track b.key) {
        <div class="sl-col" [style.--c]="b.color">
          <h4><app-icon [name]="b.icon" /> {{ b.label }}</h4>
          @for (n of b.nodes; track n.url) { <a [routerLink]="n.url">{{ n.label }}</a> }
        </div>
      }
    </div>`,
  styleUrl: './sitemap.component.scss'
})
export class SitemapComponent {
  private cats = inject(CategoryStore);
  private auth = inject(AuthService);
  readonly focus = signal<string | null>(null);

  readonly branches = computed<Branch[]>(() => [
    { key: 'realms', label: 'Realms', icon: 'globe', color: '#E11D48', nodes: this.cats.categories().map(c => ({ label: c.name, url: `/realm/${c.slug}`, icon: REALM_ICONS[c.slug], branch: 'realms' })) },
    {
      key: 'discover', label: 'Discover', icon: 'compass', color: '#22D3EE', nodes: [
        { label: 'Explorer', url: '/explore', icon: 'filter', branch: 'discover' },
        { label: 'Multimedia', url: '/media', icon: 'film', branch: 'discover' },
        { label: 'Characters', url: '/characters', icon: 'users', branch: 'discover' },
        { label: 'Articles', url: '/articles', icon: 'book-open', branch: 'discover' },
        { label: 'Fan Creations', url: '/community', icon: 'feather', branch: 'discover' }
      ]
    },
    {
      key: 'events', label: 'Events & Merch', icon: 'calendar', color: '#D4AF37', nodes: [
        { label: 'Event Map', url: '/events', icon: 'map', branch: 'events' },
        { label: 'Highlights', url: '/events/highlights', icon: 'sparkles', branch: 'events' },
        { label: 'Merchandise', url: '/merchandise', icon: 'tag', branch: 'events' },
        { label: 'Upcoming', url: '/merchandise/upcoming', icon: 'clock', branch: 'events' }
      ]
    },
    {
      key: 'members', label: 'Members', icon: 'user', color: '#A855F7', nodes: [
        { label: 'Dashboard', url: '/dashboard', icon: 'dashboard', branch: 'members', access: 'member' },
        { label: 'Profile', url: '/profile', icon: 'user', branch: 'members', access: 'member' },
        { label: 'Bookmarks', url: '/bookmarks', icon: 'bookmark', branch: 'members', access: 'member' },
        { label: 'Submit Content', url: '/submit', icon: 'upload', branch: 'members', access: 'member' },
        { label: 'My Submissions', url: '/submissions/mine', icon: 'inbox', branch: 'members', access: 'member' },
        { label: 'Chat History', url: '/chat-history', icon: 'bot', branch: 'members', access: 'member' },
        { label: 'Feedback', url: '/feedback', icon: 'message', branch: 'members', access: 'member' }
      ]
    },
    {
      key: 'help', label: 'Help & Account', icon: 'help', color: '#22C55E', nodes: [
        { label: 'FAQ', url: '/faq', icon: 'help', branch: 'help' },
        { label: 'About', url: '/about', icon: 'info', branch: 'help' },
        { label: 'Login', url: '/login', icon: 'login', branch: 'help' },
        { label: 'Register', url: '/register', icon: 'user', branch: 'help' },
        { label: 'Forgot Password', url: '/forgot-password', icon: 'key', branch: 'help' },
        { label: 'Admin Panel', url: '/admin', icon: 'shield', branch: 'help', access: 'admin' }
      ]
    }
  ]);


  readonly layout = computed<Branch[]>(() => {
    const list = this.branches();
    const angles = [-Math.PI * 0.5, -Math.PI * 0.08, Math.PI * 0.32, Math.PI * 0.68, Math.PI * 1.08];
    return list.map((b, bi) => {
      const a = angles[bi] ?? (bi / list.length) * Math.PI * 2;
      const bx = 500 + Math.cos(a) * 190, by = 320 + Math.sin(a) * 125;
      const n = b.nodes.length;
      const spread = Math.min(1.5, 0.28 * n);
      const nodes = b.nodes.map((node, i) => {
        const na = a + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
        const r = 330 + (i % 2) * 38;
        return { ...node, x: clamp(500 + Math.cos(na) * r * 1.3, 60, 940), y: clamp(320 + Math.sin(na) * r * 0.78, 30, 610) };
      });
      return { ...b, x: bx, y: by, nodes };
    });
  });
}

function clamp(v: number, a: number, b: number): number { return Math.min(b, Math.max(a, v)); }
