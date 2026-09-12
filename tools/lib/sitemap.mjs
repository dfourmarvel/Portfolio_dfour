// Rebuilds sitemap.xml from the pages actually on disk.
// lastmod comes from each file's last git commit date (today for uncommitted
// files, i.e. a post you just added), matching the convention in CLAUDE.md.
import { readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { promisify } from 'node:util';
import { ROOT } from './paths.mjs';
import { SITE_ORIGIN } from './chrome.mjs';

const run = promisify(execFile);
const SKIP = new Set(['mockups', 'assets', 'css', 'js', 'data', 'tools', 'node_modules', '.git', '.claude', '.foreman']);

async function findIndexes(dir = ROOT, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
      await findIndexes(join(dir, entry.name), acc);
    } else if (entry.name === 'index.html') {
      acc.push(relative(ROOT, join(dir, entry.name)).split(sep).join('/'));
    }
  }
  return acc;
}

const today = () => new Date().toISOString().slice(0, 10);

async function lastCommitDate(relPath) {
  try {
    const { stdout } = await run('git', ['log', '-1', '--format=%cs', '--', relPath], { cwd: ROOT });
    return stdout.trim() || today();
  } catch {
    return today();
  }
}

export async function buildSitemap() {
  const files = (await findIndexes()).sort();
  const urls = [];
  for (const file of files) {
    const path = file === 'index.html' ? '/' : `/${file.slice(0, -'index.html'.length)}`;
    const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
    const priority = depth === 0 ? '1.0' : depth === 1 ? '0.8' : '0.6';
    urls.push({ loc: SITE_ORIGIN + path, lastmod: await lastCommitDate(file), priority, depth, path });
  }
  // Home first, then sections, then detail pages — the order the file already uses.
  urls.sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path));
  const body = urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
