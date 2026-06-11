/* Captures the liquid transition mid-flight and the reservation modal. */
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
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.setViewport({ width: 1600, height: 900 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));

// click hero CTA → liquid wipe to #about
const cta = await page.$('#hero-cta');
const box = await cta.boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await new Promise((r) => setTimeout(r, 450));
await page.screenshot({ path: 'shots/11-wipe-cover.png' });
await new Promise((r) => setTimeout(r, 750));
await page.screenshot({ path: 'shots/12-wipe-reveal.png' });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: 'shots/13-after-wipe.png' });

// reservation modal
await page.evaluate(() => document.querySelector('#join').scrollIntoView({ behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 1500));
const join = await page.$('#join-cta');
const jb = await join.boundingBox();
await page.mouse.click(jb.x + jb.width / 2, jb.y + jb.height / 2);
await new Promise((r) => setTimeout(r, 2600));
await page.screenshot({ path: 'shots/14-modal.png' });

console.log(errors.length ? errors.join('\n') : 'NO ERRORS');
await browser.close();
