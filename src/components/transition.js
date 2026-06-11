import gsap from 'gsap';

/**
 * Full-screen liquid transition.
 * cover():  a wobbly multi-layer blob grows from an origin point until it
 *           swallows the viewport (yellow → pink → plum).
 * reveal(): a liquid hole expands from the centre, ringed by the same
 *           colours, uncovering the new content underneath.
 */
const LAYERS = [
  { color: '#F5B82E', lag: 0.0 },
  { color: '#FF3D9A', lag: 0.1 },
  { color: '#150310', lag: 0.2 },
];

export function initTransition() {
  const canvas = document.getElementById('transition');
  const ctx = canvas.getContext('2d');
  let vw = 0;
  let vh = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function maxRadius(x, y) {
    const dx = Math.max(x, vw - x);
    const dy = Math.max(y, vh - y);
    return Math.hypot(dx, dy) * 1.18;
  }

  function blobPath(cx, cy, r, t, seed) {
    ctx.beginPath();
    const STEPS = 64;
    for (let i = 0; i <= STEPS; i++) {
      const a = (i / STEPS) * Math.PI * 2;
      const wob =
        1 +
        0.07 * Math.sin(3 * a + t * 2.3 + seed) +
        0.045 * Math.sin(5 * a - t * 1.8 + seed * 2) +
        0.03 * Math.sin(8 * a + t * 3.1);
      const rad = r * wob;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /** phase 1 — liquid floods the screen from `origin` */
  function cover(origin) {
    const R = maxRadius(origin.x, origin.y);
    const prog = { p: 0 };
    canvas.style.display = 'block';

    return new Promise((resolve) => {
      gsap.to(prog, {
        p: 1,
        duration: 0.9,
        ease: 'power3.in',
        onUpdate() {
          const t = performance.now() * 0.001;
          ctx.clearRect(0, 0, vw, vh);
          for (const layer of LAYERS) {
            const lp = gsap.utils.clamp(0, 1, (prog.p - layer.lag) / (1 - layer.lag));
            if (lp <= 0) continue;
            ctx.fillStyle = layer.color;
            blobPath(origin.x, origin.y, R * lp, t, layer.lag * 40);
            ctx.fill();
          }
        },
        onComplete() {
          ctx.fillStyle = LAYERS[LAYERS.length - 1].color;
          ctx.fillRect(0, 0, vw, vh);
          resolve();
        },
      });
    });
  }

  /** phase 2 — liquid hole expands from the viewport centre */
  function reveal() {
    const cx = vw / 2;
    const cy = vh / 2;
    const R = maxRadius(cx, cy);
    const prog = { p: 0 };

    return new Promise((resolve) => {
      gsap.to(prog, {
        p: 1,
        duration: 0.95,
        ease: 'power3.inOut',
        onUpdate() {
          const t = performance.now() * 0.001;
          const r = R * prog.p;
          ctx.clearRect(0, 0, vw, vh);
          ctx.fillStyle = LAYERS[2].color;
          ctx.fillRect(0, 0, vw, vh);
          // coloured liquid rim trailing the hole
          ctx.fillStyle = LAYERS[1].color;
          blobPath(cx, cy, r * 1.16 + 30, t, 12);
          ctx.fill();
          ctx.fillStyle = LAYERS[0].color;
          blobPath(cx, cy, r * 1.07 + 14, t, 5);
          ctx.fill();
          ctx.globalCompositeOperation = 'destination-out';
          blobPath(cx, cy, r, t, 0);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        },
        onComplete() {
          ctx.clearRect(0, 0, vw, vh);
          canvas.style.display = 'none';
          resolve();
        },
      });
    });
  }

  let busy = false;

  return {
    /**
     * Run the cinematic wipe. `midFn` executes while the screen is fully
     * covered (scroll jump, modal open, …).
     */
    async wipe(origin, midFn) {
      if (busy) return;
      busy = true;
      await cover(origin);
      await midFn?.();
      await new Promise((r) => setTimeout(r, 130));
      await reveal();
      busy = false;
    },
    get busy() {
      return busy;
    },
  };
}
