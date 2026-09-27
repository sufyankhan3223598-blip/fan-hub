import * as THREE from 'three';
import { dotSprite } from './materials';

export class AnimeGoku {
  readonly group = new THREE.Group();

  private bodyMesh!: THREE.Mesh;
  private punchArmLeft!: THREE.Group;
  private punchArmRight!: THREE.Group;
  private kiParticles!: THREE.Points;
  private kiPositions!: Float32Array;
  private kiVelocities!: Float32Array;
  private punchFlashes!: THREE.Points;
  private flashPositions!: Float32Array;
  private impactRing!: THREE.Mesh;

  private punchPhase = 0;
  private comboBurst = 0;
  private leftPunchProgress = 0;
  private rightPunchProgress = 0;

  constructor(private lowPower: boolean) {
    this.buildGokuBody();
    this.buildBoxingFists();
    this.buildKiAura();
    this.buildPunchEffects();



    this.group.position.set(2.8, -1.95, 0);
  }

  private buildGokuBody(): void {
    const texLoader = new THREE.TextureLoader();
    const gokuTex = texLoader.load('/images/goku-anime.png');
    gokuTex.colorSpace = THREE.SRGBColorSpace;
    gokuTex.anisotropy = 4;


    const height = 3.35;
    const width = height * (410.0 / 795.0);

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshStandardMaterial({
      map: gokuTex,
      transparent: true,
      alphaTest: 0.06,
      side: THREE.DoubleSide,
      roughness: 0.45,
      metalness: 0.15,
      emissive: new THREE.Color('#381810'),
      emissiveIntensity: 0.22
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);

    this.bodyMesh.position.set(0, height / 2, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);
  }

  private buildBoxingFists(): void {

    this.punchArmLeft = new THREE.Group();
    this.punchArmLeft.position.set(-0.35, 1.85, 0.25);

    const wristGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.28, 12);
    wristGeo.rotateX(Math.PI / 2);
    const wristMat = new THREE.MeshBasicMaterial({ color: 0x1E3A8A });
    const leftWrist = new THREE.Mesh(wristGeo, wristMat);

    const fistGeo = new THREE.BoxGeometry(0.24, 0.26, 0.28);
    const fistMat = new THREE.MeshBasicMaterial({ color: 0xFED7AA });
    const leftFist = new THREE.Mesh(fistGeo, fistMat);
    leftFist.position.set(0, 0, 0.22);

    this.punchArmLeft.add(leftWrist, leftFist);
    this.punchArmLeft.scale.setScalar(0.001);


    this.punchArmRight = new THREE.Group();
    this.punchArmRight.position.set(0.38, 1.78, 0.22);

    const rightWrist = new THREE.Mesh(wristGeo, wristMat);
    const rightFist = new THREE.Mesh(fistGeo, fistMat);
    rightFist.position.set(0, 0, 0.24);

    this.punchArmRight.add(rightWrist, rightFist);
    this.punchArmRight.scale.setScalar(0.001);

    this.group.add(this.punchArmLeft, this.punchArmRight);
  }

  private buildKiAura(): void {
    const count = this.lowPower ? 45 : 110;
    this.kiPositions = new Float32Array(count * 3);
    this.kiVelocities = new Float32Array(count);

    const colors = new Float32Array(count * 3);
    const goldCol = new THREE.Color(0xF5C86A);
    const cyanCol = new THREE.Color(0x38BDF8);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.9;
      this.kiPositions[i * 3] = Math.cos(angle) * radius;
      this.kiPositions[i * 3 + 1] = Math.random() * 3.4;
      this.kiPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
      this.kiVelocities[i] = 1.2 + Math.random() * 2.2;

      const c = Math.random() < 0.65 ? goldCol : cyanCol;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.kiPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.kiParticles = new THREE.Points(geo, mat);
    this.group.add(this.kiParticles);
  }

  private buildPunchEffects(): void {

    const ringGeo = new THREE.RingGeometry(0.1, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFCD34D,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.impactRing = new THREE.Mesh(ringGeo, ringMat);
    this.impactRing.position.set(0, 1.8, 0.6);
    this.group.add(this.impactRing);


    const flashCount = 18;
    this.flashPositions = new Float32Array(flashCount * 3);
    for (let i = 0; i < flashCount; i++) {
      this.flashPositions[i * 3] = (Math.random() - 0.5) * 0.4;
      this.flashPositions[i * 3 + 1] = 1.8 + (Math.random() - 0.5) * 0.4;
      this.flashPositions[i * 3 + 2] = 0.5 + Math.random() * 0.3;
    }

    const flashGeo = new THREE.BufferGeometry();
    flashGeo.setAttribute('position', new THREE.BufferAttribute(this.flashPositions, 3));

    const flashMat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0xFFE066,
      map: dotSprite(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.punchFlashes = new THREE.Points(flashGeo, flashMat);
    this.group.add(this.punchFlashes);
  }


  triggerFlurry(): void {
    this.comboBurst = 1.5;
  }


  update(time: number, dt: number, mouse: THREE.Vector2, localScene: number, active: boolean): void {
    if (!active) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;


    const enter = Math.min(1, Math.max(0, (localScene - 0.12) / 0.25));
    const exit = Math.min(1, Math.max(0, (localScene - 0.78) / 0.2));


    const baseX = 2.8 + mouse.x * 0.25;
    const baseY = -1.95;
    this.group.position.set(baseX, baseY, 0);


    const bodyMat = this.bodyMesh.material as THREE.MeshStandardMaterial;
    bodyMat.opacity = 1 - exit;




    this.punchPhase += dt * (3.8 + this.comboBurst * 4.5);
    if (this.comboBurst > 0) this.comboBurst = Math.max(0, this.comboBurst - dt);


    const bounce = Math.sin(time * 5.8) * 0.055;
    const sway = Math.cos(time * 2.9) * 0.045;
    const torsoTilt = Math.sin(time * 2.9) * 0.035;

    this.bodyMesh.position.y = 3.35 / 2 + bounce;
    this.bodyMesh.position.x = sway;
    this.bodyMesh.rotation.z = torsoTilt;


    const targetYaw = -0.38 + Math.sin(time * 2.9) * 0.08 + mouse.x * 0.35;
    this.group.rotation.y = targetYaw;


    const cycle = (this.punchPhase % 4.0);

    if (cycle < 1.4) {

      const p = Math.sin((cycle / 1.4) * Math.PI);
      this.leftPunchProgress = Math.pow(p, 0.65);
      this.rightPunchProgress = 0;


      this.bodyMesh.position.z = -this.leftPunchProgress * 0.08;
      this.bodyMesh.rotation.y = this.leftPunchProgress * 0.14;


      this.punchArmLeft.scale.setScalar(0.95);
      this.punchArmLeft.position.set(-0.32 + sway, 1.85 + bounce, 0.25 + this.leftPunchProgress * 0.65);
      this.punchArmRight.scale.setScalar(0.001);


      if (this.leftPunchProgress > 0.88) {
        this.impactRing.position.set(-0.32 + sway, 1.85 + bounce, 0.95);
        this.impactRing.scale.setScalar(0.4 + (this.leftPunchProgress - 0.88) * 4.0);
        (this.impactRing.material as THREE.MeshBasicMaterial).opacity = (1.0 - this.leftPunchProgress) * 5.0;
        (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0.9;
      } else {
        (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
        (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0;
      }
    } else if (cycle < 2.0) {

      this.leftPunchProgress = 0;
      this.rightPunchProgress = 0;
      this.punchArmLeft.scale.setScalar(0.001);
      this.punchArmRight.scale.setScalar(0.001);
      (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0;
      this.bodyMesh.position.z = 0;
      this.bodyMesh.rotation.y = 0;
    } else if (cycle < 3.4) {

      const p = Math.sin(((cycle - 2.0) / 1.4) * Math.PI);
      this.rightPunchProgress = Math.pow(p, 0.65);
      this.leftPunchProgress = 0;


      this.bodyMesh.position.z = -this.rightPunchProgress * 0.1;
      this.bodyMesh.rotation.y = -this.rightPunchProgress * 0.18;


      this.punchArmRight.scale.setScalar(0.95);
      this.punchArmRight.position.set(0.35 + sway, 1.78 + bounce, 0.22 + this.rightPunchProgress * 0.72);
      this.punchArmLeft.scale.setScalar(0.001);


      if (this.rightPunchProgress > 0.88) {
        this.impactRing.position.set(0.35 + sway, 1.78 + bounce, 1.0);
        this.impactRing.scale.setScalar(0.45 + (this.rightPunchProgress - 0.88) * 4.2);
        (this.impactRing.material as THREE.MeshBasicMaterial).opacity = (1.0 - this.rightPunchProgress) * 5.0;
        (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0.95;
      } else {
        (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
        (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0;
      }
    } else {

      this.leftPunchProgress = 0;
      this.rightPunchProgress = 0;
      this.punchArmLeft.scale.setScalar(0.001);
      this.punchArmRight.scale.setScalar(0.001);
      (this.impactRing.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0;
    }




    const arr = this.kiParticles.geometry.attributes['position'] as THREE.BufferAttribute;
    const count = arr.count;
    for (let i = 0; i < count; i++) {
      let py = this.kiPositions[i * 3 + 1] + this.kiVelocities[i] * dt * 1.5;
      if (py > 3.6) {
        py = 0.05 + Math.random() * 0.4;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.25 + Math.random() * 0.8;
        this.kiPositions[i * 3] = Math.cos(angle) * radius;
        this.kiPositions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
      }
      this.kiPositions[i * 3 + 1] = py;


      this.kiPositions[i * 3] += Math.sin(time * 4.0 + i) * 0.006;
    }
    arr.needsUpdate = true;
  }

  dispose(): void {
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.kiParticles.geometry.dispose();
    (this.kiParticles.material as THREE.Material).dispose();
    this.impactRing.geometry.dispose();
    (this.impactRing.material as THREE.Material).dispose();
    this.punchFlashes.geometry.dispose();
    (this.punchFlashes.material as THREE.Material).dispose();
  }
}
