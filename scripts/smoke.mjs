/* Dev smoke test: drives headless Edge through the page, captures
   console errors and screenshots at several scroll positions/viewports. */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const exe = EDGE_PATHS.find((p) => existsSync(p));
const URL = process.env.SMOKE_URL ?? 'http://localhost:4173/';
mkdirSync('shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-first-run', '--hide-scrollbars', '--mute-audio'],
});

const errors = [];
const page = await browser.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.setViewport({ width: 1600, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(4200); // let the loader finish
await page.screenshot({ path: 'shots/01-hero.png' });

// hover the CTA to exercise the super-hover state
const cta = await page.$('#hero-cta');
if (cta) {
  const box = await cta.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await sleep(900);
  await page.screenshot({ path: 'shots/02-hero-cta-hover.png' });
  await page.mouse.move(100, 100, { steps: 6 });
}

for (const [name, sel] of [
  ['03-about', '#about'],
  ['04-lab', '#lab'],
  ['05-info', '#info'],
  ['06-join', '#join'],
]) {
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'start' });
  }, sel);
  await sleep(1800);
  await page.screenshot({ path: `shots/${name}.png` });
}

// mobile pass
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(1500);
await page.screenshot({ path: 'shots/07-mobile-hero.png' });

console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'NO CONSOLE ERRORS');
await browser.close();
