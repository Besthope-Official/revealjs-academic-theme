#!/usr/bin/env node
/**
 * Zero-dependency dev server: build once, serve dist/, rebuild on change.
 * Usage: npm run dev [-- --port 4173]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const PORT = Number(process.argv.includes('--port')
  ? process.argv[process.argv.indexOf('--port') + 1] : 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function rebuild() {
  const t0 = performance.now();
  build();
  console.log(`[rebuild] ${(performance.now() - t0).toFixed(0)}ms`);
}

rebuild();

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(OUT, urlPath));
  if (!file.startsWith(OUT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`serving dist/ at http://localhost:${PORT}  (refresh browser after edits)`);
});

let timer;
try {
  fs.watch(ROOT, { recursive: true }, (_evt, filename) => {
    const f = String(filename);
    if (f.startsWith('dist/') || f.startsWith('node_modules') || f.startsWith('.git')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  });
} catch (e) {
  console.warn('watch unavailable, manual `npm run build` needed:', e.message);
}
