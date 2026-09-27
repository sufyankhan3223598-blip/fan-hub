import * as THREE from 'three';
import { dotSprite } from './materials';

export class CosplayHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private starlightParticles!: THREE.Points;
  private starlightPositions!: Float32Array;
  private starlightVelocities!: Float32Array;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private auraRings: THREE.Mesh[] = [];

  private coreLight!: THREE.PointLight;
  private tiaraLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.5;
  private heroWidth = 3.5 * (566.0 / 780.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildAuraRings();
    this.buildStarlightParticles();
    this.buildPlatformPedestal();
    this.buildDynamicLights();

    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/cosplay-hero.png');
    heroTex.colorSpace = THREE.SRGBColorSpace;
    heroTex.anisotropy = 4;

    const width = this.heroWidth;
    const height = this.heroHeight;
    const segX = 36;
    const segY = 36;

    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const nx = vx / (width * 0.5);
      const ny = vy / height;

      const heightWeight = 0.55 + (ny + 0.5) * 0.65;
      const curveZ = Math.cos(nx * Math.PI * 0.48) * 0.28 * heightWeight;
      pos.setZ(i, curveZ);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: heroTex,
      transparent: true,
      alphaTest: 0.12,
      side: THREE.FrontSide,
      roughness: 0.25,
      metalness: 0.65,
      emissive: new THREE.Color('#1a082b'),
      emissiveIntensity: 0.35,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.group.add(this.bodyMesh);

    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x07020f,
      roughness: 0.75,
      metalness: 0.35,
      side: THREE.BackSide
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height / 2, -0.015);
    this.backMesh.scale.set(1.002, 1.002, 1.0);
    this.group.add(this.backMesh);

    const glowGeo = geo.clone();
    const glowMat = new THREE.MeshBasicMaterial({
      map: heroTex,
      color: 0xC084FC,
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.set(0, height / 2, -0.01);
    this.glowMesh.scale.set(1.01, 1.01, 1.0);
    this.group.add(this.glowMesh);
  }

  private buildAuraRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0xC084FC, 0xA855F7, 0x818CF8];

    for (let r = 0; r < ringCount; r++) {
      const radius = 1.1 + r * 0.35;
      const ringGeo = new THREE.TorusGeometry(radius, 0.015, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[r % ringColors.length],
        transparent: true,
        opacity: 0.40 - r * 0.08,
        blending: THREE.AdditiveBlending,
        wireframe: r === 1
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);

      ring.position.set(0, 1.95, -0.15);
      ring.rotation.x = Math.PI * 0.5 + (r * 0.15);
      this.auraRings.push(ring);
      this.group.add(ring);
    }
  }

  private buildStarlightParticles(): void {
    const count = this.lowPower ? 50 : 100;
    this.starlightPositions = new Float32Array(count * 3);
    this.starlightVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.4 + Math.random() * 1.25;
      this.starlightPositions[i * 3] = Math.cos(angle) * rad;
      this.starlightPositions[i * 3 + 1] = 0.2 + Math.random() * 3.3;
      this.starlightPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.2;

      this.starlightVelocities[i * 3] = (Math.random() - 0.5) * 0.12;
      this.starlightVelocities[i * 3 + 1] = 0.25 + Math.random() * 0.45;
      this.starlightVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.starlightPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.17,
      color: 0xC084FC,
      map: dotSprite(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starlightParticles = new THREE.Points(geo, mat);
    this.group.add(this.starlightParticles);
  }

  private buildPlatformPedestal(): void {
    const shadowGeo = new THREE.RingGeometry(0.05, 0.80, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05010b,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.scale.set(1.35, 1.0, 0.65);
    this.contactShadow.position.set(0, 0.02, 0);
    this.group.add(this.contactShadow);

    const ringGeo = new THREE.RingGeometry(0.65, 0.92, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xA855F7,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.pedestalRing = new THREE.Mesh(ringGeo, ringMat);
    this.pedestalRing.position.set(0, 0.03, 0);
    this.group.add(this.pedestalRing);
  }

  private buildDynamicLights(): void {
    this.coreLight = new THREE.PointLight('#C084FC', 30, 4.0, 1.6);
    this.coreLight.position.set(0, 2.2, 0.35);

    this.tiaraLight = new THREE.PointLight('#A855F7', 20, 3.2, 1.7);
    this.tiaraLight.position.set(0, 3.1, 0.25);

    this.group.add(this.coreLight, this.tiaraLight);
  }

  triggerAction(): void {
    this.surgeBurst = 2.2;
  }

  update(time: number, dt: number, mouse: THREE.Vector2, localScene: number, active: boolean): void {
    if (!active) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    if (this.surgeBurst > 0) {
      this.surgeBurst = Math.max(0, this.surgeBurst - dt * 1.6);
    }

    this.pulsePhase += dt * (2.8 + this.surgeBurst * 4.0);

    const breathY = Math.sin(time * 2.6) * 0.02;
    const breathScale = 1.0 + Math.sin(time * 2.6) * 0.01 + this.surgeBurst * 0.025;
    this.bodyMesh.position.y = (this.heroHeight / 2) + breathY;
    this.bodyMesh.scale.set(breathScale, breathScale, 1.0);
    this.backMesh.position.y = (this.heroHeight / 2) + breathY;
    this.backMesh.scale.set(1.002 * breathScale, 1.002 * breathScale, 1.0);
    this.glowMesh.position.y = (this.heroHeight / 2) + breathY;
    this.glowMesh.scale.set(1.01 * breathScale, 1.01 * breathScale, 1.0);

    const targetRotY = mouse.x * 0.36;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);

    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.90;

    this.auraRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.6 * dir + this.surgeBurst * 1.5;
      const s = 1.0 + Math.sin(time * 3.5 + i) * 0.05 + this.surgeBurst * 0.25;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.40 + Math.sin(time * 4.0 + i) * 0.15 + this.surgeBurst * 0.3;
    });

    if (this.starlightPositions) {
      const count = this.starlightPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.starlightPositions[i * 3 + 1] += this.starlightVelocities[i * 3 + 1] * dt * (1.0 + this.surgeBurst * 1.8);
        this.starlightPositions[i * 3] += (Math.random() - 0.5) * 0.015;
        this.starlightPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.015;

        if (this.starlightPositions[i * 3 + 1] > 3.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.4 + Math.random() * 1.25;
          this.starlightPositions[i * 3] = Math.cos(angle) * radius;
          this.starlightPositions[i * 3 + 1] = 0.2;
          this.starlightPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.2;
        }
      }
      (this.starlightParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }

    this.coreLight.intensity = 30 + Math.sin(this.pulsePhase * 3.5) * 8 + this.surgeBurst * 35;
    this.coreLight.position.y = 2.2 + breathY;

    this.tiaraLight.intensity = 20 + Math.cos(this.pulsePhase * 3.0) * 6 + this.surgeBurst * 25;
    this.tiaraLight.position.y = 3.1 + breathY;

    if (this.pedestalRing) {
      const ringScale = 1.0 + Math.sin(time * 3.0) * 0.15 + this.surgeBurst * 0.4;
      this.pedestalRing.scale.set(ringScale, ringScale, 1.0);
      (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.2) * 0.18 + this.surgeBurst * 0.4;
    }
  }

  dispose(): void {
    [this.bodyMesh, this.backMesh, this.glowMesh, this.contactShadow, this.pedestalRing, ...this.auraRings].forEach(m => {
      m?.geometry?.dispose();
      const mat = m?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    this.starlightParticles?.geometry?.dispose();
    (this.starlightParticles?.material as THREE.Material)?.dispose();
  }
}
