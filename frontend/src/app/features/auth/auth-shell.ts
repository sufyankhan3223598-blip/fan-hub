import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  input,
  viewChild,
} from '@angular/core';
import * as THREE from 'three';
import { IronmanHero } from '../../core/three/ironman-hero';
import { CaptainAmericaHero } from '../../core/three/captain-america-hero';
import { ThemeService } from '../../core/services/ui.services';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="container-fh auth-shell-layout">
        <!-- LEFT COLUMN: Form -->
        <div class="auth-form-column">
          <div class="auth-card royal-auth-card">
            <ng-content />
          </div>
        </div>

        <!-- RIGHT COLUMN: 3D Hero Stage (Iron Man on Register / Captain America on Login) -->
        <div class="auth-3d-column">
          <div class="stage-container">
            <canvas #canvas class="stage-canvas" aria-hidden="true"></canvas>
            <div class="stage-ambient-glow" [class.cap-glow]="heroType() === 'captain-america'"></div>
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      background: #050507;
    }

    .auth-page {
      position: relative;
      width: 100%;
      min-height: calc(100vh - var(--nav-h));
      padding-top: calc(var(--nav-h) + 20px);
      padding-bottom: 50px;
      background: #050507;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }

    .auth-shell-layout {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: clamp(24px, 4vw, 56px);
      align-items: center;
      width: 100%;

      @media (max-width: 991px) {
        grid-template-columns: 1fr;
      }
    }




    .auth-form-column {
      display: flex;
      justify-content: flex-start;
      width: 100%;

      @media (max-width: 991px) {
        justify-content: center;
      }
    }

    .royal-auth-card {
      width: 100%;
      max-width: 480px;
      background: linear-gradient(160deg, #0d0d11 0%, #060608 100%) !important;
      border: 1px solid rgba(245, 200, 106, 0.28) !important;
      border-radius: 24px !important;
      padding: clamp(28px, 4vw, 44px) !important;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
      position: relative;
      overflow: hidden;


      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 15%;
        right: 15%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(245, 200, 106, 0.8), #ffffff, rgba(245, 200, 106, 0.8), transparent);
        pointer-events: none;
      }
    }




    .auth-3d-column {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: clamp(540px, 82vh, 820px);

      @media (max-width: 991px) {
        display: none;
      }
    }

    .stage-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .stage-canvas {
        width: 100%;
        height: 100%;
        display: block;
        cursor: grab;

        &:active {
          cursor: grabbing;
        }
      }

      .stage-ambient-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(245, 200, 106, 0.1) 0%,
          rgba(56, 189, 248, 0.06) 40%,
          transparent 70%
        );
        filter: blur(70px);
        z-index: -1;
        pointer-events: none;

        &.cap-glow {
          background: radial-gradient(
            circle,
            rgba(245, 200, 106, 0.08) 0%,
            rgba(239, 68, 68, 0.04) 45%,
            transparent 70%
          );
        }
      }
    }
  `]
})
export class AuthShellComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private theme = inject(ThemeService);

  readonly heroType = input<'ironman' | 'captain-america'>('ironman');
  readonly headline = input<string>('Your Multiverse Passport');
  readonly copy = input<string>('Bookmark, rate, follow events and share your own fan creations across eight multiverse realms.');

  readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  private hero?: IronmanHero | CaptainAmericaHero;

  private raf = 0;
  private isDestroyed = false;
  private mouse = new THREE.Vector2();
  private mouseLerp = new THREE.Vector2();
  private ro?: ResizeObserver;

  private onPointerMove = (e: PointerEvent) => {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };

  ngAfterViewInit(): void {
    try {
      this.zone.runOutsideAngular(() => this.init3D());
    } catch {

    }
  }

  private init3D(): void {
    const canvas = this.canvas().nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;


    this.camera.position.set(0, 0.45, 6.1);


    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(0, 4, 5);

    const isCap = this.heroType() === 'captain-america';

    const keyLight = new THREE.PointLight(isCap ? 0xFFEAC2 : 0xF5C86A, 80, 25, 1.5);
    keyLight.position.set(3, 4, 4);

    const rimLight = new THREE.PointLight(isCap ? 0xEF4444 : 0x38BDF8, 60, 25, 1.5);
    rimLight.position.set(-3, 2, -1);

    this.scene.add(ambientLight, fillLight, keyLight, rimLight);


    if (isCap) {
      this.hero = new CaptainAmericaHero(this.theme.isMobile());
    } else {
      this.hero = new IronmanHero(this.theme.isMobile());
    }
    this.scene.add(this.hero.group);


    window.addEventListener('pointermove', this.onPointerMove, { passive: true });


    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);


    let lastTime = performance.now();
    const loop = () => {
      if (this.isDestroyed) return;
      this.raf = requestAnimationFrame(loop);

      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const t = (now - lastTime) / 1000;

      this.mouseLerp.lerp(this.mouse, 0.08);

      if (this.hero) {
        this.hero.update(t, dt, this.mouseLerp);
      }

      this.renderer?.render(this.scene, this.camera);
    };

    loop();
  }

  private resize(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas || !this.renderer) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.ro?.disconnect();

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
