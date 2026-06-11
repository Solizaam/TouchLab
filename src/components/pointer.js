/**
 * Shared pointer state — one listener, many consumers.
 * x/y      raw pixels
 * nx/ny    normalised -1..1 (centre = 0)
 * lx/ly    lerped pixels        (smooth follow)
 * lnx/lny  lerped normalised    (parallax)
 */
export const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  nx: 0,
  ny: 0,
  lx: window.innerWidth / 2,
  ly: window.innerHeight / 2,
  lnx: 0,
  lny: 0,
  active: false,
};

export function initPointer() {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true }
  );
}

const K = 0.085;

export function tickPointer() {
  pointer.lx += (pointer.x - pointer.lx) * K;
  pointer.ly += (pointer.y - pointer.ly) * K;
  pointer.lnx += (pointer.nx - pointer.lnx) * K;
  pointer.lny += (pointer.ny - pointer.lny) * K;
}
