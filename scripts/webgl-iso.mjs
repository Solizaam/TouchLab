/* Screenshot ONLY the webgl layer: hide all other layers, black page bg. */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const exe = EDGE_PATHS.find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));

await page.addStyleTag({
  content: `
    body { background: #000 !important; }
    body::after { display: none !important; }
    main, header, footer, .fluid-scroll, .particles-canvas, .glow-follow, .cursor { visibility: hidden !important; }
  `,
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: 'shots/webgl-iso.png' });
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
