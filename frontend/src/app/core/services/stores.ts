import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AppNotification, Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private api = inject(ApiService);
  readonly categories = signal<Category[]>([]);
  readonly loaded = signal(false);
  readonly bySlug = computed(() => new Map(this.categories().map(c => [c.slug, c])));

  load(force = false): void {
    if (this.loaded() && !force) return;
    this.loaded.set(true);
    this.api.categories().subscribe({ next: c => this.categories.set(c), error: () => this.loaded.set(false) });
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  readonly items = signal<AppNotification[]>([]);
  readonly unread = computed(() => this.items().filter(n => !n.isRead).length);

  refresh(): void {
    if (!this.auth.isLoggedIn()) { this.items.set([]); return; }
    this.api.notifications().subscribe({ next: n => this.items.set(n), error: () => undefined });
  }
  markRead(id: number): void {
    this.items.update(list => list.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    this.api.readNotification(id).subscribe({ error: () => undefined });
  }
  markAll(): void {
    this.items.update(list => list.map(n => ({ ...n, isRead: true })));
    this.api.readAllNotifications().subscribe({ error: () => undefined });
  }
}

export const REALM_ICONS: Record<string, string> = {
  anime: 'katana', gaming: 'controller', movies: 'film-reel', 'tv-shows': 'tv',
  'k-pop': 'microphone', comics: 'mask', manga: 'manga', cosplay: 'cosplay-mask'
};
