// Walks every HTML file and reports internal href/src targets that don't
// resolve to a real file (root-relative paths, dir/index.html, etc).
// Usage: node tools/link-check.mjs

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { ROOT } from './lib/paths.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const ATTR_RE = /\s(?:href|src)="([^"]*)"/g;

async function walkHtml(dir, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
}

function isInternal(target) {
  if (!target) return false;
  if (target.startsWith('#')) return false; // in-page anchor
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(target)) return false;
  if (target.startsWith('//')) return false; // protocol-relative external
  return true;
}

async function resolveTarget(fileDir, target) {
  // strip hash / query
  let clean = target.split('#')[0].split('?')[0];
  if (clean === '') return true; // pure #hash or ?query, already filtered but just in case

  let base = clean.startsWith('/') ? ROOT : fileDir;
  let candidate = resolve(base, clean.startsWith('/') ? '.' + clean : clean);

  try {
    const s = await stat(candidate);
    if (s.isDirectory()) {
      await stat(join(candidate, 'index.html'));
    }
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const files = [];
  await walkHtml(ROOT, files);

  const broken = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(html))) {
      const target = m[1];
      if (!isInternal(target)) continue;
      const ok = await resolveTarget(dirname(file), target);
      if (!ok) {
        broken.push({ file: file.slice(ROOT.length + 1), target });
      }
    }
  }

  if (broken.length === 0) {
    console.log(`link-check: ${files.length} html files scanned, 0 broken internal links.`);
    process.exit(0);
  }

  console.log(`link-check: ${files.length} html files scanned, ${broken.length} broken internal link(s):`);
  for (const b of broken) {
    console.log(`  ${b.file} -> ${b.target}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
