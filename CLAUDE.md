# Portfolio_dfour

Daniel Dela Dzikunu's personal portfolio, v2 ("Vital Terminal" design). Vanilla HTML/CSS/JS + locally vendored GSAP — no framework, no bundler. The deployed site is plain static HTML; `package.json` exists only for the authoring tools and is excluded from the deploy. Live at https://danieldeladzikunu.vercel.app (auto-deploys from `main` — pushing = deploying).

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
- `.vercelignore` — repo-only files (PRD.md, README.md, CLAUDE.md, AGENTS.md, cv-source.html, cv-welo-data.html, cv-welo-data.pdf, mockups/, data/, tools/, package.json, .claude/) stay in git but are never deployed. `vercel.json` also pins `framework: null` with no build or install command, so the root `package.json` can never turn the deploy into a Node build.

## Commands
- `npm run admin` — the content admin (see below). Serves the editor at http://localhost:4321/admin/ and the site itself on the same port.
- `npm run verify` — the gate. Asserts every data-driven page regenerates byte for byte and every body survives the block editor. **Run before publishing; a failure means generation would rewrite pages.**
- `npm run generate` — rebuild the blog and web-development pages plus `sitemap.xml` from `data/*.json`.
- `npm run extract` — the inverse: re-read the hand-written HTML back into `data/*.json`. Only needed if a page is edited by hand.
- `npm run link-check` — internal link check across the deployed pages.
- Serve without the admin: `npx serve .` from repo root, or the `portfolio` config in `.claude/launch.json`. Pages use root-absolute paths (`/css/main.css`) so `file://` won't work.
- No tests/lint tooling.

## Content pipeline
`data/blog.json` and `data/projects.json` are the source of truth for `blog/` and `web-development/`. Those pages are generated — **edit the JSON (or use the admin), never the generated HTML**, or the next `npm run generate` overwrites your change. Everything else on the site (`index.html`, `labs/`, the other section pages) is still hand-written and untouched by the generator.

- `tools/lib/templates.mjs` — the page shells. `tools/lib/chrome.mjs` — the shared head/nav/footer/scripts; drift here breaks the byte-for-byte guarantee.
- `tools/lib/blocks.mjs` — the content-block model shared by the generator and the admin editor (heading, paragraph, bullet list, image, callout, spacer, plus a raw fallback). It is served to the browser so both sides use one definition.
- `tools/lib/sitemap.mjs` — `sitemap.xml` is generated from the pages on disk; `lastmod` is each file's last git commit date, today for a page not yet committed.
- `tools/admin/` — the local editor: `server.mjs` (all file writes and git calls) and `ui/`. Bound to 127.0.0.1 only and never deployed.

## Admin tool
`npm run admin` opens a local editor for blog posts and web-development projects: add, edit, reorder and delete, upload images into `assets/post-images/` or `assets/project-shots/`, preview the real page, then Publish (commit + push, which is the deploy).

Safety properties it is built to hold — check these still pass before changing `tools/admin/`:
- **Publish is gated.** `/api/publish` runs `tools/verify.mjs` first and refuses if it fails.
- **Publish is scoped.** Both `git add` and `git commit` carry an explicit pathspec, so a parallel session's staged work in this shared checkout cannot ride along.
- **Delete is narrow.** It removes one `blog/<slug>/` or `web-development/<slug>/` folder, file by file, never recursively, and refuses outright if the folder holds anything the generator did not write. The slug is shape-checked before it is used to build a path, and git is not used to do the removing.
- **Requests must come from the admin page.** Every `/api/` call needs a per-run session token that only the served page receives, plus a matching Origin and a `localhost` Host. Without this, any website open in the same browser could drive the tool — it listens on loopback, but loopback is not a boundary a browser respects.
- **Text is escaped at the edge.** Titles, summaries and labels are stored HTML-escaped and shown decoded; body text goes through `fromFriendly`. A `<` or `&` typed into a post must never reach the page raw. `npm run verify` carries regression cases for this.
- The static handler serves only what the deployed site would: no dotfiles, no `tools/`, `data/`, `mockups/`.

## Conventions
- GSAP is the one sanctioned dependency, vendored at `assets/vendor/gsap/` (the strict CSP allows `script-src 'self'` only). Everything else stays dependency-free — the admin and the generator run on plain Node with no packages installed.
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
- `sitemap.xml` is generated (57 URLs = every `index.html` except mockups and tools). `npm run generate` rebuilds it; adding a hand-written page means running that afterwards.
- The lab topic filter on `cybersecurity/` builds its chips at runtime from each lab card's `.tag` text, so adding a lab card needs no filter edit — but the tag text *is* the filter label, so keep tags consistent (a typo spawns a phantom chip). The intro prose ("Twelve formal lab reports") is still hardcoded — update it by hand. Note the filter deliberately kills the cards' GSAP reveal on first use: filtering reflows the list, and a `ScrollTrigger.refresh()` afterwards would otherwise reset an on-screen card to `opacity: 0`.
