import * as THREE from 'three';
import { dotSprite } from './materials';

export class MovieHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private stardustParticles!: THREE.Points;
  private stardustPositions!: Float32Array;
  private stardustVelocities!: Float32Array;
  private clapperSparks!: THREE.Points;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private filmRings: THREE.Mesh[] = [];

  private eyesLight!: THREE.PointLight;
  private lensLight!: THREE.PointLight;
  private clapperLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.45;
  private heroWidth = 3.45 * (598.0 / 846.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildFilmRings();
    this.buildPremiereStardust();
    this.buildClapperSparks();
    this.buildPlatformPedestal();
    this.buildDynamicLights();



    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/movie-hero.png');
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
      roughness: 0.28,
      metalness: 0.60,
      emissive: new THREE.Color('#221004'),
      emissiveIntensity: 0.35,
      depthWrite: true
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.group.add(this.bodyMesh);


    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x120803,
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
      color: 0xF59E0B,
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


  private buildFilmRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0xF59E0B, 0xDC2626, 0xFCD34D];

    for (let r = 0; r < ringCount; r++) {
      const radius = 1.0 + r * 0.35;
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
      this.filmRings.push(ring);
      this.group.add(ring);
    }
  }


  private buildPremiereStardust(): void {
    const count = this.lowPower ? 55 : 120;
    this.stardustPositions = new Float32Array(count * 3);
    this.stardustVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.45 + Math.random() * 1.35;
      this.stardustPositions[i * 3] = Math.cos(angle) * rad;
      this.stardustPositions[i * 3 + 1] = 0.2 + Math.random() * 3.3;
      this.stardustPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.3;

      this.stardustVelocities[i * 3] = (Math.random() - 0.5) * 0.12;
      this.stardustVelocities[i * 3 + 1] = 0.25 + Math.random() * 0.45;
      this.stardustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.stardustPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0xFCD34D,
      map: dotSprite(),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stardustParticles = new THREE.Points(geo, mat);
    this.group.add(this.stardustParticles);
  }


  private buildClapperSparks(): void {
    const sparkCount = this.lowPower ? 12 : 24;
    const pos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      pos[i * 3] = 0.65 + (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 1] = 1.65 + (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 2] = 0.25 + (Math.random() - 0.5) * 0.20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.22,
      color: 0xF59E0B,
      map: dotSprite(),
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.clapperSparks = new THREE.Points(geo, mat);
    this.group.add(this.clapperSparks);
  }

  private buildPlatformPedestal(): void {

    const shadowGeo = new THREE.RingGeometry(0.05, 0.82, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a0502,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.scale.set(1.4, 1.0, 0.65);
    this.contactShadow.position.set(0, 0.02, 0);
    this.group.add(this.contactShadow);


    const ringGeo = new THREE.RingGeometry(0.65, 0.92, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
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

    this.eyesLight = new THREE.PointLight('#F59E0B', 32, 4.0, 1.6);
    this.eyesLight.position.set(0.0, 2.60, 0.35);


    this.lensLight = new THREE.PointLight('#FCD34D', 24, 3.5, 1.7);
    this.lensLight.position.set(0.48, 2.75, 0.32);


    this.clapperLight = new THREE.PointLight('#DC2626', 18, 2.8, 1.8);
    this.clapperLight.position.set(0.65, 1.65, 0.28);

    this.group.add(this.eyesLight, this.lensLight, this.clapperLight);
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
    this.backMesh.scale.set(1.015 * breathScale, 1.008 * breathScale, 1.0);
    this.glowMesh.position.y = (this.heroHeight / 2) + breathY;
    this.glowMesh.scale.set(1.035 * breathScale, 1.025 * breathScale, 1.0);


    const targetRotY = mouse.x * 0.36;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);


    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.90;


    this.filmRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.8 * dir + this.surgeBurst * 1.5;
      ring.rotation.x = Math.PI * 0.35 + Math.sin(time * 1.5 + i) * 0.15;
      const s = 1.0 + Math.sin(time * 4.0 + i) * 0.06 + this.surgeBurst * 0.3;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.50 + Math.sin(time * 5.0 + i) * 0.2 + this.surgeBurst * 0.35;
    });


    if (this.stardustPositions) {
      const count = this.stardustPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.stardustPositions[i * 3 + 1] += this.stardustVelocities[i * 3 + 1] * dt * (1.0 + this.surgeBurst * 1.8);
        this.stardustPositions[i * 3] += (Math.random() - 0.5) * 0.015;
        this.stardustPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.015;

        if (this.stardustPositions[i * 3 + 1] > 3.6) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.45 + Math.random() * 1.35;
          this.stardustPositions[i * 3] = Math.cos(angle) * radius;
          this.stardustPositions[i * 3 + 1] = 0.2;
          this.stardustPositions[i * 3 + 2] = (Math.random() - 0.45) * 1.3;
        }
      }
      (this.stardustParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }


    if (this.clapperSparks) {
      const sparkAttr = this.clapperSparks.geometry.attributes['position'] as THREE.BufferAttribute;
      const spCount = sparkAttr.count;
      for (let i = 0; i < spCount; i++) {
        sparkAttr.setY(i, 1.65 + breathY + Math.sin(this.pulsePhase * 5.0 + i) * 0.04);
      }
      sparkAttr.needsUpdate = true;
      (this.clapperSparks.material as THREE.PointsMaterial).opacity = 0.75 + 0.25 * Math.sin(this.pulsePhase * 8.0);
    }


    const eyeFlicker = 1.0 + Math.sin(time * 5.0) * 0.12 + Math.sin(time * 17.0) * 0.05;
    this.eyesLight.intensity = (32 + this.surgeBurst * 55) * eyeFlicker;
    this.eyesLight.position.y = 2.60 + breathY;

    this.lensLight.intensity = 24 + Math.sin(this.pulsePhase * 3.0) * 8 + this.surgeBurst * 35;
    this.lensLight.position.y = 2.75 + breathY;

    this.clapperLight.intensity = 18 + Math.sin(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 30;
    this.clapperLight.position.y = 1.65 + breathY;


    if (this.pedestalRing) {
      const ringScale = 1.0 + Math.sin(time * 3.0) * 0.15 + this.surgeBurst * 0.4;
      this.pedestalRing.scale.set(ringScale, ringScale, 1.0);
      (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.2) * 0.18 + this.surgeBurst * 0.4;
    }
  }

  dispose(): void {
    [this.bodyMesh, this.backMesh, this.glowMesh, this.contactShadow, this.pedestalRing, ...this.filmRings].forEach(m => {
      m?.geometry?.dispose();
      const mat = m?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    [this.stardustParticles, this.clapperSparks].forEach(p => {
      p?.geometry?.dispose();
      (p?.material as THREE.Material)?.dispose();
    });
  }
}
