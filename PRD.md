# PRD — Portfolio Overhaul (Portfolio_dfour v2)

**Owner:** Daniel Dela Dzikunu
**Status:** Draft for review
**Last updated:** 2026-07-15

---

## 1. Overview

Complete overhaul of danieldzikunu's personal portfolio. The current site (v1) is a
multi-page vanilla HTML/CSS/JS site that is functional but visually dull, reads
"AI-generated," has an empty Projects page, and doesn't reflect the four real areas
of Daniel's work. v2 is a ground-up rebuild: new architecture, new design, new
content model, real projects.

### Goals

1. Impress anyone who lands on the site within the first screen — visually and in content.
2. Make it instantly clear **what Daniel does**: medicine, cybersecurity, web development, graphic design.
3. Let a visitor interested in any one of those areas click into a dedicated, detailed section for it.
4. Showcase real, verifiable work: live demos, lab write-ups, certificates, LinkedIn posts.
5. Look hand-crafted and heavily animated — the opposite of "dull and AI."

### Non-goals

- Not optimized for one specific recruiter type — this is a general "anyone who Googles me" site.
- No timeline/journey section.
- No photo of Daniel at launch (may be added later).
- No light mode (see §6).
- No contact form (see §5.8).
- No CMS/backend — static site, content edited in code.

---

## 2. Audience & positioning

- **Audience:** general — classmates, mentors, LinkedIn connections, potential collaborators, anyone who searches Daniel's name. No single recruiter persona.
- **Positioning:** medicine + cybersecurity are the headline identity, with cybersecurity reading strongest in tone/aesthetic, and the "builder" angle (web dev, design) woven through. All four domains get equal structural weight (own sections), but the homepage presents them in this order:
  1. **Medicine / Health**
  2. **Cybersecurity**
  3. **Web Development**
  4. **Graphic Design**
- **The test:** a stranger should leave the homepage able to say *"medical student, serious about cybersecurity, builds websites and designs posters — and the site itself proves he can build."*

## 3. Voice & tone

- **Confident learner.** "Here's what I can do, here's what I'm learning next." Never apologetic, never "just a beginner," never inflated either.
- Kill v1 phrasings like "willingness to start small," "building competence before advanced work," "learner."
- Concrete over generic: name the tools, the labs, the courses, the numbers (e.g., "5 of 8 Google Cybersecurity courses complete").
- Medicine: interested in **surgery**; explicitly state the surgical specialty is **not yet chosen**.

---

## 4. Site architecture

Multi-page. Homepage is a **hub** that introduces Daniel and routes visitors into four domain sections. Each domain section lists its work at surface level; each piece of work can be clicked into for full detail (two-layer model, §5.9).

```
/                       Homepage (hub)
/medicine/              Health & Medicine section
/cybersecurity/         Cybersecurity section (labs + certs summary)
/web-development/       Web Development section (coding projects)
/graphic-design/        Graphic Design section (poster gallery)
/certifications/        Certifications page
/blog/                  Blog index (LinkedIn-linked write-ups)
/blog/<slug>/           Individual post pages
/<domain>/<slug>/       Project / lab detail pages
/contact/  (or #contact on home)   Contact
/cv.pdf                 Downloadable CV  [Daniel provides PDF later]
```

**Navigation (all pages):** Home · Medicine · Cybersecurity · Web Dev · Design · Certifications · Blog · Contact — plus a visually distinct **CV** download button. Mobile: animated full-screen menu (not a plain dropdown).

**Cut from v1:** Skills page (redundant — skills are demonstrated inside each domain section), standalone About page (absorbed into homepage + Medicine section), contact form, Security+ "planned" entry.

---

## 5. Page-by-page requirements

### 5.1 Homepage (hub)

The most important page. Sections top to bottom:

1. **Hero.** Full-viewport, heavily animated (see §7). Name, headline identity
   (medicine + cybersecurity, builder energy), one-to-two-line intro, primary CTA
   ("Explore my work" → scrolls to domain portals), secondary CTA (CV download).
   Social links: GitHub, LinkedIn. No photo.
2. **Domain portals.** Four large, animated, clearly clickable cards/panels — Medicine,
   Cybersecurity, Web Development, Graphic Design, in that order. Each has a title, a
   one-sentence promise of what's inside, a small stat or highlight (e.g., "6 labs
   documented" / "3 live projects"), and a strong hover/entry animation. These are the
   navigation centerpiece of the whole site.
3. **Featured work strip.** 2–4 hand-picked items across domains (e.g., best lab, best
   web project) with links into their detail pages.
4. **Certifications snapshot.** Compact strip: Cisco (completed), Google Cybersecurity
   (in progress, 5/8). Links to /certifications/.
5. **Latest from the blog.** 2–3 most recent posts.
6. **Contact block.** See §5.8.
7. **Footer.** Nav links, socials, copyright.

### 5.2 Medicine / Health section (`/medicine/`)

Listed first among the domains. Launches light on content — designed so it doesn't *look* empty.

- **Intro block:** Daniel's medical story — first-year medical student, drawn to
  **surgery**, specialty **deliberately not yet chosen**; how medical training shapes
  how he works (observation, discipline, structured problem-solving). Detailed prose,
  confident-learner voice. This carries the page at launch.
- **Work in this space:**
  - *Blood donation education* — community education initiative; card links to detail
    page and/or the LinkedIn post about it. **[Daniel provides the LinkedIn post URL + a photo or two if available]**
  - *Menstrual Health Game* — cross-listed here and in Web Development (§5.4). Same
    detail page, listed in both sections.
- **Grows over time:** the section's list layout must look intentional with 2 items and
  scale to 10+.

### 5.3 Cybersecurity section (`/cybersecurity/`)

- **Intro block:** current focus (networking, packet analysis, Linux, security
  fundamentals), lab environment (Kali Linux in VirtualBox, Wireshark, tcpdump),
  certification track summary linking to /certifications/.
- **Labs list:** every documented lab from the `cybersecurity-labs` repo as a card:
  title, one-line summary, tools used (as tags), course/context, date. Click →
  detail page (§5.9). Content source: existing lab documentation repo. **[Confirm at
  build time which labs are polished enough to publish]**
- Labs are **strictly separate** from web dev projects — different section, and the
  card design may differ (labs can lean more terminal-styled).
- Filterable by tool/topic if lab count > ~6.

### 5.4 Web Development section (`/web-development/`)

- **Intro block:** short — what Daniel builds and with what (vanilla HTML/CSS/JS,
  Next.js/TypeScript, learning in public).
- **Projects** (launch set):
  | Project | Live demo | Notes |
  |---|---|---|
  | med-match-gh | Vercel | Next.js/TS + Supabase app. Do **not** expose real user data in screenshots. |
  | Bible-quiz | needs deploy | Vanilla JS game. |
  | Menstrual-health-game | needs deploy | Cross-listed in Medicine. |
  | Mothers-Day | needs deploy | Personal tribute site. Contains photos/audio of Daniel's mother — Daniel has confirmed this content is already public and approved including it. |
  | This portfolio (v2) | itself | "The site you're on" — meta-project with its own write-up. |
- Each project card: screenshot/preview, name, one-liner, stack tags, **Live demo**
  button + **GitHub** button, click-through to detail page.
- **Prerequisite task:** deploy Bible-quiz, Menstrual-health-game, and Mothers-Day
  (Vercel) so live demo links work. Part of the build plan, before launch.

### 5.5 Graphic Design section (`/graphic-design/`)

- Content: **posters Daniel has made**, supplied later as PNG/JPEG files.
  **[Daniel provides image files + for each: title, what it was for, tool used]**
- Layout: visual-first gallery (masonry or uniform grid), click → lightbox/enlarged
  view with caption. No long write-ups needed per piece.
- Must ship with a designed "first pieces coming soon"-quality state if images aren't
  ready at launch — but strongly prefer launching with at least 2–3 pieces.

### 5.6 Certifications page (`/certifications/`)

- **Cisco Introduction to Cybersecurity** — Completed. Certificate PDF viewable
  (asset already in repo).
- **Google Cybersecurity Certificate** — In progress, **5 of 8 courses complete**;
  show per-course progress (course names + done/in-progress). Certificate PDFs for
  completed courses added later. **[Daniel provides PDFs]**
- **Security+ is removed entirely** — no "planned" certifications anywhere on the site.
- Design: certificates presented as substantial, visual cards (not a bullet list).

### 5.7 Blog (`/blog/`)

- **Model:** blog posts are Daniel's **LinkedIn posts, attached to projects or labs.**
  Each post lives on the site as its own page (full text, images), with a "View on
  LinkedIn" link to the original. The site is the permanent home; LinkedIn is the
  distribution channel.
- Each post is **linked to the project/lab it's about**: the post page links to the
  project detail page and vice versa ("Read the write-up" ↔ "Read the LinkedIn post").
- Index page: reverse-chronological cards (title, date, domain tag, excerpt).
- Launch content: existing LinkedIn lab posts + the blood-donation post.
  **[Daniel provides LinkedIn URLs; text can be pulled from the posts]**

### 5.8 Contact

- **No form.** A well-designed contact block (on homepage + optionally its own page):
  - **Email:** `danieldeladzikunu@gmail.com` **[confirm — see Open Items]**
  - **LinkedIn:** linkedin.com/in/danieldeladzikunu4
  - **GitHub:** github.com/dfourmarvel
  - **No phone/WhatsApp** — decided against publishing a number (scraper/spam exposure).
- Email gets a one-click copy-to-clipboard interaction in addition to `mailto:`.

### 5.9 Detail pages (projects & labs) — the two-layer model

Every project/lab has:

- **Layer 1 (card):** in its section list — image/preview, title, one-liner, tags,
  quick links (live demo / GitHub / LinkedIn post where applicable).
- **Layer 2 (detail page):** template with:
  - Hero: title, domain, date, tag row, quick links.
  - **Overview** — what it is, in 2–3 sentences (for skimmers).
  - **The problem / the goal.**
  - **What I did / how it works** — the detailed middle: tools, steps, decisions.
    For labs: methodology, commands, screenshots. For apps: features, stack, architecture notes.
  - **Screenshots / media** — lightbox gallery.
  - **What I learned.**
  - **Links:** live demo, GitHub, related blog/LinkedIn post.
  - Prev/next navigation within the section.
- One shared template, styled per domain (labs terminal-flavored, design pieces visual-first).

---

## 6. Design direction

### 6.1 Overall aesthetic

- **Dark only.** No light mode, no toggle. The dark theme is the designed theme.
- **Base vibe: dark terminal/cyber — but refined.** Think "beautiful modern portfolio
  that happens to have hacker DNA," not a green-on-black Hollywood terminal. Subtle
  scan-line/grid/glow motifs are welcome; cheesy Matrix rain is not.
- Must **not** look medical/clinical, and must not look like a template or AI output.
  Hand-crafted details everywhere: custom hover states, distinctive type treatment,
  intentional asymmetry.

### 6.2 Design selection process

Before building the real site, produce **2–3 distinct homepage design mockups**
(same content, different art direction — e.g., different palette, type, and motion
personality). Daniel reviews them **running in the browser** (not static images) and
picks one; the chosen direction then drives the full build. Budget one iteration round
on the winner.

### 6.3 Color & type

- **Palette:** open — designer's choice per mockup ("go crazy, but make it nice").
  Each mockup proposes its own palette on a dark base. Requirements: WCAG AA contrast
  for body text, one dominant accent color used with discipline, accents may vary per
  domain section (subtle per-section color coding is encouraged).
- **Typography:** each mockup proposes a pairing. Monospace is welcome as an *accent*
  (labels, tags, code, terminal flourishes) — body text stays a highly readable sans.
  Self-hosted font files (no external font CDNs at runtime if avoidable).

### 6.4 Imagery

- No photo of Daniel at launch; hero is typographic/graphic. Design should accommodate
  adding a photo later without a redesign.
- Project screenshots and poster images are the site's main imagery — they must be
  presented large and well-framed.

---

## 7. Animation & interaction

This is a headline requirement: the site must feel **alive and impressive**.

- **Stack:** GSAP (+ ScrollTrigger) via `<script>` tag — no build step — on top of
  modern CSS (transitions, keyframes, view transitions where supported). This replaces
  v1's "no external dependencies" rule; GSAP is the one sanctioned dependency.
- **Required moments:**
  - **Hero entrance:** orchestrated multi-element intro (staggered text reveal,
    animated accent graphics). The single most impressive moment on the site.
  - **Domain portal cards:** strong hover/focus states and entrance animations —
    these are the site's signature interaction.
  - **Scroll-driven reveals** throughout (staggered, varied — not one repeated fade-up).
  - **Page transitions** between pages (View Transitions API with graceful fallback).
  - **Micro-interactions:** link hovers, button presses, copy-email feedback, nav
    open/close.
  - Optional per-mockup: one tasteful terminal-flavored flourish (e.g., a typing
    effect in the hero) — max one gimmick per design.
- **Constraints:** 60fps (transform/opacity only for animated properties), no layout
  jank, total JS budget small (GSAP core + ScrollTrigger ≈ 90KB min+gz combined is fine).
- **`prefers-reduced-motion` is fully respected:** all decorative animation collapses
  to simple fades or nothing. Non-negotiable.

---

## 8. Technical requirements

- **Stack:** vanilla HTML/CSS/JS + GSAP. No framework, no build step. Shared
  header/footer kept consistent across pages manually (or via a tiny JS include —
  decide at build time and note it in the project CLAUDE.md).
- **Hosting:** Vercel, `*.vercel.app` domain. Custom domain out of scope for now.
- **Responsive:** flawless from 360px phones to large desktop. Mobile gets the same
  wow-factor (adapted, not stripped). Test at 375px, 768px, 1280px+ minimum.
- **Accessibility:** semantic HTML, full keyboard navigability, visible focus states,
  WCAG AA contrast, alt text on all images, `aria` on interactive components,
  reduced-motion support (§7).
- **SEO / social:** per-page titles + meta descriptions; Open Graph + Twitter card
  tags with a **custom-designed OG image** (dark, on-brand) so shared links look
  impressive on LinkedIn; JSON-LD Person schema (carried over from v1, updated);
  sitemap.xml + robots.txt.
- **Performance:** Lighthouse ≥ 90 on Performance/A11y/Best Practices/SEO (mobile).
  Optimized images (WebP/AVIF with fallbacks, lazy-loading below the fold).
- **Privacy:** no analytics at launch; no real user data from med-match-gh in any
  screenshot; email exposed deliberately, phone/WhatsApp never published. Mothers-Day
  is showcased with Daniel's explicit approval (content already public).
- **Repo hygiene:** v2 replaces v1 in this repo on `main` (v1 remains in git history).
  Update README and CLAUDE.md to describe v2.

---

## 9. Content inventory

### Exists now
- Cisco certificate PDF (in repo).
- Lab documentation in `cybersecurity-labs` repo.
- Web projects: med-match-gh, Bible-quiz, Menstrual-health-game, Mothers-Day (code complete; three need deploying).
- LinkedIn posts (labs + blood donation).
- Social profiles: GitHub `dfourmarvel`, LinkedIn `danieldeladzikunu4`.

### Daniel provides later (site ships with designed placeholders where needed)
- [ ] CV PDF
- [ ] Google Cybersecurity course certificate PDFs
- [ ] Poster PNG/JPEGs + one-line context for each
- [ ] LinkedIn post URLs for blog entries
- [ ] Blood-donation initiative photos (optional)
- [ ] Photo of Daniel (future, optional)

---

## 10. Open items

1. **Public email:** site currently uses `danieldeladzikunu@gmail.com`. Confirm this
   is the address to publish.
2. **Which labs are publish-ready:** review `cybersecurity-labs` together during build.
3. **Header/footer sharing mechanism** (manual copies vs. tiny JS include): decide at
   build start.

## 11. Build plan (phases)

1. **Design mockups** — 2–3 animated homepage directions, reviewed live in browser → Daniel picks one (+1 iteration round).
2. **Core build** — homepage + shared layout/nav/footer + animation system in the chosen direction.
3. **Sections** — the four domain pages + certifications + blog, with detail-page template.
4. **Content pass** — real project/lab write-ups, blog posts, imagery; deploy Bible-quiz, Menstrual-health-game & Mothers-Day for live demos.
5. **Polish & QA** — responsive pass, accessibility audit, Lighthouse, OG images, cross-browser.
6. **Launch** — deploy to Vercel, verify everything live, update README/CLAUDE.md.

## 12. Success criteria

- Daniel's own bar: *"looks very impressive"* — visibly hand-crafted, animated, and
  nothing like the "dull, AI-looking" v1.
- A first-time visitor can name all four of Daniel's domains within 10 seconds.
- Every listed project/lab has a working click-through: card → detail → live demo /
  GitHub / LinkedIn as applicable.
- Lighthouse ≥ 90 across the board (mobile); zero broken links; works at 375px.
- Reduced-motion users get a fully usable, calm site.
