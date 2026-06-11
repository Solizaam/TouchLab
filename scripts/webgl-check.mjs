/* Checks what WebGL renderer headless Edge exposes and whether the
   site's webgl canvas has non-transparent pixels after load. */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const exe = EDGE_PATHS.find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 5000));

const info = await page.evaluate(() => {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  let renderer = 'none';
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  }

  // copy the live webgl canvas into a 2d canvas and inspect pixels
  const src = document.getElementById('webgl');
  const copy = document.createElement('canvas');
  copy.width = 200;
  copy.height = 200;
  const ctx = copy.getContext('2d');
  ctx.drawImage(src, 0, 0, 200, 200);
  const data = ctx.getImageData(0, 0, 200, 200).data;
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 8) opaque++;

  return { renderer, canvasSize: `${src.width}x${src.height}`, opaquePixelsOf40k: opaque };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
