import * as THREE from 'three';
import { dotSprite } from './materials';

export class HeroGoku {
  readonly group = new THREE.Group();
  private gokuMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private waveArm!: THREE.Group;
  private handMesh!: THREE.Mesh;
  private kiParticles!: THREE.Points;
  private punchFlashes!: THREE.Points;
  private flashPositions!: Float32Array;

  private punchTimer = 0;
  private isWaving = false;

  constructor(private lowPower: boolean) {
    this.buildGokuBody();
    this.buildWavingArm();
    this.buildKiAura();
    this.buildPunchEffects();


    this.group.position.set(3.8, -0.2, 0);
  }

  private buildGokuBody(): void {
    const texLoader = new THREE.TextureLoader();
    const gokuTex = texLoader.load('/images/goku-hero.png');
    gokuTex.colorSpace = THREE.SRGBColorSpace;


    const h = 8.6;
    const w = h * (648.0 / 1024.0);

    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      map: gokuTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide
    });

    this.gokuMesh = new THREE.Mesh(geo, mat);
    this.group.add(this.gokuMesh);
  }

  private buildWavingArm(): void {
    this.waveArm = new THREE.Group();

    this.waveArm.position.set(-0.8, 1.9, 0.15);


    const upperArmGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.1, 16);
    const giMat = new THREE.MeshBasicMaterial({ color: 0xF97316 });
    const upperArm = new THREE.Mesh(upperArmGeo, giMat);
    upperArm.position.set(0, 0.5, 0);


    const bandGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.35, 16);
    const bandMat = new THREE.MeshBasicMaterial({ color: 0x6B1515 });
    const wristband = new THREE.Mesh(bandGeo, bandMat);
    wristband.position.set(0, 1.1, 0);


    const handGroup = new THREE.Group();
    handGroup.position.set(0, 1.35, 0);

    const palmGeo = new THREE.BoxGeometry(0.42, 0.45, 0.14);
    const skinMat = new THREE.MeshBasicMaterial({ color: 0xFED7AA });
    const palm = new THREE.Mesh(palmGeo, skinMat);
    handGroup.add(palm);


    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.BoxGeometry(0.08, 0.32, 0.09);
      const finger = new THREE.Mesh(fingerGeo, skinMat);
      finger.position.set(-0.14 + f * 0.095, 0.35, 0);
      finger.rotation.z = (-0.15 + f * 0.1);
      handGroup.add(finger);
    }

    const thumbGeo = new THREE.BoxGeometry(0.1, 0.25, 0.1);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-0.25, 0.12, 0);
    thumb.rotation.z = -0.6;
    handGroup.add(thumb);

    this.handMesh = palm;
    this.waveArm.add(upperArm, wristband, handGroup);
    this.waveArm.scale.setScalar(0.001);
    this.waveArm.visible = false;

    this.group.add(this.waveArm);
  }

  private buildKiAura(): void {
    const count = this.lowPower ? 120 : 320;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const gold = new THREE.Color('#FACC15');
    const cyan = new THREE.Color('#38BDF8');
    const white = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      const c = Math.random() < 0.6 ? gold : Math.random() < 0.85 ? cyan : white;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.kiParticles = new THREE.Points(geo, mat);
    this.group.add(this.kiParticles);
  }

  private buildPunchEffects(): void {
    const count = 30;
    this.flashPositions = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.flashPositions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.28,
      map: dotSprite(),
      color: 0x67E8F9,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.punchFlashes = new THREE.Points(geo, mat);
    this.group.add(this.punchFlashes);
  }

  update(time: number, dt: number, sceneT: number, mouse: THREE.Vector2): void {
    const isWaving = sceneT > 0.06;
    this.isWaving = isWaving;

    if (!isWaving) {



      this.punchTimer += dt * 3.8;


      const footBounce = Math.abs(Math.sin(this.punchTimer * 2.2)) * 0.15;
      this.gokuMesh.position.y = footBounce;


      const cycle = this.punchTimer % (Math.PI * 2);
      const isLeftJab = cycle < Math.PI * 0.8;
      const isRightCross = cycle >= Math.PI && cycle < Math.PI * 1.8;

      let lungeZ = 0;
      let torsoYaw = 0;

      if (isLeftJab) {

        const jabP = Math.sin(cycle / 0.8);
        lungeZ = jabP * 0.42;
        torsoYaw = jabP * 0.18;
      } else if (isRightCross) {

        const crossP = Math.sin((cycle - Math.PI) / 0.8);
        lungeZ = crossP * 0.55;
        torsoYaw = -crossP * 0.24;
      } else {

        torsoYaw = Math.sin(cycle * 3.0) * 0.12;
      }

      this.gokuMesh.position.z = lungeZ;
      this.gokuMesh.rotation.y = torsoYaw;
      this.gokuMesh.rotation.z = Math.sin(this.punchTimer * 1.6) * 0.05;


      (this.punchFlashes.material as THREE.PointsMaterial).opacity = Math.max(0, lungeZ * 1.8);
      if (lungeZ > 0.2) {
        const arr = this.flashPositions;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3] = (isLeftJab ? -0.8 : 0.4) + (Math.random() - 0.5) * 0.6;
          arr[i * 3 + 1] = 0.8 + (Math.random() - 0.5) * 0.6;
          arr[i * 3 + 2] = lungeZ + 0.3 + (Math.random() - 0.5) * 0.4;
        }
        this.punchFlashes.geometry.attributes['position'].needsUpdate = true;
      }


      this.waveArm.visible = false;
      this.waveArm.scale.setScalar(0.001);

    } else {



      const waveProgress = Math.min(1, (sceneT - 0.06) / 0.25);


      this.gokuMesh.position.z = 0;
      this.gokuMesh.position.y = Math.sin(time * 2.5) * 0.06;
      this.gokuMesh.rotation.y = -0.15;
      this.gokuMesh.rotation.z = -0.04;


      this.waveArm.visible = true;
      const s = THREE.MathUtils.lerp(0.001, 1.0, waveProgress);
      this.waveArm.scale.setScalar(s);


      const waveAngle = Math.sin(time * 10.5) * 0.45;
      this.waveArm.rotation.z = 0.45 + waveAngle;
      this.waveArm.rotation.x = Math.cos(time * 5.0) * 0.12;


      this.gokuMesh.rotation.x = Math.sin(time * 4.0) * 0.05;


      (this.punchFlashes.material as THREE.PointsMaterial).opacity = 0;
    }




    const pArr = (this.kiParticles.geometry.attributes['position'] as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < pArr.length / 3; i++) {
      pArr[i * 3 + 1] += dt * (2.8 + (i % 5) * 0.5);
      if (pArr[i * 3 + 1] > 4.5) {
        pArr[i * 3 + 1] = -4.2;
        pArr[i * 3] = (Math.random() - 0.5) * 3.8;
      }
    }
    this.kiParticles.geometry.attributes['position'].needsUpdate = true;




    if (sceneT < 1.0) {

      this.group.visible = true;
      this.group.position.x = THREE.MathUtils.lerp(3.8, 4.4, THREE.MathUtils.clamp((sceneT), 0, 1));
      this.group.rotation.y = mouse.x * 0.18;
      this.group.rotation.x = -mouse.y * 0.12;


      if (sceneT > 0.75) {
        const flyK = (sceneT - 0.75) / 0.35;
        this.group.position.y = -0.2 + flyK * 8.0;
        this.gokuMesh.scale.setScalar(Math.max(0.001, 1.0 - flyK * 0.8));
      } else {
        this.gokuMesh.scale.setScalar(1.0);
      }
    } else {

      this.group.visible = false;
    }
  }
}
