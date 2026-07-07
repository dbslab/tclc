const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const navLinks = [...document.querySelectorAll(".nav-links a, .mobile-menu a")];
const sections = [...document.querySelectorAll("main section[id]")];
const revealItems = [...document.querySelectorAll(".reveal")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setHeaderState() {
  header.classList.toggle("scrolled", window.scrollY > 42);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

mobileMenu?.addEventListener("click", (event) => {
  if (!event.target.matches("a")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("open");
  document.body.classList.remove("menu-open");
});

revealItems.forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index % 5, 4) * 80}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    });
  },
  { threshold: 0.35, rootMargin: "-18% 0px -48% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

document.querySelectorAll(".btn, .nav-cta").forEach((button) => {
  button.addEventListener("click", (event) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
});

document.querySelectorAll(".magnetic").forEach((element) => {
  element.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.09;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
    element.style.setProperty("--mx", `${x}px`);
    element.style.setProperty("--my", `${y}px`);
  });

  element.addEventListener("pointerleave", () => {
    element.style.setProperty("--mx", "0px");
    element.style.setProperty("--my", "0px");
  });
});

document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion || window.innerWidth < 900) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--ry", `${x * 5}deg`);
    card.style.setProperty("--rx", `${y * -5}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
});

const countTargets = [...document.querySelectorAll("[data-count]")];
let countersStarted = false;

function animateCounter(el, target) {
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    if (countersStarted || !entries.some((entry) => entry.isIntersecting)) return;
    countersStarted = true;
    countTargets.forEach((el) => animateCounter(el, Number(el.dataset.count)));
  },
  { threshold: 0.35 }
);

countTargets.forEach((el) => counterObserver.observe(el));

const carousel = document.querySelector("[data-carousel]");
const prev = document.querySelector("[data-carousel-prev]");
const next = document.querySelector("[data-carousel-next]");
const progress = document.querySelector("[data-carousel-progress]");
let isDragging = false;
let startX = 0;
let scrollLeft = 0;
let activeCarouselIndex = 0;
let carouselAutoTimer;
let programmaticUntil = 0;

function applyCarouselActive(index) {
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".process-slide")];
  activeCarouselIndex = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeCarouselIndex);
  });
  if (progress) {
    progress.style.width = `${((activeCarouselIndex + 1) / slides.length) * 100}%`;
  }
}

function updateCarouselState() {
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".process-slide")];
  if (Date.now() < programmaticUntil) {
    applyCarouselActive(activeCarouselIndex);
    return;
  }
  const maxScroll = Math.max(carousel.scrollWidth - carousel.clientWidth, 1);
  const activeIndex = Math.min(slides.length - 1, Math.round((carousel.scrollLeft / maxScroll) * (slides.length - 1)));
  applyCarouselActive(activeIndex);
}

function scrollCarousel(direction) {
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".process-slide")];
  const maxScroll = Math.max(carousel.scrollWidth - carousel.clientWidth, 0);
  const nextIndex =
    direction > 0
      ? (activeCarouselIndex + 1) % slides.length
      : (activeCarouselIndex - 1 + slides.length) % slides.length;
  const nextLeft = slides.length <= 1 ? 0 : (maxScroll * nextIndex) / (slides.length - 1);
  programmaticUntil = Date.now() + 1800;
  applyCarouselActive(nextIndex);
  carousel.classList.add("programmatic");
  carousel.scrollTo({ left: nextLeft, behavior: "smooth" });
  window.setTimeout(() => carousel.classList.remove("programmatic"), 1800);
}

function startCarouselAutoLoop() {
  if (!carousel || prefersReducedMotion) return;
  window.clearInterval(carouselAutoTimer);
  carouselAutoTimer = window.setInterval(() => scrollCarousel(1), 5200);
}

function pauseCarouselAutoLoop() {
  window.clearInterval(carouselAutoTimer);
}

function restartCarouselAutoLoop() {
  pauseCarouselAutoLoop();
  startCarouselAutoLoop();
}

prev?.addEventListener("click", () => {
  scrollCarousel(-1);
  restartCarouselAutoLoop();
});
next?.addEventListener("click", () => {
  scrollCarousel(1);
  restartCarouselAutoLoop();
});
carousel?.addEventListener("scroll", () => requestAnimationFrame(updateCarouselState), { passive: true });

carousel?.addEventListener("pointerdown", (event) => {
  isDragging = true;
  pauseCarouselAutoLoop();
  carousel.classList.add("dragging");
  carousel.setPointerCapture(event.pointerId);
  startX = event.clientX;
  scrollLeft = carousel.scrollLeft;
});

carousel?.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  carousel.scrollLeft = scrollLeft - (event.clientX - startX);
});

carousel?.addEventListener("pointerup", () => {
  isDragging = false;
  carousel.classList.remove("dragging");
  restartCarouselAutoLoop();
});

carousel?.addEventListener("pointercancel", () => {
  isDragging = false;
  carousel.classList.remove("dragging");
  restartCarouselAutoLoop();
});

updateCarouselState();
startCarouselAutoLoop();

const bookStage = document.querySelector("[data-book-stage]");
bookStage?.addEventListener("pointermove", (event) => {
  if (prefersReducedMotion) return;
  const rect = bookStage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  bookStage.style.setProperty("--px", `${x * 18}px`);
  bookStage.style.setProperty("--py", `${y * 18}px`);
});

bookStage?.addEventListener("pointerleave", () => {
  bookStage.style.setProperty("--px", "0px");
  bookStage.style.setProperty("--py", "0px");
});

const parallaxCards = [...document.querySelectorAll(".parallax-card")];
let ticking = false;

function updateParallax() {
  const viewport = window.innerHeight;
  parallaxCards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const distance = (midpoint - viewport / 2) / viewport;
    const y = Math.max(-18, Math.min(18, distance * -22));
    card.style.setProperty("--scroll-y", `${y + index * 0.4}px`);
    if (!card.matches("[data-book-stage]")) {
      card.style.translate = `0 ${y}px`;
    }
  });
  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (prefersReducedMotion || ticking) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
  },
  { passive: true }
);

window.addEventListener("resize", updateCarouselState);
