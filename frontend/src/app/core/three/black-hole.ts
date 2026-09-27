import * as THREE from 'three';
import { dotSprite } from './materials';

const blackHoleVertexShader =  `
  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const blackHoleFragmentShader =  `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uInnerR;
  uniform float uOuterR;
  varying vec2 vUv;
  varying vec3 vLocalPos;

  void main() {
    float r = length(vLocalPos.xy);


    float alphaInner = smoothstep(uInnerR, uInnerR + 0.35, r);


    float alphaOuter = smoothstep(uOuterR, uOuterR - 2.4, r);


    float uvDist = length(vUv - vec2(0.5));
    float uvMask = smoothstep(0.48, 0.28, uvDist);

    float alpha = alphaInner * alphaOuter * uvMask;

    if (alpha <= 0.001) {
      discard;
    }


    vec4 tex = texture2D(uTexture, clamp(vUv, 0.001, 0.999));


    float swirlAngle = atan(vLocalPos.y, vLocalPos.x);
    float wave = sin(r * 3.4 - uTime * 2.5 + swirlAngle * 2.0) * 0.09 + cos(vLocalPos.x * 1.6 + uTime * 1.8) * 0.06;


    vec3 color = tex.rgb * (1.0 + wave);


    vec3 electricCyan = vec3(0.08, 0.65, 0.98);
    vec3 deepViolet = vec3(0.55, 0.18, 0.95);
    float energyBand = pow(clamp(1.0 - (r - uInnerR) / (uOuterR * 0.68), 0.0, 1.0), 1.8);

    color += mix(electricCyan, deepViolet, 0.5 + 0.5 * sin(swirlAngle * 3.0 + uTime)) * energyBand * 0.52;

    gl_FragColor = vec4(color * 1.28, alpha * tex.a);
  }
`;

export class CosmicBlackHole {
  readonly group = new THREE.Group();
  private vortexMesh!: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private coreVoidMesh!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private photonRingMesh!: THREE.Mesh<THREE.RingGeometry, THREE.ShaderMaterial>;
  private haloMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private dustPoints!: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;

  private dustAngles!: Float32Array;
  private dustRadii!: Float32Array;
  private dustSpeeds!: Float32Array;
  private dustHeights!: Float32Array;


  readonly tiltEuler = new THREE.Euler(-1.08, 0.18, -0.38, 'XYZ');

  readonly innerR = 0.85;
  readonly outerR = 8.8;

  constructor(private lowPower: boolean) {
    this.build3DFunnel();
    this.buildPhotonRing();
    this.buildAtmosphericHalo();
    this.buildCore();
    this.buildAccretionDust();
    this.group.rotation.copy(this.tiltEuler);
  }

  private build3DFunnel(): void {
    const texLoader = new THREE.TextureLoader();
    const bhTexture = texLoader.load('/images/blackhole.png');
    bhTexture.colorSpace = THREE.SRGBColorSpace;
    bhTexture.wrapS = THREE.ClampToEdgeWrapping;
    bhTexture.wrapT = THREE.ClampToEdgeWrapping;


    const rings = 54;
    const segments = 128;
    const vertexCount = (rings + 1) * (segments + 1);

    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices: number[] = [];

    let vIdx = 0;
    let uvIdx = 0;

    for (let i = 0; i <= rings; i++) {
      const t = i / rings;

      const r = this.innerR + Math.pow(t, 1.1) * (this.outerR - this.innerR);

      const z = -1.55 * Math.exp(-r * 0.38);

      for (let j = 0; j <= segments; j++) {
        const u = j / segments;
        const angle = u * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        positions[vIdx * 3] = x;
        positions[vIdx * 3 + 1] = y;
        positions[vIdx * 3 + 2] = z;


        uvs[uvIdx * 2] = (x / this.outerR) * 0.46 + 0.5;
        uvs[uvIdx * 2 + 1] = (y / this.outerR) * 0.46 + 0.5;

        vIdx++;
        uvIdx++;
      }
    }

    const stride = segments + 1;
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * stride + j;
        const b = a + stride;
        const c = a + 1;
        const d = b + 1;
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: bhTexture },
        uTime: { value: 0 },
        uInnerR: { value: this.innerR },
        uOuterR: { value: this.outerR }
      },
      vertexShader: blackHoleVertexShader,
      fragmentShader: blackHoleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.vortexMesh = new THREE.Mesh(geo, mat);
    this.group.add(this.vortexMesh);
  }

  private buildPhotonRing(): void {

    const ringGeo = new THREE.RingGeometry(this.innerR * 1.01, this.innerR * 1.25, 128);
    const ringMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vPos;
        void main() {
          vPos = position.xy;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vPos;
        void main() {
          float r = length(vPos);
          float pulse = 0.85 + 0.15 * sin(uTime * 3.5);
          float a = smoothstep(0.85, 0.98, r) * smoothstep(1.08, 0.98, r);
          vec3 col = mix(vec3(0.25, 0.85, 1.0), vec3(0.8, 0.45, 1.0), 0.5 + 0.5 * sin(uTime * 1.8));
          gl_FragColor = vec4(col * pulse * 2.2, a * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.photonRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.photonRingMesh.position.set(0, 0, -0.45);
    this.group.add(this.photonRingMesh);
  }

  private buildAtmosphericHalo(): void {

    const haloGeo = new THREE.PlaneGeometry(this.outerR * 2.3, this.outerR * 2.3);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - vec2(0.5));
          if (d > 0.5) discard;
          float pulse = 0.92 + 0.08 * sin(uTime * 1.2);
          float a = smoothstep(0.5, 0.08, d) * 0.32 * pulse;
          vec3 col = mix(vec3(0.12, 0.42, 0.95), vec3(0.62, 0.22, 0.95), d * 2.0);
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.position.set(0, 0, -1.8);
    this.group.add(this.haloMesh);
  }

  private buildCore(): void {

    const voidGeo = new THREE.SphereGeometry(this.innerR * 0.98, 48, 36);
    const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.coreVoidMesh = new THREE.Mesh(voidGeo, voidMat);
    this.coreVoidMesh.position.set(0, 0, -0.72);
    this.coreVoidMesh.renderOrder = 3;
    this.group.add(this.coreVoidMesh);
  }

  private buildAccretionDust(): void {
    const count = this.lowPower ? 1200 : 3200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    this.dustAngles = new Float32Array(count);
    this.dustRadii = new Float32Array(count);
    this.dustSpeeds = new Float32Array(count);
    this.dustHeights = new Float32Array(count);

    const cyan = new THREE.Color('#38BDF8');
    const electricBlue = new THREE.Color('#60A5FA');
    const violet = new THREE.Color('#C084FC');
    const purple = new THREE.Color('#9333EA');
    const white = new THREE.Color('#FFFFFF');
    const gold = new THREE.Color('#F5C86A');

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const r = 1.15 + Math.pow(t, 0.85) * 7.5;
      const a = Math.random() * Math.PI * 2;

      const speed = (0.65 + Math.random() * 0.5) / (Math.pow(r, 0.5) + 0.1);
      const h = (Math.random() - 0.5) * 0.38;

      this.dustRadii[i] = r;
      this.dustAngles[i] = a;
      this.dustSpeeds[i] = speed;
      this.dustHeights[i] = h;

      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = h - 1.55 * Math.exp(-r * 0.38);

      let c: THREE.Color;
      if (r < 2.5) {
        c = Math.random() < 0.4 ? white : cyan;
      } else if (r < 4.8) {
        c = Math.random() < 0.45 ? cyan : electricBlue;
      } else if (r < 6.8) {
        c = Math.random() < 0.5 ? violet : purple;
      } else {
        c = Math.random() < 0.25 ? gold : violet;
      }
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      map: dotSprite(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.group.add(this.dustPoints);
  }

  update(time: number, dt: number): void {

    this.vortexMesh.rotation.z += dt * 0.16;


    this.vortexMesh.material.uniforms['uTime'].value = time;
    this.photonRingMesh.material.uniforms['uTime'].value = time;
    this.haloMesh.material.uniforms['uTime'].value = time;


    const pos = (this.dustPoints.geometry.attributes['position'] as THREE.BufferAttribute).array as Float32Array;
    const count = this.dustRadii.length;

    for (let i = 0; i < count; i++) {
      this.dustAngles[i] += this.dustSpeeds[i] * dt * 0.85;
      this.dustRadii[i] -= dt * 0.06;
      if (this.dustRadii[i] < 1.15) {
        this.dustRadii[i] = 7.6 + Math.random() * 1.0;
      }

      const r = this.dustRadii[i];
      const a = this.dustAngles[i];
      const h = this.dustHeights[i];

      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = h - 1.55 * Math.exp(-r * 0.38);
    }
    this.dustPoints.geometry.attributes['position'].needsUpdate = true;
  }


  getOrbitPosition(angle: number, radius = 5.2, out = new THREE.Vector3()): THREE.Vector3 {
    const local = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      -1.55 * Math.exp(-radius * 0.38)
    );
    local.applyEuler(this.tiltEuler);
    out.copy(local);
    return out;
  }
}
