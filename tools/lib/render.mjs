// Renders every data-driven page into a Map of repo-relative path -> HTML.
// Nothing here touches the filesystem, so generate.mjs and verify.mjs share it.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_DIR } from './paths.mjs';
import { blogPost, blogIndex, projectIndex, projectPage } from './templates.mjs';

export async function loadData() {
  const [blog, projects] = await Promise.all([
    readFile(join(DATA_DIR, 'blog.json'), 'utf8').then(JSON.parse),
    readFile(join(DATA_DIR, 'projects.json'), 'utf8').then(JSON.parse),
  ]);
  return { blog, projects };
}

export function renderAll({ blog, projects }) {
  const out = new Map();
  out.set('blog/index.html', blogIndex(blog));
  for (const post of blog.posts) out.set(`blog/${post.slug}/index.html`, blogPost(post));
  out.set('web-development/index.html', projectIndex(projects));
  for (const p of projects.projects) {
    out.set(`web-development/${p.slug}/index.html`, projectPage(p.slug, p.detail));
  }
  return out;
}
