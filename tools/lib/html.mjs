// Small string-slicing helpers. Deliberately NOT a DOM parser: generation must
// reproduce the existing hand-written HTML byte for byte, and every serializer
// normalises something (attribute order, quotes, void tags, whitespace).

export function between(html, startMarker, endMarker, { from = 0, required = true, label = '' } = {}) {
  const s = html.indexOf(startMarker, from);
  if (s === -1) {
    if (required) throw new Error(`missing start marker ${JSON.stringify(startMarker)} ${label}`);
    return null;
  }
  const contentStart = s + startMarker.length;
  const e = html.indexOf(endMarker, contentStart);
  if (e === -1) {
    if (required) throw new Error(`missing end marker ${JSON.stringify(endMarker)} ${label}`);
    return null;
  }
  return { value: html.slice(contentStart, e), start: s, contentStart, contentEnd: e, end: e + endMarker.length };
}

export function inner(html, startMarker, endMarker, opts) {
  const hit = between(html, startMarker, endMarker, opts);
  return hit === null ? null : hit.value;
}

export function attrOf(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

// Read a `<meta ... content="X">` value by its name= or property= key.
export function metaContent(html, key) {
  const m = html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`));
  return m ? m[1] : null;
}

// HTML-escape for text destined for an attribute or text node. The source pages
// use named entities (&amp;) only where required, so we match that.
export function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function unesc(text) {
  return String(text)
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

// Split a run of sibling elements that all start with the same opening marker.
// Returns the raw outer HTML of each sibling, whitespace between them dropped.
export function splitSiblings(container, openMarker, closeMarker) {
  const out = [];
  let i = 0;
  for (;;) {
    const s = container.indexOf(openMarker, i);
    if (s === -1) break;
    const e = container.indexOf(closeMarker, s);
    if (e === -1) throw new Error(`unbalanced ${openMarker}`);
    out.push(container.slice(s, e + closeMarker.length));
    i = e + closeMarker.length;
  }
  return out;
}
