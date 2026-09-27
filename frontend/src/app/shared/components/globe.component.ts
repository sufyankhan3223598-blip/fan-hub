import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, effect, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { FanEvent } from '../../core/models/models';
import { ThemeService } from '../../core/services/ui.services';
import { dotSprite } from '../../core/three/materials';

@Component({
  selector: 'app-globe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="globe-wrap" [attr.data-cursor]="'drag'">
      <canvas #canvas aria-label="Interactive globe of fandom events" role="img"></canvas>
      @if (hovered(); as h) {
        <div class="pin-pop" [style.left.px]="popPos().x" [style.top.px]="popPos().y">
          <span class="pp-type">{{ h.eventType }}</span>
          <strong>{{ h.title }}</strong>
          <small>{{ h.city }}, {{ h.country }} &middot; {{ date(h.startDate) }}</small>
          <em>Click to open</em>
        </div>
      }
    </div>`,
  styles: [`
    :host { display: block; }
    .globe-wrap { position: relative; width: 100%; aspect-ratio: 1; max-height: 640px; margin: 0 auto; touch-action: pan-y; }
    canvas { width: 100% !important; height: 100% !important; display: block; }
    .pin-pop { position: absolute; transform: translate(-50%, calc(-100% - 18px)); pointer-events: none; min-width: 200px; padding: 12px 14px; border-radius: 14px;
      background: var(--glass-strong); border: 1px solid var(--border-strong); backdrop-filter: blur(14px); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 2px; animation: popIn .25s var(--ease-out); z-index: 2; }
    .pp-type { font-family: var(--font-ui); font-size: .68rem; letter-spacing: .2em; text-transform: uppercase; color: var(--gold-2); }
    strong { font-family: var(--font-ui); font-size: 1rem; } small { color: var(--text-2); } em { font-style: normal; font-size: .72rem; color: var(--cyan); margin-top: 4px; }
    @keyframes popIn { from { opacity: 0; transform: translate(-50%, calc(-100% - 8px)); } }
  `]
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  private router = inject(Router);
  private theme = inject(ThemeService);
  readonly events = input<FanEvent[]>([]);
  readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly hovered = signal<FanEvent | null>(null);
  readonly popPos = signal({ x: 0, y: 0 });

  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  private globe = new THREE.Group();
  private pins = new THREE.Group();
  private arcs = new THREE.Group();
  private raf = 0;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private visible = false;
  private drag = { active: false, x: 0, vx: 0 };
  private pointer = new THREE.Vector2(-9, -9);
  private raycaster = new THREE.Raycaster();
  private cleanup: (() => void)[] = [];

  constructor() {
    effect(() => { const ev = this.events(); if (this.renderer) this.buildPins(ev); });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.init());
  }

  private async init(): Promise<void> {
    const canvas = this.canvas().nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.position.set(0, 0, 3.4);
    this.scene.add(this.globe);


    const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ color: '#0b0b18', transparent: true, opacity: 0.92 }));
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color('#7C3AED') } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(uColor, 1.0) * i * 2.2; }',
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
    }));
    this.scene.add(atmo);
    this.globe.add(ocean, this.pins, this.arcs);
    const lat = new THREE.Mesh(new THREE.SphereGeometry(1.002, 36, 18), new THREE.MeshBasicMaterial({ color: '#D4AF37', wireframe: true, transparent: true, opacity: 0.06 }));
    this.globe.add(lat);
    this.globe.rotation.set(0.35, -1.2, 0);

    try {
      const dots: [number, number][] = await (await fetch('/data/globe-dots.json')).json();
      const pos = new Float32Array(dots.length * 3);
      dots.forEach(([la, lo], i) => { const v = toVec(la, lo, 1.005); pos.set([v.x, v.y, v.z], i * 3); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.globe.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#F5C86A', size: 0.018, map: dotSprite(), transparent: true, depthWrite: false, opacity: 0.85 })));
    } catch {  }

    this.buildPins(this.events());
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(es => { this.visible = es[0]?.isIntersecting ?? false; });
    this.io.observe(canvas);
    this.bindPointer(canvas);
    this.loop();
  }

  private buildPins(events: FanEvent[]): void {
    this.pins.clear();
    this.arcs.clear();
    const pts: THREE.Vector3[] = [];
    events.forEach(e => {
      const v = toVec(e.latitude, e.longitude, 1);
      pts.push(v);
      const color = new THREE.Color(e.accentColor || '#D4AF37');
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, e.isHighlight ? 0.2 : 0.13, 6), new THREE.MeshBasicMaterial({ color }));
      pin.position.copy(v.clone().multiplyScalar(1 + (e.isHighlight ? 0.1 : 0.065)));
      pin.lookAt(v.clone().multiplyScalar(2));
      pin.rotateX(Math.PI / 2);
      const head = new THREE.Mesh(new THREE.SphereGeometry(e.isHighlight ? 0.026 : 0.02, 12, 10), new THREE.MeshBasicMaterial({ color }));
      head.position.copy(v.clone().multiplyScalar(1 + (e.isHighlight ? 0.2 : 0.13)));
      head.userData['event'] = e;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.028, 24), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.copy(v.clone().multiplyScalar(1.003));
      ring.lookAt(v.clone().multiplyScalar(2));
      ring.userData['pulse'] = Math.random() * 2;
      this.pins.add(pin, head, ring);
    });

    for (let i = 0; i < pts.length - 1; i += 2) {
      const a = pts[i], b = pts[i + 1];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const h = 1 + a.distanceTo(b) * 0.45;
      mid.normalize().multiplyScalar(h);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineBasicMaterial({ color: '#22D3EE', transparent: true, opacity: 0.35 }));
      this.arcs.add(line);
    }
  }

  private bindPointer(canvas: HTMLCanvasElement): void {
    const down = (e: PointerEvent) => { this.drag.active = true; this.drag.x = e.clientX; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (this.drag.active) { const dx = e.clientX - this.drag.x; this.drag.x = e.clientX; this.drag.vx = dx * 0.005; this.globe.rotation.y += this.drag.vx; }
    };
    const up = () => (this.drag.active = false);
    const leave = () => { this.pointer.set(-9, -9); if (this.hovered()) this.zone.run(() => this.hovered.set(null)); };
    const click = () => { const h = this.hovered(); if (h) this.zone.run(() => this.router.navigate(['/events', h.slug])); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('click', click);
    this.cleanup.push(() => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('click', click); });
  }

  private resize(): void {
    const c = this.canvas().nativeElement;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible || !this.renderer) return;
    const t = performance.now() / 1000;
    if (!this.drag.active) {
      this.drag.vx *= 0.95;
      this.globe.rotation.y += (this.theme.reduceMotion() ? 0 : 0.0018) + this.drag.vx;
    }
    this.pins.children.forEach(c => {
      if (c.userData['pulse'] !== undefined) {
        const k = ((t + (c.userData['pulse'] as number)) % 2) / 2;
        c.scale.setScalar(1 + k * 3);
        ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - k;
      }
    });

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const heads = this.pins.children.filter(c => c.userData['event']);
    const hit = this.raycaster.intersectObjects(heads, false)[0];
    const ev = (hit?.object.userData['event'] as FanEvent | undefined) ?? null;
    if (ev !== this.hovered()) {
      this.zone.run(() => this.hovered.set(ev));
      this.canvas().nativeElement.style.cursor = ev ? 'pointer' : '';
    }
    if (ev && hit) {
      const p = hit.object.getWorldPosition(new THREE.Vector3()).project(this.camera);
      const c = this.canvas().nativeElement;
      this.zone.run(() => this.popPos.set({ x: (p.x * 0.5 + 0.5) * c.clientWidth, y: (-p.y * 0.5 + 0.5) * c.clientHeight }));
    }
    this.renderer.render(this.scene, this.camera);
  };

  date(d: string): string { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.cleanup.forEach(f => f());
    this.renderer?.dispose();
  }
}

function toVec(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}
