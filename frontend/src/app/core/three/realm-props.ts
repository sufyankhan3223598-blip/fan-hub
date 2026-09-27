import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { glow, hologram, metal, particles, petalSprite } from './materials';

export interface RealmStyle { slug: string; accent: string; secondary: string; fog: string; }

export const REALM_STYLES: RealmStyle[] = [
  { slug: 'anime', accent: '#E11D48', secondary: '#F9A8D4', fog: '#1a0610' },
  { slug: 'gaming', accent: '#22C55E', secondary: '#D4AF37', fog: '#04160b' },
  { slug: 'movies', accent: '#F59E0B', secondary: '#DC2626', fog: '#180c02' },
  { slug: 'tv-shows', accent: '#3B82F6', secondary: '#22D3EE', fog: '#030a1c' },
  { slug: 'k-pop', accent: '#EC4899', secondary: '#22D3EE', fog: '#16041a' },
  { slug: 'comics', accent: '#FACC15', secondary: '#EF4444', fog: '#171002' },
  { slug: 'manga', accent: '#E5E7EB', secondary: '#DC2626', fog: '#0c0c0e' },
  { slug: 'cosplay', accent: '#A855F7', secondary: '#D4AF37', fog: '#0f0520' }
];

type Updatable = THREE.Object3D & { userData: { update?: (t: number) => void } };

let fontPromise: Promise<Font> | null = null;
export function loadFont(): Promise<Font> {
  fontPromise ??= new FontLoader().loadAsync('/fonts/helvetiker_bold.typeface.json');
  return fontPromise;
}

function onUpdate(obj: THREE.Object3D, fn: (t: number) => void): void {
  (obj as Updatable).userData.update = fn;
}

function katana(accent: string): THREE.Group {
  const g = new THREE.Group();
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.quadraticCurveTo(0.12, 1.6, 0.02, 3.1);
  bladeShape.lineTo(-0.06, 3.0);
  bladeShape.quadraticCurveTo(0.02, 1.6, -0.1, 0);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }), metal('#e5e7eb', 1, 0.12, 0.05));
  blade.position.set(0.04, 0.12, -0.012);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 3.0, 0.03), glow(accent));
  edge.position.set(0.11, 1.6, 0);
  edge.rotation.z = -0.03;
  const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), metal('#D4AF37', 0.9, 0.3));
  tsuba.rotation.x = Math.PI / 2;
  tsuba.rotation.z = Math.PI / 2;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.9, 12), metal('#1f1f2e', 0.3, 0.7));
  handle.position.y = -0.47;
  const wraps = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 6, 16), metal(accent, 0.4, 0.5, 0.2));
    w.rotation.x = Math.PI / 2 + (i % 2 ? 0.3 : -0.3);
    w.position.y = -0.12 - i * 0.14;
    wraps.add(w);
  }
  g.add(blade, edge, tsuba, handle, wraps);
  return g;
}

function torii(accent: string): THREE.Group {
  const g = new THREE.Group();
  const red = metal(accent, 0.3, 0.55, 0.15);
  const dark = metal('#15151f', 0.4, 0.6);
  for (const x of [-1.6, 1.6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 4.2, 16), red);
    p.position.set(x, 2.1, 0);
    g.add(p);
  }
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.28, 0.4), dark);
  kasagi.position.y = 4.3;
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 0.26), red);
  nuki.position.y = 3.5;
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 0.34), red);
  shimaki.position.y = 4.08;
  g.add(kasagi, nuki, shimaki);
  return g;
}

function buildAnime(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();
  const gate = torii(s.accent);
  gate.position.set(0, -1.6, -3);
  gate.scale.setScalar(0.9);

  const petals = particles(260, new THREE.Vector3(12, 8, 8), s.secondary, 0.22, petalSprite(), 0.95);
  (petals.material as THREE.PointsMaterial).blending = THREE.NormalBlending;
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), glow(s.accent, 0.35));
  sun.position.set(1.4, 2.6, -5);
  g.add(gate, petals, sun);
  const base = (petals.geometry.attributes['position'] as THREE.BufferAttribute).array.slice() as Float32Array;
  onUpdate(g, t => {
    const arr = petals.geometry.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < arr.count; i++) {
      arr.setY(i, ((base[i * 3 + 1] - t * 0.6 + 40) % 8) - 4);
      arr.setX(i, base[i * 3] + Math.sin(t + i) * 0.3);
    }
    arr.needsUpdate = true;
  });
  return g;
}

function controller(accent: string, secondary: string): THREE.Group {
  const g = new THREE.Group();
  const shell = hologram(accent, { base: '#12121a', rim: 1.2 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.1, 0.5, 4, 0.22), shell);
  const gripL = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.7, 6, 12), shell);
  gripL.position.set(-0.95, -0.55, 0);
  gripL.rotation.z = 0.5;
  const gripR = gripL.clone();
  gripR.position.x = 0.95;
  gripR.rotation.z = -0.5;
  const dpad = new THREE.Group();
  const dm = metal('#0b0b10', 0.5, 0.5);
  dpad.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.08), dm), new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.08), dm));
  dpad.position.set(-0.68, 0.08, 0.28);
  const colors = ['#22C55E', '#EF4444', '#3B82F6', '#FACC15'];
  const buttons = new THREE.Group();
  [[0, 0.17], [0.17, 0], [0, -0.17], [-0.17, 0]].forEach(([x, y], i) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), glow(colors[i]));
    b.position.set(x, y, 0);
    buttons.add(b);
  });
  buttons.position.set(0.68, 0.08, 0.28);
  const stickM = metal('#222230', 0.4, 0.5);
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 20), stickM);
  s1.rotation.x = Math.PI / 2;
  s1.position.set(-0.3, -0.28, 0.3);
  const s2 = s1.clone();
  s2.position.x = 0.3;
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), glow(secondary));
  light.position.set(0, 0.46, 0.2);
  g.add(body, gripL, gripR, dpad, buttons, s1, s2, light);
  return g;
}

function buildGaming(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();

  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), metal(s.accent, 0.3, 0.4, 0.6), 60);
  const dummy = new THREE.Object3D();
  const seeds = Array.from({ length: 60 }, () => ({ x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 7, z: -2 - Math.random() * 5, r: Math.random() * 6, s: 0.4 + Math.random() }));
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), new THREE.MeshBasicMaterial({ color: s.secondary, wireframe: true, transparent: true, opacity: 0.35 }));
  wire.position.set(1.6, 1.4, -4);
  const grid = new THREE.GridHelper(30, 30, new THREE.Color(s.accent), new THREE.Color(s.accent));
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.18;
  grid.position.y = -2;
  g.add(cubes, wire, grid);
  onUpdate(g, t => {
    wire.rotation.y = t * 0.2;
    wire.rotation.x = t * 0.1;
    seeds.forEach((p, i) => {
      dummy.position.set(p.x, p.y + Math.sin(t * p.s + p.r) * 0.4, p.z);
      dummy.rotation.set(t * p.s * 0.5, t * p.s, 0);
      dummy.scale.setScalar(0.6 + Math.sin(t + p.r) * 0.2);
      dummy.updateMatrix();
      cubes.setMatrixAt(i, dummy.matrix);
    });
    cubes.instanceMatrix.needsUpdate = true;
  });
  return g;
}

function filmReel(accent: string): THREE.Group {
  const g = new THREE.Group();
  const m = metal('#2a2a36', 0.9, 0.3);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.09, 12, 48), metal(accent, 0.9, 0.25, 0.2));
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 48, 1, true), m);
  disc.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), m);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 24), metal(accent, 0.9, 0.3));
  hub.rotation.x = Math.PI / 2;
  g.add(rim, disc, face, hub);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: '#07070c' }));
    hole.position.set(Math.cos(a) * 0.65, Math.sin(a) * 0.65, 0.01);
    g.add(hole);
  }
  return g;
}

function clapper(): THREE.Group {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.08), metal('#111118', 0.3, 0.6));
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const x = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f5f5f5' : '#111'; x.beginPath(); x.moveTo(i * 32, 32); x.lineTo(i * 32 + 16, 0); x.lineTo(i * 32 + 48, 0); x.lineTo(i * 32 + 32, 32); x.fill(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  top.geometry.translate(0.8, 0, 0);
  top.position.set(-0.8, 0.68, 0);
  g.add(board, top);
  onUpdate(g, t => { top.rotation.z = Math.max(0, Math.sin(t * 2.2)) * 0.45; });
  return g;
}

function buildMovies(s: RealmStyle, isDetail = false): THREE.Group {
  const g = new THREE.Group();
  if (!isDetail) {
    const beams = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 11, 32, 1, true),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? s.accent : s.secondary,
          transparent: true,
          opacity: 0.09,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      cone.position.set(-3.5 + i * 2.4, 4.2, -4);
      cone.rotation.z = (i - 1.5) * 0.28;
      beams.add(cone);
    }
    g.add(beams);
    onUpdate(g, t => {
      beams.children.forEach((b, i) => (b.rotation.z = (i - 1.5) * 0.28 + Math.sin(t * 0.7 + i * 1.2) * 0.2));
    });
  }
  return g;
}

function screenMaterial(accent: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(accent) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      float r(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        float glitch = step(0.96, r(vec2(floor(uTime * 8.0), floor(uv.y * 24.0)))) * 0.06;
        uv.x += glitch;
        float bars = step(0.5, fract(uv.x * 7.0));
        vec3 col = mix(uColor * 0.5, uColor, bars) * (0.65 + 0.35 * sin(uv.y * 3.0 + uTime));
        col += (r(uv * uTime) - 0.5) * 0.18;
        col *= 0.8 + 0.2 * sin(uv.y * 400.0 + uTime * 10.0);
        float vig = smoothstep(0.8, 0.2, length(uv - 0.5));
        gl_FragColor = vec4(col * vig * 1.6, 1.0);
      }`
  });
}

function buildTv(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();


  const broadcastWaves = new THREE.Group();
  broadcastWaves.position.set(-1.8, 1.2, -2.5);
  const waveArcs: THREE.Mesh[] = [];
  for (let w = 0; w < 4; w++) {
    const arcRadius = 0.8 + w * 0.45;
    const arcGeo = new THREE.TorusGeometry(arcRadius, 0.02, 8, 48, Math.PI * 0.9);
    const arcMat = glow(w % 2 === 0 ? s.secondary : s.accent, 0.35);
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.rotation.z = -Math.PI * 0.45;
    waveArcs.push(arc);
    broadcastWaves.add(arc);
  }


  const beaconCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glow(s.secondary, 0.8));
  beaconCore.position.set(-1.8, 1.2, -2.4);
  const beaconHalo = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.42, 32), glow(s.accent, 0.5));
  beaconHalo.position.set(-1.8, 1.2, -2.4);

  const scan = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.04), glow(s.secondary, 0.25));
  scan.position.z = -3;
  g.add(broadcastWaves, beaconCore, beaconHalo, scan);

  onUpdate(g, t => {
    waveArcs.forEach((arc, i) => {
      const pulse = 0.85 + 0.25 * Math.sin(t * 3.0 - i * 0.8);
      arc.scale.setScalar(pulse);
      (arc.material as THREE.Material).opacity = 0.25 + 0.35 * Math.sin(t * 2.5 - i * 0.6);
    });
    beaconCore.rotation.y = t * 1.5;
    beaconCore.rotation.z = t * 0.8;
    beaconHalo.rotation.z = -t * 1.2;
    scan.position.y = ((t * 1.5) % 8) - 4;
  });
  return g;
}

function buildKpop(s: RealmStyle, isDetail = false): THREE.Group {
  const g = new THREE.Group();
  if (!isDetail) {
    const beams = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 10, 24, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? s.secondary : s.accent, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
      cone.position.set(-4 + i * 2, 4, -5);
      beams.add(cone);
    }
    g.add(beams);
    onUpdate(g, t => {
      beams.children.forEach((b, i) => (b.rotation.z = Math.sin(t * 1.2 + i) * 0.5));
    });
  }
  const confetti = particles(200, new THREE.Vector3(12, 8, 6), s.secondary, 0.09);
  g.add(confetti);
  const prevUpdate = (g as any).userData.update;
  onUpdate(g, t => {
    prevUpdate?.(t);
    confetti.rotation.y = t * 0.05;
  });
  return g;
}

function burst(color: string, points = 16, outer = 1.8, inner = 1.1): THREE.Mesh {
  const shape = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }), metal(color, 0.2, 0.5, 0.25));
}

function heroMask(color: string): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-1.2, 0.1);
  s.quadraticCurveTo(-1.1, 0.55, -0.5, 0.45);
  s.quadraticCurveTo(0, 0.35, 0.5, 0.45);
  s.quadraticCurveTo(1.1, 0.55, 1.2, 0.1);
  s.quadraticCurveTo(1.0, -0.45, 0.45, -0.35);
  s.quadraticCurveTo(0, -0.15, -0.45, -0.35);
  s.quadraticCurveTo(-1.0, -0.45, -1.2, 0.1);
  for (const x of [-0.55, 0.55]) {
    const eye = new THREE.Path();
    eye.absellipse(x, 0.05, 0.28, 0.16, 0, Math.PI * 2, false, x > 0 ? 0.2 : -0.2);
    s.holes.push(eye);
  }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }), metal(color, 0.6, 0.3, 0.1));
}

function buildComics(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();

  const dots = particles(400, new THREE.Vector3(14, 8, 3), s.accent, 0.12);
  dots.position.z = -4;
  g.add(dots);
  onUpdate(g, t => {
    dots.rotation.y = t * 0.04;
    g.children.forEach(c => c !== g && (c.userData as { update?: (n: number) => void }).update?.(t));
  });
  return g;
}

function buildManga(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();


  const ink = particles(300, new THREE.Vector3(12, 7, 5), '#f5f5f5', 0.1);
  g.add(ink);
  onUpdate(g, t => {
    ink.rotation.z = t * 0.03;
  });
  return g;
}

function ornateMask(gold: string, accent: string): THREE.Group {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, -0.2);
  s.bezierCurveTo(0.4, 0.1, 0.9, -0.5, 1.4, 0.05);
  s.bezierCurveTo(1.6, 0.5, 1.3, 0.9, 0.9, 0.7);
  s.bezierCurveTo(0.5, 0.6, 0.2, 0.75, 0, 0.55);
  s.bezierCurveTo(-0.2, 0.75, -0.5, 0.6, -0.9, 0.7);
  s.bezierCurveTo(-1.3, 0.9, -1.6, 0.5, -1.4, 0.05);
  s.bezierCurveTo(-0.9, -0.5, -0.4, 0.1, 0, -0.2);
  for (const x of [-0.7, 0.7]) {
    const eye = new THREE.Path();
    eye.absellipse(x, 0.3, 0.3, 0.14, 0, Math.PI * 2, false, x > 0 ? -0.25 : 0.25);
    s.holes.push(eye);
  }
  const mask = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }), metal(gold, 1, 0.22, 0.08));
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), glow(accent));
  gem.position.set(0, 0.58, 0.18);
  const feathers = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.4, 8), metal(accent, 0.3, 0.5, 0.3));
    f.position.set(1.2 + i * 0.08, 1.1 + i * 0.05, -0.05);
    f.rotation.z = -0.6 + i * 0.18;
    feathers.add(f);
  }
  g.add(mask, gem, feathers);
  return g;
}

function buildCosplay(s: RealmStyle): THREE.Group {
  const g = new THREE.Group();

  const rings = new THREE.Group();
  for (let i = 1; i <= 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.4 + i * 0.6, 0.015, 8, 96), glow(i % 2 ? s.secondary : s.accent, 0.6));
    rings.add(r);
  }
  rings.position.set(0, 1, -4);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.position.z = -3;
  g.add(rings, flash);
  onUpdate(g, t => {
    rings.children.forEach((r, i) => { r.rotation.x = t * (0.2 + i * 0.1); r.rotation.y = t * 0.15 * (i + 1); });
    const f = (t % 4) < 0.12 ? 0.35 : 0;
    (flash.material as THREE.MeshBasicMaterial).opacity = f;
  });
  return g;
}

const BUILDERS: Record<string, (s: RealmStyle, isDetail?: boolean) => THREE.Group> = {
  anime: buildAnime, gaming: buildGaming, movies: buildMovies, 'tv-shows': buildTv,
  'k-pop': buildKpop, comics: buildComics, manga: buildManga, cosplay: buildCosplay
};

export function buildRealmProps(slug: string, isDetail = false): THREE.Group {
  const style = REALM_STYLES.find(r => r.slug === slug) ?? REALM_STYLES[0];
  return (BUILDERS[style.slug] ?? buildAnime)(style, isDetail);
}

export function buildEmblem(slug: string): THREE.Group {
  const s = REALM_STYLES.find(r => r.slug === slug) ?? REALM_STYLES[0];
  const g = new THREE.Group();
  let obj: THREE.Object3D;
  switch (s.slug) {
    case 'anime': obj = katana(s.accent); obj.scale.setScalar(0.55); obj.rotation.z = -0.7; break;
    case 'gaming': obj = controller(s.accent, s.secondary); obj.scale.setScalar(0.5); break;
    case 'movies': obj = filmReel(s.accent); obj.scale.setScalar(0.6); break;
    case 'tv-shows': { const tv = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1, 0.6, 3, 0.12), hologram(s.accent)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.7), glow(s.secondary)); sc.position.z = 0.31; tv.add(sc); obj = tv; break; }
    case 'k-pop': { const m = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), metal('#d4d4dc', 1, 0.2)); const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 1, 16), metal(s.accent, 0.8, 0.3, 0.3)); hd.position.y = -0.7; m.add(h, hd); obj = m; break; }
    case 'comics': obj = heroMask(s.accent); obj.scale.setScalar(0.6); break;
    case 'manga': { const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.3), new THREE.MeshBasicMaterial({ color: '#f5f5f0', side: THREE.DoubleSide })); p.add(new THREE.LineSegments(new THREE.EdgesGeometry(p.geometry), new THREE.LineBasicMaterial({ color: s.secondary }))); const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: '#0c0c0e' })); inner.position.set(0, 0.25, 0.01); p.add(inner); obj = p; break; }
    default: obj = ornateMask(s.secondary, s.accent); obj.scale.setScalar(0.45);
  }
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.02, 48), new THREE.MeshBasicMaterial({ color: s.accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(obj, halo);
  g.userData['accent'] = s.accent;
  g.userData['halo'] = halo;
  return g;
}

export function updateProps(obj: THREE.Object3D, t: number): void {
  (obj as Updatable).userData.update?.(t);
}
