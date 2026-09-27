import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ToastService } from '../../core/services/ui.services';
import { CategoryStore, REALM_ICONS } from '../../core/services/stores';
import { IconComponent } from '../../shared/components/icon.component';
import { ModalComponent } from '../../shared/components/basics';
import { AssetPipe, InitialsPipe } from '../../core/pipes/pipes';
import { UserShellComponent } from './user-shell';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent, AssetPipe, InitialsPipe, UserShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styles: [`
    .avatar-zone { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
    .fandom-input { display: flex; gap: 8px; }
    .crop-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .crop-stage { position: relative; width: 280px; height: 280px; border-radius: 16px; overflow: hidden; background: #000; touch-action: none; cursor: grab;
      img { position: absolute; left: 50%; top: 50%; max-width: none; user-select: none; pointer-events: none; }
      &::after { content: ''; position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 999px rgba(0,0,0,.55); border: 2px solid var(--gold); pointer-events: none; } }
    .pref-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .seg { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--bg-2); border: 1px solid var(--border);
      button { flex: 1; height: 40px; border: none; border-radius: 9px; background: none; color: var(--muted); font-family: var(--font-ui); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        &.on { background: var(--bg-3); color: var(--text); box-shadow: inset 0 -2px 0 var(--gold); } } }
  `]
})
export class ProfileComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly cats = inject(CategoryStore);
  readonly icons = REALM_ICONS;
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('file');

  fullName = this.auth.user()?.fullName ?? '';
  bio = this.auth.user()?.bio ?? '';
  newFandom = '';
  readonly fandoms = signal<string[]>(this.auth.user()?.favoriteFandoms ?? []);
  readonly catIds = signal<number[]>(this.auth.user()?.categories.map(c => c.id) ?? []);
  readonly saving = signal(false);
  readonly emailNotifications = signal(this.auth.user()?.emailNotifications ?? true);


  readonly cropSrc = signal<string | null>(null);
  readonly zoom = signal(1);
  readonly pos = signal({ x: 0, y: 0 });
  private img?: HTMLImageElement;
  private drag: { x: number; y: number; px: number; py: number } | null = null;


  currentPassword = '';
  newPassword = '';

  constructor() {
    this.api.profile().subscribe(u => {
      this.auth.setUser(u);
      this.fullName = u.fullName; this.bio = u.bio ?? '';
      this.fandoms.set(u.favoriteFandoms); this.catIds.set(u.categories.map(c => c.id)); this.emailNotifications.set(u.emailNotifications);
    });
  }

  addFandom(): void {
    const f = this.newFandom.trim();
    if (f && !this.fandoms().some(x => x.toLowerCase() === f.toLowerCase()) && this.fandoms().length < 20) this.fandoms.update(a => [...a, f]);
    this.newFandom = '';
  }
  removeFandom(f: string): void { this.fandoms.update(a => a.filter(x => x !== f)); }
  toggleCat(id: number): void { this.catIds.update(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id])); }

  saveProfile(): void {
    if (this.fullName.trim().length < 2) { this.toast.error('Name is required'); return; }
    this.saving.set(true);
    this.api.updateProfile({ fullName: this.fullName, bio: this.bio, favoriteFandoms: this.fandoms(), categoryIds: this.catIds() }).subscribe({
      next: u => { this.auth.setUser(u); this.saving.set(false); this.toast.success('Profile saved'); },
      error: () => this.saving.set(false)
    });
  }

  savePrefs(): void {
    this.api.updatePreferences({ theme: this.theme.theme(), fontSize: this.theme.fontSize(), reduceMotion: this.theme.userReduceMotion(), emailNotifications: this.emailNotifications() })
      .subscribe(u => { this.auth.setUser(u); this.toast.success('Display preferences saved', 'They follow you on every device.'); });
  }


  pick(): void { this.fileInput()?.nativeElement.click(); }
  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) { this.toast.error('Unsupported file', 'Use JPG, PNG, WEBP or GIF.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.toast.error('Image too large', 'Maximum 5 MB before cropping.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { this.img = img; this.zoom.set(1); this.pos.set({ x: 0, y: 0 }); this.cropSrc.set(reader.result as string); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = '';
  }
  baseScale(): number { return this.img ? 280 / Math.min(this.img.width, this.img.height) : 1; }
  imgStyle(): Record<string, string> {
    const s = this.baseScale() * this.zoom();
    const w = (this.img?.width ?? 0) * s, h = (this.img?.height ?? 0) * s;
    return { width: `${w}px`, height: `${h}px`, transform: `translate(calc(-50% + ${this.pos().x}px), calc(-50% + ${this.pos().y}px))` };
  }
  down(e: PointerEvent): void { this.drag = { x: e.clientX, y: e.clientY, px: this.pos().x, py: this.pos().y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
  move(e: PointerEvent): void { if (this.drag) this.pos.set({ x: this.drag.px + e.clientX - this.drag.x, y: this.drag.py + e.clientY - this.drag.y }); }
  up(): void { this.drag = null; }

  uploadCropped(): void {
    if (!this.img) return;
    const size = 400;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d')!;
    const s = this.baseScale() * this.zoom() * (size / 280);
    const w = this.img.width * s, h = this.img.height * s;
    g.drawImage(this.img, size / 2 - w / 2 + this.pos().x * (size / 280), size / 2 - h / 2 + this.pos().y * (size / 280), w, h);
    canvas.toBlob(blob => {
      if (!blob) return;
      this.api.uploadAvatar(blob, 'avatar.png').subscribe(u => { this.auth.setUser(u); this.cropSrc.set(null); this.toast.success('Avatar updated'); });
    }, 'image/png');
  }
  removeAvatar(): void { this.api.removeAvatar().subscribe(u => { this.auth.setUser(u); this.toast.info('Avatar removed'); }); }

  changePassword(): void {
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe(() => {
      this.currentPassword = ''; this.newPassword = '';
      this.toast.success('Password changed');
    });
  }
}
