import gsap from 'gsap';
import { pointer } from './pointer.js';

/**
 * Hero orchestration:
 * - magnetic buttons
 * - CTA hover super-state: liquid button, glitching title, glowing hands,
 *   surging fluid, particles converging on the button, boosted core
 */
export function initHero({ particles, blobs, core }) {
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- magnetic buttons ---------- */
  if (fine) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const toX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const toY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', () => {
        const r = el.getBoundingClientRect();
        toX((pointer.x - (r.left + r.width / 2)) * 0.32);
        toY((pointer.y - (r.top + r.height / 2)) * 0.32);
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- liquid goo fill on every .btn ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    const goos = btn.querySelectorAll('.btn__goo i');
    btn.addEventListener('mouseenter', () => {
      gsap.to(goos, {
        scale: 1.25,
        duration: 0.7,
        stagger: 0.07,
        ease: 'back.out(1.8)',
        overwrite: 'auto',
      });
      gsap.fromTo(
        btn,
        { scaleX: 1, scaleY: 1 },
        { scaleX: 1.05, scaleY: 0.95, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' }
      );
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(goos, { scale: 0, duration: 0.55, stagger: 0.05, ease: 'power3.in', overwrite: 'auto' });
    });
  });

  /* ---------- hero CTA super-hover ---------- */
  const cta = document.getElementById('hero-cta');
  const glitchEls = gsap.utils.toArray('.hero__title .glitch');
  const handGlows = gsap.utils.toArray('.hand__glow');
  const spark = document.querySelector('.hero__spark');
  let glitchTimer = null;

  function glitchBurst() {
    glitchEls.forEach((el) => el.classList.add('is-glitching'));
    setTimeout(() => glitchEls.forEach((el) => el.classList.remove('is-glitching')), 240);
  }

  cta?.addEventListener('mouseenter', () => {
    glitchBurst();
    glitchTimer = setInterval(glitchBurst, 620);
    gsap.to(handGlows, { opacity: 1, duration: 0.5 });
    gsap.to(spark, { opacity: 1, scale: 1.3, duration: 0.6, ease: 'power2.out' });
    blobs.surge(true);
    particles.attractTo(cta);
    core.boost(0.85);
  });

  cta?.addEventListener('mouseleave', () => {
    clearInterval(glitchTimer);
    glitchEls.forEach((el) => el.classList.remove('is-glitching'));
    gsap.to(handGlows, { opacity: 0.5, duration: 0.7 });
    gsap.to(spark, { scale: 1, duration: 0.7, ease: 'power2.out' });
    blobs.surge(false);
    particles.release();
    core.boost(0);
  });

  cta?.addEventListener('click', () => {
    clearInterval(glitchTimer);
    glitchEls.forEach((el) => el.classList.remove('is-glitching'));
    particles.release();
    core.pulse();
  });
}
