/* ============================================================
   main.js — navigation, services, social links, contact form,
   portfolio filters, and the shared toast helper.
   ============================================================ */

/* ---------------- Toast (shared with reviews.js) ---------------- */

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "error" : ""}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

/* ---------------- Icons ---------------- */

const SERVICE_ICONS = {
  cake: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 21h16"/><path d="M8 12V8c0-1.5 1-2 1-3.5S8 2 8 2"/><path d="M12 12V8c0-1.5 1-2 1-3.5S12 2 12 2"/><path d="M16 12V8c0-1.5 1-2 1-3.5S16 2 16 2"/><path d="M4 17h16"/></svg>',
  bouquet: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 12v9"/><path d="M12 12a3 3 0 1 0-3-3"/><path d="M12 12a3 3 0 1 1 3-3"/><path d="M12 9a3 3 0 1 0-3 3"/><path d="M12 9a3 3 0 1 1 3 3"/><path d="M9 21c0-2 1.3-3 3-3s3 1 3 3"/></svg>',
  chocolate: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 6v12M15 6v12M3 12h18"/></svg>',
  hamper: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10h16l-1.5 9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><path d="M2 10h20"/><path d="M8 10c0-3 1.5-6 4-6s4 3 4 6"/></svg>',
  gift: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 9h18v4H3z" fill="currentColor" fill-opacity="0.12"/><path d="M12 9v12"/><path d="M12 9c-1.5-3-3-5-5-5s-2 3 0 4 5 1 5 1z"/><path d="M12 9c1.5-3 3-5 5-5s2 3 0 4-5 1-5 1z"/></svg>',
  default: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.8 6.3 19.6l1.5-6.5-5-4.4 6.6-.6z"/></svg>',
};

function serviceIconSvg(name) {
  return SERVICE_ICONS[(name || "").toLowerCase()] || SERVICE_ICONS.default;
}

const SOCIAL_ICONS = {
  instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
  linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.01M12 17v-4.5a2.5 2.5 0 0 1 5 0V17M12 17v-7"/></svg>',
  github: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
  facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 8h2V5h-2a4 4 0 0 0-4 4v2H9v3h2v7h3v-7h2.2l.8-3H14V9c0-.6.4-1 1-1z"/></svg>',
  whatsapp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l1.4-4A8 8 0 1 1 8.6 19z"/><path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.4-.6.7-1.4.5-1.8l-1.7-.8c-.3-.1-.6 0-.8.2l-.4.5c-1-.5-1.9-1.4-2.4-2.4l.5-.4c.2-.2.3-.5.2-.8L9.6 8.3c-.2-.4-1-.2-1.1.3z" fill="currentColor" fill-opacity="0.15"/></svg>',
  youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor"/></svg>',
  default: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>',
};

function socialIconSvg(platform) {
  return SOCIAL_ICONS[(platform || "").toLowerCase()] || SOCIAL_ICONS.default;
}

/** Only allow http/https links to be used as href — never javascript: etc. */
function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch (_) {
    return "#";
  }
}

/* ---------------- Navigation ---------------- */

function initNav() {
  const hamburger = document.getElementById("hamburger");
  const panel = document.getElementById("mobilePanel");
  if (!hamburger || !panel) return;

  hamburger.addEventListener("click", () => {
    panel.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", panel.classList.contains("open"));
  });

  panel.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => panel.classList.remove("open"))
  );
}

/* ---------------- Services ---------------- */

async function loadServices() {
  const grid = document.getElementById("serviceGrid");
  if (!grid) return;

  grid.innerHTML = '<p class="state-message">Loading services…</p>';

  try {
    const services = await Api.getServices();

    if (!services || services.length === 0) {
      grid.innerHTML = '<p class="state-message">Our services are being updated. Please check back soon.</p>';
      return;
    }

    grid.innerHTML = "";
    services.forEach((service) => {
      const card = document.createElement("article");
      card.className = "service-card";

      const iconWrap = document.createElement("div");
      iconWrap.className = "service-icon";
      iconWrap.innerHTML = serviceIconSvg(service.icon);
      card.appendChild(iconWrap);

      const title = document.createElement("h3");
      title.textContent = service.title;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.textContent = service.description;
      card.appendChild(desc);

      if (service.price_range) {
        const price = document.createElement("span");
        price.className = "service-price";
        price.textContent = service.price_range;
        card.appendChild(price);
      }

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="state-message">${err.message}</p>`;
  }
}

/* ---------------- Social links ---------------- */

async function loadSocialLinks() {
  const targets = document.querySelectorAll("[data-social-target]");
  if (targets.length === 0) return;

  try {
    const links = await Api.getSocialLinks();

    targets.forEach((target) => {
      target.innerHTML = "";
      if (!links || links.length === 0) return;

      links.forEach((link) => {
        const a = document.createElement("a");
        a.href = safeUrl(link.url);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", link.platform);
        a.innerHTML = socialIconSvg(link.platform);
        target.appendChild(a);
      });
    });
  } catch (err) {
    console.error("Could not load social links", err);
  }
}

/* ---------------- Contact form ---------------- */

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const note = document.getElementById("contactNote");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    note.className = "form-note";

    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const message = form.message.value.trim();

    if (!name || !contact || !message) {
      note.textContent = "Please fill in every field before sending.";
      note.classList.add("error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      await Api.sendMessage({ name, contact, message });
      note.textContent = "Thank you! Your message has been sent — we'll be in touch soon.";
      note.classList.add("success");
      form.reset();
    } catch (err) {
      note.textContent = err.message;
      note.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}

/* ---------------- Portfolio filters (static content) ---------------- */

function initPortfolioFilters() {
  const buttons = document.querySelectorAll(".portfolio-filters button");
  const items = document.querySelectorAll(".portfolio-item");
  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.dataset.filter;

      items.forEach((item) => {
        const show = category === "all" || item.dataset.category === category;
        item.style.display = show ? "flex" : "none";
      });
    });
  });
}

/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  loadServices();
  loadSocialLinks();
  initContactForm();
  initPortfolioFilters();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});