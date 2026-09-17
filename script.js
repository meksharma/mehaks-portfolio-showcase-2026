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
};

applyTheme("dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

const initReveals = () => {
  const revealEls = document.querySelectorAll(".reveal:not(.philosophy-content), .reveal-stagger");
  const philosophyContent = document.querySelector(".philosophy-content");
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

  if (philosophyContent && "IntersectionObserver" in window) {
    const philosophyObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          philosophyContent.classList.add("in-view");
          philosophyObserver.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    philosophyObserver.observe(philosophyContent);
  } else if (philosophyContent) {
    philosophyContent.classList.add("in-view");
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

const scrollProgress = document.getElementById("scroll-progress");
if (scrollProgress) {
  const scrollProgressFill = scrollProgress.querySelector(".scroll-progress-fill");
  let progressFrame = null;

  const updateScrollProgress = () => {
    progressFrame = null;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
    scrollProgressFill.style.transform = `scaleX(${progress})`;
    scrollProgress.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  };

  const requestScrollProgressUpdate = () => {
    if (progressFrame === null) {
      progressFrame = window.requestAnimationFrame(updateScrollProgress);
    }
  };

  updateScrollProgress();
  window.addEventListener("scroll", requestScrollProgressUpdate, { passive: true });
  window.addEventListener("resize", requestScrollProgressUpdate);
}

document.querySelectorAll(".project-video").forEach((player) => {
  const video = player.querySelector("video");
  const replayButton = player.querySelector(".video-replay");
  if (!video || !replayButton) return;

  video.addEventListener("ended", () => {
    replayButton.hidden = false;
  });

  video.addEventListener("play", () => {
    replayButton.hidden = true;
  });

  replayButton.addEventListener("click", () => {
    video.currentTime = 0;
    video.play();
  });
});

const startPage = () => {
  document.body.classList.add("loaded");
  initReveals();
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startPage);
} else {
  startPage();
}
