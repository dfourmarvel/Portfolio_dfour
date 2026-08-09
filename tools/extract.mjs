// One-shot-ish importer: reads the hand-written HTML and writes data/*.json.
// Safe to re-run — it is the inverse of generate.mjs, and `npm run verify`
// asserts the pair round-trips byte for byte.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, DATA_DIR } from './lib/paths.mjs';
import { inner, between, metaContent, splitSiblings, attrOf } from './lib/html.mjs';

const read = (rel) => readFile(join(ROOT, rel), 'utf8');

function accentOf(html) {
  const m = html.match(/<body data-ac="([a-z]+)"/);
  return m ? m[1] : null;
}

function spansOf(block) {
  return splitSiblings(block, '<span', '</span>').map((s) => s.trim());
}

async function extractBlog() {
  const indexHtml = await read('blog/index.html');

  const listHtml = inner(indexHtml, '<div class="blog-list">\n', '\n        </div>');
  const cards = splitSiblings(listHtml, '<a class="post reveal"', '</a>');

  const order = cards.map((card) => {
    const href = attrOf(card, 'href');
    const slug = href.replace(/^\/blog\/|\/$/g, '');
    const catTag = card.match(/<span class="cat ([^"]+)">([^<]*)<\/span>/);
    return {
      slug,
      listTitle: inner(card, '<h3>', '</h3>'),
      date: inner(card, '<span class="date">', '</span>'),
      categoryClass: catTag[1],
      category: catTag[2],
    };
  });

  const posts = [];
  for (const entry of order) {
    const html = await read(`blog/${entry.slug}/index.html`);
    const heroBlock = between(html, '<header class="page-hero">', '</header>', {
      label: entry.slug,
    }).value;
    posts.push({
      ...entry,
      title: inner(heroBlock, '<h1>', '</h1>'),
      description: metaContent(html, 'description'),
      accent: accentOf(html),
      meta: spansOf(inner(heroBlock, '<p class="post-meta">', '</p>')),
      body: inner(html, '<article class="post-body reveal">\n', '\n        </article>'),
      footHtml: inner(html, '<div class="post-foot">\n', '\n        </div>'),
    });
  }

  return {
    page: {
      title: inner(indexHtml, '<title>', '</title>'),
      description: metaContent(indexHtml, 'description'),
      ogTitle: metaContent(indexHtml, 'og:title'),
      ogDescription: metaContent(indexHtml, 'og:description'),
      accent: accentOf(indexHtml),
      crumb: inner(indexHtml, '<span class="crumb">', '</span>'),
      heroHtml: inner(indexHtml, '<h1>', '</h1>'),
      lede: inner(indexHtml, '<p class="lede reveal">', '</p>'),
      secLabel: inner(indexHtml, '<p class="sec-label">', '</p>'),
      secHeading: inner(indexHtml, '<h2 class="reveal">', '</h2>'),
    },
    posts,
  };
}

async function extractProjects() {
  const indexHtml = await read('web-development/index.html');
  const gridHtml = inner(indexHtml, '<div class="feat-grid">\n', '\n        </div>');
  const cards = splitSiblings(gridHtml, '<article class="feat f-web reveal">', '</article>');

  const projects = [];
  for (const card of cards) {
    const linksHtml = inner(card, '<div class="feat-links">\n', '\n            </div>');
    // The write-up link is what ties a card to its detail page.
    const writeUp = linksHtml.match(/href="\/web-development\/([^"/]+)\//);
    const slug = writeUp ? writeUp[1] : null;

    const card_ = {
      slug,
      tag: inner(card, '<span class="tag">', '</span>'),
      name: inner(card, '<h3>', '</h3>'),
      blurb: inner(card, '<p>', '</p>'),
      linksHtml,
    };

    if (!slug) {
      projects.push({ ...card_, detail: null });
      continue;
    }

    const html = await read(`web-development/${slug}/index.html`);
    const heroBlock = between(html, '<header class="page-hero">', '</header>', { label: slug }).value;
    const labNav = inner(html, '<div class="lab-nav">', '</div>', { required: false });
    projects.push({
      ...card_,
      detail: {
        title: inner(heroBlock, '<h1>', '</h1>'),
        crumb: inner(heroBlock, '<span class="crumb">', '</span>'),
        description: metaContent(html, 'description'),
        accent: accentOf(html),
        lede: inner(heroBlock, '<p class="lede reveal">', '</p>'),
        tools: splitSiblings(
          inner(heroBlock, '<div class="lab-tools reveal">', '</div>'),
          '<span class="tool">',
          '</span>'
        ).map((s) => inner(s, '<span class="tool">', '</span>')),
        heroLinksHtml: inner(heroBlock, '<div class="feat-links reveal">\n', '\n      </div>'),
        body: inner(html, '<article class="lab-body reveal">\n', '\n        </article>'),
        footHtml: inner(html, '<div class="post-foot">', '</div>'),
        labNavHtml: labNav,
      },
    });
  }

  return {
    page: {
      title: inner(indexHtml, '<title>', '</title>'),
      description: metaContent(indexHtml, 'description'),
      ogTitle: metaContent(indexHtml, 'og:title'),
      ogDescription: metaContent(indexHtml, 'og:description'),
      accent: accentOf(indexHtml),
      crumb: inner(indexHtml, '<span class="crumb">', '</span>'),
      heroHtml: inner(indexHtml, '<h1>', '</h1>'),
      lede: inner(indexHtml, '<p class="lede reveal">', '</p>'),
      secLabel: inner(indexHtml, '<p class="sec-label">', '</p>'),
      secHeading: inner(indexHtml, '<h2 class="reveal">', '</h2>'),
    },
    projects,
  };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const blog = await extractBlog();
  const projects = await extractProjects();
  await writeFile(join(DATA_DIR, 'blog.json'), JSON.stringify(blog, null, 2) + '\n');
  await writeFile(join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2) + '\n');
  console.log(`extracted ${blog.posts.length} posts, ${projects.projects.length} projects`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
