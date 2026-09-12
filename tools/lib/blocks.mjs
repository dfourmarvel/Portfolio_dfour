// Turns a post/project body into a list of editable content blocks and back.
// The admin form edits blocks, never raw HTML. Anything the parser does not
// recognise survives as a `raw` block, so nothing can be silently dropped:
// toBlocks() -> toHtml() is asserted lossless for every existing page by
// `npm run verify`.
//
// Blocks keep the indentation they were found with, because the blog pages and
// the project pages were hand-written with different list layouts and both must
// regenerate byte for byte.

const INDENT = '        ';

const FIGURE = /^<figure class="lab-fig"><img src="([^"]*)" alt="([^"]*)" loading="lazy"><figcaption>([\s\S]*)<\/figcaption><\/figure>$/;
const VERDICT = /^<div class="verdict"><(span|p) class="v-label">([\s\S]*?)<\/(?:span|p)>([\s\S]*)<\/div>$/;
const HEADING = /^<h3>([\s\S]*)<\/h3>$/;
const PARA = /^<p>([\s\S]*)<\/p>$/;
const LIST = /^<ul>([\s\S]*)<\/ul>$/;
const LI = /^<li>([\s\S]*)<\/li>$/;


// HTML entities. The editor shows real characters; the page stores entities.
// Encode order matters (& first); decode order is the mirror (&amp; last).
// Attributes need quotes escaped; running prose does not, and the site's posts
// are full of straight quotation marks that must stay exactly as written.
export const decodeEntities = (text) =>
  String(text).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export const encodeEntities = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decodeText = (text) =>
  String(text).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const encodeText = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Blocks that occupy a single line must never contain one. A stray newline
// would be re-parsed as two unrecognised blocks, turning the writer's own prose
// into raw HTML the next time the post is opened.
const oneLine = (text) => String(text).replace(/\s*\n\s*/g, ' ');

// src and alt already hold escaped attribute text; this only repairs a raw
// quote or newline that would otherwise break out of the attribute.
const attr = (text) => oneLine(text).replace(/"/g, '&quot;');

const indentOf = (line) => line.match(/^[ \t]*/)[0];

export function toBlocks(body) {
  if (!body) return [];
  const lines = body.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ind = indentOf(line);
    const t = line.trim();
    if (!t) { blocks.push({ type: 'blank' }); continue; }
    let m;

    // A <ul> spread over several lines, one <li> per line (the project pages).
    if (t === '<ul>') {
      const items = [];
      let j = i + 1;
      let itemIndent = ind + '  ';
      for (; j < lines.length && lines[j].trim() !== '</ul>'; j++) {
        const li = lines[j].trim().match(LI);
        if (!li) break;
        itemIndent = indentOf(lines[j]);
        items.push(li[1]);
      }
      if (j < lines.length && lines[j].trim() === '</ul>' && items.length) {
        blocks.push({ type: 'list', items, indent: ind, itemIndent, multiline: true });
        i = j;
        continue;
      }
    }

    if ((m = t.match(FIGURE))) { blocks.push({ type: 'figure', src: m[1], alt: m[2], caption: m[3], indent: ind }); continue; }
    if ((m = t.match(VERDICT))) { blocks.push({ type: 'verdict', labelTag: m[1], label: m[2], text: m[3], indent: ind }); continue; }
    if ((m = t.match(HEADING))) { blocks.push({ type: 'heading', text: m[1], indent: ind }); continue; }
    if ((m = t.match(LIST))) {
      const items = [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
      if (items.map((x) => `<li>${x}</li>`).join('') === m[1]) {
        blocks.push({ type: 'list', items, indent: ind, multiline: false });
        continue;
      }
    }
    if ((m = t.match(PARA)) && !m[1].includes('</p>')) { blocks.push({ type: 'paragraph', text: m[1], indent: ind }); continue; }
    blocks.push({ type: 'raw', html: t, indent: ind });
  }
  return blocks;
}

export function toHtml(blocks) {
  return blocks
    .map((b) => {
      const ind = b.indent ?? INDENT;
      switch (b.type) {
        case 'blank':
          return '';
        case 'heading':
          return `${ind}<h3>${oneLine(b.text)}</h3>`;
        case 'paragraph':
          return `${ind}<p>${oneLine(b.text)}</p>`;
        case 'list': {
          if (b.multiline) {
            const li = b.itemIndent ?? ind + '  ';
            return [`${ind}<ul>`, ...b.items.map((x) => `${li}<li>${oneLine(x)}</li>`), `${ind}</ul>`].join('\n');
          }
          return `${ind}<ul>${b.items.map((x) => `<li>${oneLine(x)}</li>`).join('')}</ul>`;
        }
        case 'figure':
          return `${ind}<figure class="lab-fig"><img src="${attr(b.src)}" alt="${attr(b.alt)}" loading="lazy"><figcaption>${oneLine(b.caption)}</figcaption></figure>`;
        case 'verdict':
          return `${ind}<div class="verdict"><${b.labelTag || 'span'} class="v-label">${oneLine(b.label)}</${b.labelTag || 'span'}>${oneLine(b.text)}</div>`;
        default:
          return `${ind}${b.html}`;
      }
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Inline formatting. Inside a paragraph, list item or caption, bold/italic/code/
// links are shown to the writer as **bold**, *italic*, `code` and [text](url)
// instead of HTML tags. `npm run verify` asserts this round-trips exactly, so
// the notation never rewrites existing wording.
const ESCAPES = [['\\', '\\\\'], ['*', '\\*'], ['`', '\\`'], ['[', '\\['], [']', '\\]']];

function escapeText(text) {
  let out = text;
  for (const [from, to] of ESCAPES) out = out.split(from).join(to);
  return out;
}

function unescapeText(text) {
  return text.replace(/\\([\\*`\[\]])/g, '$1');
}

const TOKEN = /<(b|em|code|a)\b([^>]*)>([\s\S]*?)<\/\1>/g;

export function toFriendly(html) {
  let out = '';
  let last = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(html)) !== null) {
    out += escapeText(html.slice(last, m.index));
    const inner = escapeText(m[3]);
    if (m[1] === 'b') out += `**${inner}**`;
    else if (m[1] === 'em') out += `*${inner}*`;
    else if (m[1] === 'code') out += '`' + inner + '`';
    else {
      const href = (m[2].match(/href="([^"]*)"/) || [])[1] || '';
      out += `[${inner}](${href})`;
    }
    last = TOKEN.lastIndex;
  }
  return decodeText(out + escapeText(html.slice(last)));
}

const LINK = /(^|[^\\])\[((?:\\.|[^\]\\])*)\]\(([^)]*)\)/;
const BOLD = /(^|[^\\])\*\*((?:\\.|[^*\\])+)\*\*/;
const ITALIC = /(^|[^\\])\*((?:\\.|[^*\\])+)\*/;
const CODE = /(^|[^\\])`((?:\\.|[^`\\])+)`/;

export function fromFriendly(text, { linkRel = 'noreferrer' } = {}) {
  // Encode before any tag is inserted, so the tags themselves are left alone.
  let out = encodeText(text);
  let m;
  while ((m = LINK.exec(out)) !== null) {
    const href = m[3];
    const external = /^https?:/i.test(href);
    const attrs = external ? ` target="_blank" rel="${linkRel}"` : '';
    out = out.slice(0, m.index) + m[1] + `<a href="${href}"${attrs}>${m[2]}</a>` + out.slice(m.index + m[0].length);
  }
  for (const [re, open, close] of [[BOLD, '<b>', '</b>'], [CODE, '<code>', '</code>'], [ITALIC, '<em>', '</em>']]) {
    while ((m = re.exec(out)) !== null) {
      out = out.slice(0, m.index) + m[1] + open + m[2] + close + out.slice(m.index + m[0].length);
    }
  }
  return unescapeText(out);
}
