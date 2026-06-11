import gsap from 'gsap';

/**
 * Yellow fluid blobs (layer 2). Idle float loops + loader entrance +
 * a "surge" used while the hero CTA is hovered.
 */
export function initBlobs() {
  const a = document.querySelector('.blob--a');
  const b = document.querySelector('.blob--b');
  const c = document.querySelector('.blob--c');
  const dots = gsap.utils.toArray('.blob-dot');

  // idle breathing (transforms only — the displacement filter result is cached)
  gsap.to(a, { rotation: 22, scale: 1.06, duration: 11, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(b, { rotation: -24, scale: 1.09, y: 30, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(c, { rotation: 110, x: 40, duration: 13, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  dots.forEach((d, i) =>
    gsap.to(d, { y: gsap.utils.random(-26, 26), x: gsap.utils.random(-18, 18), duration: 4 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' })
  );

  return {
    /** entrance: fluid slides in from the edges (loading step 2) */
    intro() {
      const tl = gsap.timeline();
      tl.from(a, { xPercent: -70, yPercent: 60, scale: 0.5, duration: 1.4, ease: 'expo.out' }, 0)
        .from(b, { xPercent: 70, yPercent: -55, scale: 0.5, duration: 1.4, ease: 'expo.out' }, 0.12)
        .from(c, { scale: 0, duration: 1.1, ease: 'back.out(2)' }, 0.4)
        .from(dots, { scale: 0, opacity: 0, duration: 0.7, stagger: 0.09, ease: 'back.out(3)' }, 0.55);
      return tl;
    },

    /** CTA hover: the fluid leans towards / swells around the button */
    surge(on) {
      gsap.to(a, { scaleX: on ? 1.16 : 1, scaleY: on ? 1.1 : 1, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
      gsap.to(b, { scale: on ? 1.14 : 1, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
    },
  };
}
