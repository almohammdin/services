(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const toolCards = [...document.querySelectorAll("[data-category]")];
  const requestButtons = [...document.querySelectorAll("[data-request]")];
  const requestSelect = document.querySelector("[data-request-select]");
  const contactForm = document.querySelector("[data-contact-form]");
  const detailsField = document.querySelector("#request-details");
  const toast = document.querySelector("[data-toast]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const whatsappNumber = "966506350457";
  let toastTimer;

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  const openMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!nav?.classList.contains("is-open")) return;
    if (!event.target.closest("[data-nav]") && !event.target.closest("[data-menu-button]")) closeMenu();
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setFilter = (filter) => {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    toolCards.forEach((card) => {
      const categories = (card.dataset.category || "").split(/\s+/);
      const visible = filter === "all" || categories.includes(filter);
      card.hidden = !visible;
      if (visible) card.classList.add("is-visible");
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter || "all"));
  });

  document.querySelectorAll("[data-focus-filter]").forEach((link) => {
    link.addEventListener("click", () => setFilter(link.dataset.focusFilter || "all"));
  });

  const showToast = () => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const selectRequest = (request) => {
    if (!requestSelect) return;

    const existingOption = [...requestSelect.options].find((option) => option.value === request || option.text === request);
    if (existingOption) {
      requestSelect.value = existingOption.value;
    } else {
      const option = new Option(request, request, true, true);
      requestSelect.add(option, 1);
    }

    document.querySelector("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    showToast();

    window.setTimeout(() => {
      if (!reducedMotion) detailsField?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 650);
  };

  requestButtons.forEach((button) => {
    button.addEventListener("click", () => selectRequest(button.dataset.request || "أحتاج مساعدة في اختيار الحل"));
  });

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const selected = requestSelect?.value || "أحتاج مساعدة في اختيار الحل";
    const details = detailsField?.value.trim();
    const message = [
      "السلام عليكم، اطلعت على صفحة حتى لحلول الأعمال.",
      `الخدمة أو الحل: ${selected}.`,
      details ? `وصف الاحتياج: ${details}` : "أرغب في مناقشة الاحتياج ومعرفة المسار المناسب."
    ].join("\n\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const revealItems = [...document.querySelectorAll(".reveal")];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -35px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const sectionLinks = [...document.querySelectorAll(".main-nav a[href^='#']")];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      sectionLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    }, { threshold: [0.2, 0.45], rootMargin: "-25% 0px -55%" });

    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
