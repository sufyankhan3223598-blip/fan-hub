import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { REALM_STYLES, buildEmblem, buildRealmProps, updateProps } from './realm-props';
import { dotSprite, energyCore, glow, hologram, metal, particles } from './materials';
import { CosmicBlackHole } from './black-hole';
import { AnimeGoku } from './anime-goku';
import { ComicHero } from './comic-hero';
import { GamingHero } from './gaming-hero';
import { TvHero } from './tv-hero';
import { MovieHero } from './movie-hero';
import { KpopHero } from './kpop-hero';
import { MangaHero } from './manga-hero';
import { CosplayHero } from './cosplay-hero';

interface CharacterDef { model: string; clip: string; alt?: string; scale: number; yaw: number; }

const CHARACTERS: CharacterDef[] = [
  { model: 'xbot', clip: 'idle', alt: 'agree', scale: 1.35, yaw: -0.4 },
  { model: 'robot', clip: 'Idle', alt: 'Punch', scale: 0.62, yaw: -0.5 },
  { model: 'soldier', clip: 'Idle', alt: 'Walk', scale: 1.4, yaw: -0.5 },
  { model: 'robot', clip: 'Sitting', alt: 'ThumbsUp', scale: 0.62, yaw: -0.6 },
  { model: 'michelle', clip: 'SambaDance', scale: 1.45, yaw: -0.3 },
  { model: 'xbot', clip: 'idle', alt: 'headShake', scale: 1.35, yaw: -0.5 },
  { model: 'soldier', clip: 'Idle', scale: 1.4, yaw: -0.4 },
  { model: 'robot', clip: 'Dance', alt: 'Wave', scale: 0.62, yaw: -0.4 }
];

const REALM_SPACING = 34;
const realmZ = (i: number) => -40 - i * REALM_SPACING;

interface RealmNode {
  group: THREE.Group;
  props: THREE.Group;
  character?: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  actions: THREE.AnimationAction[];
  dust: THREE.Points;
  dustBase: Float32Array;
  materials: THREE.Material[];
  fog: THREE.Color;
}

export class HomeScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private disposed = false;

  private portal = new THREE.Group();
  private blackHole!: CosmicBlackHole;
  private emblems: THREE.Group[] = [];
  private stars!: THREE.Points;
  private tunnel!: THREE.InstancedMesh;
  private realms: RealmNode[] = [];
  private animeGoku!: AnimeGoku;
  private comicHero!: ComicHero;
  private gamingHero!: GamingHero;
  private tvHero!: TvHero;
  private movieHero!: MovieHero;
  private kpopHero!: KpopHero;
  private mangaHero!: MangaHero;
  private cosplayHero!: CosplayHero;
  private keyLight = new THREE.PointLight('#ffffff', 60, 40, 1.6);
  private rimLight = new THREE.PointLight('#7C3AED', 40, 40, 1.6);

  private sceneT = 0;
  private smoothT = 0;
  private mouse = new THREE.Vector2();
  private mouseLerp = new THREE.Vector2();
  private intro = 1;
  private readonly lowPower: boolean;
  private readonly bgBase = new THREE.Color('#07070C');
  private tmpV = new THREE.Vector3();
  private lookAt = new THREE.Vector3();
  onReady?: () => void;
  onProgress?: (p: number) => void;

  constructor(private canvas: HTMLCanvasElement, opts: { lowPower: boolean }) {
    this.lowPower = opts.lowPower;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lowPower, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 1.25 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
    this.camera.position.set(0, 0, 60);
    this.scene.background = this.bgBase.clone();
    this.scene.fog = new THREE.FogExp2('#07070C', 0.018);

    this.scene.add(new THREE.AmbientLight('#8888aa', 0.6));
    const hemi = new THREE.HemisphereLight('#c7d2fe', '#1f1030', 0.8);
    this.scene.add(hemi, this.keyLight, this.rimLight);

    this.buildStars();
    this.buildPortal();
    this.buildTunnel();
    this.buildEmblems();
    this.buildRealms();
    this.setupPost();
    this.loadCharacters();
  }


  private buildStars(): void {
    const count = this.lowPower ? 1800 : 4200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = ['#ffffff', '#F5C86A', '#22D3EE', '#A78BFA'].map(c => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const r = 60 + Math.random() * 160;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(ph) - 120;
      const c = palette[Math.random() < 0.8 ? 0 : 1 + Math.floor(Math.random() * 3)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.55, map: dotSprite(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.scene.add(this.stars);
  }

  private buildPortal(): void {
    this.blackHole = new CosmicBlackHole(this.lowPower);
    this.portal.add(this.blackHole.group);
    this.scene.add(this.portal);
  }

  private buildTunnel(): void {
    const count = this.lowPower ? 260 : 600;
    this.tunnel = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.03, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), count);
    const dummy = new THREE.Object3D();
    const colors = REALM_STYLES.map(r => new THREE.Color(r.accent));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 6;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, -20 - Math.random() * (REALM_SPACING * 8 + 40));
      dummy.scale.set(1, 1, 0.5 + Math.random() * 2);
      dummy.updateMatrix();
      this.tunnel.setMatrixAt(i, dummy.matrix);
      this.tunnel.setColorAt(i, colors[Math.floor(Math.random() * colors.length)]);
    }
    this.scene.add(this.tunnel);
  }

  private buildEmblems(): void {
    REALM_STYLES.forEach(s => {
      const e = buildEmblem(s.slug);
      e.scale.setScalar(0.001);
      this.emblems.push(e);
      this.scene.add(e);
    });
  }

  private buildRealms(): void {
    REALM_STYLES.forEach((s, i) => {
      const group = new THREE.Group();
      group.position.set(0, 0, realmZ(i));
      const props = buildRealmProps(s.slug);
      props.position.set(2.8, 0, 0);
      group.add(props);
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.2, 64), hologram(s.accent, { base: '#101018', rim: 0.8 }));
      platform.position.set(2.8, -2.05, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.03, 8, 96), glow(s.accent));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(2.8, -1.93, 0);
      group.add(platform, ring);
      if (i === 0) {
        this.animeGoku = new AnimeGoku(this.lowPower);
        group.add(this.animeGoku.group);
      } else if (i === 1) {
        this.gamingHero = new GamingHero(this.lowPower);
        group.add(this.gamingHero.group);
      } else if (i === 2) {
        this.movieHero = new MovieHero(this.lowPower);
        group.add(this.movieHero.group);
      } else if (i === 3) {
        this.tvHero = new TvHero(this.lowPower);
        group.add(this.tvHero.group);
      } else if (i === 4) {
        this.kpopHero = new KpopHero(this.lowPower);
        group.add(this.kpopHero.group);
      } else if (i === 5) {
        this.comicHero = new ComicHero(this.lowPower);
        group.add(this.comicHero.group);
      } else if (i === 6) {
        this.mangaHero = new MangaHero(this.lowPower);
        group.add(this.mangaHero.group);
      } else if (i === 7) {
        this.cosplayHero = new CosplayHero(this.lowPower);
        group.add(this.cosplayHero.group);
      }
      const dust = particles(this.lowPower ? 250 : 600, new THREE.Vector3(1.4, 3.6, 1.2), s.accent, 0.06);
      dust.position.set(2.8, -0.2, 0);
      (dust.material as THREE.PointsMaterial).opacity = 0;
      group.add(dust);
      group.visible = false;
      this.scene.add(group);
      this.realms.push({
        group, props, actions: [], dust, dustBase: (dust.geometry.attributes['position'] as THREE.BufferAttribute).array.slice() as Float32Array,
        materials: [], fog: new THREE.Color(s.fog)
      });
    });
  }

  private setupPost(): void {
    if (this.lowPower) return;
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(size.multiplyScalar(0.5), 0.85, 0.55, 0.62);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }


  private async loadCharacters(): Promise<void> {
    const draco = new DRACOLoader().setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const names = Array.from(new Set(CHARACTERS.map(c => c.model)));
    const cache = new Map<string, GLTF>();
    let done = 0;
    await Promise.all(names.map(async n => {
      try { cache.set(n, await loader.loadAsync(`/models/${n}.glb`)); } catch {  }
      this.onProgress?.(++done / names.length);
    }));
    if (this.disposed) return;
    CHARACTERS.forEach((def, i) => {
      if (i >= 0 && i < 8) return;
      const gltf = cache.get(def.model);
      if (!gltf) return;
      const realm = this.realms[i];
      const style = REALM_STYLES[i];
      const obj = cloneSkinned(gltf.scene);
      const mat = hologram(style.accent, { base: '#2a2a3a', rim: 1.8, metalness: 0.55, roughness: 0.35 });
      obj.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.material = mat; m.frustumCulled = false; m.castShadow = false; }
      });
      realm.materials.push(mat);
      obj.scale.setScalar(def.scale);
      obj.position.set(2.8, -1.95, 0);
      obj.rotation.y = def.yaw;
      const mixer = new THREE.AnimationMixer(obj);
      const clip = THREE.AnimationClip.findByName(gltf.animations, def.clip) ?? gltf.animations[0];
      if (clip) { const a = mixer.clipAction(clip); a.play(); realm.actions.push(a); }
      if (def.alt) {
        const alt = THREE.AnimationClip.findByName(gltf.animations, def.alt);
        if (alt) { const a = mixer.clipAction(alt); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; realm.actions.push(a); }
      }
      realm.character = obj;
      realm.mixer = mixer;
      realm.group.add(obj);
    });
    this.onReady?.();
  }


  setSceneT(t: number): void { this.sceneT = t; }
  setMouse(x: number, y: number): void { this.mouse.set(x, y); }
  playIntro(): void { this.intro = 1; }
  get introProgress(): number { return this.intro; }
  setIntro(v: number): void { this.intro = v; }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    loop();
  }

  stop(): void { this.running = false; cancelAnimationFrame(this.raf); }


  triggerAction(i: number): void {
    if (i === 0) {
      this.animeGoku?.triggerFlurry();
      return;
    }
    if (i === 1) {
      this.gamingHero?.triggerLevelUp();
      return;
    }
    if (i === 2) {
      this.movieHero?.triggerAction();
      return;
    }
    if (i === 3) {
      this.tvHero?.triggerBroadcastPulse();
      return;
    }
    if (i === 4) {
      this.kpopHero?.triggerAction();
      return;
    }
    if (i === 5) {
      this.comicHero?.triggerPowerSurge();
      return;
    }
    if (i === 6) {
      this.mangaHero?.triggerAction();
      return;
    }
    if (i === 7) {
      this.cosplayHero?.triggerAction();
      return;
    }
    const r = this.realms[i];
    const alt = r?.actions[1];
    const base = r?.actions[0];
    if (!alt || !base || !r.mixer) return;
    alt.reset().setEffectiveWeight(1).fadeIn(0.3).play();
    base.fadeOut(0.3);
    const onFinish = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== alt) return;
      base.reset().fadeIn(0.4).play();
      alt.fadeOut(0.4);
      r.mixer?.removeEventListener('finished', onFinish as never);
    };
    r.mixer.addEventListener('finished', onFinish as never);
  }


  private frame(): void {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(0.05, rawDt);
    const time = this.clock.elapsedTime;

    this.smoothT += (this.sceneT - this.smoothT) * (1 - Math.exp(-rawDt * 7));
    if (Math.abs(this.sceneT - this.smoothT) > 1.5) this.smoothT = this.sceneT;
    const t = this.smoothT;
    this.mouseLerp.lerp(this.mouse, Math.min(1, dt * 3));


    if (this.portal.visible) {
      this.blackHole.update(time, dt);
    }
    this.stars.rotation.y = time * 0.004;


    const heroK = clamp01(1 - t);
    const finaleK = 0;
    const realmFloat = Math.max(0, t - 1);


    const cam = this.tmpV;
    const look = this.lookAt;

    const aspect = this.camera.aspect;
    const isDesktop = aspect > 1.2;
    const isTablet = aspect <= 1.2 && aspect > 0.85;
    const isMobile = aspect <= 0.85;

    let heroBhX = 4.6;
    let heroBhY = 0.05;
    let baseScale = 1.08;

    if (isTablet) {
      heroBhX = 3.3;
      heroBhY = -0.15;
      baseScale = 0.82;
    } else if (isMobile) {
      heroBhX = 0;
      heroBhY = -3.8;
      baseScale = 0.66;
    }

    if (t < 1) {

      const introZ = 17 + this.intro * 46;
      const z = lerp(introZ, -6, easeInOut(clamp01(t)));
      cam.set(this.mouseLerp.x * 1.2, this.mouseLerp.y * 0.8, z);
      look.set(1.0, 0, z - 9);
    } else if (t < 9) {

      const i = Math.min(7, Math.floor(realmFloat));
      const local = realmFloat - i;
      const fly = easeInOut(clamp01(local / 0.22));
      const from = i === 0 ? -6 : realmZ(i - 1) + 8;
      const to = realmZ(i) + 8;
      const z = lerp(from, to, fly) - clamp01((local - 0.22) / 0.78) * 2.2;
      cam.set(this.mouseLerp.x * 0.8 - 0.4, 0.4 + this.mouseLerp.y * 0.5, z);
      look.set(1.0, 0, z - 9);
    } else {

      const k = Math.min(2.5, t - 9);
      cam.set(this.mouseLerp.x, 1 + k, realmZ(7) - 10 - k * 12);
      look.set(0, 0, cam.z - 12);
    }
    this.camera.position.copy(cam);
    this.camera.lookAt(look);


    const bhCenter = new THREE.Vector3(
      lerp(heroBhX, 0, easeInOut(clamp01(t))),
      lerp(heroBhY, 0, easeInOut(clamp01(t))),
      0
    );
    this.portal.position.copy(bhCenter);

    this.portal.rotation.copy(this.blackHole.tiltEuler);
    if (t < 1.2) {
      this.portal.rotation.x += this.mouseLerp.y * 0.12;
      this.portal.rotation.y += this.mouseLerp.x * 0.14;
    }
    const throatPos = new THREE.Vector3(bhCenter.x, bhCenter.y, -2.2);


    this.portal.scale.setScalar(Math.max(0.0001, baseScale + finaleK * 0.9));
    this.portal.visible = (finaleK > 0.01 && t < 12.05);


    this.emblems.forEach(e => { e.visible = false; });


    const bg = this.bgBase.clone();
    this.realms.forEach((r, i) => {
      const local = realmFloat - i;
      const active = local > -0.35 && local < 1.2 && t < 9.3;
      const finaleShow = finaleK > 0.01 && t < 12.05;
      r.group.visible = active || (finaleShow && (!!r.character || i === 0));
      if (!r.group.visible) return;
      updateProps(r.props, time);
      r.props.visible = active;
      r.group.children.forEach(c => { if (c !== r.character && c !== r.props && c !== r.dust) c.visible = active; });
      r.mixer?.update(dt);

      if (active) {
        r.group.position.set(0, 0, realmZ(i));
        const enter = easeOut(clamp01((local - 0.12) / 0.25));
        const exit = clamp01((local - 0.78) / 0.2);
        if (i === 0 && this.animeGoku) {
          this.animeGoku.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 1 && this.gamingHero) {
          this.gamingHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 2 && this.movieHero) {
          this.movieHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 3 && this.tvHero) {
          this.tvHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 4 && this.kpopHero) {
          this.kpopHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 5 && this.comicHero) {
          this.comicHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 6 && this.mangaHero) {
          this.mangaHero.update(time, dt, this.mouseLerp, local, active);
        } else if (i === 7 && this.cosplayHero) {
          this.cosplayHero.update(time, dt, this.mouseLerp, local, active);
        } else if (r.character) {
          r.character.visible = true;
          r.character.position.set(lerp(8, 2.8, enter) + this.mouseLerp.x * 0.25, -1.95 + Math.sin(time * 1.4) * 0.05, 0);
          r.character.rotation.y = CHARACTERS[i].yaw + this.mouseLerp.x * 0.35;
          const s = CHARACTERS[i].scale * (1 - exit * 0.4);
          r.character.scale.setScalar(s);
        }
        r.materials.forEach(m => ((m as THREE.MeshStandardMaterial).opacity = 1 - exit));

        const dm = r.dust.material as THREE.PointsMaterial;
        dm.opacity = exit > 0 ? 1 - Math.max(0, exit - 0.6) * 2.5 : 0;
        const arr = r.dust.geometry.attributes['position'] as THREE.BufferAttribute;
        for (let k = 0; k < arr.count; k++) {
          arr.setXYZ(k, r.dustBase[k * 3] * (1 + exit * 3), r.dustBase[k * 3 + 1] + exit * exit * 2, r.dustBase[k * 3 + 2] - exit * exit * 22 * ((k % 5) / 5 + 0.5));
        }
        arr.needsUpdate = true;

        const w = bell(local, 0.5, 0.75);
        bg.lerp(r.fog, w * 0.85);
        if (w > 0.5) {
          this.keyLight.color.set(REALM_STYLES[i].accent);
          this.rimLight.color.set(REALM_STYLES[i].secondary);
        }
      } else if (finaleShow) {

        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        r.group.position.set(0, 0, 0);
        const heroes = [
          this.animeGoku?.group,
          this.gamingHero?.group,
          this.movieHero?.group,
          this.tvHero?.group,
          this.kpopHero?.group,
          this.comicHero?.group,
          this.mangaHero?.group,
          this.cosplayHero?.group
        ];
        const charObj = heroes[i] || r.character;
        if (charObj) {
          charObj.visible = true;
          charObj.position.set(Math.sin(a) * 6.2, -2.2, Math.cos(a) * 4.2);
          charObj.lookAt(this.camera.position.x, -2.2, this.camera.position.z);
          charObj.scale.setScalar((CHARACTERS[i]?.scale ?? 1.1) * 0.85);
        }
        r.materials.forEach(m => ((m as THREE.MeshStandardMaterial).opacity = clamp01(finaleK)));
        (r.dust.material as THREE.PointsMaterial).opacity = 0;
      }
    });

    if (t < 2 || t > 10) { this.keyLight.color.set('#F5C86A'); this.rimLight.color.set('#7C3AED'); }
    this.keyLight.position.set(this.camera.position.x + 4, this.camera.position.y + 5, this.camera.position.z - 3);
    this.rimLight.position.set(this.camera.position.x - 5, this.camera.position.y + 1, this.camera.position.z - 12);
    (this.scene.background as THREE.Color).copy(bg);
    (this.scene.fog as THREE.FogExp2).color.copy(bg);
    (this.scene.fog as THREE.FogExp2).density = t > 11.9 ? 0.012 : 0.02;


    let flight = 0;
    if (t >= 1.7 && t < 10) {
      const local = realmFloat - Math.floor(Math.max(0, realmFloat));
      flight = t < 2 ? (t - 1.7) / 0.3 : bell(local, 0.1, 0.14);
    }
    (this.tunnel.material as THREE.MeshBasicMaterial).opacity = clamp01(flight) * 0.9;
    this.tunnel.visible = flight > 0.01;

    if (t < 0.8) {

      this.renderer.render(this.scene, this.camera);
    } else {
      if (this.bloom) this.bloom.strength = 0.75 + heroK * 0.35 + finaleK * 0.2;
      if (this.composer) this.composer.render(dt);
      else this.renderer.render(this.scene, this.camera);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.animeGoku?.dispose();
    this.comicHero?.dispose();
    this.gamingHero?.dispose();
    this.tvHero?.dispose();
    this.movieHero?.dispose();
    this.kpopHero?.dispose();
    this.mangaHero?.dispose();
    this.cosplayHero?.dispose();
    this.scene.traverse(o => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose?.();
    });
    this.composer?.dispose();
    this.renderer.dispose();
  }
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export const bell = (x: number, c: number, w: number) => { const d = Math.abs(x - c) / w; return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(d * Math.PI); };
