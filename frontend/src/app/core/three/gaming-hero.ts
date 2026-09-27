import * as THREE from 'three';
import { dotSprite } from './materials';

export class GamingHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private matrixParticles!: THREE.Points;
  private matrixPositions!: Float32Array;
  private matrixVelocities!: Float32Array;
  private controllerSparks!: THREE.Points;
  private fistSparks!: THREE.Points;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;
  private cyberRings: THREE.Mesh[] = [];

  private screenLight!: THREE.PointLight;
  private controllerLight!: THREE.PointLight;
  private fistLight!: THREE.PointLight;

  private surgeBurst = 0;
  private pulsePhase = 0;
  private heroHeight = 3.35;
  private heroWidth = 3.35 * (577.0 / 784.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildCyberRings();
    this.buildMatrixAura();
    this.buildGamerSparks();
    this.buildPlatformPedestal();
    this.buildDynamicLights();



    this.group.position.set(2.8, -1.90, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/gaming-hero.png');
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


      const heightWeight = 0.5 + (ny + 0.5) * 0.65;
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
      metalness: 0.55,
      emissive: new THREE.Color('#032812'),
      emissiveIntensity: 0.35
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height / 2, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);


    const backGeo = geo.clone();
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x050A06,
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
      color: 0x10B981,
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


  private buildCyberRings(): void {
    const ringCount = this.lowPower ? 2 : 3;
    const ringColors = [0x10B981, 0x22C55E, 0x34D399];

    for (let r = 0; r < ringCount; r++) {
      const radius = 0.95 + r * 0.35;
      const ringGeo = new THREE.TorusGeometry(radius, 0.018, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[r % ringColors.length],
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 1.5 + r * 0.4, 0);
      ringMesh.rotation.x = Math.PI * 0.35 + r * 0.2;
      this.cyberRings.push(ringMesh);
      this.group.add(ringMesh);
    }
  }

  private buildMatrixAura(): void {
    const count = this.lowPower ? 60 : 130;
    this.matrixPositions = new Float32Array(count * 3);
    this.matrixVelocities = new Float32Array(count);

    const colors = new Float32Array(count * 3);
    const greenCol = new THREE.Color(0x10B981);
    const emeraldCol = new THREE.Color(0x22C55E);
    const whiteCol = new THREE.Color(0xDCFCE7);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 0.95;
      this.matrixPositions[i * 3] = Math.cos(angle) * radius;
      this.matrixPositions[i * 3 + 1] = Math.random() * 3.4;
      this.matrixPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.1;
      this.matrixVelocities[i] = 1.3 + Math.random() * 2.5;

      const pick = Math.random();
      const c = pick < 0.5 ? greenCol : (pick < 0.8 ? emeraldCol : whiteCol);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.matrixPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.matrixParticles = new THREE.Points(geo, mat);
    this.group.add(this.matrixParticles);
  }

  private buildGamerSparks(): void {
    const sparkCount = 16;
    const createSparks = (x: number, y: number, z: number, colorHex: number) => {
      const pos = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        pos[i * 3] = x + (Math.random() - 0.5) * 0.28;
        pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.28;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.25;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.24,
        color: colorHex,
        map: dotSprite(),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      return new THREE.Points(geo, mat);
    };


    this.controllerSparks = createSparks(0.25, 1.6, 0.28, 0x34D399);

    this.fistSparks = createSparks(-0.62, 2.7, 0.18, 0x10B981);
    this.group.add(this.controllerSparks, this.fistSparks);
  }

  private buildPlatformPedestal(): void {

    const shadowGeo = new THREE.RingGeometry(0.05, 0.82, 36);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020803,
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
      color: 0x10B981,
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

    this.screenLight = new THREE.PointLight('#22C55E', 32, 4.0, 1.6);
    this.screenLight.position.set(0, 2.4, 0.42);


    this.controllerLight = new THREE.PointLight('#10B981', 22, 2.5, 2.0);
    this.controllerLight.position.set(0.25, 1.6, 0.35);


    this.fistLight = new THREE.PointLight('#34D399', 18, 2.2, 2.0);
    this.fistLight.position.set(-0.62, 2.7, 0.25);

    this.group.add(this.screenLight, this.controllerLight, this.fistLight);
  }


  triggerLevelUp(): void {
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



    const breathY = Math.sin(time * 2.8) * 0.02;
    const breathScale = 1.0 + Math.sin(time * 2.8) * 0.012;
    this.bodyMesh.position.y = (this.heroHeight / 2) + breathY;
    this.bodyMesh.scale.set(breathScale, breathScale, 1.0);
    this.backMesh.position.y = (this.heroHeight / 2) + breathY;
    this.glowMesh.position.y = (this.heroHeight / 2) + breathY;


    const targetRotY = mouse.x * 0.36;
    const targetRotX = -mouse.y * 0.16;
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetRotY, 0.08);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRotX, 0.08);


    this.group.position.x = 2.8 + mouse.x * 0.18;
    this.group.position.y = -1.90;


    this.cyberRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.z = time * 0.8 * dir + this.surgeBurst * 1.5;
      ring.rotation.x = Math.PI * 0.35 + Math.sin(time * 1.5 + i) * 0.15;
      const s = 1.0 + Math.sin(time * 4.0 + i) * 0.06 + this.surgeBurst * 0.3;
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(time * 5.0 + i) * 0.2 + this.surgeBurst * 0.35;
    });


    if (this.matrixPositions) {
      const count = this.matrixPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.matrixPositions[i * 3 + 1] += this.matrixVelocities[i] * dt * (1.0 + this.surgeBurst);

        this.matrixPositions[i * 3] += (Math.random() - 0.5) * 0.02;
        this.matrixPositions[i * 3 + 2] += (Math.random() - 0.5) * 0.02;

        if (this.matrixPositions[i * 3 + 1] > 3.4) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.35 + Math.random() * 0.95;
          this.matrixPositions[i * 3] = Math.cos(angle) * radius;
          this.matrixPositions[i * 3 + 1] = 0.05;
          this.matrixPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
        }
      }
      (this.matrixParticles.geometry.attributes['position'] as THREE.BufferAttribute).needsUpdate = true;
    }


    const sparkScale = 1.0 + Math.sin(this.pulsePhase * 3.5) * 0.35 + this.surgeBurst * 0.85;
    this.controllerSparks.scale.setScalar(sparkScale);
    this.fistSparks.scale.setScalar(sparkScale);


    this.screenLight.intensity = 32 + Math.sin(time * 4.5) * 10 + this.surgeBurst * 40;
    this.controllerLight.intensity = 22 + Math.sin(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 25;
    this.fistLight.intensity = 18 + Math.cos(this.pulsePhase * 4.0) * 8 + this.surgeBurst * 25;


    const ringScale = 1.0 + Math.sin(time * 3.0) * 0.2 + this.surgeBurst * 0.5;
    this.pedestalRing.scale.setScalar(ringScale);
    (this.pedestalRing.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 3.2) * 0.18 + this.surgeBurst * 0.4;
  }

  dispose(): void {
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.backMesh.geometry.dispose();
    (this.backMesh.material as THREE.Material).dispose();
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
    this.matrixParticles.geometry.dispose();
    (this.matrixParticles.material as THREE.Material).dispose();
    this.controllerSparks.geometry.dispose();
    (this.controllerSparks.material as THREE.Material).dispose();
    this.fistSparks.geometry.dispose();
    (this.fistSparks.material as THREE.Material).dispose();
    this.contactShadow.geometry.dispose();
    (this.contactShadow.material as THREE.Material).dispose();
    this.pedestalRing.geometry.dispose();
    (this.pedestalRing.material as THREE.Material).dispose();
    this.cyberRings.forEach(r => {
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    });
  }
}
