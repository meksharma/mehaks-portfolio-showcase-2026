const menuToggle = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");
const themeToggle = document.getElementById("theme-toggle");
const yearNode = document.getElementById("year");
const aboutMedia = document.querySelector(".about-media");

if (aboutMedia) {
  const portraitRevealKey = "portfolio-portrait-color-revealed";
  if (sessionStorage.getItem(portraitRevealKey) === "true") {
    aboutMedia.classList.add("is-color", "is-session-revealed");
  } else {
    aboutMedia.addEventListener("mouseenter", () => {
      aboutMedia.classList.add("is-color");
      sessionStorage.setItem(portraitRevealKey, "true");
    }, { once: true });
  }
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (menuToggle && siteNav) {
  const closeMenu = () => {
    siteNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  };

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
    siteNav.classList.toggle("open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteNav.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("portfolio-theme", theme);
};

const storedTheme = localStorage.getItem("portfolio-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(storedTheme || (prefersDark ? "dark" : "light"));

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

const initReveals = () => {
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -12% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }
};

const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  const toggleBackToTop = () => {
    if (window.scrollY > window.innerHeight * 0.6) {
      backToTop.classList.add("is-visible");
    } else {
      backToTop.classList.remove("is-visible");
    }
  };
  toggleBackToTop();
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  backToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const philosophy = document.getElementById("approach");
if (philosophy) {
  const items = Array.from(philosophy.querySelectorAll(".phil-item"));
  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const clamp = (n) => Math.min(1, Math.max(0, n));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const n = items.length;
  const updatePhilosophy = () => {
    if (mobileQuery.matches) {
      const viewportCenter = window.innerHeight / 2;
      const closestItem = items.reduce((closest, item) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        return !closest || distance < closest.distance ? { item, distance } : closest;
      }, null);
      items.forEach((item) => item.classList.toggle("is-focused", item === closestItem.item));
      return;
    }
    const rect = philosophy.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = clamp(-rect.top / (total || 1));
    items.forEach((item, i) => {
      const span = 1 / (n + 1);
      const start = i * span;
      const local = clamp((scrolled - start) / (span * 2));
      item.style.setProperty("--p", easeOut(local).toFixed(4));
    });
  };
  updatePhilosophy();
  window.addEventListener("scroll", updatePhilosophy, { passive: true });
  window.addEventListener("resize", updatePhilosophy);
}


const startPage = () => {
  document.body.classList.add("loaded");
  initReveals();
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startPage);
} else {
  startPage();
}
