// Local content admin for the portfolio. `npm run admin`.
//
// It serves two things on one port: the admin UI at /admin/, and the real site
// from the repo root, so "Preview" opens the actual page you just edited.
//
// Deliberately dependency-free and bound to 127.0.0.1 only — it writes files
// into the repo and runs git, so it must never be reachable from the network.
// It lives under tools/, which is listed in .vercelignore, so it is never
// deployed with the site.

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, rm, rmdir } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT, DATA_DIR, ASSETS_DIR } from '../lib/paths.mjs';
import { generate } from '../generate.mjs';
import { renderAll } from '../lib/render.mjs';

const run = promisify(execFile);
const PORT = Number(process.env.PORT) || 4321;
const UI_DIR = join(ROOT, 'tools', 'admin', 'ui');
const POST_IMAGES = join(ASSETS_DIR, 'post-images');
const PROJECT_SHOTS = join(ASSETS_DIR, 'project-shots');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// No SVG: an SVG is a document that can carry script, and these files get
// committed and served from the site's own origin.
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Mirrors .vercelignore: these exist in the repo but are not part of the site.
const PRIVATE_DIRS = new Set(['tools', 'data', 'mockups', 'node_modules']);


// A page on any website can make your browser send requests to localhost. This
// server deletes posts and pushes to the live site, so every API call must prove
// it came from the admin page itself:
//   - a per-run secret, handed only to the page this server serves;
//   - a custom header, which forces a CORS preflight that we never answer;
//   - an Origin/Referer that is this server, when the browser sends one.
const SESSION_TOKEN = randomUUID();
const TOKEN_HEADER = 'x-admin-token';

function sameOrigin(req) {
  const allowed = [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`];
  const origin = req.headers.origin;
  if (origin) return allowed.includes(origin);
  const referer = req.headers.referer;
  if (referer) return allowed.some((a) => referer.startsWith(a + '/'));
  return true; // curl and friends send neither; the token still has to match
}

function authorised(req) {
  if (req.headers[TOKEN_HEADER] !== SESSION_TOKEN) return false;
  if (!sameOrigin(req)) return false;
  const host = (req.headers.host || '').split(':')[0];
  if (host !== 'localhost' && host !== '127.0.0.1') return false; // DNS rebinding
  if (req.method !== 'GET') {
    const type = (req.headers['content-type'] || '').split(';')[0].trim();
    if (type !== 'application/json') return false;
  }
  return true;
}

// ---------------------------------------------------------------- data access

const dataPath = (kind) => join(DATA_DIR, kind === 'posts' ? 'blog.json' : 'projects.json');

async function readData(kind) {
  return JSON.parse(await readFile(dataPath(kind), 'utf8'));
}

async function writeData(kind, value) {
  await writeFile(dataPath(kind), JSON.stringify(value, null, 2) + '\n', 'utf8');
}

// Rendering every page is how we prove an edit cannot break the build. If the
// templates throw on the new content, the save is rejected before it lands.
async function assertRenderable(blog, projects) {
  renderAll({ blog, projects });
}

// ------------------------------------------------------------------ utilities

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function safeJoin(base, target) {
  const path = normalize(join(base, target));
  if (!path.startsWith(base + sep) && path !== base) return null;
  return path;
}

async function listImages() {
  const out = [];
  for (const [dir, prefix] of [[POST_IMAGES, '/assets/post-images'], [PROJECT_SHOTS, '/assets/project-shots']]) {
    let entries = [];
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of entries.sort()) {
      if (IMAGE_EXT.has(extname(name).toLowerCase())) out.push(`${prefix}/${name}`);
    }
  }
  return out;
}

async function git(args) {
  try {
    const { stdout } = await run('git', args, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
    return { ok: true, out: stdout.trim() };
  } catch (err) {
    return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}`.trim() || String(err) };
  }
}


// Deletes exactly one generated page folder. It will not touch anything outside
// blog/<slug>/ or web-development/<slug>/, will not recurse into subfolders, and
// leaves the folder alone if it contains a file this tool did not generate.
async function removePageFolder(relDir) {
  const parent = relDir.split('/')[0];
  const slug = relDir.split('/')[1];
  if (!['blog', 'web-development'].includes(parent) || !slug || slug.includes('.')) return [];
  const abs = safeJoin(ROOT, relDir);
  if (!abs) return [];

  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return []; // already gone
  }
  const unexpected = entries.filter((e) => !e.isFile() || e.name !== 'index.html');
  if (unexpected.length) {
    console.warn(`Left ${relDir} in place: it holds files this tool did not generate.`);
    return [];
  }
  const removed = [];
  for (const entry of entries) {
    await rm(join(abs, entry.name));
    removed.push(`${relDir}/${entry.name}`);
  }
  await rmdir(abs).catch(() => {});
  return removed;
}

// ------------------------------------------------------------------- handlers

function json(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

function readBody(req, limit = 40 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const CATEGORY_CLASSES = new Set(['cat-cyber', 'cat-med', 'cat-web', 'cat-design']);
const ACCENTS = new Set(['green', 'rose', 'cyan', 'amber']);


// Titles, summaries and labels are interpolated straight into tags and
// attributes, so they must arrive already escaped. The admin page does that;
// this catches anything else that talks to the API.
const RAW_MARKUP = /[<>]|&(?!(?:[a-z]+|#\d+);)|"/;

function checkPlainText(errors, label, value) {
  if (typeof value === 'string' && RAW_MARKUP.test(value)) {
    errors.push(`${label} contains characters that must be escaped first (< > " or a bare &)`);
  }
}

function validatePost(post) {
  const errors = [];
  if (!post || typeof post !== 'object') return ['post payload missing'];
  for (const field of ['slug', 'title', 'listTitle', 'date', 'category', 'categoryClass', 'description', 'accent', 'body']) {
    if (typeof post[field] !== 'string' || !post[field].trim()) errors.push(`${field} is required`);
  }
  if (post.slug && slugify(post.slug) !== post.slug) errors.push('slug must be lowercase words joined by hyphens');
  if (post.categoryClass && !CATEGORY_CLASSES.has(post.categoryClass)) errors.push('unknown category colour');
  if (post.accent && !ACCENTS.has(post.accent)) errors.push('unknown accent colour');
  if (!Array.isArray(post.meta)) errors.push('meta must be a list');
  else {
    for (const entry of post.meta) {
      const m = /^<span(?: class="tag-pill")?>([\s\S]*)<\/span>$/.exec(String(entry));
      if (!m) errors.push('the line under the headline has an entry this tool cannot write');
      else checkPlainText(errors, 'the line under the headline', m[1]);
    }
  }
  if (typeof post.footHtml !== 'string') errors.push('footHtml must be text');
  for (const field of ['title', 'listTitle', 'description', 'category', 'date']) checkPlainText(errors, field, post[field]);
  return errors;
}

function validateProject(project) {
  const errors = [];
  if (!project || typeof project !== 'object') return ['project payload missing'];
  for (const field of ['slug', 'name', 'tag', 'blurb', 'linksHtml']) {
    if (typeof project[field] !== 'string' || !project[field].trim()) errors.push(`${field} is required`);
  }
  if (project.slug && slugify(project.slug) !== project.slug) errors.push('slug must be lowercase words joined by hyphens');
  const d = project.detail;
  if (!d || typeof d !== 'object') return errors.concat('detail page is required');
  for (const field of ['title', 'crumb', 'description', 'accent', 'lede', 'heroLinksHtml', 'body', 'footHtml']) {
    if (typeof d[field] !== 'string' || !d[field].trim()) errors.push(`detail.${field} is required`);
  }
  if (d.accent && !ACCENTS.has(d.accent)) errors.push('unknown accent colour');
  if (!Array.isArray(d.tools)) errors.push('detail.tools must be a list');
  for (const field of ['name', 'tag', 'blurb']) checkPlainText(errors, field, project[field]);
  for (const field of ['title', 'crumb', 'description', 'lede']) checkPlainText(errors, `detail.${field}`, d[field]);
  for (const tool of Array.isArray(d.tools) ? d.tools : []) checkPlainText(errors, 'detail.tools', tool);
  return errors;
}

async function handleApi(req, res, url) {
  const path = url.pathname;

  if (!authorised(req)) {
    return json(res, 403, { errors: ['This request did not come from the admin page. Reload http://localhost:' + PORT + '/admin/ and try again.'] });
  }

  if (req.method === 'GET' && path === '/api/data') {
    const [blog, projects, images, status] = await Promise.all([
      readData('posts'),
      readData('projects'),
      listImages(),
      git(['status', '--short']),
    ]);
    return json(res, 200, { blog, projects, images, dirty: status.out });
  }

  if (req.method === 'POST' && (path === '/api/posts' || path === '/api/projects')) {
    const kind = path === '/api/posts' ? 'posts' : 'projects';
    const payload = await readBody(req);
    const item = payload.item;
    const errors = kind === 'posts' ? validatePost(item) : validateProject(item);
    if (errors.length) return json(res, 400, { errors });

    const data = await readData(kind);
    const list = kind === 'posts' ? data.posts : data.projects;
    const originalSlug = payload.originalSlug || item.slug;
    const existing = list.findIndex((x) => x.slug === originalSlug);
    const clash = list.findIndex((x) => x.slug === item.slug);
    if (clash !== -1 && clash !== existing) return json(res, 400, { errors: [`slug "${item.slug}" is already used`] });

    if (existing === -1) list.unshift(item); // newest first, matching the site
    else list[existing] = item;

    const blog = kind === 'posts' ? data : await readData('posts');
    const projects = kind === 'projects' ? data : await readData('projects');
    try {
      await assertRenderable(blog, projects);
    } catch (err) {
      return json(res, 400, { errors: [`that content does not render: ${err.message}`] });
    }
    await writeData(kind, data);
    const written = await generate({ quiet: true });
    return json(res, 200, { ok: true, slug: item.slug, written });
  }

  if (req.method === 'POST' && path === '/api/delete') {
    const { kind, slug } = await readBody(req);
    if (kind !== 'posts' && kind !== 'projects') return json(res, 400, { errors: ['unknown kind'] });
    // Check the slug before it is ever used to build a path. An empty or odd
    // slug must never reach a filesystem call.
    if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) return json(res, 400, { errors: ['that is not a valid page address'] });
    const data = await readData(kind);
    const list = kind === 'posts' ? data.posts : data.projects;
    const at = list.findIndex((x) => x.slug === slug);
    if (at === -1) return json(res, 404, { errors: ['not found'] });
    list.splice(at, 1);
    await writeData(kind, data);
    // The generated page must also leave the working tree, or the next publish
    // would stage it again. Removal is deliberately narrow: one page folder,
    // files listed one by one, nothing recursive, and it refuses outright if the
    // folder holds anything other than the generated index.html.
    const dir = kind === 'posts' ? `blog/${slug}` : `web-development/${slug}`;
    // The guard decides; nothing destructive runs before it. Git is not used to
    // do the removing, so there is no recursive delete anywhere in this path.
    const removedFiles = await removePageFolder(dir);
    const written = await generate({ quiet: true });
    const note = removedFiles.length ? null : `${dir} was left in place because it holds files this tool did not generate — remove it yourself if you meant to.`;
    return json(res, 200, { ok: true, removed: dir, removedFiles, note, written });
  }

  if (req.method === 'POST' && path === '/api/reorder') {
    const { kind, slug, direction } = await readBody(req);
    if (kind !== 'posts' && kind !== 'projects') return json(res, 400, { errors: ['unknown kind'] });
    const data = await readData(kind);
    const list = kind === 'posts' ? data.posts : data.projects;
    const at = list.findIndex((x) => x.slug === slug);
    const to = direction === 'up' ? at - 1 : at + 1;
    if (at === -1 || to < 0 || to >= list.length) return json(res, 400, { errors: ['cannot move that way'] });
    [list[at], list[to]] = [list[to], list[at]];
    await writeData(kind, data);
    const written = await generate({ quiet: true });
    return json(res, 200, { ok: true, written });
  }

  if (req.method === 'POST' && path === '/api/upload') {
    const { filename, dataUrl, folder } = await readBody(req);
    const dir = folder === 'project-shots' ? PROJECT_SHOTS : POST_IMAGES;
    const ext = extname(filename || '').toLowerCase();
    if (!IMAGE_EXT.has(ext)) return json(res, 400, { errors: ['only jpg, png, webp, gif or svg images'] });
    const base = slugify(filename.slice(0, filename.length - ext.length)) || 'image';
    const m = /^data:[^;,]+;base64,(.+)$/s.exec(dataUrl || '');
    if (!m) return json(res, 400, { errors: ['could not read that file'] });
    const bytes = Buffer.from(m[1], 'base64');
    if (bytes.length > 8 * 1024 * 1024) return json(res, 400, { errors: ['image is larger than 8 MB — please shrink it first'] });

    await mkdir(dir, { recursive: true });
    let name = `${base}${ext}`;
    const taken = new Set(await readdir(dir).catch(() => []));
    let n = 2;
    while (taken.has(name)) name = `${base}-${n++}${ext}`;
    await writeFile(join(dir, name), bytes);
    const prefix = dir === PROJECT_SHOTS ? '/assets/project-shots' : '/assets/post-images';
    return json(res, 200, { ok: true, src: `${prefix}/${name}` });
  }

  if (req.method === 'GET' && path === '/api/status') {
    const [status, branch, ahead] = await Promise.all([
      git(['status', '--short']),
      git(['branch', '--show-current']),
      git(['rev-list', '--count', '@{u}..HEAD']),
    ]);
    return json(res, 200, { changes: status.out, branch: branch.out, ahead: Number(ahead.out) || 0 });
  }

  if (req.method === 'POST' && path === '/api/publish') {
    const { message } = await readBody(req);
    if (typeof message !== 'string' || !message.trim()) return json(res, 400, { errors: ['a short description of the change is required'] });

    const written = await generate({ quiet: true });
    const steps = [];

    // The gate the whole design rests on. If generation no longer reproduces the
    // pages, or content would come back mangled, nothing is published.
    const checked = await run('node', ['tools/verify.mjs'], { cwd: ROOT }).then(
      (r) => ({ ok: true, out: r.stdout.trim() }),
      (e) => ({ ok: false, out: `${e.stdout || ''}${e.stderr || ''}`.trim() })
    );
    steps.push({ step: 'check the pages are safe to publish', ...checked });
    if (!checked.ok) return json(res, 500, { steps });

    // Stage explicit paths only — never `git add -A`. Other work may be open in
    // this same checkout and must not be swept into this commit.
    const paths = ['data/blog.json', 'data/projects.json', 'sitemap.xml', 'blog', 'web-development', 'assets/post-images', 'assets/project-shots'];
    const add = await git(['add', '--', ...paths]);
    steps.push({ step: 'stage changes', ...add });
    if (!add.ok) return json(res, 500, { steps });

    const staged = await git(['diff', '--cached', '--name-only']);
    if (!staged.out) return json(res, 200, { nothingToPublish: true, steps, written });

    // Pathspec included on purpose: another session may have staged its own work
    // in this shared checkout, and it must not ride along in this commit.
    const commit = await git(['commit', '-m', message.trim(), '--', ...paths]);
    steps.push({ step: 'save a version', ...commit });
    if (!commit.ok) return json(res, 500, { steps });

    const push = await git(['push']);
    steps.push({ step: 'send to the live site', ...push });
    return json(res, push.ok ? 200 : 500, { ok: push.ok, steps, files: staged.out.split('\n') });
  }

  return json(res, 404, { errors: ['no such endpoint'] });
}

// --------------------------------------------------------------- static files

async function serveFile(res, absPath) {
  try {
    const body = await readFile(absPath);
    res.writeHead(200, {
      'content-type': MIME[extname(absPath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);

    if (url.pathname === '/admin' || url.pathname === '/') {
      res.writeHead(302, { location: '/admin/' });
      return res.end();
    }

    if (url.pathname.startsWith('/admin/')) {
      const rel = url.pathname.slice('/admin/'.length) || 'index.html';

      // The admin page is the only thing that ever receives the session token.
      if (rel === 'index.html') {
        const page = await readFile(join(UI_DIR, 'index.html'), 'utf8');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(page.replace('__ADMIN_TOKEN__', SESSION_TOKEN));
      }

      if (rel === 'blocks.mjs') {
        if (await serveFile(res, join(ROOT, 'tools', 'lib', 'blocks.mjs'))) return;
      }
      const abs = safeJoin(UI_DIR, rel);
      if (abs && (await serveFile(res, abs))) return;
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }

    // Everything else is the real site, so previews work with the same
    // root-absolute paths the deployed pages use. Only what the deployed site
    // would serve: no dotfiles (.git), and none of the repo-only folders.
    const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const firstSegment = rel.split('/')[0];
    if (firstSegment.startsWith('.') || PRIVATE_DIRS.has(firstSegment)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }
    const abs = safeJoin(ROOT, rel || 'index.html');
    if (!abs) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      return res.end('forbidden');
    }
    if (await serveFile(res, abs)) return;
    if (await serveFile(res, join(abs, 'index.html'))) return;
    const notFound = await readFile(join(ROOT, '404.html'), 'utf8').catch(() => 'not found');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(notFound);
  } catch (err) {
    json(res, 500, { errors: [err.message] });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/admin/`;
  console.log(`\n  Portfolio admin running at ${url}`);
  console.log('  The live site preview is on the same address, e.g. http://localhost:' + PORT + '/blog/');
  console.log('  Press Ctrl+C to stop.\n');
});
