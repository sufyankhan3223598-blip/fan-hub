import * as THREE from 'three';
import { dotSprite } from './materials';

export class TvHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private streamParticles!: THREE.Points;
  private streamPositions!: Float32Array;
  private streamVelocities!: Float32Array;
  private handSparks!: THREE.Points;
  private antennaBeacons!: THREE.Group;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private signalRings: THREE.Mesh[] = [];

  private screenLight!: THREE.PointLight;
  private chestLight!: THREE.PointLight;
  private antennaLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.45;
  private heroWidth = 3.45 * (499.0 / 789.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildSignalRings();
    this.buildStreamAura();
    this.buildAntennaBeacons();
    this.buildHandSparks();
    this.buildPlatformPedestal();
    this.buildDynamicLights();



    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/tv-hero.png');
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
      alphaTest: 0.04,
      side: THREE.FrontSide,
      roughness: 0.26,
      metalness: 0.60,
      emissive: new THREE.Color('#031526'),
      emissiveIntensity: 0.35,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.group.add(this.bodyMesh);


    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x020815,
      roughness: 0.75,
      metalness: 0.35,
      side: THREE.BackSide
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height / 2, -0.04);
    this.backMesh.scale.set(1.015, 1.008, 1.0);
    this.group.add(this.backMesh);


    const glowGeo = geo.clone();
    const glowMat = new THREE.MeshBasicMaterial({
      map: heroTex,
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.set(0, height / 2, -0.02);
    this.glowMesh.scale.set(1.035, 1.025, 1.0);
    this.group.add(this.glowMesh);
  }


  private buildSignalRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0x22D3EE, 0x3B82F6, 0x60A5FA];

    for (let r = 0; r < ringCount; r++) {
      const radius = 0.95 + r * 0.35;
      const ringGeo = new THREE.TorusGeometry(radius, 0.018, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[r % ringColors.length],
        transparent: true,
        opacity: 0.45 - r * 0.08,
        blending: THREE.AdditiveBlending,
        wireframe: r === 1
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 1.95, 0.05);
      ring.rotation.x = (r * Math.PI) / 3 + 0.3;
      ring.rotation.y = (r * Math.PI) / 4;
      this.signalRings.push(ring);
      this.group.add(ring);
    }
  }


  private buildStreamAura(): void {
    const count = this.lowPower ? 55 : 120;
    this.streamPositions = new Float32Array(count * 3);
    this.streamVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.45 + Math.random() * 1.35;
      this.streamPositions[i * 3] = Math.cos(angle) * rad;
      this.streamPositions[i * 3 + 1] = 0.2 + Math.random() * 3.3;
      this.streamPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.3;

      this.streamVelocities[i * 3] = (Math.random() - 0.5) * 0.12;
      this.streamVelocities[i * 3 + 1] = 0.25 + Math.random() * 0.45;
      this.streamVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.streamPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      color: 0x22D3EE,
      map: dotSprite(),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streamParticles = new THREE.Points(geo, mat);
    this.group.add(this.streamParticles);
  }


  private buildAntennaBeacons(): void {
    this.antennaBeacons = new THREE.Group();


    const tipGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.95
    });

    const tip1 = new THREE.Mesh(tipGeo, tipMat);
    tip1.position.set(-0.35, 3.36, 0.15);


    const tip2 = new THREE.Mesh(tipGeo, tipMat.clone());
    tip2.position.set(0.04, 3.48, 0.15);


    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const halo1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), haloMat);
    halo1.position.copy(tip1.position);

    const halo2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), haloMat);
    halo2.position.copy(tip2.position);

    this.antennaBeacons.add(tip1, tip2, halo1, halo2);
    this.group.add(this.antennaBeacons);
  }


  private buildHandSparks(): void {
    const sparkCount = this.lowPower ? 12 : 24;
    const pos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      pos[i * 3] = 0.62 + (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 1] = 2.45 + (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 2] = 0.20 + (Math.random() - 0.5) * 0.20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.20,
      color: 0x22D3EE,
      map: dotSprite(),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.handSparks = new THREE.Points(geo, mat);
    this.group.add(this.handSparks);
  }

  private buildPlatformPedestal(): void {

    const shadowGeo = new THREE.RingGeometry(0.05, 0.80, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x01050d,
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
      color: 0x22D3EE,
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

    this.screenLight = new THREE.PointLight('#22D3EE', 32, 4.2, 1.6);
    this.screenLight.position.set(0, 2.72, 0.35);


    this.chestLight = new THREE.PointLight('#38BDF8', 20, 3.2, 1.7);
    this.chestLight.position.set(-0.08, 1.95, 0.30);


    this.antennaLight = new THREE.PointLight('#60A5FA', 16, 2.5, 1.6);
    this.antennaLight.position.set(-0.16, 3.4, 0.25);

    this.group.add(this.screenLight, this.chestLight, this.antennaLight);
  }


  triggerBroadcastPulse(): void {
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
    this.backMesh.scale.set(1.015 * breathScale, 1.008 * breathScale, 1.0);
    this.glowMesh.position.y = (this.heroHeight / 2) + breathY;
    this.glowMesh.scale.set(1.035 * breathScale, 1.025 * breathScale, 1.0);


    const targetRotY = mouse.x * 0.36;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);


    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.90;


    this.signalRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.8 * dir + this.surgeBurst * 1.5;
      ring.rotation.x = Math.PI * 0.35 + Math.sin(time * 1.5 + i) * 0.15;
      const s = 1.0 + Math.sin(time * 4.0 + i) * 0.06 + this.surgeBurst * 0.3;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.50 + Math.sin(time * 5.0 + i) * 0.2 + this.surgeBurst * 0.35;
    });


    if (this.antennaBeacons) {
      this.antennaBeacons.position.y = breathY;
      const antPulse = 0.85 + 0.25 * Math.sin(this.pulsePhase * 4.0);
      this.antennaBeacons.children.forEach((c, i) => {
        if (i >= 2) {
          c.scale.setScalar(antPulse + this.surgeBurst * 0.5);
          ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (0.4 + 0.3 * Math.sin(this.pulsePhase * 4.0)) * (1.0 + this.surgeBurst * 0.4);
        }
      });
    }


    if (this.streamPositions) {
      const count = this.streamPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.streamPositions[i * 3 + 1] += this.streamVelocities[i * 3 + 1] * dt * (1.0 + this.surgeBurst * 1.8);
        this.streamPositions[i * 3] += (Math.random() - 0.5) * 0.015;
        this.streamPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.015;

        if (this.streamPositions[i * 3 + 1] > 3.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.45 + Math.random() * 1.35;
          this.streamPositions[i * 3] = Math.cos(angle) * radius;
          this.streamPositions[i * 3 + 1] = 0.2;
          this.streamPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.3;
        }
      }
      (this.streamParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }


    if (this.handSparks) {
      const sparkAttr = this.handSparks.geometry.attributes['position'] as THREE.BufferAttribute;
      const spCount = sparkAttr.count;
      for (let i = 0; i < spCount; i++) {
        sparkAttr.setY(i, 2.45 + breathY + Math.sin(this.pulsePhase * 5.0 + i) * 0.04);
      }
      sparkAttr.needsUpdate = true;
      (this.handSparks.material as THREE.PointsMaterial).opacity = 0.75 + 0.25 * Math.sin(this.pulsePhase * 8.0);
    }


    const screenFlicker = 1.0 + Math.sin(time * 5.0) * 0.12 + Math.sin(time * 17.0) * 0.05;
    this.screenLight.intensity = (32 + this.surgeBurst * 55) * screenFlicker;
    this.screenLight.position.y = 2.72 + breathY;

    this.chestLight.intensity = 20 + Math.sin(this.pulsePhase * 3.0) * 8 + this.surgeBurst * 35;
    this.chestLight.position.y = 1.95 + breathY;

    this.antennaLight.intensity = 16 + Math.sin(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 30;
    this.antennaLight.position.y = 3.4 + breathY;


    if (this.pedestalRing) {
      const ringScale = 1.0 + Math.sin(time * 3.0) * 0.15 + this.surgeBurst * 0.4;
      this.pedestalRing.scale.set(ringScale, ringScale, 1.0);
      (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.2) * 0.18 + this.surgeBurst * 0.4;
    }
  }

  dispose(): void {
    [this.bodyMesh, this.backMesh, this.glowMesh, this.contactShadow, this.pedestalRing, ...this.signalRings].forEach(m => {
      m?.geometry?.dispose();
      const mat = m?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    [this.streamParticles, this.handSparks].forEach(p => {
      p?.geometry?.dispose();
      (p?.material as THREE.Material)?.dispose();
    });
    this.antennaBeacons?.traverse(o => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      (m.material as THREE.Material)?.dispose?.();
    });
  }
}
