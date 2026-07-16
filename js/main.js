/* Portfolio v2 — shared behavior for all pages.
   Animation contract: content is never hidden unless GSAP is confirmed
   running (body.anim). Everything degrades to a fully readable page. */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- mobile nav ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
if (menuToggle && navMenu) {
  const setOpen = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    navMenu.classList.toggle("open", open);
    document.body.classList.toggle("menu-locked", open);
  };
  menuToggle.addEventListener("click", () =>
    setOpen(menuToggle.getAttribute("aria-expanded") !== "true")
  );
  navMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

/* ---------- hero terminal typing (homepage only) ---------- */
const term = document.getElementById("term");
if (term) {
  const script = [
    { type: "cmd", text: "whoami" },
    { type: "out", html: '<span class="hl-rose">med student</span> · <span class="hl-green">security</span> · <span class="hl-cyan">builder</span>' },
    { type: "cmd", text: "ls ./work" },
    { type: "out", html: '<span class="hl-rose">medicine/</span>  <span class="hl-green">cybersecurity/</span>  <span class="hl-cyan">web-dev/</span>  <span class="hl-amber">design/</span>' },
    { type: "cmd", text: "cat vitals.log" },
    { type: "out", html: '<span class="hl-rose">♥ sinus rhythm</span> — all systems learning' },
  ];
  const renderLine = (kind, content) => {
    const ln = document.createElement("span");
    ln.className = "ln";
    ln.innerHTML =
      kind === "cmd"
        ? `<span class="prompt">daniel@portfolio:~$</span> <span class="cmd">${content}</span>`
        : `<span class="out">${content}</span>`;
    term.appendChild(ln);
  };
  const typeScript = async () => {
    for (const line of script) {
      if (line.type === "cmd") {
        const ln = document.createElement("span");
        ln.className = "ln";
        ln.innerHTML = `<span class="prompt">daniel@portfolio:~$</span> <span class="cmd"></span>`;
        term.appendChild(ln);
        const target = ln.querySelector(".cmd");
        for (const ch of line.text) {
          target.textContent += ch;
          await new Promise((r) => setTimeout(r, 50));
        }
        await new Promise((r) => setTimeout(r, 220));
      } else {
        renderLine("out", line.html);
        await new Promise((r) => setTimeout(r, 320));
      }
    }
    const c = document.createElement("span");
    c.innerHTML = `<span class="prompt">daniel@portfolio:~$</span> <span class="cursor"></span>`;
    term.appendChild(c);
  };
  if (reduced) {
    script.forEach((l) => renderLine(l.type, l.type === "cmd" ? l.text : l.html));
  } else {
    typeScript();
  }
}

/* ---------- live bpm readout (homepage only) ---------- */
const bpm = document.getElementById("bpm");
if (bpm && !reduced) {
  setInterval(() => {
    bpm.textContent = `♥ ${68 + Math.floor(Math.random() * 9)} bpm`;
  }, 2400);
}

/* ---------- GSAP entrances + scroll reveals ---------- */
if (!reduced && window.gsap) {
  document.body.classList.add("anim");
  gsap.registerPlugin(ScrollTrigger);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ScrollTrigger.refresh();
  });

  const heroTitle = document.querySelector(".hero h1, .page-hero h1");
  if (heroTitle) gsap.from(heroTitle, { y: 60, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
  const terminal = document.querySelector(".terminal");
  if (terminal) gsap.from(terminal, { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.45 });
  const ecg = document.querySelector(".ecg-strip");
  if (ecg) gsap.from(ecg, { opacity: 0, duration: 1.2, ease: "power2.out", delay: 0.9 });

  gsap.utils.toArray(".hero .reveal, .page-hero .reveal").forEach((el, i) => {
    gsap.to(el, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.6 + i * 0.18 });
  });
  gsap.utils.toArray("section .reveal").forEach((el) => {
    gsap.to(el, {
      y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  document.querySelectorAll(".bar i").forEach((bar) => {
    gsap.to(bar, {
      width: bar.dataset.w, duration: 1.2, ease: "power2.out",
      scrollTrigger: { trigger: bar, start: "top 90%" },
    });
  });
} else {
  document.querySelectorAll(".reveal").forEach((el) => {
    el.style.opacity = 1;
    el.style.transform = "none";
  });
  document.querySelectorAll(".bar i").forEach((bar) => (bar.style.width = bar.dataset.w));
}

/* ---------- lab topic filter (cybersecurity page) ---------- */
const labFilter = document.getElementById("lab-filter");
const labList = document.querySelector(".lab-list");
if (labFilter && labList) {
  const cards = [...labList.querySelectorAll(".feat")];
  const status = document.getElementById("lab-filter-status");
  const slug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");

  /* Topics come from each card's own .tag text, so a new lab shows up in the
     filter automatically and the chips can never drift from the card labels. */
  const topics = new Map();
  cards.forEach((card) => {
    const label = card.querySelector(".tag").textContent.trim().toLowerCase();
    const id = slug(label);
    card.dataset.topic = id;
    const seen = topics.get(id);
    if (seen) seen.count++;
    else topics.set(id, { label, count: 1 });
  });

  const chips = [{ id: "all", label: "all", count: cards.length }].concat(
    [...topics.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
      .map(([id, t]) => ({ id, label: t.label, count: t.count }))
  );

  labFilter.innerHTML =
    '<span class="lf-label" aria-hidden="true">filter:</span>' +
    chips
      .map(
        (c, i) =>
          `<button type="button" data-topic="${c.id}" aria-pressed="${i === 0}">${c.label}<i>${c.count}</i></button>`
      )
      .join("");
  labFilter.hidden = false; // only expose the control once it's wired up

  /* Filtering reflows the list, and a ScrollTrigger.refresh() after that will reset
     any un-fired reveal back to opacity 0 — stranding a card that is on screen.
     So retire the cards' reveal entirely on first use rather than fight it. */
  let settled = false;
  const settleCards = () => {
    if (settled) return;
    settled = true;
    if (window.gsap && window.ScrollTrigger) {
      gsap.killTweensOf(cards);
      ScrollTrigger.getAll().forEach((st) => {
        if (cards.includes(st.trigger)) st.kill();
      });
    }
    cards.forEach((card) => {
      card.style.opacity = 1;
      card.style.transform = "none";
    });
  };

  const buttons = [...labFilter.querySelectorAll("button")];
  labFilter.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-topic]");
    if (!btn) return;
    settleCards();
    let shown = 0;
    cards.forEach((card) => {
      const match = btn.dataset.topic === "all" || card.dataset.topic === btn.dataset.topic;
      card.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    status.textContent = `${shown} lab${shown === 1 ? "" : "s"} shown`;
    if (window.ScrollTrigger) ScrollTrigger.refresh(); // everything below the list moved
  });
}

/* ---------- copy email ---------- */
const chip = document.getElementById("email-chip");
if (chip) {
  chip.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("danieldeladzikunu@gmail.com");
      const label = document.getElementById("copy-label");
      label.textContent = "[copied ✓]";
      setTimeout(() => (label.textContent = "[copy]"), 1800);
    } catch (e) { /* clipboard unavailable — mailto link still works */ }
  });
}
