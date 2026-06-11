import './styles/base.css';
import './styles/loader.css';
import './styles/cursor.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/responsive.css';

import gsap from 'gsap';

import { initPointer, tickPointer } from './components/pointer.js';
import { initCursor } from './components/cursor.js';
import { initParticles } from './components/particles.js';
import { initBlobs } from './components/blobs.js';
import { initParallax } from './components/parallax.js';
import { initEnergyCore } from './components/energy-core.js';
import { initTransition } from './components/transition.js';
import { initHero } from './components/hero.js';
import { playLoader } from './components/loader.js';
import { initScroll } from './components/scroll.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initPointer();
const cursor = initCursor();
const parallax = initParallax();
const particles = initParticles(document.getElementById('particles'));
const blobs = initBlobs();
const core = initEnergyCore(document.getElementById('webgl'));
const transition = initTransition();

initHero({ particles, blobs, core });

window.__TL = { core };

/* single render loop for everything frame-based */
gsap.ticker.add((time, deltaMs) => {
  tickPointer();
  cursor?.update();
  parallax?.update();
  particles.update(time);
  core.update(time, deltaMs);
});

/* loading sequence → then unlock scroll choreography */
const start = () => {
  playLoader({ blobs, particles, core, reduced }).then(() => {
    initScroll({ core, transition });
  });
};

// wait for the display fonts so the title reveal doesn't FOUT mid-animation
if (document.fonts?.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(start);
} else {
  start();
}
