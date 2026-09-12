// data/*.json -> the blog and web-development pages, plus sitemap.xml.
// Run `npm run verify` first: it proves this reproduces the committed HTML
// byte for byte, so a bad edit shows up as a diff instead of as a mangled site.
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { ROOT } from './lib/paths.mjs';
import { loadData, renderAll } from './lib/render.mjs';
import { buildSitemap } from './lib/sitemap.mjs';

export async function generate({ quiet = false } = {}) {
  const pages = renderAll(await loadData());
  const written = [];
  for (const [rel, html] of pages) {
    const abs = join(ROOT, rel);
    let current = null;
    try { current = await readFile(abs, 'utf8'); } catch {}
    if (current === html) continue;
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, html, 'utf8');
    written.push(rel);
  }
  // Sitemap last: it reads the directory tree the step above just changed.
  const sitemap = await buildSitemap();
  const smPath = join(ROOT, 'sitemap.xml');
  let currentSm = null;
  try { currentSm = await readFile(smPath, 'utf8'); } catch {}
  if (currentSm !== sitemap) {
    await writeFile(smPath, sitemap, 'utf8');
    written.push('sitemap.xml');
  }
  if (!quiet) {
    console.log(written.length ? `Wrote ${written.length} file(s):` : 'Nothing changed.');
    for (const f of written) console.log(`  ${f}`);
  }
  return written;
}

if (process.argv[1] && process.argv[1].endsWith('generate.mjs')) {
  await generate();
}
