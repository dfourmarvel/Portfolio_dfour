import { head, nav, FOOTER, SCRIPTS } from './chrome.mjs';

function page({ headHtml, accent, bodyHtml }) {
  const bodyAttr = accent ? ` data-ac="${accent}"` : '';
  return `${headHtml}
<body${bodyAttr}>
  <a class="skip-link" href="#main">Skip to content</a>

  <div class="wrap">
${bodyHtml}

${FOOTER}
  </div>

${SCRIPTS}
</body>
</html>
`;
}

export function blogPost(post) {
  const headHtml = head({
    title: `${post.title} — Daniel Dela Dzikunu`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}/`,
    ogTitle: post.title,
    ogDescription: post.description,
    ogType: 'article',
  });
  const meta = post.meta.map((m) => `        ${m}`).join('\n');
  return page({
    headHtml,
    accent: post.accent,
    bodyHtml: `${nav('blog')}

    <header class="page-hero">
      <span class="crumb">blog</span>
      <h1>${post.title}</h1>
      <p class="post-meta">
${meta}
      </p>
    </header>

    <main id="main">
      <section style="padding-top: 40px;">
        <article class="post-body reveal">
${post.body}
        </article>
        <div class="post-foot">
${post.footHtml}
        </div>
      </section>
    </main>`,
  });
}

export function blogIndex({ posts, page: meta }) {
  const headHtml = head({
    title: meta.title,
    description: meta.description,
    canonicalPath: '/blog/',
    ogTitle: meta.ogTitle,
    ogDescription: meta.ogDescription,
    ogType: 'website',
  });
  const list = posts
    .map(
      (p) => `        <a class="post reveal" href="/blog/${p.slug}/">
          <h3>${p.listTitle}</h3>
          <span class="meta-col"><span class="date">${p.date}</span><span class="cat ${p.categoryClass}">${p.category}</span></span>
        </a>`
    )
    .join('\n');
  return page({
    headHtml,
    accent: meta.accent,
    bodyHtml: `${nav('blog')}

    <header class="page-hero">
      <span class="crumb">${meta.crumb}</span>
      <h1>${meta.heroHtml}</h1>
      <p class="lede reveal">${meta.lede}</p>
    </header>

    <main id="main">
      <section>
        <p class="sec-label">${meta.secLabel}</p>
        <h2 class="reveal">${meta.secHeading}</h2>

        <div class="lab-filter" id="blog-filter" role="group" aria-label="Filter posts by topic" hidden></div>
        <p class="visually-hidden" id="blog-filter-status" role="status"></p>

        <div class="blog-list">
${list}
        </div>
      </section>
    </main>`,
  });
}

export function projectIndex({ projects, page: meta }) {
  const headHtml = head({
    title: meta.title,
    description: meta.description,
    canonicalPath: '/web-development/',
    ogTitle: meta.ogTitle,
    ogDescription: meta.ogDescription,
    ogType: 'website',
  });
  const cards = projects
    .map(
      (p) => `          <article class="feat f-web reveal">
            <span class="tag">${p.tag}</span>
            <h3>${p.name}</h3>
            <p>${p.blurb}</p>
            <div class="feat-links">
${p.linksHtml}
            </div>
          </article>`
    )
    .join('\n');
  return page({
    headHtml,
    accent: meta.accent,
    bodyHtml: `${nav('web-dev')}

    <header class="page-hero">
      <span class="crumb">${meta.crumb}</span>
      <h1>${meta.heroHtml}</h1>
      <p class="lede reveal">${meta.lede}</p>
    </header>

    <main id="main">
      <section>
        <p class="sec-label">${meta.secLabel}</p>
        <h2 class="reveal">${meta.secHeading}</h2>

        <div class="feat-grid">
${cards}
        </div>

      </section>
    </main>`,
  });
}

export function projectPage(slug, project) {
  const headHtml = head({
    title: `${project.title} — Daniel Dela Dzikunu`,
    description: project.description,
    canonicalPath: `/web-development/${slug}/`,
    ogTitle: project.title,
    ogDescription: project.description,
    ogType: 'article',
  });
  const labNav = project.labNavHtml ? `\n        <div class="lab-nav">${project.labNavHtml}</div>` : '';
  const tools = project.tools.map((t) => `<span class="tool">${t}</span>`).join('');
  return page({
    headHtml,
    accent: project.accent,
    bodyHtml: `${nav('web-dev')}

    <header class="page-hero">
      <span class="crumb">${project.crumb}</span>
      <h1>${project.title}</h1>
      <p class="lede reveal">${project.lede}</p>
      <div class="lab-tools reveal">${tools}</div>
      <div class="feat-links reveal">
${project.heroLinksHtml}
      </div>
    </header>

    <main id="main">
      <section style="padding-top: 40px;">
        <article class="lab-body reveal">
${project.body}
        </article>
        <div class="post-foot">${project.footHtml}</div>${labNav}
      </section>
    </main>`,
  });
}
