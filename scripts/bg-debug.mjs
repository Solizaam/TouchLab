import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const exe = EDGE_PATHS.find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e}`));

await page.setViewport({ width: 1600, height: 900 });
await page.evaluateOnNewDocument(() => (window.__TL_DEBUG = true));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));

// jump to #about exactly like the smoke test does
await page.evaluate(() => {
  document.querySelector('#about').scrollIntoView({ behavior: 'instant', block: 'start' });
});

// sample scrollY and --bg over time
for (let i = 0; i < 6; i++) {
  await new Promise((r) => setTimeout(r, 400));
  const s = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return JSON.stringify({
      scrollY: Math.round(window.scrollY),
      bg: cs.getPropertyValue('--bg').trim(),
      aboutTop: Math.round(document.querySelector('#about').getBoundingClientRect().top),
    });
  });
  console.log(i, s);
}

console.log('--- console ---');
console.log(logs.join('\n') || '(empty)');
await browser.close();
