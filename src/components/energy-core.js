import * as THREE from 'three';
import gsap from 'gsap';
import { pointer } from './pointer.js';

/**
 * Touch Energy Core — a fluid neon sphere floating between the fingertips.
 * - simplex-noise vertex displacement (constantly "breathing")
 * - bulges towards the cursor when it comes close
 * - shockwave pulse on click
 * - glides between per-section keyframes while scrolling
 */

const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

const VERT = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
uniform float uHover;
uniform float uPulseT;
uniform vec3 uMouseDir;
uniform vec3 uPulseDir;
varying float vDisp;
varying float vRing;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vec3 nPos = normalize(position);
  float n  = snoise(nPos * 1.6 + uTime * 0.32);
  float n2 = snoise(nPos * 3.6 - uTime * 0.5) * 0.4;
  float disp = (n + n2) * 0.22;

  float mProx = smoothstep(1.25, 0.0, distance(nPos, uMouseDir));
  disp += mProx * uHover * (0.3 + 0.1 * sin(uTime * 6.0));

  float pd = distance(nPos, uPulseDir);
  float ringDist = pd - uPulseT * 2.3;
  float ring = exp(-ringDist * ringDist * 26.0) * (1.0 - smoothstep(0.0, 1.0, uPulseT));
  disp += ring * 0.5;

  vDisp = disp;
  vRing = ring;
  vec3 newPos = position + normal * disp;
  vec4 mv = modelViewMatrix * vec4(newPos, 1.0);
  vNormal = normalMatrix * normal;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform float uHover;
varying float vDisp;
varying float vRing;
varying vec3 vNormal;
varying vec3 vView;
vec3 pal(float t){
  vec3 c1 = vec3(1.000, 0.894, 0.360); // FFE45C
  vec3 c2 = vec3(1.000, 0.239, 0.604); // FF3D9A
  vec3 c3 = vec3(0.706, 0.298, 1.000); // B44CFF
  vec3 c4 = vec3(0.239, 0.784, 1.000); // 3DC8FF
  t = clamp(t, 0.0, 1.0);
  if (t < 0.34) return mix(c1, c2, t / 0.34);
  if (t < 0.67) return mix(c2, c3, (t - 0.34) / 0.33);
  return mix(c3, c4, (t - 0.67) / 0.33);
}
void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 col = pal(vDisp * 1.7 + 0.42 + fres * 0.22);
  col += fres * vec3(1.0, 0.45, 0.85) * 0.85;
  col += vRing * vec3(1.0);
  col += uHover * 0.12;
  gl_FragColor = vec4(col, 1.0);
}`;

const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLOW_FRAG = /* glsl */ `
uniform float uHover;
uniform float uFlash;
varying vec2 vUv;
void main(){
  float d = distance(vUv, vec2(0.5)) * 2.0;
  float a = exp(-d * d * 5.0) * (0.42 + uHover * 0.3 + uFlash * 0.9);
  vec3 col = mix(vec3(1.0, 0.30, 0.62), vec3(1.0, 0.89, 0.36), clamp(d * 1.3, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a);
}`;

export function initEnergyCore(canvas) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const FOV = 35;
  const CAM_Z = 8;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 30);
  camera.position.z = CAM_Z;
  // matrixWorldInverse is otherwise only computed inside render(); without this,
  // the first-frame project() divides by w=0 and poisons uHover with NaN
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  const group = new THREE.Group();
  scene.add(group);

  const uniforms = {
    uTime: { value: 0 },
    uHover: { value: 0 },
    uPulseT: { value: 1 },
    uMouseDir: { value: new THREE.Vector3(0, 0, 1) },
    uPulseDir: { value: new THREE.Vector3(0, 0, 1) },
  };

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, coarse ? 20 : 32),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG })
  );
  group.add(blob);

  const glowUniforms = { uHover: uniforms.uHover, uFlash: { value: 0 } };
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.ShaderMaterial({
      uniforms: glowUniforms,
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.position.z = -1.4;
  group.add(glow);

  // orbiting dust shell
  const COUNT = coarse ? 140 : 260;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 1.5 + Math.random() * 0.9;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffd1ec,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(dust);

  /* ---------- placement state ---------- */
  // key = position as viewport fractions (-1..1) + scale; world recomputed on resize
  const state = {
    key: { nx: 0.42, ny: 0.04, s: 1 },
    target: { x: 0, y: 0, s: 0 }, // tweened
    cur: { x: 0, y: 0, s: 0 },    // lerped each frame
    boost: 0,
    introDone: false,
  };

  let aspect = 1;
  let halfW = 1;
  let halfH = 1;

  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    renderer.setSize(vw, vh);
    aspect = vw / vh;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    halfW = halfH * aspect;
    applyKey(state.key, true);
  }

  function applyKey(key, immediate = false) {
    state.key = key;
    const wx = key.nx * halfW;
    const wy = key.ny * halfH;
    if (immediate) {
      state.target.x = wx;
      state.target.y = wy;
      state.target.s = state.introDone ? key.s : 0;
    } else {
      gsap.to(state.target, { x: wx, y: wy, s: key.s, duration: 1.4, ease: 'expo.out', overwrite: 'auto' });
    }
  }

  resize();
  window.addEventListener('resize', resize);

  /* ---------- pulse on click ---------- */
  function pulse() {
    uniforms.uPulseDir.value.copy(uniforms.uMouseDir.value);
    gsap.fromTo(uniforms.uPulseT, { value: 0 }, { value: 1, duration: 1.3, ease: 'power2.out' });
    gsap.fromTo(glowUniforms.uFlash, { value: 1 }, { value: 0, duration: 0.9, ease: 'power2.out' });
    gsap.fromTo(state.cur, { s: state.cur.s * 1.18 }, { s: state.target.s, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
  }

  window.addEventListener('click', () => {
    if (uniforms.uHover.value > 0.22 && !document.body.hasAttribute('data-loading')) pulse();
  });

  const screenPos = new THREE.Vector3();

  return {
    /** introspection for tests / debugging */
    debug() {
      // pick fields explicitly: gsap attaches a circular _gsap cache to tweened objects
      return {
        cur: { x: state.cur.x, y: state.cur.y, s: state.cur.s },
        target: { x: state.target.x, y: state.target.y, s: state.target.s },
        key: { nx: state.key.nx, ny: state.key.ny, s: state.key.s },
        introDone: state.introDone,
        hover: uniforms.uHover.value,
        drawCalls: renderer.info.render.calls,
        frame: renderer.info.render.frame,
      };
    },

    /** loader step 5 — pop the core into existence */
    intro(immediate = false) {
      state.introDone = true;
      if (immediate) {
        state.target.s = state.key.s;
        state.cur.s = state.key.s;
        return;
      }
      gsap.to(state.target, { s: state.key.s, duration: 1.3, ease: 'elastic.out(1, 0.45)' });
    },

    /** move to a section keyframe ({nx, ny, s}) */
    setKey(key) {
      applyKey(key);
    },

    /** external glow boost (CTA hover) */
    boost(v) {
      state.boost = v;
    },

    pulse,

    update(t, dtMs) {
      const dt = Math.min(dtMs, 50) / 16.7;
      uniforms.uTime.value = t;

      // proximity hover: cursor distance to projected core centre
      screenPos.set(state.cur.x, state.cur.y, 0).project(camera);
      const sx = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      const dist = Math.hypot(pointer.x - sx, pointer.y - sy);
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.32 * Math.max(state.cur.s, 0.4);
      const prox = Number.isFinite(dist) ? Math.max(0, 1 - dist / radius) : 0;
      const hoverTarget = Math.max(prox, state.boost);
      if (!Number.isFinite(uniforms.uHover.value)) uniforms.uHover.value = 0;
      uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.07 * dt;

      // direction of the bulge: from core centre towards the cursor
      const mx = pointer.nx * halfW - state.cur.x;
      const my = -pointer.ny * halfH - state.cur.y;
      uniforms.uMouseDir.value.set(mx, my, 0.7).normalize();

      // glide towards target
      const k = 1 - Math.pow(0.94, dt);
      state.cur.x += (state.target.x - state.cur.x) * k;
      state.cur.y += (state.target.y - state.cur.y) * k;
      state.cur.s += (state.target.s - state.cur.s) * k;

      group.position.set(state.cur.x, state.cur.y, 0);
      const breathe = 1 + Math.sin(t * 1.4) * 0.02 + uniforms.uHover.value * 0.06;
      const s = Math.max(state.cur.s * breathe, 0.0001);
      group.scale.setScalar(s);

      blob.rotation.y = t * 0.12;
      blob.rotation.x = Math.sin(t * 0.2) * 0.25;
      dust.rotation.y = t * 0.05;
      dust.rotation.z = t * 0.03;

      renderer.render(scene, camera);
    },
  };
}
