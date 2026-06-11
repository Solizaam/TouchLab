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

await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));

const a = await page.evaluate(() => {
  try {
    return JSON.stringify({ tl: typeof window.__TL, dbg: window.__TL?.core?.debug?.() });
  } catch (e) {
    return 'EVAL ERR: ' + e;
  }
});
await new Promise((r) => setTimeout(r, 1000));
const b = await page.evaluate(() => {
  try {
    return JSON.stringify({ dbg: window.__TL?.core?.debug?.() });
  } catch (e) {
    return 'EVAL ERR: ' + e;
  }
});

console.log('T+4.5s:', a);
console.log('T+5.5s:', b);
console.log('--- console ---');
console.log(logs.join('\n') || '(empty)');
await browser.close();
