import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { AuthService } from '../../core/services/auth.service';

interface SiteNode {
  label: string;
  url: string;
  icon: string;
  branch: string;
  access?: 'public' | 'member' | 'admin';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface Branch {
  key: string;
  label: string;
  icon: string;
  color: string;
  nodes: SiteNode[];
  x?: number;
  y?: number;
}

interface BranchConfig {
  key: string;
  hubAngle: number;
  hubRx: number;
  hubRy: number;
  startDeg: number;
  endDeg: number;
}

const BRANCH_CONFIGS: Record<string, BranchConfig> = {
  realms: { key: 'realms', hubAngle: 270, hubRx: 175, hubRy: 130, startDeg: 254, endDeg: 326 },
  discover: { key: 'discover', hubAngle: 5, hubRx: 195, hubRy: 115, startDeg: 345, endDeg: 385 },
  events: { key: 'events', hubAngle: 61, hubRx: 180, hubRy: 125, startDeg: 42, endDeg: 80 },
  members: { key: 'members', hubAngle: 134, hubRx: 185, hubRy: 125, startDeg: 104, endDeg: 164 },
  help: { key: 'help', hubAngle: 210, hubRx: 190, hubRy: 120, startDeg: 185, endDeg: 236 },
};

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
            [class.lit]="focus() === b.key" (mouseenter)="focus.set(b.key)" (mouseleave)="focus.set(null)" [style.animation-delay.ms]="i * 35">
            <i class="leaf-dot"></i>
            <span class="leaf-label">{{ n.label }}</span>
            @if (n.access === 'member') { <span class="leaf-badge member">members</span> }
            @if (n.access === 'admin') { <span class="leaf-badge admin">admin</span> }
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

  readonly branches = computed<Branch[]>(() => {
    const rawCats = this.cats.categories();
    const realmNodes = (rawCats.length > 0 ? rawCats : [
      { name: 'Anime', slug: 'anime' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Movies', slug: 'movies' },
      { name: 'TV Shows', slug: 'tv-shows' },
      { name: 'K-Pop', slug: 'k-pop' },
      { name: 'Comics', slug: 'comics' },
      { name: 'Manga', slug: 'manga' },
      { name: 'Cosplay', slug: 'cosplay' }
    ]).map(c => ({
      label: c.name,
      url: `/realm/${c.slug}`,
      icon: REALM_ICONS[c.slug] || 'globe',
      branch: 'realms'
    }));

    return [
      {
        key: 'realms', label: 'Realms', icon: 'globe', color: '#E11D48',
        nodes: realmNodes
      },
      {
        key: 'discover', label: 'Discover', icon: 'compass', color: '#22D3EE',
        nodes: [
          { label: 'Explorer', url: '/explore', icon: 'filter', branch: 'discover' },
          { label: 'Multimedia', url: '/media', icon: 'film', branch: 'discover' },
          { label: 'Characters', url: '/characters', icon: 'users', branch: 'discover' },
          { label: 'Articles', url: '/articles', icon: 'book-open', branch: 'discover' },
          { label: 'Fan Creations', url: '/community', icon: 'feather', branch: 'discover' }
        ]
      },
      {
        key: 'events', label: 'Events & Merch', icon: 'calendar', color: '#D4AF37',
        nodes: [
          { label: 'Event Map', url: '/events', icon: 'map', branch: 'events' },
          { label: 'Highlights', url: '/events/highlights', icon: 'sparkles', branch: 'events' },
          { label: 'Merchandise', url: '/merchandise', icon: 'tag', branch: 'events' },
          { label: 'Upcoming', url: '/merchandise/upcoming', icon: 'clock', branch: 'events' }
        ]
      },
      {
        key: 'members', label: 'Members', icon: 'user', color: '#A855F7',
        nodes: [
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
        key: 'help', label: 'Help & Account', icon: 'help', color: '#22C55E',
        nodes: [
          { label: 'FAQ', url: '/faq', icon: 'help', branch: 'help' },
          { label: 'About', url: '/about', icon: 'info', branch: 'help' },
          { label: 'Login', url: '/login', icon: 'login', branch: 'help' },
          { label: 'Register', url: '/register', icon: 'user', branch: 'help' },
          { label: 'Forgot Password', url: '/forgot-password', icon: 'key', branch: 'help' },
          { label: 'Admin Panel', url: '/admin', icon: 'shield', branch: 'help', access: 'admin' }
        ]
      }
    ];
  });

  readonly layout = computed<Branch[]>(() => {
    const list = this.branches();
    const branchesWithNodes = list.map((b, bi) => {
      const cfg = BRANCH_CONFIGS[b.key] || {
        key: b.key,
        hubAngle: (bi / list.length) * 360,
        hubRx: 180,
        hubRy: 120,
        startDeg: (bi / list.length) * 360 - 30,
        endDeg: (bi / list.length) * 360 + 30
      };

      const hubRad = (cfg.hubAngle * Math.PI) / 180;
      const bx = Math.round(500 + Math.cos(hubRad) * cfg.hubRx);
      const by = Math.round(320 + Math.sin(hubRad) * cfg.hubRy);

      const n = b.nodes.length;
      const nodes: SiteNode[] = b.nodes.map((node, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const deg = cfg.startDeg + t * (cfg.endDeg - cfg.startDeg);
        const rad = ((deg % 360) * Math.PI) / 180;
        const alt = (i % 2 === 0) ? 1.0 : 0.85;
        const rx = 395 * alt;
        const ry = 245 * alt;
        const x = Math.round(500 + Math.cos(rad) * rx);
        const y = Math.round(320 + Math.sin(rad) * ry);
        const extraLen = node.access ? 8 : 0;
        const fullLen = node.label.length + extraLen;
        const width = 28 + fullLen * 7.2;
        const height = 24;
        return { ...node, x, y, width, height };
      });

      return { ...b, x: bx, y: by, nodes };
    });

    // Flatten all leaf nodes to run a relaxation step for collision prevention
    const allLeafs: SiteNode[] = [];
    branchesWithNodes.forEach(b => b.nodes.forEach(node => allLeafs.push(node)));

    for (let pass = 0; pass < 50; pass++) {
      for (let i = 0; i < allLeafs.length; i++) {
        for (let j = i + 1; j < allLeafs.length; j++) {
          const a = allLeafs[i];
          const bNode = allLeafs[j];
          const dx = Math.abs((a.x ?? 0) - (bNode.x ?? 0));
          const dy = Math.abs((a.y ?? 0) - (bNode.y ?? 0));
          const reqX = ((a.width ?? 60) + (bNode.width ?? 60)) / 2 + 12;
          const reqY = ((a.height ?? 24) + (bNode.height ?? 24)) / 2 + 8;
          if (dx < reqX && dy < reqY) {
            const overlapY = reqY - dy;
            const pushY = overlapY * 0.5;
            if ((a.y ?? 0) <= (bNode.y ?? 0)) {
              a.y = (a.y ?? 0) - pushY;
              bNode.y = (bNode.y ?? 0) + pushY;
            } else {
              a.y = (a.y ?? 0) + pushY;
              bNode.y = (bNode.y ?? 0) - pushY;
            }
          }
        }
      }
      allLeafs.forEach(leaf => {
        const halfW = (leaf.width ?? 60) / 2;
        const halfH = (leaf.height ?? 24) / 2;
        leaf.x = Math.max(halfW + 16, Math.min(1000 - halfW - 16, leaf.x ?? 500));
        leaf.y = Math.max(halfH + 16, Math.min(640 - halfH - 16, leaf.y ?? 320));
      });
    }

    allLeafs.forEach(leaf => {
      leaf.x = Math.round(leaf.x ?? 500);
      leaf.y = Math.round(leaf.y ?? 320);
    });

    return branchesWithNodes;
  });
}
