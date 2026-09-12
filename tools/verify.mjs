// Asserts two things the admin tool depends on:
//
//  1. The JSON -> HTML render reproduces what is on disk byte for byte, so
//     regenerating can never silently rewrite a hand-authored page.
//  2. Every post and project body survives a round-trip through the block
//     editor unchanged, so opening something in the admin and saving it
//     without edits is a no-op.
//
// If this fails, do not publish.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './lib/paths.mjs';
import { loadData, renderAll } from './lib/render.mjs';
import { toBlocks, toHtml, toFriendly, fromFriendly, encodeEntities } from './lib/blocks.mjs';

const data = await loadData();

const bodies = [
  ...data.blog.posts.map((p) => [`post ${p.slug}`, p.body]),
  ...data.projects.projects.map((p) => [`project ${p.slug}`, p.detail.body]),
];

let lossy = 0;
for (const [name, body] of bodies) {
  if (toHtml(toBlocks(body)) === body) continue;
  lossy++;
  console.log(`BLOCKS   ${name} does not survive a round-trip through the editor`);
}

// The editor shows inline bold/italic/code/links in a plain-text notation rather
// than as tags. That conversion must also be exactly reversible.
const inlineRuns = [];
for (const [, body] of bodies) {
  for (const m of body.matchAll(/<p>([\s\S]*?)<\/p>|<li>([\s\S]*?)<\/li>|<figcaption>([\s\S]*?)<\/figcaption>/g)) {
    inlineRuns.push(m[1] ?? m[2] ?? m[3]);
  }
}
let mangled = 0;
for (const run of inlineRuns) {
  if (fromFriendly(toFriendly(run)) === run) continue;
  mangled++;
  console.log(`INLINE   text is changed by the editor's formatting view: ${JSON.stringify(run.slice(0, 90))}`);
}

// Characters and keystrokes that used to corrupt a page. Each case is written
// the way the admin would produce it, then pushed through the same parse the
// editor does on reload: the block must come back as the same kind of block
// with the same text.
const cases = [
  { what: 'a less-than sign typed in a paragraph', block: { type: 'paragraph', text: fromFriendly('if x<y then stop') } },
  { what: 'an ampersand typed in a paragraph', block: { type: 'paragraph', text: fromFriendly('the R&D budget rose') } },
  { what: 'a quotation mark typed in a paragraph', block: { type: 'paragraph', text: fromFriendly('he said "hello" loudly') } },
  { what: 'Enter pressed mid-paragraph', block: { type: 'paragraph', text: fromFriendly('first line\nsecond line') } },
  { what: 'a quotation mark in image alt text', block: { type: 'figure', src: '/assets/post-images/x.jpg', alt: encodeEntities('a screen showing "done"'), caption: fromFriendly('a caption') } },
  { what: 'bold and code together', block: { type: 'paragraph', text: fromFriendly('run `ls -a` to **see** hidden files') } },
];

let broken = 0;
for (const { what, block } of cases) {
  const html = toHtml([block]);
  const back = toBlocks(html);
  const ok = back.length === 1 && back[0].type === block.type && toHtml(back) === html;
  if (ok) continue;
  broken++;
  console.log(`CONTENT  ${what} does not survive: ${JSON.stringify(html.trim().slice(0, 110))}`);
  console.log(`         came back as ${back.length} ${back.map((b) => b.type).join(' + ')} block(s)`);
}

const pages = renderAll(data);
let bad = 0;

for (const [rel, html] of pages) {
  let disk;
  try {
    disk = await readFile(join(ROOT, rel), 'utf8');
  } catch {
    console.log(`MISSING  ${rel}`);
    bad++;
    continue;
  }
  if (disk === html) continue;
  bad++;
  const a = disk.split('\n');
  const b = html.split('\n');
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log(`DIFFERS  ${rel}  (first difference at line ${i + 1})`);
  console.log(`  disk: ${JSON.stringify((a[i] ?? '<eof>').slice(0, 150))}`);
  console.log(`  gen : ${JSON.stringify((b[i] ?? '<eof>').slice(0, 150))}`);
}

console.log(`\n${pages.size - bad}/${pages.size} pages regenerate exactly.`);
console.log(`${bodies.length - lossy}/${bodies.length} bodies survive the block editor.`);
console.log(`${inlineRuns.length - mangled}/${inlineRuns.length} text runs survive the formatting view.`);
console.log(`${cases.length - broken}/${cases.length} awkward-character cases survive.`);
process.exit(bad || lossy || mangled || broken ? 1 : 0);
