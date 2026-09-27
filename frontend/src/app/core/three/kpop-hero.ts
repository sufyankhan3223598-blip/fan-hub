import * as THREE from 'three';
import { dotSprite } from './materials';

export class KpopHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private sparkleParticles!: THREE.Points;
  private sparklePositions!: Float32Array;
  private sparkleVelocities!: Float32Array;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private stageRings: THREE.Mesh[] = [];

  private coreLight!: THREE.PointLight;
  private hairClipLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.4;
  private heroWidth = 3.4 * (555.0 / 821.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildStageRings();
    this.buildSparkleParticles();
    this.buildPlatformPedestal();
    this.buildDynamicLights();

    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/kpop-hero.png');
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
      roughness: 0.28,
      metalness: 0.50,
      emissive: new THREE.Color('#24061a'),
      emissiveIntensity: 0.35,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.group.add(this.bodyMesh);

    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x0a0209,
      roughness: 0.8,
      metalness: 0.3,
      side: THREE.BackSide
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height / 2, -0.015);
    this.backMesh.scale.set(1.002, 1.002, 1.0);
    this.group.add(this.backMesh);

    const glowGeo = geo.clone();
    const glowMat = new THREE.MeshBasicMaterial({
      map: heroTex,
      color: 0xEC4899,
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

  private buildStageRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0xEC4899, 0xF472B6, 0x22D3EE];

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
      this.stageRings.push(ring);
      this.group.add(ring);
    }
  }

  private buildSparkleParticles(): void {
    const count = this.lowPower ? 50 : 100;
    this.sparklePositions = new Float32Array(count * 3);
    this.sparkleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.4 + Math.random() * 1.25;
      this.sparklePositions[i * 3] = Math.cos(angle) * rad;
      this.sparklePositions[i * 3 + 1] = 0.2 + Math.random() * 3.3;
      this.sparklePositions[i * 3 + 2] = (Math.random() - 0.45) * 1.2;

      this.sparkleVelocities[i * 3] = (Math.random() - 0.5) * 0.12;
      this.sparkleVelocities[i * 3 + 1] = 0.25 + Math.random() * 0.45;
      this.sparkleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparklePositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.17,
      color: 0xF472B6,
      map: dotSprite(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkleParticles = new THREE.Points(geo, mat);
    this.group.add(this.sparkleParticles);
  }

  private buildPlatformPedestal(): void {
    const shadowGeo = new THREE.RingGeometry(0.05, 0.80, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x090106,
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
      color: 0xEC4899,
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
    this.coreLight = new THREE.PointLight('#EC4899', 30, 4.0, 1.6);
    this.coreLight.position.set(0, 2.1, 0.35);

    this.hairClipLight = new THREE.PointLight('#F472B6', 20, 3.2, 1.7);
    this.hairClipLight.position.set(-0.25, 3.0, 0.25);

    this.group.add(this.coreLight, this.hairClipLight);
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

    this.stageRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.6 * dir + this.surgeBurst * 1.5;
      const s = 1.0 + Math.sin(time * 3.5 + i) * 0.05 + this.surgeBurst * 0.25;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.40 + Math.sin(time * 4.0 + i) * 0.15 + this.surgeBurst * 0.3;
    });

    if (this.sparklePositions) {
      const count = this.sparklePositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.sparklePositions[i * 3 + 1] += this.sparkleVelocities[i * 3 + 1] * dt * (1.0 + this.surgeBurst * 1.8);
        this.sparklePositions[i * 3] += (Math.random() - 0.5) * 0.015;
        this.sparklePositions[i * 3 + 2] += (Math.random() - 0.5) * 0.015;

        if (this.sparklePositions[i * 3 + 1] > 3.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.4 + Math.random() * 1.25;
          this.sparklePositions[i * 3] = Math.cos(angle) * radius;
          this.sparklePositions[i * 3 + 1] = 0.2;
          this.sparklePositions[i * 3 + 2] = (Math.random() - 0.45) * 1.2;
        }
      }
      (this.sparkleParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }

    this.coreLight.intensity = 30 + Math.sin(this.pulsePhase * 3.5) * 8 + this.surgeBurst * 35;
    this.coreLight.position.y = 2.1 + breathY;

    this.hairClipLight.intensity = 20 + Math.cos(this.pulsePhase * 3.0) * 6 + this.surgeBurst * 25;
    this.hairClipLight.position.y = 3.0 + breathY;

    if (this.pedestalRing) {
      const ringScale = 1.0 + Math.sin(time * 3.0) * 0.15 + this.surgeBurst * 0.4;
      this.pedestalRing.scale.set(ringScale, ringScale, 1.0);
      (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.2) * 0.18 + this.surgeBurst * 0.4;
    }
  }

  dispose(): void {
    [this.bodyMesh, this.backMesh, this.glowMesh, this.contactShadow, this.pedestalRing, ...this.stageRings].forEach(m => {
      m?.geometry?.dispose();
      const mat = m?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    this.sparkleParticles?.geometry?.dispose();
    (this.sparkleParticles?.material as THREE.Material)?.dispose();
  }
}
