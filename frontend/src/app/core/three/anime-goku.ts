import * as THREE from 'three';
import { dotSprite } from './materials';

export class AnimeGoku {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private kiParticles!: THREE.Points;
  private kiPositions!: Float32Array;
  private kiVelocities!: Float32Array;
  private impactRing!: THREE.Mesh;

  private chestLight!: THREE.PointLight;
  private hairLight!: THREE.PointLight;
  private rimLight!: THREE.PointLight;

  private pulsePhase = 0;
  private flurryTimer = 0;
  private heroHeight = 3.4;
  private heroWidth = 3.4 * (648.0 / 1024.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildContactShadow();
    this.buildGodKiAura();
    this.buildImpactEffects();
    this.buildDynamicLights();

    this.group.position.set(2.8, -1.95, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const gokuTex = texLoader.load('/images/goku-anime.png');
    gokuTex.colorSpace = THREE.SRGBColorSpace;
    gokuTex.anisotropy = 8;
    gokuTex.generateMipmaps = true;

    const normalTex = texLoader.load('/images/goku-normal.png');
    normalTex.anisotropy = 8;

    const width = this.heroWidth;
    const height = this.heroHeight;
    const segX = 54;
    const segY = 54;

    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const nx = vx / (width * 0.5);   // [-1, 1] horizontally
      const ny = vy / (height * 0.5);  // [-1, 1] vertically

      // 1. Horizontal cylindrical curvature (chest curves forward, arms back)
      const torsoCurve = Math.cos(nx * Math.PI * 0.46) * 0.22;

      // 2. Chest & Pectoral bulge
      const pecDist = Math.hypot(nx, ny - 0.20);
      const pecBulge = Math.max(0, 1.0 - pecDist / 0.65) * 0.14;

      // 3. Clenched fists forward bulge (arms on both sides at waist level)
      const fistDist = Math.hypot(Math.abs(nx) - 0.68, ny - 0.04);
      const fistBulge = Math.max(0, 1.0 - fistDist / 0.32) * 0.16;

      // 4. Hair spike depth curvature
      let hairDepth = 0;
      if (ny > 0.4) {
        hairDepth = Math.cos(nx * Math.PI * 0.5) * 0.12 + Math.sin(nx * Math.PI * 2.8) * 0.05;
      }

      // 5. Leg curvature
      let legCurve = 0;
      if (ny < -0.25) {
        const legDist = Math.min(Math.abs(nx - 0.32), Math.abs(nx + 0.32));
        legCurve = Math.max(0, 1.0 - legDist / 0.32) * 0.12;
      }

      pos.setZ(i, torsoCurve + pecBulge + fistBulge + hairDepth + legCurve);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: gokuTex,
      normalMap: normalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.35,
      metalness: 0.22,
      emissive: new THREE.Color('#450a0a'),
      emissiveIntensity: 0.20,
      side: THREE.FrontSide,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height * 0.5, 0.06);
    this.bodyMesh.castShadow = true;

    // Solid dark backmesh for physical 3D depth and thickness
    const backGeo = geo.clone();
    const backMat = new THREE.MeshBasicMaterial({
      color: 0x120303,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height * 0.5, 0.01);

    this.group.add(this.backMesh, this.bodyMesh);
  }

  private buildContactShadow(): void {
    const texLoader = new THREE.TextureLoader();
    const shadowTex = texLoader.load('/images/hero-shadow.png');

    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.1);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });

    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, 0.015, 0.06);
    this.group.add(this.contactShadow);
  }

  private buildDynamicLights(): void {
    // God Ki Chest/Torso Key Light
    this.chestLight = new THREE.PointLight(0xFF4500, 3.8, 4.2, 1.4);
    this.chestLight.position.set(0, 1.8, 1.2);

    // Hair Glow Halo Light
    this.hairLight = new THREE.PointLight(0xFF2200, 4.0, 3.8, 1.4);
    this.hairLight.position.set(0, 3.4, 0.8);

    // Golden Silhouette Rim Light
    this.rimLight = new THREE.PointLight(0xF59E0B, 3.0, 4.5, 1.5);
    this.rimLight.position.set(-1.6, 2.0, 0.3);

    this.group.add(this.chestLight, this.hairLight, this.rimLight);
  }

  private buildGodKiAura(): void {
    const count = this.lowPower ? 50 : 130;
    this.kiPositions = new Float32Array(count * 3);
    this.kiVelocities = new Float32Array(count * 3);

    const colors = new Float32Array(count * 3);
    const crimsonCol = new THREE.Color(0xFF2200);
    const flameCol = new THREE.Color(0xFF7A00);
    const goldCol = new THREE.Color(0xFBBF24);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.95;

      this.kiPositions[idx] = Math.cos(angle) * radius;
      this.kiPositions[idx + 1] = Math.random() * 3.4;
      this.kiPositions[idx + 2] = Math.sin(angle) * radius * 0.6;

      this.kiVelocities[idx] = (Math.random() - 0.5) * 0.014;
      this.kiVelocities[idx + 1] = 0.018 + Math.random() * 0.028;
      this.kiVelocities[idx + 2] = (Math.random() - 0.5) * 0.014;

      const rnd = Math.random();
      const c = rnd < 0.52 ? crimsonCol : rnd < 0.82 ? flameCol : goldCol;
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.kiPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.17,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.kiParticles = new THREE.Points(geo, mat);
    this.group.add(this.kiParticles);
  }

  private buildImpactEffects(): void {
    const ringGeo = new THREE.RingGeometry(0.15, 0.75, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.impactRing = new THREE.Mesh(ringGeo, ringMat);
    this.impactRing.position.set(0, 1.8, 0.4);
    this.group.add(this.impactRing);
  }

  triggerFlurry(): void {
    this.flurryTimer = 1.4;
  }

  update(time: number, dt: number, mouse: THREE.Vector2, localScene: number, active: boolean): void {
    if (!active) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    this.pulsePhase += dt * 3.2;

    const exit = Math.min(1, Math.max(0, (localScene - 0.78) / 0.2));
    const bodyMat = this.bodyMesh.material as THREE.MeshStandardMaterial;
    bodyMat.opacity = 1 - exit;

    // 1. Natural 3D breathing and stance balance
    const breath = Math.sin(this.pulsePhase * 0.85) * 0.022;
    this.bodyMesh.position.y = this.heroHeight * 0.5 + breath;
    this.backMesh.position.y = this.heroHeight * 0.5 + breath;

    // Contact shadow subtly expands with breath
    this.contactShadow.scale.setScalar(1.0 + breath * 0.6);

    // 2. 3D Mouse Parallax Tilt (like Captain America hero stage)
    const targetYaw = -0.25 + mouse.x * 0.36;
    const targetPitch = -mouse.y * 0.12;
    this.group.rotation.y += (targetYaw - this.group.rotation.y) * 0.08;
    this.group.rotation.x += (targetPitch - this.group.rotation.x) * 0.08;

    // 3. Dynamic Key Light Tracking and Pulsing
    this.chestLight.position.x = mouse.x * 0.35;
    this.chestLight.position.y = 1.8 + mouse.y * 0.25;

    let flurryBoost = 0;
    if (this.flurryTimer > 0) {
      this.flurryTimer -= dt;
      flurryBoost = Math.max(0, this.flurryTimer) * 2.5;

      const progress = 1.0 - (this.flurryTimer / 1.4);
      this.impactRing.scale.setScalar(0.5 + progress * 3.2);
      (this.impactRing.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.95;
    } else {
      (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    this.chestLight.intensity = 3.6 + Math.sin(this.pulsePhase * 2.0) * 0.5 + flurryBoost;
    this.hairLight.intensity = 3.8 + Math.sin(this.pulsePhase * 2.4 + 1) * 0.4 + flurryBoost;

    // 4. God Ki Swirling Flame Particles Update
    if (this.kiParticles && this.kiPositions) {
      const count = this.kiPositions.length / 3;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        this.kiPositions[idx] += this.kiVelocities[idx];
        this.kiPositions[idx + 1] += this.kiVelocities[idx + 1] * (1.0 + flurryBoost * 0.8);
        this.kiPositions[idx + 2] += this.kiVelocities[idx + 2];

        // Orbit around body
        const x = this.kiPositions[idx];
        const z = this.kiPositions[idx + 2];
        const rotSpeed = 0.025;
        this.kiPositions[idx] = x * Math.cos(rotSpeed) - z * Math.sin(rotSpeed);
        this.kiPositions[idx + 2] = x * Math.sin(rotSpeed) + z * Math.cos(rotSpeed);

        if (this.kiPositions[idx + 1] > 3.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.25 + Math.random() * 0.95;
          this.kiPositions[idx] = Math.cos(angle) * radius;
          this.kiPositions[idx + 1] = 0.05;
          this.kiPositions[idx + 2] = Math.sin(angle) * radius * 0.6;
        }
      }
      this.kiParticles.geometry.attributes['position'].needsUpdate = true;
    }
  }

  dispose(): void {
    (this.bodyMesh.material as THREE.Material).dispose();
    this.bodyMesh.geometry.dispose();
    (this.backMesh.material as THREE.Material).dispose();
    this.backMesh.geometry.dispose();
    this.kiParticles?.geometry.dispose();
    (this.kiParticles?.material as THREE.Material)?.dispose();
  }
}
