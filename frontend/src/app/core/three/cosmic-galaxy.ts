import * as THREE from 'three';
import { dotSprite } from './materials';

export class CosmicGalaxy {
  readonly group = new THREE.Group();

  private mainVortexMesh!: THREE.Mesh;
  private innerSwirlMesh!: THREE.Mesh;
  private photonRing!: THREE.Mesh;
  private coreVoid!: THREE.Mesh;
  private dustPoints!: THREE.Points;

  private dustPositions!: Float32Array;
  private dustRadii!: Float32Array;
  private dustAngles!: Float32Array;
  private dustSpeeds!: Float32Array;
  private dustHeights!: Float32Array;


  private readonly baseTiltX = -0.25;
  private readonly baseTiltY = 0.20;

  constructor(private lowPower: boolean) {
    this.buildGalaxyMesh();
    this.buildPhotonRingAndCore();
    this.buildAccretionParticles();

    this.group.rotation.x = this.baseTiltX;
    this.group.rotation.y = this.baseTiltY;
  }

  private buildGalaxyMesh(): void {
    const texLoader = new THREE.TextureLoader();
    const galaxyTex = texLoader.load('/images/cosmic-galaxy.png');
    galaxyTex.colorSpace = THREE.SRGBColorSpace;
    galaxyTex.anisotropy = 8;
    galaxyTex.generateMipmaps = true;


    const width = 6.6;
    const height = 6.6 / 1.753;
    const segX = 48;
    const segY = 48;


    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const r = Math.sqrt(vx * vx + vy * vy);

      const depthFactor = Math.max(0, 1.0 - (r / 2.7));
      const funnelDepth = -(depthFactor * depthFactor * 0.75);
      pos.setZ(i, funnelDepth);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      map: galaxyTex,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mainVortexMesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mainVortexMesh);


    const innerGeo = geo.clone();
    const innerMat = new THREE.MeshBasicMaterial({
      map: galaxyTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.innerSwirlMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerSwirlMesh.scale.setScalar(0.92);
    this.innerSwirlMesh.position.z = 0.04;
    this.group.add(this.innerSwirlMesh);
  }

  private buildPhotonRingAndCore(): void {

    const ringGeo = new THREE.TorusGeometry(1.08, 0.03, 16, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    });
    this.photonRing = new THREE.Mesh(ringGeo, ringMat);
    this.photonRing.position.set(0, 0, -0.46);
    this.group.add(this.photonRing);


    const voidGeo = new THREE.CircleGeometry(0.96, 48);
    const voidMat = new THREE.MeshBasicMaterial({
      color: 0x020206,
      side: THREE.FrontSide,
    });
    this.coreVoid = new THREE.Mesh(voidGeo, voidMat);
    this.coreVoid.position.set(0, 0, -0.60);
    this.group.add(this.coreVoid);
  }

  private buildAccretionParticles(): void {
    const count = this.lowPower ? 200 : 520;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    this.dustRadii = new Float32Array(count);
    this.dustAngles = new Float32Array(count);
    this.dustSpeeds = new Float32Array(count);
    this.dustHeights = new Float32Array(count);

    const cyan = new THREE.Color(0x38BDF8);
    const violet = new THREE.Color(0xA855F7);
    const electricBlue = new THREE.Color(0x60A5FA);
    const gold = new THREE.Color(0xF5C86A);
    const white = new THREE.Color(0xFFFFFF);

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const r = 1.10 + Math.pow(t, 0.88) * 3.5;
      const a = Math.random() * Math.PI * 2;

      const speed = (0.75 + Math.random() * 0.4) / (Math.sqrt(r) + 0.1);
      const h = (Math.random() - 0.5) * 0.25;

      this.dustRadii[i] = r;
      this.dustAngles[i] = a;
      this.dustSpeeds[i] = speed;
      this.dustHeights[i] = h;

      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * (r * 0.65);
      const depthFactor = Math.max(0, 1.0 - (r / 2.7));
      pos[i * 3 + 2] = h - depthFactor * depthFactor * 0.75;

      let c: THREE.Color;
      if (r < 1.5) {
        c = Math.random() < 0.5 ? white : cyan;
      } else if (r < 2.6) {
        c = Math.random() < 0.5 ? cyan : electricBlue;
      } else if (r < 3.3) {
        c = Math.random() < 0.6 ? violet : electricBlue;
      } else {
        c = Math.random() < 0.4 ? gold : violet;
      }

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.dustPositions = pos;

    const mat = new THREE.PointsMaterial({
      size: 0.065,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.group.add(this.dustPoints);
  }

  update(time: number, dt: number, mouse: THREE.Vector2): void {

    this.mainVortexMesh.rotation.z = time * 0.14;


    this.innerSwirlMesh.rotation.z = -time * 0.09;
    (this.innerSwirlMesh.material as THREE.MeshBasicMaterial).opacity =
      0.32 + Math.sin(time * 1.6) * 0.08;


    const pulse = 1.0 + Math.sin(time * 2.5) * 0.06;
    this.photonRing.scale.setScalar(pulse);


    const pos = this.dustPositions;
    const count = this.dustRadii.length;

    for (let i = 0; i < count; i++) {
      this.dustAngles[i] += this.dustSpeeds[i] * dt * 0.85;
      this.dustRadii[i] -= dt * 0.05;


      if (this.dustRadii[i] < 1.06) {
        this.dustRadii[i] = 3.8 + Math.random() * 0.5;
      }

      const r = this.dustRadii[i];
      const a = this.dustAngles[i];
      const h = this.dustHeights[i];

      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * (r * 0.65);
      const depthFactor = Math.max(0, 1.0 - (r / 2.7));
      pos[i * 3 + 2] = h - depthFactor * depthFactor * 0.75;
    }
    this.dustPoints.geometry.attributes['position'].needsUpdate = true;


    const targetRotX = this.baseTiltX - mouse.y * 0.18;
    const targetRotY = this.baseTiltY + mouse.x * 0.26;
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.06;
    this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.06;
  }
}
