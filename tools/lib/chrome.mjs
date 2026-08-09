// The shared page shell (head, nav, footer, scripts) exactly as it appears in
// the hand-written pages. Anything here that drifts breaks the round-trip check.

export const SITE_ORIGIN = 'https://danieldeladzikunu.vercel.app';

const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230a0e0c'/><text x='50' y='68' text-anchor='middle' font-size='52' font-family='monospace' font-weight='bold' fill='%233df5a5'>DD</text></svg>">`;

const NAV_ITEMS = [
  { key: 'medicine', href: '/medicine/', label: 'medicine' },
  { key: 'cybersecurity', href: '/cybersecurity/', label: 'cybersecurity' },
  { key: 'web-dev', href: '/web-development/', label: 'web-dev' },
  { key: 'design', href: '/graphic-design/', label: 'design' },
  { key: 'certs', href: '/certifications/', label: 'certs' },
  { key: 'blog', href: '/blog/', label: 'blog' },
  { key: 'contact', href: '/#contact', label: 'contact' },
];

export function head({ title, description, canonicalPath, ogTitle, ogDescription, ogType, ogImage }) {
  const url = SITE_ORIGIN + canonicalPath;
  const image = ogImage || `${SITE_ORIGIN}/assets/images/og.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${image}">
  ${FAVICON}
  <link rel="stylesheet" href="/css/main.css">
</head>`;
}

export function nav(currentKey) {
  const links = NAV_ITEMS.map((item) => {
    const current = item.key === currentKey ? ' aria-current="page"' : '';
    return `        <a href="${item.href}"${current}>${item.label}</a>`;
  }).join('\n');
  return `    <nav class="site-nav" aria-label="Main navigation">
      <a class="brand" href="/"><span class="beat" aria-hidden="true">♥</span> daniel@portfolio<span>:~$</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation menu">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-menu" id="nav-menu">
${links}
        <a class="cv-btn" href="/cv.pdf" target="_blank" rel="noopener">CV ↓</a>
      </div>
    </nav>`;
}

export const FOOTER = `    <footer class="site-footer">
      <span>© 2026 Daniel Dela Dzikunu</span>
      <span>built by hand · no template</span>
    </footer>`;

export const SCRIPTS = `  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="/js/main.js"></script>`;
