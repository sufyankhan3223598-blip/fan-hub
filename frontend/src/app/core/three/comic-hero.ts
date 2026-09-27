import * as THREE from 'three';
import { dotSprite } from './materials';

export class ComicHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private lightningParticles!: THREE.Points;
  private lightningPositions!: Float32Array;
  private lightningVelocities!: Float32Array;
  private fistSparksLeft!: THREE.Points;
  private fistSparksRight!: THREE.Points;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private lightningBolts: THREE.Mesh[] = [];

  private chestLight!: THREE.PointLight;
  private leftFistLight!: THREE.PointLight;
  private rightFistLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.4;
  private heroWidth = 3.4 * (659.0 / 879.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.build3DLightningBolts();
    this.buildLightningAura();
    this.buildFistSparks();
    this.buildPlatformPedestal();
    this.buildDynamicLights();



    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/comic-hero.png');
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


      const heightWeight = 0.45 + (ny + 0.5) * 0.7;
      const curveZ = Math.cos(nx * Math.PI * 0.48) * 0.28 * heightWeight;
      pos.setZ(i, curveZ);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: heroTex,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.FrontSide,
      roughness: 0.25,
      metalness: 0.65,
      emissive: new THREE.Color('#3A2A04'),
      emissiveIntensity: 0.32
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);


    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x08080C,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height / 2, -0.04);
    this.backMesh.scale.set(1.015, 1.008, 1.0);
    this.group.add(this.backMesh);


    const glowGeo = geo.clone();
    const glowMat = new THREE.MeshBasicMaterial({
      map: heroTex,
      color: 0xFACC15,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.position.set(0, height / 2, -0.02);
    this.glowMesh.scale.set(1.035, 1.025, 1.0);
    this.group.add(this.glowMesh);
  }


  private build3DLightningBolts(): void {
    const boltCount = this.lowPower ? 3 : 5;
    for (let b = 0; b < boltCount; b++) {
      const points: THREE.Vector3[] = [];
      const numPts = 10;
      const baseAngle = (b / boltCount) * Math.PI * 2;
      const startY = 0.5 + b * 0.55;

      for (let p = 0; p < numPts; p++) {
        const t = p / (numPts - 1);
        const a = baseAngle + t * Math.PI * 1.8;
        const rad = 0.75 + Math.sin(t * Math.PI) * 0.35 + (Math.random() - 0.5) * 0.12;
        const y = startY + t * 0.85 + (Math.random() - 0.5) * 0.12;

        const z = Math.sin(a) * rad * 0.8;
        points.push(new THREE.Vector3(Math.cos(a) * rad, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.02, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: b % 2 === 0 ? 0xFDE047 : 0xFFFFFF,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const bolt = new THREE.Mesh(tubeGeo, tubeMat);
      this.lightningBolts.push(bolt);
      this.group.add(bolt);
    }
  }

  private buildLightningAura(): void {
    const count = this.lowPower ? 60 : 140;
    this.lightningPositions = new Float32Array(count * 3);
    this.lightningVelocities = new Float32Array(count);

    const colors = new Float32Array(count * 3);
    const yellowCol = new THREE.Color(0xFACC15);
    const goldCol = new THREE.Color(0xF59E0B);
    const whiteCol = new THREE.Color(0xFFFFFF);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 1.0;
      this.lightningPositions[i * 3] = Math.cos(angle) * radius;
      this.lightningPositions[i * 3 + 1] = Math.random() * 3.4;
      this.lightningPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.1;
      this.lightningVelocities[i] = 1.6 + Math.random() * 3.0;

      const pick = Math.random();
      const c = pick < 0.45 ? yellowCol : (pick < 0.75 ? goldCol : whiteCol);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.lightningPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.2,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.lightningParticles = new THREE.Points(geo, mat);
    this.group.add(this.lightningParticles);
  }

  private buildFistSparks(): void {
    const sparkCount = 18;
    const createSparks = (x: number, y: number) => {
      const pos = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        pos[i * 3] = x + (Math.random() - 0.5) * 0.28;
        pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.28;
        pos[i * 3 + 2] = 0.24 + (Math.random() - 0.5) * 0.25;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.26,
        color: 0xFFE066,
        map: dotSprite(),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      return new THREE.Points(geo, mat);
    };


    this.fistSparksLeft = createSparks(-0.68, 1.88);
    this.fistSparksRight = createSparks(0.68, 1.88);
    this.group.add(this.fistSparksLeft, this.fistSparksRight);
  }

  private buildPlatformPedestal(): void {

    const shadowGeo = new THREE.RingGeometry(0.05, 0.85, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x030306,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.scale.set(1.45, 1.0, 0.65);
    this.contactShadow.position.set(0, 0.02, 0);
    this.group.add(this.contactShadow);


    const ringGeo = new THREE.RingGeometry(0.6, 0.88, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFACC15,
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

    this.chestLight = new THREE.PointLight('#FACC15', 35, 4.0, 1.6);
    this.chestLight.position.set(0, 2.1, 0.45);


    this.leftFistLight = new THREE.PointLight('#FDE047', 20, 2.5, 2.0);
    this.leftFistLight.position.set(-0.68, 1.88, 0.35);

    this.rightFistLight = new THREE.PointLight('#FDE047', 20, 2.5, 2.0);
    this.rightFistLight.position.set(0.68, 1.88, 0.35);

    this.group.add(this.chestLight, this.leftFistLight, this.rightFistLight);
  }


  triggerPowerSurge(): void {
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



    const breathY = Math.sin(time * 2.5) * 0.02;
    const breathScale = 1.0 + Math.sin(time * 2.5) * 0.012;
    this.bodyMesh.position.y = (this.heroHeight / 2) + breathY;
    this.bodyMesh.scale.set(breathScale, breathScale, 1.0);
    this.backMesh.position.y = (this.heroHeight / 2) + breathY;
    this.glowMesh.position.y = (this.heroHeight / 2) + breathY;


    const targetRotY = mouse.x * 0.38;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);


    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.90;


    this.lightningBolts.forEach((bolt, i) => {
      const speed = (i % 2 === 0 ? 1 : -1) * (1.2 + i * 0.3);
      bolt.rotation.y = time * speed + this.surgeBurst * 2.0;
      const s = 1.0 + Math.sin(time * 6.0 + i) * 0.08 + this.surgeBurst * 0.35;
      bolt.scale.set(s, 1.0, s);
      (bolt.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(time * 8.0 + i * 2) * 0.3 + this.surgeBurst * 0.4;
    });


    if (this.lightningPositions) {
      const count = this.lightningPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.lightningPositions[i * 3 + 1] += this.lightningVelocities[i] * dt * (1.0 + this.surgeBurst);

        this.lightningPositions[i * 3] += (Math.random() - 0.5) * 0.025;
        this.lightningPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.025;

        if (this.lightningPositions[i * 3 + 1] > 3.4) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.35 + Math.random() * 0.95;
          this.lightningPositions[i * 3] = Math.cos(angle) * radius;
          this.lightningPositions[i * 3 + 1] = 0.05;
          this.lightningPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
        }
      }
      (this.lightningParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }


    const sparkScale = 1.0 + Math.sin(this.pulsePhase * 3.5) * 0.35 + this.surgeBurst * 0.9;
    this.fistSparksLeft.scale.setScalar(sparkScale);
    this.fistSparksRight.scale.setScalar(sparkScale);


    this.chestLight.intensity = 35 + Math.sin(time * 5.0) * 12 + this.surgeBurst * 45;
    this.leftFistLight.intensity = 20 + Math.sin(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 30;
    this.rightFistLight.intensity = 20 + Math.cos(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 30;


    const ringScale = 1.0 + Math.sin(time * 3.2) * 0.25 + this.surgeBurst * 0.6;
    this.pedestalRing.scale.setScalar(ringScale);
    (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.5) * 0.2 + this.surgeBurst * 0.45;
  }

  dispose(): void {
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.backMesh.geometry.dispose();
    (this.backMesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
    this.lightningParticles.geometry.dispose();
    (this.lightningParticles.material as THREE.Material).dispose();
    this.fistSparksLeft.geometry.dispose();
    (this.fistSparksLeft.material as THREE.Material).dispose();
    this.fistSparksRight.geometry.dispose();
    (this.fistSparksRight.material as THREE.Material).dispose();
    this.contactShadow.geometry.dispose();
    (this.contactShadow.material as THREE.Material).dispose();
    this.pedestalRing.geometry.dispose();
    (this.pedestalRing.material as THREE.Material).dispose();
    this.lightningBolts.forEach(b => {
      b.geometry.dispose();
      (b.material as THREE.Material).dispose();
    });
  }
}
