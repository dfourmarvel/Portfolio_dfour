# Daniel Dela Dzikunu — Portfolio (v2)

Personal portfolio, live at [danieldeladzikunu.vercel.app](https://danieldeladzikunu.vercel.app).

Four domains, one site: **Medicine · Cybersecurity · Web Development · Graphic Design** —
in a dark "Vital Terminal" design (part hacker terminal, part hospital vitals monitor).

## Built with

- HTML5 / CSS3 / vanilla JavaScript — no framework, no bundler
- [GSAP](https://gsap.com) (+ ScrollTrigger), vendored locally, for animations
- Blog posts and project pages generated from `data/*.json` by a small Node script
- Deployed on Vercel; auto-deploys from `main`

## Structure

```
index.html            homepage (hub)
medicine/             health & medicine section
cybersecurity/        labs + credentials
web-development/      coding projects with live demos
graphic-design/       poster gallery
certifications/       cert details + course progress
blog/                 write-ups (imported from LinkedIn)
404.html              custom not-found page
css/main.css          single shared stylesheet
js/main.js            single shared script
assets/               images, certificate PDFs
mockups/              phase-1 design explorations (kept for the record)
PRD.md                product requirements for the v2 overhaul
data/                 blog + project content (the source of truth for those pages)
tools/                authoring scripts and the local admin (never deployed)
```

## Updating the site

Blog posts and web-development projects are edited in a local admin rather than by
hand. From the repo root:

```
npm run admin
```

Then open <http://localhost:4321/admin/>. You can write and edit posts, add projects,
upload images, reorder and delete entries, and preview the real page. **Publish** saves
a version and pushes it, which is what triggers the Vercel deploy.

The admin needs nothing installed — it runs on plain Node — and listens on localhost
only. It is never deployed with the site.

Under the hood it edits `data/blog.json` and `data/projects.json`, then regenerates
`blog/`, `web-development/` and `sitemap.xml`. Those generated pages should not be
edited by hand: the next run would overwrite the change. Everything else on the site
(the homepage, `labs/`, the other section pages) is still hand-written.

```
npm run verify    # checks generation reproduces every page exactly — run before publishing
npm run generate  # rebuild the generated pages from the JSON
npm run extract   # the reverse, if a generated page was edited by hand
```

## Run locally

Any static server from the repo root, e.g.:

```
npx serve .
```

(Pages use root-absolute paths like `/css/main.css`, so open via a server, not `file://`.)

## Accessibility & motion

Dark-only by design. Full keyboard navigation, skip link, and `prefers-reduced-motion`
support — all animation collapses to a readable static page.
