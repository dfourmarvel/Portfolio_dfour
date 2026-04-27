const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const header = document.querySelector(".site-header");
const revealItems = document.querySelectorAll(".reveal");
const yearElement = document.getElementById("year");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

const THEME_KEY = "theme";
const THEMES = {
  dark: "\u263E",
  light: "\u2600"
};

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

const persistTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage failures and keep the in-memory theme change.
  }
};

const closeMenu = () => {
  if (!menuToggle || !navMenu) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  navMenu.classList.remove("is-open");
};

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    navMenu.classList.toggle("is-open", !isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("is-open")) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Node &&
      !navMenu.contains(target) &&
      !menuToggle.contains(target)
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

const setTheme = (theme) => {
  const isLight = theme === "light";
  document.documentElement.classList.toggle("light-theme", isLight);

  if (themeIcon) {
    themeIcon.textContent = isLight ? THEMES.light : THEMES.dark;
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme"
    );
  }
};

if (themeToggle) {
  const savedTheme = readStoredTheme() || "dark";
  setTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.classList.contains("light-theme")
      ? "dark"
      : "light";

    persistTheme(nextTheme);
    setTheme(nextTheme);
  });
}

const normalizePath = (value) => value.replace(/\/index\.html$/, "/").replace(/\/$/, "");

const currentPath = normalizePath(window.location.pathname);

navLinks.forEach((link) => {
  const targetPath = normalizePath(new URL(link.href, window.location.href).pathname);
  const isCurrentPage = targetPath === currentPath;
  link.classList.toggle("active", isCurrentPage);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18
    }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => {
    item.classList.add("is-visible");
  });
}

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 12);
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !subject || !message) {
      if (formStatus) {
        formStatus.textContent = "Please complete all fields before opening the email draft.";
      }
      return;
    }

    const body = [
      `Name: ${name}`,
      `Sender Email: ${email}`,
      "",
      message
    ].join("\n");

    const mailtoUrl = `mailto:danieldeladzikunu@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (formStatus) {
      formStatus.textContent = "Opening your email app with the message prefilled.";
    }

    window.location.href = mailtoUrl;
  });
}
