import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll (Lenis) + section choreography (ScrollTrigger).
 * Every section gets its own treatment: parallax, scale, rotation,
 * blur and opacity — plus background-colour morphs and energy-core
 * keyframes per section.
 */

const BG = {
  pink: { bg: '#F02D7D', fg: '#ffffff' },
  plum: { bg: '#2A0716', fg: '#ffffff' },
  dark: { bg: '#150310', fg: '#ffffff' },
  yellow: { bg: '#F5B82E', fg: '#1C040F' },
};

export function initScroll({ core, transition }) {
  /* ---------- Lenis ---------- */
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- background colour morph ---------- */
  const root = document.documentElement;
  function morphBg(name) {
    const c = BG[name] ?? BG.pink;
    if (import.meta.env.DEV || window.__TL_DEBUG) console.debug('[morphBg]', name, c.bg);
    gsap.to(root, { '--bg': c.bg, '--fg-header': c.fg, duration: 1.1, ease: 'power2.inOut', overwrite: 'auto' });
  }

  // deterministic: whichever [data-bg] section crosses the 55% line owns the
  // backdrop — survives instant jumps, unlike paired enter/leave callbacks
  const bgSections = gsap.utils.toArray('[data-bg]');
  let currentBg = 'pink';
  function syncBg() {
    const line = window.innerHeight * 0.55;
    let name = 'pink';
    for (const s of bgSections) {
      const r = s.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) {
        name = s.dataset.bg;
        break;
      }
    }
    if (name !== currentBg) {
      currentBg = name;
      morphBg(name);
    }
  }
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncBg });
  syncBg();

  /* ---------- energy core keyframes per section ---------- */
  function heroKey() {
    const spark = document.querySelector('.hero__spark');
    if (!spark) return { nx: 0.42, ny: 0.04, s: 1 };
    const r = spark.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    // document space: hero sits at the document top, so this equals the
    // spark's resting viewport position regardless of current scroll
    const cy = r.top + r.height / 2 + window.scrollY;
    return {
      nx: (cx / window.innerWidth) * 2 - 1,
      ny: -((cy / window.innerHeight) * 2 - 1),
      s: window.innerWidth < 768 ? 0.7 : 1,
    };
  }

  const KEYS = [
    { trigger: '#hero', key: heroKey },
    { trigger: '#about', key: () => ({ nx: 0.62, ny: -0.45, s: 0.42 }) },
    { trigger: '#lab', key: () => ({ nx: 0, ny: window.innerWidth < 768 ? 0.05 : -0.14, s: window.innerWidth < 768 ? 1.15 : 1.6 }) },
    { trigger: '#info', key: () => ({ nx: -0.6, ny: 0.3, s: 0.4 }) },
    { trigger: '#join', key: () => ({ nx: 0, ny: 0.55, s: 0.8 }) },
  ];

  KEYS.forEach(({ trigger, key }) => {
    ScrollTrigger.create({
      trigger,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => core.setKey(key()),
      onEnterBack: () => core.setKey(key()),
    });
  });
  core.setKey(heroKey());
  window.addEventListener('resize', () => core.setKey(heroKey()));

  /* ---------- fluid layer drifts slowly with scroll ---------- */
  gsap.to('.fluid-scroll', {
    y: '-14vh',
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'max', scrub: 1.2 },
  });

  /* ---------- SECTION 1 : hero exit (parallax + scale + blur + opacity) ---------- */
  gsap
    .timeline({
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    })
    .to('.hero__content', { yPercent: -22, scale: 0.94, opacity: 0.0, ease: 'none' }, 0)
    .to('.hand--top', { yPercent: -26, xPercent: 10, opacity: 0, ease: 'none' }, 0)
    .to('.hand--bottom', { yPercent: 26, xPercent: -10, opacity: 0, ease: 'none' }, 0)
    .to('.hero__hands', { filter: 'blur(14px)', ease: 'none' }, 0)
    .to('.hero__spark', { opacity: 0, ease: 'none' }, 0)
    .to(['.hero__meta', '.hero__badge', '.hero__scroll'], { opacity: 0, ease: 'none' }, 0);

  /* ---------- SECTION 2 : about ---------- */
  gsap.to('.about__giant', {
    xPercent: -28,
    ease: 'none',
    scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });

  gsap.from('.about__statement .reveal-line > span', {
    yPercent: 115,
    duration: 1.1,
    stagger: 0.14,
    ease: 'power4.out',
    scrollTrigger: { trigger: '.about__statement', start: 'top 78%' },
  });

  /* ---------- SECTION 3 : lab ---------- */
  gsap.to('.lab__ring', {
    rotation: 200,
    ease: 'none',
    scrollTrigger: { trigger: '#lab', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.lab__ring--inner', {
    rotation: -260,
    scale: 1.12,
    ease: 'none',
    scrollTrigger: { trigger: '#lab', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.from('.lab__title', {
    scale: 0.85,
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.lab__head', start: 'top 75%' },
  });

  /* ---------- SECTION 4 : info ---------- */
  gsap.to('.info__date', {
    yPercent: 24,
    rotation: -4,
    ease: 'none',
    scrollTrigger: { trigger: '#info', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.from('.info-row', {
    xPercent: -6,
    opacity: 0,
    skewX: -6,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.info__rows', start: 'top 80%' },
  });

  /* ---------- SECTION 5 : join ---------- */
  gsap.from('.join__title .reveal-line > span', {
    yPercent: 115,
    rotation: 4,
    duration: 1,
    stagger: 0.12,
    ease: 'power4.out',
    scrollTrigger: { trigger: '#join', start: 'top 65%' },
  });
  gsap.fromTo(
    '.join__title',
    { scale: 0.92 },
    {
      scale: 1.04,
      ease: 'none',
      scrollTrigger: { trigger: '#join', start: 'top bottom', end: 'bottom top', scrub: 1 },
    }
  );
  gsap.from('#join-cta', {
    scale: 0.6,
    opacity: 0,
    duration: 1,
    ease: 'elastic.out(1, 0.5)',
    scrollTrigger: { trigger: '#join-cta', start: 'top 88%' },
  });

  /* ---------- generic fades ---------- */
  gsap.utils.toArray('.reveal-fade').forEach((el, i) => {
    gsap.from(el, {
      y: 44,
      opacity: 0,
      rotation: i % 2 ? 1.2 : -1.2,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });
  gsap.utils.toArray('.section__index').forEach((el) => {
    gsap.from(el, {
      x: -30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* ---------- liquid page transitions on nav / CTA clicks ---------- */
  document.querySelectorAll('[data-transition]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (transition.busy) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      const r = link.getBoundingClientRect();
      const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      transition.wipe(origin, () => {
        lenis.scrollTo(target, { immediate: true, force: true });
        ScrollTrigger.refresh();
        syncBg();
      });
    });
  });

  /* ---------- reservation modal (final CTA) ---------- */
  const modal = document.getElementById('modal');
  document.querySelectorAll('[data-modal]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (transition.busy) return;
      const r = btn.getBoundingClientRect();
      transition.wipe({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, () => {
        modal.hidden = false;
        lenis.stop();
        gsap.from('.modal__panel', { scale: 0.85, rotation: -5, opacity: 0, duration: 0.7, ease: 'back.out(1.7)', delay: 0.3 });
      });
    });
  });
  modal.querySelector('.modal__close').addEventListener('click', () => {
    gsap.to('.modal__panel', {
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete() {
        modal.hidden = true;
        gsap.set('.modal__panel', { clearProps: 'all' });
        lenis.start();
      },
    });
  });

  ScrollTrigger.refresh();
  return lenis;
}
