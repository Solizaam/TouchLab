import { pointer } from './pointer.js';

/**
 * 2D canvas particle field (layer 1 of the parallax stack).
 * - drifts on layered sine noise
 * - parallaxes with the pointer, depth-weighted
 * - can be attracted towards a DOM element (CTA hover)
 */
const PALETTE = [
  [255, 255, 255],
  [255, 228, 92],
  [255, 170, 210],
  [255, 138, 61],
];

function makeSprite() {
  const s = document.createElement('canvas');
  s.width = s.height = 64;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return s;
}

export function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const sprite = makeSprite();
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let vw = 0;
  let vh = 0;
  let parts = [];
  let attract = null;

  const state = { alpha: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawn();
  }

  function spawn() {
    const target = Math.round((vw * vh) / (coarse ? 26000 : 13000));
    const count = Math.max(50, Math.min(170, target));
    parts = Array.from({ length: count }, () => {
      const depth = 0.25 + Math.random() * 0.75;
      return {
        bx: Math.random() * vw,
        by: Math.random() * vh,
        x: Math.random() * vw,
        y: Math.random() * vh,
        vx: 0,
        vy: 0,
        depth,
        r: 0.8 + depth * 2.6,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        amp: 14 + Math.random() * 40,
        sp: 0.12 + Math.random() * 0.3,
        ph: Math.random() * Math.PI * 2,
        tw: 0.6 + Math.random() * 1.8,
      };
    });
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    /** fade the field in (used by the loading sequence) */
    state,

    attractTo(el) {
      const r = el.getBoundingClientRect();
      attract = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    release() {
      attract = null;
    },

    update(t) {
      ctx.clearRect(0, 0, vw, vh);
      if (state.alpha <= 0.01) return;

      const px = pointer.lnx;
      const py = pointer.lny;

      for (const p of parts) {
        // resting position: base + sine drift + pointer parallax
        const hx = p.bx + Math.sin(t * p.sp + p.ph) * p.amp + px * 46 * p.depth;
        const hy = p.by + Math.cos(t * p.sp * 0.8 + p.ph * 1.7) * p.amp * 0.8 + py * 34 * p.depth;

        if (attract) {
          p.vx += (attract.x - p.x) * 0.0022 * p.depth;
          p.vy += (attract.y - p.y) * 0.0022 * p.depth;
          p.vx *= 0.9;
          p.vy *= 0.9;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.vx *= 0.86;
          p.vy *= 0.86;
          p.x += (hx - p.x) * 0.045 + p.vx;
          p.y += (hy - p.y) * 0.045 + p.vy;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(t * p.tw + p.ph * 3.1);
        const a = state.alpha * (0.25 + 0.6 * twinkle) * p.depth;
        const size = p.r * (attract ? 1.35 : 1) * 4;

        ctx.globalAlpha = a;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
        // tint pass for coloured particles
        if (p.c[1] !== 255) {
          ctx.globalAlpha = a * 0.5;
          ctx.fillStyle = `rgb(${p.c[0]},${p.c[1]},${p.c[2]})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
