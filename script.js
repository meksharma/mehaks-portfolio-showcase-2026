const menuToggle = document.getElementById("menu-toggle");
const siteNav = document.getElementById("site-nav");
const themeToggle = document.getElementById("theme-toggle");
const yearNode = document.getElementById("year");

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
  const initialReveal = document.querySelector("#about .reveal");
  const revealEls = document.querySelectorAll(".reveal:not(.about-grid):not(.philosophy-content), .reveal-stagger");
  const philosophyContent = document.querySelector(".philosophy-content");
  if (initialReveal) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => initialReveal.classList.add("in-view"));
    });
  }
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

const initScrollSnap = () => {
  const snapPages = Array.from(document.querySelectorAll("#about, #background, #approach, #builds, .project-cover, #contact"));
  if (!snapPages.length) return;

  let currentPage = snapPages.reduce((closest, page) => {
    const distance = Math.abs(page.getBoundingClientRect().top - 64);
    return !closest || distance < closest.distance ? { page, distance } : closest;
  }, null).page;
  currentPage.classList.add("is-snap-current");

  let settleTimer = null;
  const updateCurrentPage = () => {
    const alignedPage = snapPages.find((page) => {
      const top = page.getBoundingClientRect().top;
      return Math.min(Math.abs(top), Math.abs(top - 64)) < 12;
    });
    if (!alignedPage || alignedPage === currentPage) return;
    currentPage.classList.remove("is-snap-current");
    currentPage = alignedPage;
    currentPage.classList.add("is-snap-current");
  };

  window.addEventListener("scroll", () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(updateCurrentPage, 180);
  }, { passive: true });
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

const initBuildsReel = () => {
  const section = document.querySelector(".builds-section");
  const track = document.querySelector(".builds-track");
  const cards = track ? Array.from(track.querySelectorAll(".build-card")) : [];
  const previousButton = document.querySelector('[data-builds-direction="previous"]');
  const nextButton = document.querySelector('[data-builds-direction="next"]');
  if (!section || !track || !cards.length || !previousButton || !nextButton) return;

  if (cards.length === 1) {
    previousButton.parentElement.hidden = true;
  }

  track.querySelectorAll(".build-card-media").forEach((media) => {
    const video = media.querySelector("video");
    const toggle = media.querySelector(".build-video-toggle");
    if (!video || !toggle) return;

    const syncToggle = () => {
      toggle.setAttribute("aria-label", video.paused ? "Play video preview" : "Pause video preview");
    };

    toggle.addEventListener("click", () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", syncToggle);
    video.addEventListener("pause", syncToggle);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
    syncToggle();
  });

  const getActiveIndex = () => cards.reduce((closestIndex, card, index) => {
    const currentDistance = Math.abs(card.offsetLeft - track.scrollLeft);
    const closestDistance = Math.abs(cards[closestIndex].offsetLeft - track.scrollLeft);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);

  const updateControls = () => {
    const activeIndex = getActiveIndex();
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === cards.length - 1;
  };

  const moveToCard = (offset) => {
    const targetIndex = Math.min(cards.length - 1, Math.max(0, getActiveIndex() + offset));
    const targetLeft = targetIndex === 0
      ? 0
      : Math.min(cards[targetIndex].offsetLeft, track.scrollWidth - track.clientWidth);
    track.scrollTo({ left: targetLeft, behavior: "auto" });
    updateControls();
  };

  previousButton.addEventListener("click", () => moveToCard(-1));
  nextButton.addEventListener("click", () => moveToCard(1));
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    moveToCard(event.key === "ArrowLeft" ? -1 : 1);
  });
  track.addEventListener("scroll", updateControls, { passive: true });

  let scrollFrame = null;
  const syncTrackToPage = () => {
    scrollFrame = null;
    if (window.innerWidth <= 760 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scrollRange = section.offsetHeight - window.innerHeight;
    if (scrollRange <= 0) return;
    const progress = Math.min(1, Math.max(0, (window.scrollY - section.offsetTop) / scrollRange));
    const lastCardLeft = Math.min(cards[cards.length - 1].offsetLeft, track.scrollWidth - track.clientWidth);
    track.scrollLeft = lastCardLeft * progress;
    updateControls();
  };

  const requestTrackSync = () => {
    if (scrollFrame === null) {
      scrollFrame = window.requestAnimationFrame(syncTrackToPage);
    }
  };

  window.addEventListener("scroll", requestTrackSync, { passive: true });
  window.addEventListener("resize", requestTrackSync);
  syncTrackToPage();
  updateControls();
};

const startPage = () => {
  document.body.classList.add("loaded");
  initReveals();
  initScrollSnap();
  initBuildsReel();
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", startPage);
} else {
  startPage();
}
