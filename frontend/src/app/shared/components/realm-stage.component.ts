import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, effect, inject, input, viewChild } from '@angular/core';
import * as THREE from 'three';
import { buildEmblem, buildRealmProps, REALM_STYLES, updateProps } from '../../core/three/realm-props';
import { energyCore, glow, metal, particles } from '../../core/three/materials';
import { ThemeService } from '../../core/services/ui.services';
import { AnimeGoku } from '../../core/three/anime-goku';
import { GamingHero } from '../../core/three/gaming-hero';
import { MovieHero } from '../../core/three/movie-hero';
import { TvHero } from '../../core/three/tv-hero';
import { KpopHero } from '../../core/three/kpop-hero';
import { ComicHero } from '../../core/three/comic-hero';
import { MangaHero } from '../../core/three/manga-hero';
import { CosplayHero } from '../../core/three/cosplay-hero';
import { CosmicGalaxy } from '../../core/three/cosmic-galaxy';

interface HeroInstance {
  group: THREE.Group;
  update(time: number, dt: number, mouse: THREE.Vector2, localScene: number, active: boolean): void;
}

function buildHero(slug: string, lowPower: boolean): HeroInstance | null {
  switch (slug) {
    case 'anime': return new AnimeGoku(lowPower);
    case 'gaming': return new GamingHero(lowPower);
    case 'movies': return new MovieHero(lowPower);
    case 'tv-shows': return new TvHero(lowPower);
    case 'k-pop': return new KpopHero(lowPower);
    case 'comics': return new ComicHero(lowPower);
    case 'manga': return new MangaHero(lowPower);
    case 'cosplay': return new CosplayHero(lowPower);
    default: return null;
  }
}

@Component({
  selector: 'app-realm-stage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: [`:host { display: block; position: absolute; inset: 0; pointer-events: none; } canvas { width: 100%; height: 100%; display: block; }`]
})
export class RealmStageComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private theme = inject(ThemeService);
  readonly slug = input<string>('anime');
  readonly mode = input<'realm' | 'portal' | 'galaxy'>('realm');
  readonly offsetX = input<number>(3.4);
  readonly offsetY = input<number>(0);
  readonly scale = input<number>(1);
  readonly showHero = input<boolean>(true);
  readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  private content = new THREE.Group();
  private stageGroup?: THREE.Group;
  private keyLight?: THREE.PointLight;
  private rimLight?: THREE.PointLight;
  private fillLight?: THREE.DirectionalLight;
  private raf = 0;
  private visible = true;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private mouse = new THREE.Vector2();
  private mouseLerp = new THREE.Vector2();
  private onMove = (e: PointerEvent) => this.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  private core?: THREE.ShaderMaterial;

  constructor() {
    effect(() => {
      const s = this.slug();
      this.mode();
      this.scale();
      this.offsetX();
      this.offsetY();
      if (this.renderer) this.build(s);
    });
  }

  ngAfterViewInit(): void {
    try {
      this.zone.runOutsideAngular(() => this.init());
    } catch {  }
  }

  private init(): void {
    const canvas = this.canvas().nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.theme.isMobile() ? 1.25 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.camera.position.set(0, 0.6, 9);

    this.scene.add(new THREE.AmbientLight('#9999bb', 1.0));
    this.fillLight = new THREE.DirectionalLight('#ffffff', 0.95);
    this.fillLight.position.set(0, 3, 6);
    this.keyLight = new THREE.PointLight('#F5C86A', 80, 30, 1.4);
    this.keyLight.position.set(4, 5, 6);
    this.rimLight = new THREE.PointLight('#7C3AED', 70, 30, 1.4);
    this.rimLight.position.set(-5, 2, -2);
    this.scene.add(this.fillLight, this.keyLight, this.rimLight, this.content);

    this.build(this.slug());
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(es => (this.visible = es[0]?.isIntersecting ?? true));
    this.io.observe(canvas);
    window.addEventListener('pointermove', this.onMove, { passive: true });

    const start = performance.now();
    let lastTime = performance.now();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      if (!this.visible) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const t = (now - start) / 1000;
      this.frame(this.theme.reduceMotion() ? 0 : t, dt);
      if (this.theme.reduceMotion()) cancelAnimationFrame(this.raf);
    };
    loop();
  }

  private build(slug: string): void {
    this.content.clear();
    const style = REALM_STYLES.find(r => r.slug === slug) ?? REALM_STYLES[0];
    if (this.mode() === 'galaxy') {
      const galaxy = new CosmicGalaxy(this.theme.isMobile());
      galaxy.group.scale.setScalar(this.scale());
      this.content.add(galaxy.group);

      this.content.position.set(this.offsetX(), this.offsetY(), 0);

      this.content.userData['update'] = (t: number, dt: number) => {
        galaxy.update(t, dt, this.mouseLerp);
      };

      if (this.keyLight && this.rimLight) {
        this.keyLight.color.set('#8B5CF6');
        this.rimLight.color.set('#38BDF8');
        this.keyLight.position.set(this.offsetX() + 2, 4, 4);
        this.rimLight.position.set(this.offsetX() - 3, 2, -2);
      }
    } else if (this.mode() === 'portal') {
      const portalGroup = new THREE.Group();
      portalGroup.scale.setScalar(this.scale());

      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 20, 120), metal('#D4AF37', 1, 0.22, 0.3));
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.035, 10, 120), glow('#7C3AED'));
      this.core = energyCore();
      const core = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), this.core);
      const dust = particles(500, new THREE.Vector3(14, 9, 6), '#F5C86A', 0.06);
      const icons = new THREE.Group();
      REALM_STYLES.forEach((r, i) => {
        const e = buildEmblem(r.slug);
        const a = (i / 8) * Math.PI * 2;
        e.position.set(Math.cos(a) * 4.2, Math.sin(a) * 2.4, Math.sin(a) * 1.2);
        e.scale.setScalar(0.38);
        icons.add(e);
      });
      portalGroup.add(ring, ring2, core, icons);
      this.content.add(portalGroup, dust);
      this.content.userData['update'] = (t: number) => {
        ring.rotation.z = t * 0.15; ring2.rotation.z = -t * 0.22; ring2.rotation.x = Math.sin(t * 0.5) * 0.3;
        if (this.core) this.core.uniforms['uTime'].value = t;
        icons.rotation.z = t * 0.08;
        icons.children.forEach(c => c.lookAt(this.camera.position));
        dust.rotation.y = t * 0.03;
      };
      this.content.position.set(this.offsetX(), this.offsetY(), 0);
    } else {
      this.stageGroup = new THREE.Group();


      const scale = 1.25;


      const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2.3 * scale, 2.45 * scale, 0.20, 48),
        metal('#0f0f18', 0.8, 0.35, 0.15)
      );
      platform.position.set(0, -0.1, 0);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.35 * scale, 0.035, 8, 96),
        glow(style.accent)
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.02, 0);
      this.stageGroup.add(platform, ring);


      const props = buildRealmProps(style.slug, true);
      props.scale.setScalar(scale);
      props.position.set(0, 1.90, 0);
      this.stageGroup.add(props);


      const dust = particles(this.theme.isMobile() ? 160 : 380, new THREE.Vector3(2.0, 4.4, 1.6), style.accent, 0.06);
      dust.position.set(0, 1.8, 0);
      this.stageGroup.add(dust);


      const hero = this.showHero() ? buildHero(style.slug, this.theme.isMobile()) : null;
      if (hero) {
        const heroWrapper = new THREE.Group();
        heroWrapper.scale.setScalar(scale);
        heroWrapper.position.set(-2.8 * scale, 1.90 * scale, 0);
        heroWrapper.add(hero.group);
        this.stageGroup.add(heroWrapper);
      }


      const targetOffset = this.offsetX();
      this.stageGroup.position.set(targetOffset, -1.05, 0);

      this.content.add(this.stageGroup);


      if (this.keyLight && this.rimLight) {
        this.keyLight.color.set(style.accent);
        this.rimLight.color.set(style.secondary);
        this.keyLight.position.set(targetOffset + 1.2, 4, 5);
        this.rimLight.position.set(targetOffset - 3.5, 2, -2);
      }

      this.content.userData['update'] = (t: number, dt: number) => {
        updateProps(props, t);
        if (hero) {
          hero.update(t, dt, this.mouseLerp, 0.5, true);
        }
        dust.rotation.y = t * 0.12;
      };
    }
  }

  private frame(t: number, dt: number = 0.016): void {
    this.mouseLerp.lerp(this.mouse, 0.08);
    const update = this.content.userData['update'] as ((t: number, dt: number) => void) | undefined;
    update?.(t, dt);
    this.content.rotation.y += ((this.mouseLerp.x * 0.22) - this.content.rotation.y) * 0.05;
    this.content.rotation.x += ((-this.mouseLerp.y * 0.12) - this.content.rotation.x) * 0.05;
    this.renderer?.render(this.scene, this.camera);
  }

  private resize(): void {
    const c = this.canvas().nativeElement;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = w < 768 ? 11 : 9;
    this.camera.updateProjectionMatrix();

    if (this.stageGroup && this.mode() === 'realm') {
      const off = this.offsetX();
      const shiftX = w < 768 ? 0.6 : (w < 1100 ? off * 0.85 : off);
      const shiftY = w < 768 ? -0.85 : -1.05;
      this.stageGroup.position.set(shiftX, shiftY, 0);
    } else if (this.mode() === 'portal' || this.mode() === 'galaxy') {
      const off = this.offsetX();
      const offY = this.offsetY();
      const shiftX = w < 768 ? off * 0.6 : (w < 1100 ? off * 0.88 : off);
      this.content.position.set(shiftX, offY, 0);
    }

    if (this.renderer) this.frame(0, 0.016);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.renderer?.dispose();
  }
}
