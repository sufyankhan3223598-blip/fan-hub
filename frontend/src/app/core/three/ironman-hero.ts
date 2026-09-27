import * as THREE from 'three';
import { dotSprite } from './materials';

export class IronmanHero {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private energyParticles!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleVelocities!: Float32Array;
  private pedestalPlatform!: THREE.Mesh;
  private pedestalRing!: THREE.Mesh;
  private contactShadow!: THREE.Mesh;

  private arcReactorLight!: THREE.PointLight;
  private palmLight!: THREE.PointLight;
  private helmetLight!: THREE.PointLight;

  private pulsePhase = 0;
  private heroHeight = 3.6;
  private heroWidth = 3.6 * (355.0 / 575.0);

  constructor(private lowPower: boolean) {
    this.buildVolumetricBody();
    this.buildEnergySparks();
    this.buildPlatformPedestal();
    this.buildDynamicLights();


    this.group.position.set(0, -1.05, 0);
  }

  private buildVolumetricBody(): void {
    const texLoader = new THREE.TextureLoader();
    const heroTex = texLoader.load('/images/ironman-3d-hero.png');
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


      const heightWeight = 0.5 + (ny + 0.5) * 0.8;
      const curveZ = Math.cos(nx * Math.PI * 0.48) * 0.28 * heightWeight;
      pos.setZ(i, curveZ);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: heroTex,
      transparent: true,
      alphaTest: 0.08,
      roughness: 0.35,
      metalness: 0.65,
      side: THREE.FrontSide,
      depthWrite: true,
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.set(0, height * 0.5, 0.08);


    const backGeo = geo.clone();
    const backMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.backMesh = new THREE.Mesh(backGeo, backMat);
    this.backMesh.position.set(0, height * 0.5, 0.02);

    this.group.add(this.backMesh, this.bodyMesh);
  }

  private buildPlatformPedestal(): void {

    const platGeo = new THREE.CylinderGeometry(1.65, 1.75, 0.18, 48);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.pedestalPlatform = new THREE.Mesh(platGeo, platMat);
    this.pedestalPlatform.position.set(0, -0.09, 0);


    const ringGeo = new THREE.TorusGeometry(1.68, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xF5C86A,
    });
    this.pedestalRing = new THREE.Mesh(ringGeo, ringMat);
    this.pedestalRing.rotation.x = Math.PI / 2;
    this.pedestalRing.position.set(0, 0.01, 0);


    const innerRingGeo = new THREE.TorusGeometry(1.2, 0.02, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.set(0, 0.015, 0);


    const shadowGeo = new THREE.CircleGeometry(1.4, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.75,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, 0.02, 0);

    this.group.add(this.pedestalPlatform, this.pedestalRing, innerRing, this.contactShadow);
  }

  private buildEnergySparks(): void {
    const count = this.lowPower ? 40 : 120;
    this.particlePositions = new Float32Array(count * 3);
    this.particleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 1.5;
      this.particlePositions[idx] = Math.cos(angle) * radius;
      this.particlePositions[idx + 1] = Math.random() * 3.5;
      this.particlePositions[idx + 2] = Math.sin(angle) * radius;

      this.particleVelocities[idx] = (Math.random() - 0.5) * 0.015;
      this.particleVelocities[idx + 1] = 0.015 + Math.random() * 0.025;
      this.particleVelocities[idx + 2] = (Math.random() - 0.5) * 0.015;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.07,
      map: dotSprite(),
      color: new THREE.Color(0xF5C86A),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.energyParticles = new THREE.Points(geo, mat);
    this.group.add(this.energyParticles);
  }

  private buildDynamicLights(): void {

    this.arcReactorLight = new THREE.PointLight(0x38BDF8, 2.5, 4);
    this.arcReactorLight.position.set(0, 2.1, 0.45);


    this.palmLight = new THREE.PointLight(0x38BDF8, 2.0, 3);
    this.palmLight.position.set(-0.7, 1.8, 0.65);


    this.helmetLight = new THREE.PointLight(0xF5C86A, 1.8, 5);
    this.helmetLight.position.set(0.5, 3.2, 1.2);

    this.group.add(this.arcReactorLight, this.palmLight, this.helmetLight);
  }

  update(time: number, dt: number, mouse: THREE.Vector2): void {
    this.pulsePhase += dt * 3.5;


    const breath = Math.sin(this.pulsePhase * 0.8) * 0.03;
    this.bodyMesh.position.y = this.heroHeight * 0.5 + breath;
    this.backMesh.position.y = this.heroHeight * 0.5 + breath;


    const targetRotY = mouse.x * 0.35;
    const targetRotX = -mouse.y * 0.15;
    this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.08;
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.08;


    const pulseIntensity = 2.0 + Math.sin(this.pulsePhase * 2.5) * 0.6;
    this.arcReactorLight.intensity = pulseIntensity;
    this.palmLight.intensity = 1.6 + Math.sin(this.pulsePhase * 2.0 + 1) * 0.5;


    if (this.energyParticles && this.particlePositions) {
      const count = this.particlePositions.length / 3;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        this.particlePositions[idx] += this.particleVelocities[idx];
        this.particlePositions[idx + 1] += this.particleVelocities[idx + 1];
        this.particlePositions[idx + 2] += this.particleVelocities[idx + 2];


        if (this.particlePositions[idx + 1] > 3.8) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.3 + Math.random() * 1.5;
          this.particlePositions[idx] = Math.cos(angle) * radius;
          this.particlePositions[idx + 1] = 0.1;
          this.particlePositions[idx + 2] = Math.sin(angle) * radius;
        }
      }
      this.energyParticles.geometry.attributes['position'].needsUpdate = true;
    }
  }
}
