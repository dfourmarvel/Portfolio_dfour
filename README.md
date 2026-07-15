# Daniel Dela Dzikunu — Portfolio (v2)

Personal portfolio, live at [danieldeladzikunu.vercel.app](https://danieldeladzikunu.vercel.app).

Four domains, one site: **Medicine · Cybersecurity · Web Development · Graphic Design** —
in a dark "Vital Terminal" design (part hacker terminal, part hospital vitals monitor).

## Built with

- HTML5 / CSS3 / vanilla JavaScript — no framework, no build step
- [GSAP](https://gsap.com) (+ ScrollTrigger) via CDN for animations
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
