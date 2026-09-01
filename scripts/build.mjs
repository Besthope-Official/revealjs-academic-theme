#!/usr/bin/env node
/**
 * Build the routed static site into dist/.
 *
 * Mapping: markdown/<course>/<lec>.md  ->  dist/<course>/<lec>/index.html
 *          markdown/<course>/index.md  ->  dist/<course>/index.html
 *          markdown/index.md           ->  dist/index.html
 * Assets:  markdown/<x>.assets/        ->  dist/<route>/<x>.assets/  (verbatim)
 * Vendor:  node_modules reveal.js prebuilt dist -> dist/vendor/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'markdown');
const OUT = path.join(ROOT, 'dist');
const TEMPLATE = path.join(ROOT, 'template.html');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
   .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** '2026-09-01' -> '2026 年 9 月 1 日'; other strings pass through. */
const formatDate = (s) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s).trim());
  return m ? `${m[1]} 年 ${+m[2]} 月 ${+m[3]} 日` : s;
};

/** Parse leading `--- key: value ---` front-matter; return {meta, body}. */
function splitFrontMatter(raw) {
  const lines = raw.split('\n');
  if (lines[0].trim() !== '---') return { meta: {}, body: raw };
  const meta = {};
  let i = 1;
  for (; i < lines.length && lines[i].trim() !== '---'; i++) {
    const m = lines[i].match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: lines.slice(i + 1).join('\n') };
}

function walkMd(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.endsWith('.assets')) continue;
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkMd(full, rel));
    else if (entry.name.endsWith('.md')) out.push({ rel, full });
  }
  return out;
}

/** rel like 'git/lec1.md' -> { routeDir: 'git/lec1', base: '../..' } */
function routeFor(rel) {
  const parts = rel.split('/');
  const file = parts.pop();
  if (file !== 'index.md') parts.push(file.replace(/\.md$/, ''));
  return { routeDir: parts.join('/'), depth: parts.length };
}

function copyVendor() {
  const rv = path.join(ROOT, 'node_modules', 'reveal.js', 'dist');
  const need = (p) => fs.existsSync(path.join(rv, p));
  fs.mkdirSync(path.join(OUT, 'vendor', 'plugin', 'highlight'), { recursive: true });
  for (const f of ['reset.css', 'reveal.css', 'reveal.js']) {
    if (need(f)) fs.copyFileSync(path.join(rv, f), path.join(OUT, 'vendor', f));
  }
  for (const f of fs.readdirSync(path.join(rv, 'plugin'))) {
    if (f.endsWith('.js')) {
      fs.copyFileSync(path.join(rv, 'plugin', f), path.join(OUT, 'vendor', 'plugin', f));
    }
  }
  for (const f of ['monokai.css', 'zenburn.css']) {
    if (need(path.join('plugin', 'highlight', f))) {
      fs.copyFileSync(path.join(rv, 'plugin', 'highlight', f),
        path.join(OUT, 'vendor', 'plugin', 'highlight', f));
    }
  }
  // third-party plugins vendored from node_modules
  const cc = path.join(ROOT, 'node_modules', 'reveal.js-copycode', 'plugin', 'copycode');
  fs.cpSync(cc, path.join(OUT, 'vendor', 'plugin', 'copycode'), { recursive: true });
}

export function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  copyVendor();
  fs.cpSync(path.join(ROOT, 'theme'), path.join(OUT, 'theme'), { recursive: true });
  const globalAssets = path.join(ROOT, 'assets');
  if (fs.existsSync(globalAssets)) {
    fs.cpSync(globalAssets, path.join(OUT, 'assets'), { recursive: true });
  }

  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  const routes = [];

  for (const { rel, full } of walkMd(SRC)) {
    const { routeDir, depth } = routeFor(rel);
    const dest = path.join(OUT, routeDir);
    fs.mkdirSync(dest, { recursive: true });

    const { meta, body } = splitFrontMatter(fs.readFileSync(full, 'utf8'));
    const coverMeta = [meta.institute, meta.author].filter(Boolean).join(' · ');
    const html = template
      .replaceAll('{{base}}', '../'.repeat(depth))
      .replaceAll('{{title}}', escapeHtml(meta.title || 'untitled'))
      .replaceAll('{{author}}', escapeHtml(meta.author || ''))
      .replaceAll('{{coverMeta}}', escapeHtml(coverMeta))
      .replaceAll('{{date}}', escapeHtml(formatDate(meta.date || today)))
      .replaceAll('{{md}}', 'index.md');

    fs.writeFileSync(path.join(dest, 'index.html'), html);
    fs.writeFileSync(path.join(dest, 'index.md'), body);

    // sibling assets dir: markdown/<x>.assets -> dist/<route>/<x>.assets
    const stem = rel.slice(0, -3); // strip .md
    const assetsDir = path.join(SRC, `${stem}.assets`);
    if (fs.existsSync(assetsDir)) {
      fs.cpSync(assetsDir, path.join(dest, path.basename(assetsDir)), { recursive: true });
    }
    routes.push(`/${routeDir}`);
  }
  return routes;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = performance.now();
  const routes = build();
  console.log(`built ${routes.length} deck(s) in ${(performance.now() - t0).toFixed(0)}ms`);
  for (const r of routes) console.log(`  ${r}`);
}
