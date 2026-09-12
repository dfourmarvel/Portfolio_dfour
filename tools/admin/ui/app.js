// Admin editor. Talks to tools/admin/server.mjs, which owns all file writes.
//
// The content model is shared with the site generator: `blocks.mjs` is the same
// file the build uses, served straight from tools/lib/, so a block edited here
// renders to exactly the HTML the templates expect.

import { toBlocks, toHtml, toFriendly, fromFriendly, decodeEntities, encodeEntities } from '/admin/blocks.mjs';

// ------------------------------------------------------------------- helpers

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, props = {}, kids = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'value') node.value = v;
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) {
    if (kid) node.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return node;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function displayToIso(display) {
  const m = /^([A-Za-z]{3})\w* (\d{1,2}), (\d{4})$/.exec((display || '').trim());
  if (!m) return '';
  const month = MONTHS.indexOf(m[1]);
  if (month === -1) return '';
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}


// Plain-text fields (titles, summaries, link labels) are stored HTML-escaped,
// because they are dropped straight into tags and attributes by the templates.
// The writer always sees and types real characters.
const show = (value) => decodeEntities(value || '');
const store = (value) => encodeEntities(String(value).trim());

const CATEGORY_COLOURS = [
  { value: 'cat-cyber', label: 'Cybersecurity (green)', accent: 'green' },
  { value: 'cat-med', label: 'Medicine / health (rose)', accent: 'rose' },
  { value: 'cat-web', label: 'Web development (cyan)', accent: 'cyan' },
  { value: 'cat-design', label: 'Design (amber)', accent: 'amber' },
];

const ACCENTS = ['green', 'rose', 'cyan', 'amber'];

// A run of <a>/<span> links, kept with the whitespace it was found with so an
// untouched field regenerates byte for byte.
function parseLinks(html, fallbackPrefix = '', fallbackSep = '') {
  const re = /<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  const items = [];
  let m;
  let prefix = null;
  let last = 0;
  const gaps = [];
  while ((m = re.exec(html)) !== null) {
    if (prefix === null) prefix = html.slice(0, m.index);
    else gaps.push(html.slice(last, m.index));
    const attrs = m[2];
    const get = (name) => (attrs.match(new RegExp(`${name}="([^"]*)"`)) || [])[1] || '';
    items.push({
      tag: m[1],
      href: get('href'),
      external: /target="_blank"/.test(attrs),
      rel: get('rel') || 'noopener',
      style: get('style'),
      label: m[3],
    });
    last = re.lastIndex;
  }
  return {
    prefix: prefix ?? fallbackPrefix,
    sep: gaps.length ? gaps[0] : fallbackSep,
    tail: items.length ? html.slice(last) : '',
    items,
  };
}

function serializeLinks(field) {
  if (!field.items.length) return '';
  const body = field.items
    .map((i) => {
      if (i.tag === 'span') return `<span${i.style ? ` style="${i.style}"` : ''}>${i.label}</span>`;
      const ext = i.external ? ` target="_blank" rel="${i.rel || 'noopener'}"` : '';
      return `<a href="${i.href}"${ext}>${i.label}</a>`;
    })
    .join(field.sep);
  return field.prefix + body + field.tail;
}

function parseMeta(meta) {
  return (meta || []).map((raw) => {
    const m = /^<span( class="tag-pill")?>([\s\S]*)<\/span>$/.exec(raw);
    if (m) return { kind: m[1] ? 'pill' : 'plain', text: m[2] };
    return { kind: 'raw', text: raw };
  });
}

const serializeMeta = (chips) =>
  chips
    .filter((c) => c.text.trim())
    .map((c) => (c.kind === 'pill' ? `<span class="tag-pill">${c.text}</span>` : c.kind === 'raw' ? c.text : `<span>${c.text}</span>`));

// ---------------------------------------------------------------------- state

const state = {
  view: 'posts',
  blog: null,
  projects: null,
  images: [],
  draft: null,
  originalSlug: null,
  kind: null,
};

const ADMIN_TOKEN = document.querySelector('meta[name="admin-token"]').content;

async function api(path, options = {}) {
  // Every call carries the session token. Without it the server refuses, which
  // is what stops another website from driving this tool through your browser.
  const res = await fetch(path, {
    ...options,
    headers: { ...(options.headers || {}), 'x-admin-token': ADMIN_TOKEN },
  });
  let payload = {};
  try {
    payload = await res.json();
  } catch {
    /* an empty body is fine */
  }
  if (!res.ok) throw new Error((payload.errors || ['something went wrong']).join('\n'));
  return payload;
}

let toastTimer;
function toast(message, bad = false) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.toggle('bad', bad);
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 3200);
}

async function refresh() {
  const data = await api('/api/data');
  state.blog = data.blog;
  state.projects = data.projects;
  state.images = data.images;
  setStatus(data.dirty);
}

function setStatus(dirty) {
  const node = $('#status');
  const count = dirty ? dirty.split('\n').filter(Boolean).length : 0;
  node.textContent = count ? `${count} unpublished change${count === 1 ? '' : 's'}` : 'everything published';
  node.classList.toggle('dirty', count > 0);
}

// ----------------------------------------------------------------- list views

function listView(kind) {
  const isPosts = kind === 'posts';
  const items = isPosts ? state.blog.posts : state.projects.projects;
  const main = $('#main');
  main.replaceChildren();

  main.append(
    el('div', { class: 'head' }, [
      el('h1', { text: isPosts ? 'Blog posts' : 'Projects' }),
      el('button', { class: 'primary', onclick: () => openEditor(kind, null) }, isPosts ? 'Write a new post' : 'Add a project'),
    ]),
    el('p', { class: 'lede', text: isPosts
      ? 'These are the posts on your blog, newest first. The order here is the order they appear on the site.'
      : 'The projects on your web development page, in the order they appear. Each one has a card and its own detail page.' })
  );

  if (!items.length) {
    main.append(el('p', { class: 'empty', text: 'Nothing here yet.' }));
    return;
  }

  const rows = el('div', { class: 'rows' });
  items.forEach((item, index) => {
    const title = show(isPosts ? item.listTitle : item.name);
    const sub = isPosts ? `${item.date} · ${show(item.category)} · /blog/${item.slug}/` : `${show(item.tag)} · /web-development/${item.slug}/`;
    rows.append(
      el('div', { class: 'row' }, [
        el('div', { class: 'row-main' }, [
          el('span', { class: 'row-title', text: title }),
          el('span', { class: 'row-sub', text: sub }),
        ]),
        el('div', { class: 'row-actions' }, [
          el('button', { class: 'mini', title: 'Move up', disabled: index === 0, onclick: () => move(kind, item.slug, 'up') }, '↑'),
          el('button', { class: 'mini', title: 'Move down', disabled: index === items.length - 1, onclick: () => move(kind, item.slug, 'down') }, '↓'),
          el('a', { class: 'mini', href: isPosts ? `/blog/${item.slug}/` : `/web-development/${item.slug}/`, target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, 'View'),
          el('button', { class: 'mini', onclick: () => openEditor(kind, item.slug) }, 'Edit'),
          el('button', { class: 'mini danger', onclick: () => remove(kind, item.slug, title) }, 'Delete'),
        ]),
      ])
    );
  });
  main.append(rows);
}

async function move(kind, slug, direction) {
  try {
    await api('/api/reorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, slug, direction }) });
    await refresh();
    listView(kind);
  } catch (err) {
    toast(err.message, true);
  }
}

async function remove(kind, slug, title) {
  if (!confirm(`Delete "${title}"?\n\nIts page is removed from the site the next time you publish. This cannot be undone from here.`)) return;
  try {
    const out = await api('/api/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, slug }) });
    await refresh();
    listView(kind);
    if (out.note) alert(`Removed from the site, but the old page folder was kept:

${out.note}`);
    else toast('Deleted. Publish when you are ready.');
  } catch (err) {
    toast(err.message, true);
  }
}

// ------------------------------------------------------------- block editing

const BLOCK_LABELS = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  list: 'Bullet list',
  figure: 'Image',
  verdict: 'Callout',
  blank: 'Spacer',
  raw: 'Custom HTML',
};

function wrapSelection(input, before, after) {
  const { selectionStart: s, selectionEnd: e, value } = input;
  const chosen = value.slice(s, e) || 'text';
  input.value = value.slice(0, s) + before + chosen + after + value.slice(e);
  input.focus();
  input.setSelectionRange(s + before.length, s + before.length + chosen.length);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatBar(getInput) {
  const btn = (label, before, after, title) =>
    el('button', { type: 'button', title, onclick: () => wrapSelection(getInput(), before, after) }, label);
  return el('div', { class: 'fmt' }, [
    btn('B', '**', '**', 'Bold the selected words'),
    btn('i', '*', '*', 'Italicise the selected words'),
    btn('code', '`', '`', 'Show the selection as code or a command'),
    el('button', {
      type: 'button',
      title: 'Turn the selected words into a link',
      onclick: () => {
        const url = prompt('Link address (a full https:// address, or a path on your site like /blog/)');
        if (!url) return;
        wrapSelection(getInput(), '[', `](${url})`);
      },
    }, 'link'),
  ]);
}

function blockEditor(blocks, onChange) {
  const wrap = el('div');
  const list = el('div', { class: 'blocks' });

  const rerender = () => {
    list.replaceChildren();
    blocks.forEach((block, index) => list.append(blockCard(block, index)));
    onChange();
  };

  function blockCard(block, index) {
    const card = el('div', { class: `block${block.type === 'blank' ? ' blank' : ''}` });
    const bar = el('div', { class: 'block-bar' }, [
      el('span', { class: 'block-kind', text: BLOCK_LABELS[block.type] || block.type }),
      el('span', { class: 'spacer' }),
      el('button', { class: 'mini', title: 'Move up', disabled: index === 0, onclick: () => { [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]]; rerender(); } }, '↑'),
      el('button', { class: 'mini', title: 'Move down', disabled: index === blocks.length - 1, onclick: () => { [blocks[index + 1], blocks[index]] = [blocks[index], blocks[index + 1]]; rerender(); } }, '↓'),
      el('button', { class: 'mini danger', title: 'Remove this block', onclick: () => { blocks.splice(index, 1); rerender(); } }, '✕'),
    ]);
    card.append(bar);

    const bind = (node, key) => {
      node.addEventListener('input', () => { block[key] = node.value; onChange(); });
      return node;
    };

    // Text that can carry inline formatting is shown in the writer-facing
    // notation (**bold**, `code`, [text](url)) and converted back on every edit.
    const bindText = (node, key) => {
      node.value = toFriendly(block[key] || '');
      node.addEventListener('input', () => { block[key] = fromFriendly(node.value); onChange(); });
      return node;
    };

    if (block.type === 'heading') {
      card.append(bindText(el('input', { type: 'text', placeholder: 'Section heading' }), 'text'));
    } else if (block.type === 'paragraph') {
      const area = el('textarea', { placeholder: 'Write a paragraph…' });
      // On leaving the box, blank lines become separate paragraphs — what
      // pressing Enter twice looks like it should do.
      area.addEventListener('change', () => {
        const parts = area.value.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
        if (parts.length < 2) return;
        blocks.splice(index, 1, ...parts.map((text) => ({ type: 'paragraph', text: fromFriendly(text), indent: block.indent })));
        rerender();
      });
      card.append(formatBar(() => area), bindText(area, 'text'));
    } else if (block.type === 'list') {
      const area = el('textarea', { value: block.items.join('\n'), placeholder: 'One bullet point per line', rows: Math.max(3, block.items.length) });
      area.addEventListener('input', () => {
        block.items = area.value.split('\n').map((x) => x.trim()).filter(Boolean);
        onChange();
      });
      card.append(el('span', { class: 'row-sub', text: 'One bullet point per line' }), formatBar(() => area), area);
    } else if (block.type === 'figure') {
      card.append(figureFields(block, onChange));
    } else if (block.type === 'verdict') {
      const label = bind(el('input', { type: 'text', value: block.label, placeholder: 'Callout label, e.g. what I learned' }), 'label');
      const area = el('textarea', { placeholder: 'The callout text' });
      card.append(label, el('div', { style: 'height:8px' }), formatBar(() => area), bindText(area, 'text'));
    } else if (block.type === 'raw') {
      card.append(el('span', { class: 'row-sub', text: 'Hand-written HTML from the original page — left exactly as it is unless you change it.' }), bind(el('textarea', { value: block.html }), 'html'));
    }
    return card;
  }

  const add = (type, make) =>
    el('button', { class: 'mini', type: 'button', onclick: () => { blocks.push(make()); rerender(); } }, `+ ${BLOCK_LABELS[type]}`);

  wrap.append(
    list,
    el('div', { class: 'add-block' }, [
      add('paragraph', () => ({ type: 'paragraph', text: '' })),
      add('heading', () => ({ type: 'heading', text: '' })),
      add('list', () => ({ type: 'list', items: [''], multiline: false })),
      add('figure', () => ({ type: 'figure', src: '', alt: '', caption: '' })),
      add('verdict', () => ({ type: 'verdict', labelTag: 'span', label: 'what I learned', text: '' })),
      add('blank', () => ({ type: 'blank' })),
    ])
  );
  rerender();
  return wrap;
}

function figureFields(block, onChange) {
  const wrap = el('div');
  const preview = el('img', { class: 'thumb', alt: '', src: block.src || '', hidden: !block.src });
  const srcInput = el('input', { type: 'text', value: block.src, placeholder: '/assets/post-images/…' });

  const setSrc = (value) => {
    block.src = value;
    srcInput.value = value;
    preview.src = value;
    preview.hidden = !value;
    onChange();
  };

  srcInput.addEventListener('input', () => setSrc(srcInput.value));

  const file = el('input', { type: 'file', accept: 'image/*' });
  file.addEventListener('change', async () => {
    const chosen = file.files[0];
    if (!chosen) return;
    toast('Uploading…');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(chosen);
      });
      const folder = state.kind === 'projects' ? 'project-shots' : 'post-images';
      const out = await api('/api/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: chosen.name, dataUrl, folder }),
      });
      setSrc(out.src);
      state.images.push(out.src);
      toast('Image added');
    } catch (err) {
      toast(err.message, true);
    } finally {
      file.value = '';
    }
  });

  const picker = el('select', {}, [el('option', { value: '' }, '…or choose an image already uploaded')]);
  for (const src of state.images) picker.append(el('option', { value: src, selected: src === block.src }, src.split('/').pop()));
  picker.addEventListener('change', () => picker.value && setSrc(picker.value));

  const alt = el('textarea', { value: decodeEntities(block.alt || ''), placeholder: 'Describe the image for someone who cannot see it — this is read aloud by screen readers.', rows: 2 });
  alt.addEventListener('input', () => { block.alt = encodeEntities(alt.value); onChange(); });

  const caption = el('textarea', { value: toFriendly(block.caption || ''), placeholder: 'Caption shown under the image', rows: 2 });
  caption.addEventListener('input', () => { block.caption = fromFriendly(caption.value); onChange(); });

  wrap.append(
    preview,
    file,
    el('div', { style: 'height:8px' }),
    picker,
    el('div', { style: 'height:8px' }),
    srcInput,
    el('div', { style: 'height:10px' }),
    el('span', { class: 'row-sub', text: 'Alt text (required — describes the image)' }),
    alt,
    el('div', { style: 'height:10px' }),
    el('span', { class: 'row-sub', text: 'Caption' }),
    formatBar(() => caption),
    caption
  );
  return wrap;
}

// ------------------------------------------------------------- small editors

function chipsEditor(values, onChange, placeholder) {
  const wrap = el('div', { class: 'chips' });
  const rerender = () => {
    wrap.replaceChildren();
    values.forEach((value, i) => {
      const input = el('input', { type: 'text', value: show(value), size: Math.max(4, value.length) });
      input.addEventListener('input', () => {
        values[i] = store(input.value);
        input.size = Math.max(4, input.value.length);
        onChange();
      });
      wrap.append(el('span', { class: 'chip' }, [input, el('button', { type: 'button', title: 'Remove', onclick: () => { values.splice(i, 1); rerender(); onChange(); } }, '×')]));
    });
    wrap.append(el('button', { class: 'mini', type: 'button', onclick: () => { values.push(''); rerender(); onChange(); } }, `+ ${placeholder}`));
  };
  rerender();
  return wrap;
}

function metaEditor(chips, onChange) {
  const wrap = el('div', { class: 'chips' });
  const rerender = () => {
    wrap.replaceChildren();
    chips.forEach((chip, i) => {
      const input = el('input', { type: 'text', value: show(chip.text), size: Math.max(4, chip.text.length) });
      input.addEventListener('input', () => { chip.text = store(input.value); input.size = Math.max(4, input.value.length); onChange(); });
      const toggle = el('button', { type: 'button', title: 'Switch between plain text and a coloured pill', onclick: () => { chip.kind = chip.kind === 'pill' ? 'plain' : 'pill'; rerender(); onChange(); } }, chip.kind === 'pill' ? '◉' : '○');
      wrap.append(el('span', { class: 'chip' }, [input, toggle, el('button', { type: 'button', title: 'Remove', onclick: () => { chips.splice(i, 1); rerender(); onChange(); } }, '×')]));
    });
    wrap.append(el('button', { class: 'mini', type: 'button', onclick: () => { chips.push({ kind: 'plain', text: '' }); rerender(); onChange(); } }, '+ detail'));
  };
  rerender();
  return wrap;
}

function linksEditor(field, onChange) {
  const wrap = el('div');
  const rows = el('div');
  const rerender = () => {
    rows.replaceChildren();
    field.items.forEach((item, i) => {
      const label = el('input', { type: 'text', value: show(item.label), placeholder: 'Link text' });
      label.addEventListener('input', () => { item.label = store(label.value); onChange(); });
      const href = el('input', { type: 'text', value: show(item.href), placeholder: '/blog/ or https://…' });
      href.addEventListener('input', () => { item.href = store(href.value); onChange(); });
      const ext = el('input', { type: 'checkbox' });
      ext.checked = item.external;
      ext.addEventListener('change', () => { item.external = ext.checked; onChange(); });
      rows.append(
        el('div', { class: 'link-row' }, [
          label,
          href,
          el('label', {}, [ext, 'new tab']),
          el('button', { class: 'mini danger', type: 'button', onclick: () => { field.items.splice(i, 1); rerender(); onChange(); } }, '✕'),
        ])
      );
    });
  };
  rerender();
  wrap.append(rows, el('button', {
    class: 'mini',
    type: 'button',
    onclick: () => { field.items.push({ tag: 'a', href: '', label: '', external: false, rel: 'noopener', style: '' }); rerender(); onChange(); },
  }, '+ link'));
  return wrap;
}

function field(labelText, control, hint) {
  return el('label', { class: 'field' }, [el('span', {}, [labelText, hint ? el('em', { text: ` — ${hint}` }) : null]), control]);
}

function group(legend, children) {
  return el('fieldset', {}, [el('legend', { text: legend }), ...[].concat(children)]);
}

// ------------------------------------------------------------------- editors

function openEditor(kind, slug) {
  state.kind = kind;
  state.originalSlug = slug;
  if (kind === 'posts') {
    const found = slug ? state.blog.posts.find((p) => p.slug === slug) : null;
    state.draft = found ? structuredClone(found) : newPost();
    postEditor(!found);
  } else {
    const found = slug ? state.projects.projects.find((p) => p.slug === slug) : null;
    state.draft = found ? structuredClone(found) : newProject();
    projectEditor(!found);
  }
  window.scrollTo(0, 0);
}

function newPost() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug: '',
    listTitle: '',
    date: isoToDisplay(today),
    categoryClass: 'cat-cyber',
    category: '',
    title: '',
    description: '',
    accent: 'green',
    meta: [`<span>${isoToDisplay(today)}</span>`],
    body: '        <p></p>',
    footHtml: '          <a href="/blog/">← all write-ups</a>',
  };
}

function newProject() {
  return {
    slug: '',
    tag: '',
    name: '',
    blurb: '',
    linksHtml: '              <a href="/web-development/">← all projects</a>',
    detail: {
      title: '',
      crumb: 'web-development / projects',
      description: '',
      accent: 'cyan',
      lede: '',
      tools: [],
      heroLinksHtml: '        <a href="https://github.com/dfourmarvel/" target="_blank" rel="noopener">github ↗</a>',
      body: '        <p></p>',
      footHtml: '<a href="/web-development/">← all projects</a>',
      labNavHtml: '',
    },
  };
}

function saveBar(kind, isNew, collect) {
  const errors = el('p', { class: 'errors' });
  const save = el('button', { class: 'primary' }, isNew ? 'Create' : 'Save changes');
  save.addEventListener('click', async () => {
    errors.textContent = '';
    save.disabled = true;
    try {
      const item = collect();
      await api(kind === 'posts' ? '/api/posts' : '/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item, originalSlug: state.originalSlug }),
      });
      await refresh();
      state.originalSlug = item.slug;
      toast('Saved. Publish when you are ready.');
      listView(kind);
    } catch (err) {
      errors.textContent = err.message;
    } finally {
      save.disabled = false;
    }
  });

  return el('div', { class: 'save-bar' }, [
    el('button', { class: 'ghost', onclick: () => listView(kind) }, '← Back'),
    errors,
    el('span', { class: 'grow' }),
    save,
  ]);
}

function postEditor(isNew) {
  const post = state.draft;
  const main = $('#main');
  main.replaceChildren();

  const blocks = toBlocks(post.body);
  const metaChips = parseMeta(post.meta);
  const foot = parseLinks(post.footHtml, '          ', '\n          ');
  const sync = () => {};

  const title = el('input', { type: 'text', value: show(post.title), placeholder: 'The headline of the post' });
  const listTitle = el('input', { type: 'text', value: show(post.listTitle), placeholder: 'Defaults to the headline' });
  const slugInput = el('input', { type: 'text', value: post.slug, placeholder: 'auto-generated-from-the-title' });
  const slugTouched = { value: Boolean(post.slug) };
  slugInput.addEventListener('input', () => { slugTouched.value = true; });

  title.addEventListener('input', () => {
    if (!slugTouched.value) slugInput.value = slugify(title.value);
    if (!listTitle.value.trim()) listTitle.placeholder = title.value || 'Defaults to the headline';
  });

  const date = el('input', { type: 'date', value: displayToIso(post.date) });
  const category = el('input', { type: 'text', value: show(post.category), placeholder: 'e.g. network analysis', list: 'categories' });
  const known = [...new Set(state.blog.posts.map((p) => p.category))].sort();
  const datalist = el('datalist', { id: 'categories' }, known.map((c) => el('option', { value: c })));

  const colour = el('select', {}, CATEGORY_COLOURS.map((c) => el('option', { value: c.value, selected: c.value === post.categoryClass }, c.label)));
  const accent = el('select', {}, ACCENTS.map((a) => el('option', { value: a, selected: a === post.accent }, a)));
  colour.addEventListener('change', () => {
    const match = CATEGORY_COLOURS.find((c) => c.value === colour.value);
    if (match) accent.value = match.accent;
  });

  const description = el('textarea', { value: show(post.description), placeholder: 'One or two sentences. This is what Google and LinkedIn show under the link.', rows: 3 });

  main.append(
    el('div', { class: 'head' }, [
      el('h1', { text: isNew ? 'New blog post' : 'Edit post' }),
      isNew ? null : el('a', { class: 'ghost', href: `/blog/${post.slug}/`, target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, 'Preview the page ↗'),
    ]),
    datalist,
    group('the basics', [
      field('Headline', title),
      field('Title in the blog list', listTitle, 'leave blank to reuse the headline'),
      field('Web address', slugInput, 'the last part of the link: /blog/…/'),
      el('div', { class: 'grid2' }, [field('Date', date), field('Topic', category, 'shown as the pill on the card')]),
      el('div', { class: 'grid2' }, [field('Topic colour', colour), field('Page accent colour', accent)]),
      field('Summary for search and link previews', description),
    ]),
    group('the line under the headline', metaEditor(metaChips, sync)),
    group('the post', blockEditor(blocks, sync)),
    group('links at the bottom of the post', linksEditor(foot, sync))
  );

  main.append(saveBar('posts', isNew, () => {
    const headline = store(title.value);
    const shown = isoToDisplay(date.value) || post.date;
    // Keep the meta line honest: the chip that was showing the old date follows
    // the date field, and a new post gets a topic pill without having to add one.
    for (const chip of metaChips) if (chip.kind === 'plain' && chip.text === post.date) chip.text = shown;
    const topic = store(category.value);
    if (topic && !metaChips.some((c) => c.kind === 'pill')) metaChips.splice(1, 0, { kind: 'pill', text: topic });
    return {
      ...post,
      slug: slugInput.value.trim() || slugify(title.value),
      title: headline,
      listTitle: store(listTitle.value) || headline,
      date: shown,
      category: store(category.value),
      categoryClass: colour.value,
      accent: accent.value,
      description: store(description.value),
      meta: serializeMeta(metaChips),
      body: toHtml(blocks),
      footHtml: serializeLinks(foot),
    };
  }));
}

function projectEditor(isNew) {
  const project = state.draft;
  const d = project.detail;
  const main = $('#main');
  main.replaceChildren();

  const blocks = toBlocks(d.body);
  const cardLinks = parseLinks(project.linksHtml, '              ', '\n              ');
  const heroLinks = parseLinks(d.heroLinksHtml, '        ', '\n        ');
  const footLinks = parseLinks(d.footHtml, '', '');
  const navLinks = parseLinks(d.labNavHtml || '', '', '');
  const tools = [...(d.tools || [])];
  const tech = project.tag ? project.tag.split(' · ') : [];
  const sync = () => {};

  const name = el('input', { type: 'text', value: show(project.name), placeholder: 'Project name' });
  const slugInput = el('input', { type: 'text', value: project.slug, placeholder: 'auto-generated-from-the-name' });
  const slugTouched = { value: Boolean(project.slug) };
  slugInput.addEventListener('input', () => { slugTouched.value = true; });
  name.addEventListener('input', () => { if (!slugTouched.value) slugInput.value = slugify(name.value); });

  const blurb = el('textarea', { value: show(project.blurb), placeholder: 'The short description on the project card.', rows: 3 });
  const pageTitle = el('input', { type: 'text', value: show(d.title), placeholder: 'Heading on the project page' });
  const crumb = el('input', { type: 'text', value: show(d.crumb), list: 'crumbs' });
  const crumbs = el('datalist', { id: 'crumbs' }, [...new Set(state.projects.projects.map((p) => p.detail.crumb))].map((c) => el('option', { value: c })));
  const description = el('textarea', { value: show(d.description), placeholder: 'One or two sentences for search results and link previews.', rows: 3 });
  const lede = el('textarea', { value: show(d.lede), placeholder: 'The opening line on the project page.', rows: 3 });
  const accent = el('select', {}, ACCENTS.map((a) => el('option', { value: a, selected: a === d.accent }, a)));
  const heroNote = el('input', { type: 'text', value: (d.heroNoteHtml || '').replace(/<[^>]+>/g, ''), placeholder: 'Optional small note under the links' });

  main.append(
    el('div', { class: 'head' }, [
      el('h1', { text: isNew ? 'New project' : 'Edit project' }),
      isNew ? null : el('a', { class: 'ghost', href: `/web-development/${project.slug}/`, target: '_blank', rel: 'noopener', style: 'text-decoration:none' }, 'Preview the page ↗'),
    ]),
    crumbs,
    group('the card on the projects page', [
      field('Project name', name),
      field('Web address', slugInput, 'the last part of the link: /web-development/…/'),
      field('Technologies on the card', chipsEditor(tech, sync, 'technology'), 'shown joined by dots, e.g. NEXT.JS · TYPESCRIPT'),
      field('Short description', blurb),
      field('Links on the card', linksEditor(cardLinks, sync)),
    ]),
    group('the project page', [
      field('Page heading', pageTitle),
      el('div', { class: 'grid2' }, [field('Breadcrumb', crumb), field('Accent colour', accent)]),
      field('Summary for search and link previews', description),
      field('Opening line', lede),
      field('Tools listed at the top', chipsEditor(tools, sync, 'tool')),
      field('Links at the top', linksEditor(heroLinks, sync)),
      field('Small note under those links', heroNote, 'leave blank for none'),
    ]),
    group('the write-up', blockEditor(blocks, sync)),
    group('links at the bottom', linksEditor(footLinks, sync)),
    group('previous / next project links', linksEditor(navLinks, sync))
  );

  main.append(saveBar('projects', isNew, () => {
    const label = store(name.value);
    const noteText = store(heroNote.value);
    const detail = {
      ...d,
      title: store(pageTitle.value) || label,
      crumb: store(crumb.value),
      description: store(description.value),
      accent: accent.value,
      lede: lede.value.trim(),
      tools: tools.filter((t) => t.trim()),
      heroLinksHtml: serializeLinks(heroLinks),
      body: toHtml(blocks),
      footHtml: serializeLinks(footLinks),
      labNavHtml: serializeLinks(navLinks),
    };
    if (noteText) {
      detail.heroNoteHtml = `<p style="font-family: var(--mono); font-size: 12.5px; color: var(--text-dim); margin-top: 10px;">${noteText}</p>`;
    } else {
      delete detail.heroNoteHtml;
    }
    return {
      ...project,
      slug: slugInput.value.trim() || slugify(name.value),
      name: label,
      tag: tech.filter((t) => t.trim()).join(' · '),
      blurb: store(blurb.value),
      linksHtml: serializeLinks(cardLinks),
      detail,
    };
  }));
}

// ------------------------------------------------------------------- publish

async function openPublish() {
  const dialog = $('#publish');
  const box = $('#publish-changes');
  $('#publish-log').hidden = true;
  $('#publish-log').replaceChildren();
  box.textContent = 'Checking…';
  dialog.showModal();
  try {
    const status = await api('/api/status');
    const lines = status.changes ? status.changes.split('\n').filter(Boolean) : [];
    box.textContent = lines.length
      ? `On branch ${status.branch}. These files will be published:\n\n${lines.join('\n')}`
      : 'Nothing has changed since your last publish.';
    $('#publish-go').disabled = !lines.length;
  } catch (err) {
    box.textContent = err.message;
  }
}

async function doPublish() {
  const message = $('#publish-message').value.trim();
  const log = $('#publish-log');
  const go = $('#publish-go');
  if (!message) {
    toast('Add a short note describing the change', true);
    return;
  }
  go.disabled = true;
  log.hidden = false;
  log.textContent = 'Publishing…';
  try {
    const out = await api('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) });
    log.replaceChildren();
    if (out.nothingToPublish) {
      log.append('Nothing to publish.');
    } else {
      for (const step of out.steps) {
        log.append(el('div', { class: step.ok ? 'pass' : 'fail', text: `${step.ok ? '✓' : '✕'} ${step.step}${step.out ? ` — ${step.out}` : ''}` }));
      }
      if (out.ok) {
        log.append(el('div', { class: 'pass', text: '\nDone. Vercel is rebuilding the site — give it about a minute, then check https://danieldeladzikunu.vercel.app' }));
        $('#publish-message').value = '';
      }
    }
    await refresh();
  } catch (err) {
    log.textContent = err.message;
  } finally {
    go.disabled = false;
  }
}

// --------------------------------------------------------------------- start

$('#tabs').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-view]');
  if (!button) return;
  for (const b of $('#tabs').querySelectorAll('button')) b.classList.toggle('on', b === button);
  state.view = button.dataset.view;
  listView(state.view);
});

$('#publish-open').addEventListener('click', openPublish);
$('#publish-go').addEventListener('click', doPublish);
$('#publish-cancel').addEventListener('click', () => $('#publish').close());

await refresh();
listView('posts');
