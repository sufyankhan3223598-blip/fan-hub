import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, effect, inject, signal, viewChildren } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/ui.services';
import { FanEvent } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon.component';
import { BreadcrumbsComponent, CountdownComponent, SpinnerComponent } from '../../shared/components/basics';
import { AssetPipe } from '../../core/pipes/pipes';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-event-highlights',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent, BreadcrumbsComponent, CountdownComponent, SpinnerComponent, AssetPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="eh-intro">
      <div class="eh-bg" aria-hidden="true">
        <img src="/media/images/events/wolverine-hero.jpg" alt="A Year of Fandom" class="eh-wolverine-img" />
        <div class="eh-overlay-dark"></div>
        <div class="eh-overlay-gold"></div>
        <div class="eh-claws-accent"></div>
      </div>

      <div class="container-fh eh-content-wrap">
        <div class="eh-content">
          <app-breadcrumbs [items]="[{ label: 'Events', url: '/events' }, { label: 'Highlights' }]" />

          <div class="eh-badge mt-4">
            <span class="badge-dot"></span>
            <span class="badge-text">SEASON 2026 ROADMAP</span>
            <span class="badge-sep">/</span>
            <span class="badge-accent">EVENT HIGHLIGHTS</span>
          </div>

          <h1 class="eh-title mt-3">
            A YEAR OF <span class="fandom-gradient">FANDOM</span>
          </h1>

          <p class="eh-lead">
            Scroll through the conventions, premieres and meetups shaping the season. Each chapter is a relentless stop on the ultimate fan journey.
          </p>

          <div class="eh-stats-strip">
            <div class="eh-stat-pill">
              <app-icon name="film" />
              <span class="stat-label">10+ Global Premieres</span>
            </div>
            <div class="eh-stat-pill">
              <app-icon name="map-pin" />
              <span class="stat-label">Conventions & Meetups</span>
            </div>
            <div class="eh-stat-pill">
              <app-icon name="shield" />
              <span class="stat-label">Adamantium Season</span>
            </div>
          </div>

          <div class="eh-actions mt-4">
            <button type="button" class="btn-fh btn-gold" (click)="scrollToFirstChapter()">
              <app-icon name="arrow-down" /> Explore Chapters
            </button>
            <a class="btn-fh btn-ghost" routerLink="/events">
              <app-icon name="map" /> All Events & Map
            </a>
          </div>

          <div class="scroll-cue" (click)="scrollToFirstChapter()" role="button" tabindex="0">
            <span class="cue-label">SCROLL DOWN</span>
            <app-icon name="chevron-down" />
          </div>
        </div>
      </div>
    </section>
    @if (events().length) {
      <div class="story">
        <div class="story-line" aria-hidden="true"><span></span></div>
        @for (e of events(); track e.id; let i = $index) {
          <section class="chapter" #chapter [class.flip]="i % 2 === 1" [style.--accent]="e.accentColor">
            <div class="container-fh chapter-grid">
              <div class="ch-media">
                <img class="m1" [src]="e.imageUrl | asset" [alt]="e.title" loading="lazy" />
                <img class="m2" [src]="e.hoverImageUrl | asset" alt="" loading="lazy" />
                <span class="ch-num">{{ (i + 1).toString().padStart(2, '0') }}</span>
              </div>
              <div class="ch-text">
                <span class="eyebrow">{{ e.eventType }} &middot; {{ e.city }}, {{ e.country }}</span>
                <h2>{{ e.title }}</h2>
                <p class="ch-date"><app-icon name="calendar" /> {{ e.startDate | date: 'longDate' }} - {{ e.endDate | date: 'longDate' }} &middot; {{ e.venue }}</p>
                <p class="ch-desc">{{ e.description }}</p>
                <app-countdown [target]="e.startDate" />
                <div class="d-flex gap-2 mt-4 flex-wrap">
                  <a class="btn-fh btn-gold btn-sm" [routerLink]="['/events', e.slug]">Read the story <app-icon name="arrow-right" /></a>
                  <a class="btn-fh btn-ghost btn-sm" routerLink="/events"><app-icon name="map" /> On the map</a>
                </div>
              </div>
            </div>
          </section>
        }
      </div>
    } @else { <app-spinner label="Loading highlights" /> }`,
  styles: [`
    .eh-intro {
      position: relative;
      min-height: 88vh;
      display: flex;
      align-items: center;
      padding-top: calc(var(--nav-h) + 20px);
      padding-bottom: 60px;
      overflow: hidden;
      background: #08080d;
    }
    .eh-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .eh-wolverine-img {
      position: absolute;
      top: 0;
      right: 0;
      width: 60%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      filter: saturate(1.15) contrast(1.08);
      transform: scale(1.02);
      transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
      @media (max-width: 991px) {
        width: 100%;
        opacity: 0.35;
        object-position: 70% top;
      }
    }
    .eh-overlay-dark {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, #08080d 0%, #08080d 36%, rgba(8, 8, 13, 0.85) 54%, rgba(8, 8, 13, 0.35) 75%, transparent 100%),
        linear-gradient(0deg, #08080d 0%, rgba(8, 8, 13, 0.4) 20%, transparent 50%),
        linear-gradient(180deg, #08080d 0%, rgba(8, 8, 13, 0.6) 15%, transparent 35%);
      @media (max-width: 991px) {
        background: linear-gradient(180deg, rgba(8, 8, 13, 0.88) 0%, rgba(8, 8, 13, 0.96) 100%);
      }
    }
    .eh-overlay-gold {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 75% 35%, rgba(245, 158, 11, 0.15) 0%, transparent 60%),
                  radial-gradient(circle at 20% 70%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
    }
    .eh-claws-accent {
      position: absolute;
      top: 25%;
      right: 15%;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(234, 179, 8, 0.22) 0%, transparent 65%);
      filter: blur(40px);
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .eh-content-wrap {
      position: relative;
      z-index: 1;
      width: 100%;
    }
    .eh-content {
      max-width: 680px;
    }
    .eh-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 16px;
      border-radius: 999px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.35);
      backdrop-filter: blur(8px);
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
      .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #F59E0B;
        box-shadow: 0 0 10px #F59E0B;
        animation: pulseDot 2s infinite;
      }
      .badge-text {
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #FBBF24;
      }
      .badge-sep {
        color: rgba(255, 255, 255, 0.3);
        font-size: 0.8rem;
      }
      .badge-accent {
        font-family: var(--font-ui);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: #ffffff;
      }
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    .eh-title {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 5.5vw, 4.4rem);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #ffffff;
      margin: 16px 0 18px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);

      .fandom-gradient {
        background: linear-gradient(135deg, #FDE047 0%, #EAB308 40%, #F97316 75%, #FDE047 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmerText 4s linear infinite;
        filter: drop-shadow(0 0 25px rgba(234, 179, 8, 0.45));
      }
    }
    @keyframes shimmerText {
      to { background-position: 200% center; }
    }
    .eh-lead {
      font-size: clamp(1.05rem, 1.6vw, 1.25rem);
      color: rgba(255, 255, 255, 0.86);
      line-height: 1.65;
      max-width: 58ch;
      margin-bottom: 24px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
    }
    .eh-stats-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 28px;
    }
    .eh-stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 7px 16px;
      border-radius: 12px;
      background: rgba(16, 16, 24, 0.78);
      border: 1px solid rgba(245, 158, 11, 0.24);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(10px);
      transition: all 0.25s ease;
      app-icon {
        color: #F59E0B;
        font-size: 15px;
        filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.45));
      }
      .stat-label {
        font-size: 0.84rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.92);
        letter-spacing: 0.02em;
      }
      &:hover {
        border-color: rgba(245, 158, 11, 0.55);
        background: rgba(245, 158, 11, 0.09);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
        app-icon {
          color: #FDE047;
          filter: drop-shadow(0 0 10px rgba(253, 224, 71, 0.6));
        }
      }
    }
    .eh-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      button.btn-gold {
        cursor: pointer;
        font-weight: 700;
        letter-spacing: 0.05em;
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        color: #08080d;
        border: none;
        padding: 12px 24px;
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
        &:hover {
          box-shadow: 0 12px 32px rgba(245, 158, 11, 0.55);
          transform: translateY(-2px);
        }
      }
      .btn-ghost {
        padding: 11px 22px;
      }
    }
    .scroll-cue {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 36px;
      cursor: pointer;
      color: rgba(245, 158, 11, 0.85);
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      transition: color 0.2s, transform 0.2s;
      .cue-label { font-family: var(--font-ui); }
      app-icon { font-size: 16px; animation: bob 1.6s infinite ease-in-out; }
      &:hover {
        color: #FDE047;
        transform: translateY(2px);
      }
    }
    @keyframes bob { 50% { transform: translateY(8px); } }
    .story { position: relative; }
    .story-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: var(--border); @media (max-width: 991px) { display: none; }
      span { position: sticky; top: 0; display: block; height: 50vh; background: linear-gradient(transparent, var(--gold), transparent); } }
    .chapter { min-height: 100vh; display: flex; align-items: center; padding: 80px 0; }
    .chapter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; align-items: center; @media (max-width: 991px) { grid-template-columns: 1fr; gap: 30px; } }
    .flip .ch-media { order: 2; @media (max-width: 991px) { order: 0; } }
    .ch-media {
      position: relative; aspect-ratio: 4/3; border-radius: var(--r-xl); overflow: visible;
      img {
        position: absolute; object-fit: cover; border-radius: 20px;
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.85);
        border: 1px solid rgba(245, 200, 106, 0.28);
        background: #09090f;
        transition: transform 0.4s var(--ease-out), box-shadow 0.4s ease;
      }
      .m1 {
        inset: 0 18% 18% 0; width: 82%; height: 82%; z-index: 1;
        &:hover { transform: scale(1.02); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(245, 200, 106, 0.2); }
      }
      .m2 {
        right: 0; bottom: 0; width: 55%; height: 55%; z-index: 2;
        border: 2px solid var(--accent, #F5C86A);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9), 0 0 20px color-mix(in srgb, var(--accent, #F5C86A) 30%, transparent);
        &:hover { transform: scale(1.05); }
      }
    }
    .ch-num { position: absolute; left: -10px; top: -40px; font-family: var(--font-display); font-size: 6rem; font-weight: 900; color: transparent; -webkit-text-stroke: 1px var(--accent); opacity: .6; z-index: 3; }
    .ch-text h2 { font-size: clamp(2rem, 4vw, 3.4rem); text-transform: uppercase; margin: 12px 0; }
    .ch-date { color: var(--accent); font-family: var(--font-ui); font-weight: 600; letter-spacing: .04em; }
    .ch-desc { font-size: 1.1rem; }
  `]
})
export class EventHighlightsComponent implements AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly events = signal<FanEvent[]>([]);
  readonly chapters = viewChildren<ElementRef<HTMLElement>>('chapter');
  private triggers: ScrollTrigger[] = [];

  constructor() {
    this.api.events({ highlights: true }).subscribe(e => this.events.set(e));
    effect(() => { if (this.chapters().length) setTimeout(() => this.animate(), 50); });
  }

  ngAfterViewInit(): void {  }

  private animate(): void {
    if (this.theme.reduceMotion() || this.triggers.length) return;
    this.zone.runOutsideAngular(() => {
      this.chapters().forEach(ch => {
        const el = ch.nativeElement;
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', end: 'center center', scrub: 1 } });
        tl.fromTo(el.querySelector('.m1'), { y: 80, opacity: 0, rotate: -3 }, { y: 0, opacity: 1, rotate: 0 })
          .fromTo(el.querySelector('.m2'), { y: 140, opacity: 0, rotate: 4 }, { y: 0, opacity: 1, rotate: 0 }, '<0.1')
          .fromTo(el.querySelectorAll('.ch-text > *'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08 }, '<');
        if (tl.scrollTrigger) this.triggers.push(tl.scrollTrigger);
        const para = gsap.to(el.querySelector('.m2'), { yPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (para.scrollTrigger) this.triggers.push(para.scrollTrigger);
      });
      ScrollTrigger.refresh();
    });
  }

  scrollToFirstChapter(): void {
    const first = this.chapters()[0]?.nativeElement;
    if (first) {
      first.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void { this.triggers.forEach(t => t.kill()); }
}
