import { pointer } from './pointer.js';

/**
 * Custom cursor: translucent ring + dot with inertia, halo on hover,
 * plus a large ambient glow that trails the pointer slowly (光晕 layer).
 */
export function initCursor() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (!fine) return null;

  document.documentElement.classList.add('has-cursor');

  const root = document.createElement('div');
  root.className = 'cursor';
  root.innerHTML = `
    <div class="cursor__halo"></div>
    <div class="cursor__ring"></div>
    <div class="cursor__dot"></div>`;
  document.body.appendChild(root);

  const halo = root.querySelector('.cursor__halo');
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const glow = document.querySelector('.glow-follow');

  const ringPos = { x: pointer.x, y: pointer.y };
  const haloPos = { x: pointer.x, y: pointer.y };
  const glowPos = { x: pointer.x, y: pointer.y };

  let scale = 1;
  let targetScale = 1;
  let shown = false;

  const HOVER_SEL = 'a, button, [data-hover], [data-magnetic]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER_SEL)) {
      root.classList.add('is-hover');
      targetScale = 2.3;
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVER_SEL)) {
      root.classList.remove('is-hover');
      targetScale = 1;
    }
  });
  window.addEventListener('pointerdown', () => (targetScale = Math.max(0.8, targetScale * 0.78)));
  window.addEventListener('pointerup', () => (targetScale = root.classList.contains('is-hover') ? 2.3 : 1));

  return {
    update() {
      if (pointer.active && !shown) {
        shown = true;
        root.classList.add('is-on');
      }

      // dot: tight follow / ring: inertia / halo+glow: heavy inertia
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;

      ringPos.x += (pointer.x - ringPos.x) * 0.16;
      ringPos.y += (pointer.y - ringPos.y) * 0.16;
      scale += (targetScale - scale) * 0.14;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale.toFixed(3)})`;

      haloPos.x += (pointer.x - haloPos.x) * 0.09;
      haloPos.y += (pointer.y - haloPos.y) * 0.09;
      halo.style.transform = `translate3d(${haloPos.x}px, ${haloPos.y}px, 0) scale(${(0.6 + scale * 0.35).toFixed(3)})`;

      if (glow) {
        glowPos.x += (pointer.x - glowPos.x) * 0.045;
        glowPos.y += (pointer.y - glowPos.y) * 0.045;
        glow.style.transform = `translate3d(${glowPos.x}px, ${glowPos.y}px, 0)`;
      }
    },
  };
}
