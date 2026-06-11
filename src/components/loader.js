import gsap from 'gsap';

/**
 * Loading sequence (~3s):
 *   1. pure pink screen + counter
 *   2. yellow fluid slides in from the edges
 *   3. TOUCH LAB title reveals line by line
 *   4. hands sharpen from blur
 *   5. particles + energy core activate, UI fades in
 */
export function playLoader({ blobs, particles, core, reduced }) {
  const loader = document.getElementById('loader');
  const pct = loader.querySelector('.loader__pct');

  // pre-hide everything the timeline will introduce
  gsap.set('.hero__title .line__inner', { yPercent: 112 });
  gsap.set('.hero__hands', { opacity: 0 });
  gsap.set('.hero__spark', { scale: 0 });
  gsap.set(['.hero__sub', '.hero__facts', '.btn--hero', '.hero__meta', '.hero__badge', '.hero__scroll', '.site-head'], {
    opacity: 0,
    y: 26,
  });

  if (reduced) {
    gsap.set('.hero__title .line__inner', { yPercent: 0 });
    gsap.set('.hero__hands', { opacity: 1 });
    gsap.set('.hero__spark', { scale: 1 });
    gsap.set(['.hero__sub', '.hero__facts', '.btn--hero', '.hero__meta', '.hero__badge', '.hero__scroll', '.site-head'], {
      opacity: 1,
      y: 0,
    });
    particles.state.alpha = 1;
    core.intro(true);
    loader.remove();
    document.body.removeAttribute('data-loading');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const count = { v: 0 };
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete() {
        loader.remove();
        document.body.removeAttribute('data-loading');
        resolve();
      },
    });

    // 1 — counter on pure pink
    tl.to(loader.querySelector('.loader__bar i'), { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0)
      .to(count, {
        v: 100,
        duration: 1.05,
        ease: 'power2.inOut',
        onUpdate: () => (pct.textContent = String(Math.round(count.v)).padStart(3, '0')),
      }, 0)
      .to(loader.querySelector('.loader__center'), { yPercent: -36, opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.1)
      .to(loader, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 1.18)
      .set(loader, { pointerEvents: 'none' }, 1.18)

      // 2 — yellow fluid slides in
      .add(blobs.intro(), 0.95)

      // 3 — title, line by line
      .to('.hero__title .line__inner', { yPercent: 0, duration: 0.95, stagger: 0.13, ease: 'power4.out' }, 1.35)

      // 4 — hands: blurred → sharp
      .fromTo(
        '.hero__hands',
        { opacity: 0, filter: 'blur(28px)', scale: 1.07 },
        { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.05, ease: 'power2.out', clearProps: 'filter' },
        1.55
      )
      .to('.hero__spark', { scale: 1, duration: 0.7, ease: 'back.out(2.4)' }, 2.05)

      // 5 — particles + core + UI
      .to(particles.state, { alpha: 1, duration: 0.9, ease: 'power1.inOut' }, 2.05)
      .add(() => core.intro(), 2.0)
      .to(['.site-head', '.hero__meta', '.hero__sub', '.hero__facts', '.btn--hero', '.hero__badge', '.hero__scroll'], {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
      }, 2.15);
  });
}
