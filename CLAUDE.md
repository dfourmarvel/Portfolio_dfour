# Portfolio_dfour

Daniel Dela Dzikunu's personal portfolio, v2 ("Vital Terminal" design). Vanilla HTML/CSS/JS + GSAP via CDN — no framework, no build step, no package.json. Live at https://danieldeladzikunu.vercel.app (auto-deploys from `main` — pushing = deploying).

## Structure
- `index.html` — homepage hub; section pages live at `medicine/`, `cybersecurity/`, `web-development/`, `graphic-design/`, `certifications/`, `blog/` (each is a directory with an `index.html`)
- `labs/<slug>/` — full cybersecurity lab-report detail pages (the deep layer behind the blog summaries). Terminal-styled command blocks, data tables, verdict callouts, extracted screenshots. Linked from the cybersecurity section and from each matching blog post's footer. Figures live in `assets/lab-figures/` (extracted from Daniel's PDF reports with mupdf; qwiklabs browser chrome cropped out — never re-introduce it)
- `web-development/<slug>/` — project detail pages (the web-dev equivalent of `labs/`). Same template components as a lab page, themed cyan via `data-ac`. Screenshots live in `assets/project-shots/`
- `css/main.css` — single shared stylesheet; per-page accent color set via `<body data-ac="rose|green|cyan|amber">`
- `js/main.js` — single shared script (terminal typing, GSAP reveals, mobile menu, copy-email)
- `404.html` — custom not-found page (Vercel picks it up automatically). Carries `noindex`, so it deliberately has no description/OG tags.
- `assets/` — images (incl. `og.png` social preview), certificate PDFs
- `mockups/` — phase-1 design explorations; not linked from the site
- `PRD.md` — the spec for the v2 overhaul; check it before structural changes
- `sitemap.xml` / `robots.txt` — sitemap is generated, not hand-written (see Conventions)
- `.vercelignore` — repo-only files (PRD.md, README.md, CLAUDE.md, AGENTS.md, cv-source.html, cv-welo-data.html, cv-welo-data.pdf, mockups/, data/, tools/, .claude/) stay in git but are never deployed

## Commands
- Serve locally: `npx serve .` from repo root, or use the `portfolio` config in `.claude/launch.json`. Pages use root-absolute paths (`/css/main.css`) so `file://` won't work.
- No tests/lint tooling.

## Conventions
- GSAP is the one sanctioned dependency (CDN `<script>` tags). Everything else stays dependency-free.
- Dark mode only — no light theme, no toggle.
- Animation contract: content must never be stuck invisible. Hidden-until-animated styles are gated on `body.anim`, which `js/main.js` adds only after confirming GSAP will run. Respect `prefers-reduced-motion` in any new animation.
- Nav/footer are duplicated across all pages (deliberate no-build tradeoff) — a nav change means editing every `index.html` + `404.html`.
- Domain accent colors: medicine=rose, cybersecurity=green, web-dev=cyan, design=amber. Keep new components on this system.
- Course certificates live in `assets/certificates/` (named `google-NN-course-name.pdf`) and are linked per-course in `certifications/index.html`; follow the same pattern when courses 6–8 complete.
- `cv.pdf` is generated from `cv-source.html` (deliberately excludes Daniel's phone number — never add it). Regenerate after edits with:
  `chrome --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=cv.pdf cv-source.html`
- Content must reflect Daniel's real work — check `cybersecurity-labs` and other project repos when updating sections. No invented projects, stats, or post titles.
- Lab-page terminal blocks must match the commands in Daniel's source lab reports verbatim — never reconstruct them from memory. Sources: `cybersecurity-labs/` and the lab PDFs/DOCX in `~/Downloads`. (A generator once silently ate the first 4 characters of every `$` prompt line, publishing `56sum` for `sha256sum`; re-read the source when touching these.)
- Every page carries the full meta set: `canonical`, `og:title/description/type/url/image`, `twitter:card/title/description/image`. Copy the block from an existing page when adding one — `og:type` is `article` for `blog/` and `labs/`, `website` elsewhere.
- Adding or removing a page means regenerating `sitemap.xml` (47 URLs = every `index.html` except mockups; `lastmod` comes from each file's last git commit date).
- The lab topic filter on `cybersecurity/` builds its chips at runtime from each lab card's `.tag` text, so adding a lab card needs no filter edit — but the tag text *is* the filter label, so keep tags consistent (a typo spawns a phantom chip). The intro prose ("Twelve formal lab reports") is still hardcoded — update it by hand. Note the filter deliberately kills the cards' GSAP reveal on first use: filtering reflows the list, and a `ScrollTrigger.refresh()` afterwards would otherwise reset an on-screen card to `opacity: 0`.
