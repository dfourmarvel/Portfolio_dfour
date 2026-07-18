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
    if (open) {
      const first = navMenu.querySelector("a");
      if (first) first.focus();
    } else {
      menuToggle.focus();
    }
  };
  menuToggle.addEventListener("click", () =>
    setOpen(menuToggle.getAttribute("aria-expanded") !== "true")
  );
  navMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setOpen(false);
  });
  /* simple focus trap: only active while the mobile overlay is open */
  navMenu.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !navMenu.classList.contains("open")) return;
    const focusable = [...navMenu.querySelectorAll("a")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
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

/* ---------- topic filter (reused on cybersecurity + blog) ----------
   Topics come from each card's own tag/category text, so a new card shows up
   in the filter automatically and the chips can never drift from the card
   labels. Filtering reflows the list, and a ScrollTrigger.refresh() after that
   will reset any un-fired reveal back to opacity 0 — stranding a card that is
   on screen — so the cards' reveal is retired entirely on first use rather
   than fought. */
function initTopicFilter({ filterEl, statusEl, list, cardSelector, tagSelector, noun }) {
  if (!filterEl || !list) return;
  const cards = [...list.querySelectorAll(cardSelector)];
  const slug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");

  const topics = new Map();
  cards.forEach((card) => {
    const label = card.querySelector(tagSelector).textContent.trim().toLowerCase();
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

  filterEl.innerHTML =
    '<span class="lf-label" aria-hidden="true">filter:</span>' +
    chips
      .map(
        (c, i) =>
          `<button type="button" data-topic="${c.id}" aria-pressed="${i === 0}">${c.label}<i>${c.count}</i></button>`
      )
      .join("");
  filterEl.hidden = false; // only expose the control once it's wired up

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

  const buttons = [...filterEl.querySelectorAll("button")];
  filterEl.addEventListener("click", (e) => {
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
    statusEl.textContent = `${shown} ${noun}${shown === 1 ? "" : "s"} shown`;
    if (window.ScrollTrigger) ScrollTrigger.refresh(); // everything below the list moved
  });
}

initTopicFilter({
  filterEl: document.getElementById("lab-filter"),
  statusEl: document.getElementById("lab-filter-status"),
  list: document.querySelector(".lab-list"),
  cardSelector: ".feat",
  tagSelector: ".tag",
  noun: "lab",
});

initTopicFilter({
  filterEl: document.getElementById("blog-filter"),
  statusEl: document.getElementById("blog-filter-status"),
  list: document.querySelector(".blog-list"),
  cardSelector: ".post",
  tagSelector: ".cat",
  noun: "post",
});

/* ---------- footer sign-off typing (homepage only) ----------
   Deliberately separate from typeScript/#term above so this small closing
   touch can never break the hero effect. */
const footEcho = document.getElementById("foot-echo");
if (footEcho) {
  const signOff = "exit 0 — thanks for reading.";
  const renderFootEcho = (text) => {
    footEcho.innerHTML = `<span class="prompt">daniel@portfolio:~$</span> <span class="cmd">${text}</span><span class="cursor"></span>`;
  };
  const typeFootEcho = () => {
    footEcho.innerHTML = `<span class="prompt">daniel@portfolio:~$</span> <span class="cmd"></span>`;
    const target = footEcho.querySelector(".cmd");
    let i = 0;
    const step = () => {
      if (i < signOff.length) {
        target.textContent += signOff[i];
        i++;
        setTimeout(step, 50);
      } else {
        const cursor = document.createElement("span");
        cursor.className = "cursor";
        footEcho.appendChild(cursor);
      }
    };
    step();
  };
  if (reduced) {
    renderFootEcho(signOff);
  } else if (window.gsap && window.ScrollTrigger) {
    /* "top 88%"-style thresholds can sit past max-scroll for content this
       close to the page's true bottom (the crossing never happens, so
       onEnter never fires) — "top bottom" fires as the footer's top enters
       the viewport, well before that edge case, and still reads as "the
       footer scrolls into view". */
    ScrollTrigger.create({ trigger: footEcho, start: "top bottom", once: true, onEnter: typeFootEcho });
  } else {
    renderFootEcho(signOff);
  }
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
