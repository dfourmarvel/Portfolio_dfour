# Portfolio_dfour

Daniel Dela Dzikunu's personal portfolio, v2 ("Vital Terminal" design). Vanilla HTML/CSS/JS + GSAP via CDN — no framework, no build step, no package.json. Live at https://danieldeladzikunu.vercel.app (auto-deploys from `main` — pushing = deploying).

## Structure
- `index.html` — homepage hub; section pages live at `medicine/`, `cybersecurity/`, `web-development/`, `graphic-design/`, `certifications/`, `blog/` (each is a directory with an `index.html`)
- `css/main.css` — single shared stylesheet; per-page accent color set via `<body data-ac="rose|green|cyan|amber">`
- `js/main.js` — single shared script (terminal typing, GSAP reveals, mobile menu, copy-email)
- `404.html` — custom not-found page (Vercel picks it up automatically)
- `assets/` — images (incl. `og.png` social preview), certificate PDFs
- `mockups/` — phase-1 design explorations; not linked from the site
- `PRD.md` — the spec for the v2 overhaul; check it before structural changes

## Commands
- Serve locally: `npx serve .` from repo root (port anything). Pages use root-absolute paths (`/css/main.css`) so `file://` won't work.
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
