import * as THREE from 'three';
import { dotSprite } from './materials';

export class MangaHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private chakraSealMesh!: THREE.Mesh;
  private chakraAuraParticles!: THREE.Points;
  private auraPositions!: Float32Array;
  private auraVelocities!: Float32Array;
  private contactShadow!: THREE.Mesh;
  private pedestalSealRing!: THREE.Mesh;
  private chakraRings: THREE.Mesh[] = [];

  private coreChakraLight!: THREE.PointLight;
  private rimLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private readonly heroHeight = 3.35;

  private readonly heroWidth = 3.35 * (682.0 / 1024.0);

  constructor(private lowPower: boolean) {
    this.buildNarutoBody();
    this.buildChakraHandSeal();
    this.buildChakraHaloRings();
    this.buildChakraAuraParticles();
    this.buildPlatformPedestal();
    this.buildDynamicLighting();


    this.group.position.set(2.8, -1.95, 0);
  }

  private buildNarutoBody(): void {
    const texLoader = new THREE.TextureLoader();
    const narutoTex = texLoader.load('/images/manga-hero.png');
    narutoTex.colorSpace = THREE.SRGBColorSpace;
    narutoTex.anisotropy = 8;

    const width = this.heroWidth;
    const height = this.heroHeight;

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshStandardMaterial({
      map: narutoTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      roughness: 0.40,
      metalness: 0.15,
      emissive: new THREE.Color('#3A1705'),
      emissiveIntensity: 0.25,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);

    this.bodyMesh.position.set(0, height / 2, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);
  }

  private buildChakraHandSeal(): void {

    const sealGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const sealMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.chakraSealMesh = new THREE.Mesh(sealGeo, sealMat);

    this.chakraSealMesh.position.set(0, 2.18, 0.15);
    this.group.add(this.chakraSealMesh);
  }

  private buildChakraHaloRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0xF59E0B, 0x38BDF8, 0xEF4444];

    for (let r = 0; r < ringCount; r++) {
      const radius = 1.05 + r * 0.28;
      const ringGeo = new THREE.TorusGeometry(radius, 0.012, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[r % ringColors.length],
        transparent: true,
        opacity: 0.35 - r * 0.06,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);

      ring.position.set(0, 2.05, -0.12);
      ring.rotation.x = Math.PI * 0.5 + (r * 0.18);
      this.chakraRings.push(ring);
      this.group.add(ring);
    }
  }

  private buildChakraAuraParticles(): void {
    const count = this.lowPower ? 55 : 120;
    this.auraPositions = new Float32Array(count * 3);
    this.auraVelocities = new Float32Array(count);

    const colors = new Float32Array(count * 3);
    const orangeCol = new THREE.Color(0xF97316);
    const goldCol = new THREE.Color(0xFBBF24);
    const cyanCol = new THREE.Color(0x38BDF8);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.95;
      this.auraPositions[i * 3] = Math.cos(angle) * radius;
      this.auraPositions[i * 3 + 1] = Math.random() * 3.4;
      this.auraPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.45;
      this.auraVelocities[i] = 1.1 + Math.random() * 2.0;

      const rand = Math.random();
      const c = rand < 0.5 ? orangeCol : (rand < 0.8 ? goldCol : cyanCol);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.auraPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.chakraAuraParticles = new THREE.Points(geo, mat);
    this.group.add(this.chakraAuraParticles);
  }

  private buildPlatformPedestal(): void {

    const shadowGeo = new THREE.RingGeometry(0.04, 0.72, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050101,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.scale.set(1.4, 1.0, 0.7);
    this.contactShadow.position.set(0, 0.02, 0);
    this.group.add(this.contactShadow);


    const ringGeo = new THREE.RingGeometry(0.68, 0.96, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xF97316,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.pedestalSealRing = new THREE.Mesh(ringGeo, ringMat);
    this.pedestalSealRing.position.set(0, 0.03, 0);
    this.group.add(this.pedestalSealRing);
  }

  private buildDynamicLighting(): void {

    this.coreChakraLight = new THREE.PointLight('#F97316', 26, 4.0, 1.6);
    this.coreChakraLight.position.set(0, 2.15, 0.35);


    this.rimLight = new THREE.PointLight('#38BDF8', 16, 3.2, 1.8);
    this.rimLight.position.set(0, 3.1, 0.25);

    this.group.add(this.coreChakraLight, this.rimLight);
  }

  triggerAction(): void {
    this.surgeBurst = 2.4;
  }

  update(time: number, dt: number, mouse: THREE.Vector2, localScene: number, active: boolean): void {
    if (!active) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    if (this.surgeBurst > 0) {
      this.surgeBurst = Math.max(0, this.surgeBurst - dt * 1.8);
    }

    this.pulsePhase += dt * (2.8 + this.surgeBurst * 4.2);


    const breathY = Math.sin(time * 2.5) * 0.025;
    const breathScale = 1.0 + Math.sin(time * 2.5) * 0.008 + this.surgeBurst * 0.03;
    this.bodyMesh.position.y = (this.heroHeight / 2) + breathY;
    this.bodyMesh.scale.set(breathScale, breathScale, 1.0);


    if (this.chakraSealMesh) {
      const sealScale = (1.0 + Math.sin(this.pulsePhase * 3.2) * 0.25 + this.surgeBurst * 0.8);
      this.chakraSealMesh.scale.setScalar(sealScale);
      this.chakraSealMesh.position.y = 2.18 + breathY;
      (this.chakraSealMesh.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(this.pulsePhase * 3.2) * 0.25 + this.surgeBurst * 0.2;
    }


    const targetRotY = mouse.x * 0.38;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);

    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.95;


    this.chakraRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.55 * dir + this.surgeBurst * 1.8;
      const s = 1.0 + Math.sin(time * 3.2 + i) * 0.06 + this.surgeBurst * 0.3;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.8 + i) * 0.15 + this.surgeBurst * 0.35;
    });


    if (this.auraPositions) {
      const count = this.auraPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.auraPositions[i * 3 + 1] += this.auraVelocities[i] * dt * (1.0 + this.surgeBurst * 1.6);

        this.auraPositions[i * 3] += Math.sin(time * 3.0 + i) * 0.005;
        this.auraPositions[i * 3 + 2] += Math.cos(time * 3.0 + i) * 0.005;


        if (this.auraPositions[i * 3 + 1] > 3.45) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.25 + Math.random() * 0.95;
          this.auraPositions[i * 3] = Math.cos(angle) * radius;
          this.auraPositions[i * 3 + 1] = 0.15;
          this.auraPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.45;
        }
      }
      (this.chakraAuraParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }


    this.coreChakraLight.intensity = 26 + Math.sin(this.pulsePhase * 3.2) * 8 + this.surgeBurst * 35;
    this.coreChakraLight.position.y = 2.15 + breathY;

    this.rimLight.intensity = 16 + Math.cos(this.pulsePhase * 2.8) * 6 + this.surgeBurst * 20;
    this.rimLight.position.y = 3.1 + breathY;


    if (this.pedestalSealRing) {
      const ringScale = 1.0 + Math.sin(time * 2.8) * 0.12 + this.surgeBurst * 0.35;
      this.pedestalSealRing.scale.set(ringScale, ringScale, 1.0);
      (this.pedestalSealRing.material as THREE.MeshBasicMaterial).opacity = 0.38 + Math.sin(time * 3.0) * 0.15 + this.surgeBurst * 0.35;
    }
  }

  dispose(): void {
    [this.bodyMesh, this.chakraSealMesh, this.contactShadow, this.pedestalSealRing, ...this.chakraRings].forEach(m => {
      m?.geometry?.dispose();
      const mat = m?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    this.chakraAuraParticles?.geometry?.dispose();
    (this.chakraAuraParticles?.material as THREE.Material)?.dispose();
  }
}
