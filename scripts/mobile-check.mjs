/* Fresh mobile-viewport load (the realistic mobile path). */
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

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));
await page.screenshot({ path: 'shots/08-mobile-fresh-hero.png' });

await page.evaluate(() => document.querySelector('#about').scrollIntoView({ behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: 'shots/09-mobile-about.png' });

await page.evaluate(() => document.querySelector('#join').scrollIntoView({ behavior: 'instant' }));
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: 'shots/10-mobile-join.png' });

console.log(errors.length ? errors.join('\n') : 'NO ERRORS');
await browser.close();
