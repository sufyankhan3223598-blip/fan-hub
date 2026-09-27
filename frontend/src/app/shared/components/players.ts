import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IconComponent } from './icon.component';
import { DurationPipe, assetUrl } from '../../core/pipes/pipes';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [IconComponent, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vp" [class.playing]="playing()" [attr.data-cursor]="'play'">
      @if (embedType() === 'youtube') {
        <iframe [src]="ytUrl()" [title]="title()" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>
      } @else {
        <video #video [src]="src()" [poster]="poster()" preload="metadata" playsinline (timeupdate)="onTime()" (loadedmetadata)="onMeta()"
          (play)="playing.set(true)" (pause)="playing.set(false)" (ended)="playing.set(false); ended.emit()" (click)="toggle()"></video>
        <button type="button" class="big-play" (click)="toggle()" [attr.aria-label]="playing() ? 'Pause' : 'Play'"><app-icon [name]="playing() ? 'pause' : 'play'" /></button>
        <div class="controls">
          <button type="button" (click)="toggle()" [attr.aria-label]="playing() ? 'Pause' : 'Play'"><app-icon [name]="playing() ? 'pause' : 'play'" /></button>
          <span class="time">{{ current() | duration }} / {{ duration() | duration }}</span>
          <input type="range" class="seek" min="0" [max]="duration() || 0" step="0.1" [value]="current()" (input)="seek($event)" aria-label="Seek" />
          <button type="button" (click)="toggleMute()" [attr.aria-label]="muted() ? 'Unmute' : 'Mute'"><app-icon [name]="muted() ? 'volume-x' : 'volume'" /></button>
          <button type="button" (click)="fullscreen()" aria-label="Fullscreen"><app-icon name="maximize" /></button>
        </div>
      }
    </div>`,
  styles: [`
    .vp { position: relative; aspect-ratio: 16/9; border-radius: var(--r-lg); overflow: hidden; background: #000; border: 1px solid var(--border-strong); box-shadow: var(--shadow); }
    video, iframe { width: 100%; height: 100%; display: block; border: 0; object-fit: cover; }
    .big-play { position: absolute; inset: 0; margin: auto; width: 76px; height: 76px; border-radius: 50%; border: none; cursor: pointer; color: #0B0A06;
      background: radial-gradient(circle at 30% 30%, #fff5d6, #F5C86A 40%, #D4AF37); display: grid; place-items: center; font-size: 28px;
      box-shadow: 0 0 0 10px rgba(212,175,55,.18), 0 20px 50px -10px rgba(0,0,0,.8); transition: transform .35s var(--ease-out), opacity .35s; }
    .playing .big-play { opacity: 0; transform: scale(.7); pointer-events: none; }
    .controls { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 14px;
      background: rgba(7,7,12,.72); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.12); color: #fff; opacity: 0; transform: translateY(10px); transition: all .35s var(--ease-out); }
    .vp:hover .controls, .vp:not(.playing) .controls, .vp:focus-within .controls { opacity: 1; transform: none; }
    .controls button { background: none; border: none; color: #fff; cursor: pointer; font-size: 18px; display: grid; place-items: center; padding: 4px; }
    .controls button:hover { color: #F5C86A; }
    .time { font-family: var(--font-ui); font-size: .82rem; white-space: nowrap; color: rgba(255,255,255,.85); }
    .seek { flex: 1; accent-color: #D4AF37; }
  `]
})
export class VideoPlayerComponent {
  private sanitizer = inject(DomSanitizer);
  readonly url = input<string>('');
  readonly posterUrl = input<string>('');
  readonly embedType = input<string>('file');
  readonly title = input<string>('Video');
  readonly autoplay = input<boolean>(false);
  readonly ended = output<void>();
  readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  readonly playing = signal(false);
  readonly current = signal(0);
  readonly duration = signal(0);
  readonly muted = signal(false);

  readonly src = computed(() => assetUrl(this.url()));
  readonly poster = computed(() => assetUrl(this.posterUrl()));
  readonly ytUrl = computed<SafeResourceUrl>(() => {

    const u = this.url().replace('https://www.youtube.com/watch?v=', 'https://www.youtube-nocookie.com/embed/');
    const safe = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+$/.test(u) ? u : 'about:blank';
    return this.sanitizer.bypassSecurityTrustResourceUrl(safe + (this.autoplay() && safe !== 'about:blank' ? '?autoplay=1' : ''));
  });

  constructor() {
    effect(() => {
      const v = this.video()?.nativeElement;
      if (v && this.autoplay()) v.play().catch(() => undefined);
    });
  }

  toggle(): void { const v = this.video()?.nativeElement; if (!v) return; v.paused ? v.play() : v.pause(); }
  onTime(): void { this.current.set(this.video()?.nativeElement.currentTime ?? 0); }
  onMeta(): void { this.duration.set(this.video()?.nativeElement.duration ?? 0); }
  seek(e: Event): void { const v = this.video()?.nativeElement; if (v) v.currentTime = +(e.target as HTMLInputElement).value; }
  toggleMute(): void { const v = this.video()?.nativeElement; if (!v) return; v.muted = !v.muted; this.muted.set(v.muted); }
  fullscreen(): void { this.video()?.nativeElement.requestFullscreen?.(); }
}

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [IconComponent, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ap" [style.--accent]="accent()">
      <button type="button" class="btn-play" (click)="toggle()" [attr.aria-label]="playing() ? 'Pause' : 'Play'"><app-icon [name]="playing() ? 'pause' : 'play'" /></button>
      <div class="ap-main">
        <div class="ap-head"><strong>{{ title() }}</strong><span>{{ current() | duration }} / {{ duration() | duration }}</span></div>
        <canvas #wave class="wave" (click)="seekTo($event)" role="slider" aria-label="Seek" [attr.aria-valuenow]="current()" [attr.aria-valuemax]="duration()"></canvas>
      </div>
      <audio #audio [src]="src()" preload="metadata" (timeupdate)="onTime()" (loadedmetadata)="onMeta()" (play)="playing.set(true)" (pause)="playing.set(false)" (ended)="playing.set(false)"></audio>
    </div>`,
  styles: [`
    .ap { display: flex; align-items: center; gap: 18px; padding: 16px 18px; border-radius: var(--r-lg); background: var(--glass); border: 1px solid var(--border); }
    .ap-main { flex: 1; min-width: 0; }
    .ap-head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px; font-size: .9rem;
      strong { font-family: var(--font-ui); letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } span { color: var(--muted); font-family: var(--font-ui); } }
    .wave { width: 100%; height: 56px; cursor: pointer; display: block; }
  `]
})
export class AudioPlayerComponent implements AfterViewInit, OnDestroy {
  readonly url = input<string>('');
  readonly title = input<string>('');
  readonly accent = input<string>('#D4AF37');
  readonly audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');
  readonly wave = viewChild.required<ElementRef<HTMLCanvasElement>>('wave');
  readonly playing = signal(false);
  readonly current = signal(0);
  readonly duration = signal(0);
  readonly src = computed(() => assetUrl(this.url()));
  private peaks: number[] = [];
  private ro?: ResizeObserver;

  async ngAfterViewInit(): Promise<void> {
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(this.wave().nativeElement);
    try {
      const buf = await (await fetch(this.src())).arrayBuffer();
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const audio = await ctx.decodeAudioData(buf);
      const data = audio.getChannelData(0);
      const bars = 120;
      const block = Math.floor(data.length / bars);
      this.peaks = Array.from({ length: bars }, (_, i) => {
        let sum = 0;
        for (let j = 0; j < block; j += 32) sum += Math.abs(data[i * block + j]);
        return sum / (block / 32);
      });
      const max = Math.max(...this.peaks, 0.001);
      this.peaks = this.peaks.map(p => p / max);
      ctx.close();
    } catch {
      this.peaks = Array.from({ length: 120 }, (_, i) => 0.35 + 0.3 * Math.abs(Math.sin(i * 0.37)));
    }
    this.draw();
  }

  private draw(): void {
    const canvas = this.wave().nativeElement;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.scale(dpr, dpr);
    const accent = getComputedStyle(canvas).getPropertyValue('--accent').trim() || '#D4AF37';
    const muted = getComputedStyle(document.documentElement).getPropertyValue('--border-strong').trim() || 'rgba(255,255,255,.2)';
    const n = this.peaks.length || 1;
    const bw = w / n;
    const progress = this.duration() ? this.current() / this.duration() : 0;
    this.peaks.forEach((p, i) => {
      const bh = Math.max(3, p * (h - 6));
      g.fillStyle = i / n <= progress ? accent : muted;
      const x = i * bw + bw * 0.2, y = (h - bh) / 2;
      g.beginPath();
      if (typeof g.roundRect === 'function') g.roundRect(x, y, bw * 0.6, bh, 2); else g.rect(x, y, bw * 0.6, bh);
      g.fill();
    });
  }

  toggle(): void { const a = this.audio().nativeElement; a.paused ? a.play() : a.pause(); }
  onTime(): void { this.current.set(this.audio().nativeElement.currentTime); this.draw(); }
  onMeta(): void { this.duration.set(this.audio().nativeElement.duration); this.draw(); }
  seekTo(e: MouseEvent): void {
    const c = this.wave().nativeElement;
    const r = c.getBoundingClientRect();
    const a = this.audio().nativeElement;
    if (a.duration) a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  }
  ngOnDestroy(): void { this.ro?.disconnect(); this.audio().nativeElement.pause(); }
}
