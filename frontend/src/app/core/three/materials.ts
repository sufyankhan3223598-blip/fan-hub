import * as THREE from 'three';

export function hologram(accent: string, opts: { base?: string; metalness?: number; roughness?: number; rim?: number } = {}): THREE.MeshStandardMaterial {
  const color = new THREE.Color(accent);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(opts.base ?? '#1a1a26').lerp(color, 0.18),
    metalness: opts.metalness ?? 0.65,
    roughness: opts.roughness ?? 0.32,
    emissive: color.clone().multiplyScalar(0.12),
    transparent: true,
    opacity: 1
  });
  const rimStrength = opts.rim ?? 1.6;
  mat.onBeforeCompile = shader => {
    shader.uniforms['uRim'] = { value: color };
    shader.uniforms['uRimStrength'] = { value: rimStrength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;\nuniform float uRimStrength;')
      .replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), -normal) * -1.0, 0.0, 1.0), 2.4);
         totalEmissiveRadiance += uRim * fres * uRimStrength;`);
  };
  mat.customProgramCacheKey = () => 'holo-' + accent + rimStrength;
  return mat;
}

export function glow(color: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: opacity < 1, opacity, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacity >= 1 });
}

export function metal(color: string, metalness = 0.9, roughness = 0.25, emissive = 0): THREE.MeshStandardMaterial {
  const c = new THREE.Color(color);
  return new THREE.MeshStandardMaterial({ color: c, metalness, roughness, emissive: c.clone().multiplyScalar(emissive) });
}

const coreVertex =  `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const coreFragment =  `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vView;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    float n = noise(vPos * 2.2 + vec3(0.0, uTime * 0.6, uTime * 0.3));
    n += 0.5 * noise(vPos * 5.0 - vec3(uTime * 0.8));
    float swirl = sin(atan(vPos.y, vPos.x) * 6.0 + uTime * 2.0 + n * 4.0) * 0.5 + 0.5;
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
    vec3 col = mix(uColorA, uColorB, swirl * 0.7 + n * 0.3);
    col += fres * vec3(1.0, 0.95, 0.8) * 1.4;
    gl_FragColor = vec4(col * uIntensity, 0.85 + fres * 0.15);
  }`;

export function energyCore(a = '#22D3EE', b = '#7C3AED'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColorA: { value: new THREE.Color(a) }, uColorB: { value: new THREE.Color(b) }, uIntensity: { value: 1.2 } },
    vertexShader: coreVertex,
    fragmentShader: coreFragment,
    transparent: true
  });
}

let dotTexture: THREE.Texture | null = null;
export function dotSprite(): THREE.Texture {
  if (dotTexture) return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  dotTexture.colorSpace = THREE.SRGBColorSpace;
  return dotTexture;
}

let petalTexture: THREE.Texture | null = null;
export function petalSprite(): THREE.Texture {
  if (petalTexture) return petalTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.translate(32, 32);
  g.rotate(0.6);
  const grad = g.createLinearGradient(-20, 0, 20, 0);
  grad.addColorStop(0, '#ffd1e3');
  grad.addColorStop(1, '#f472b6');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, -24);
  g.bezierCurveTo(18, -14, 16, 14, 0, 24);
  g.bezierCurveTo(-16, 14, -18, -14, 0, -24);
  g.fill();
  petalTexture = new THREE.CanvasTexture(c);
  petalTexture.colorSpace = THREE.SRGBColorSpace;
  return petalTexture;
}

export function particles(count: number, spread: THREE.Vector3, color: string, size: number, texture: THREE.Texture = dotSprite(), opacity = 0.9): THREE.Points {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: new THREE.Color(color), size, map: texture, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}
