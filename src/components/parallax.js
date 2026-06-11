import gsap from 'gsap';
import { pointer } from './pointer.js';

/**
 * Pointer-driven multi-layer parallax.
 * Any element with [data-depth] translates against the cursor;
 * higher depth = faster layer. Layers used:
 *   particles (canvas-internal)  ~ depth 0.25–0.75
 *   fluid blobs                  0.025
 *   title                        0.012
 *   hands                        0.045
 *   spark / glow                 0.07
 */
const RANGE_X = 850;
const RANGE_Y = 520;

export function initParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return null;

  const layers = gsap.utils.toArray('[data-depth]').map((el) => ({
    depth: parseFloat(el.dataset.depth),
    setX: gsap.quickSetter(el, 'x', 'px'),
    setY: gsap.quickSetter(el, 'y', 'px'),
  }));

  return {
    update() {
      for (const l of layers) {
        l.setX(-pointer.lnx * l.depth * RANGE_X);
        l.setY(-pointer.lny * l.depth * RANGE_Y);
      }
    },
  };
}
