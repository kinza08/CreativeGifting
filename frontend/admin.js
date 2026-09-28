/* ============================================================
   admin.js — everything the authenticated dashboard needs.
   Relies on helpers (showToast, serviceIconSvg, safeUrl) from
   main.js, which is loaded before this file.
   ============================================================ */

let pendingDelete = null; // { type, id }

/* ---------------- Auth guard ---------------- */

function requireAuth() {
  if (!localStorage.getItem("admin_access_token")) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem("admin_access_token");
  window.location.href = "login.html";
}

/* ---------------- Section navigation ---------------- */

function initSectionNav() {
  const buttons = document.querySelectorAll(".admin-nav button");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach((s) => s.classList.toggle("active", s.id === `section-${btn.dataset.section}`));
      document.getElementById("adminSidebar").classList.remove("open");
    });
  });

  const toggle = document.getElementById("sidebarToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.getElementById("adminSidebar").classList.toggle("open");
    });
  }

  document.getElementById("logoutBtn").addEventListener("click", logout);
}

/* ---------------- Modal helpers ---------------- */

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function initModalClosers() {
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.dataset.closeModal));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });
}

function askConfirm(type, id, label) {
  pendingDelete = { type, id };
  document.getElementById("confirmModalBody").textContent =
    `This will permanently delete ${label}. This action cannot be undone.`;
  openModal("confirmModal");
}

function initConfirmModal() {
  document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    const btn = document.getElementById("confirmDeleteBtn");
    btn.disabled = true;
    btn.textContent = "Deleting…";

    try {
      if (type === "service") await Api.deleteService(id);
      if (type === "review") await Api.deleteReview(id);
      if (type === "message") await Api.deleteMessage(id);
      if (type === "social") await Api.deleteSocialLink(id);

      showToast("Deleted successfully.");
      closeModal("confirmModal");

      if (type === "service") await loadAdminServices();
      if (type === "review") await loadAdminReviews();
      if (type === "message") await loadAdminMessages();
      if (type === "social") await loadAdminSocial();
      loadOverviewStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Delete";
      pendingDelete = null;
    }
  });
}

function formatAdminDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch (_) {
    return "";
  }
}

/* ---------------- Overview ---------------- */

async function loadOverviewStats() {
  try {
    const [services, reviews, messages, social] = await Promise.all([
      Api.getServices(),
      Api.getReviews(),
      Api.getAdminMessages(),
      Api.getSocialLinks(),
    ]);
    document.getElementById("statServices").textContent = services.length;
    document.getElementById("statReviews").textContent = reviews.length;
    document.getElementById("statMessages").textContent = messages.length;
    document.getElementById("statSocial").textContent = social.length;
  } catch (err) {
    console.error("Could not load overview stats", err);
  }
}

/* ---------------- Services ---------------- */

async function loadAdminServices() {
  const tbody = document.querySelector("#servicesTable tbody");
  const cards = document.getElementById("servicesCards");
  tbody.innerHTML = `<tr><td colspan="4" class="table-empty">Loading services…</td></tr>`;
  cards.innerHTML = "";

  try {
    const services = await Api.getServices();

    if (services.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No services yet — add your first one.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    services.forEach((service) => {
      const tr = document.createElement("tr");

      const titleTd = document.createElement("td");
      titleTd.textContent = service.title;
      tr.appendChild(titleTd);

      const descTd = document.createElement("td");
      descTd.textContent = service.description;
      tr.appendChild(descTd);

      const priceTd = document.createElement("td");
      priceTd.textContent = service.price_range || "—";
      tr.appendChild(priceTd);

      const actionsTd = document.createElement("td");
      actionsTd.appendChild(buildActionButtons(
        () => openServiceModal(service),
        () => askConfirm("service", service.id, `"${service.title}"`)
      ));
      tr.appendChild(actionsTd);

      tbody.appendChild(tr);

      const card = document.createElement("div");
      card.className = "record-card";
      card.innerHTML = `
        <div class="rc-title">${escapeHtml(service.title)}</div>
        <div class="rc-meta">${escapeHtml(service.price_range || "No price set")}</div>
        <div class="rc-body">${escapeHtml(service.description)}</div>
      `;
      const cardActions = buildActionButtons(
        () => openServiceModal(service),
        () => askConfirm("service", service.id, `"${service.title}"`)
      );
      card.appendChild(cardActions);
      cards.appendChild(card);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${err.message}</td></tr>`;
  }
}

function buildActionButtons(onEdit, onDelete) {
  const wrap = document.createElement("div");
  wrap.className = "row-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.setAttribute("aria-label", "Edit");
  editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  editBtn.addEventListener("click", onEdit);
  wrap.appendChild(editBtn);

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn danger";
  delBtn.setAttribute("aria-label", "Delete");
  delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
  delBtn.addEventListener("click", onDelete);
  wrap.appendChild(delBtn);

  return wrap;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function openServiceModal(service = null) {
  const form = document.getElementById("serviceForm");
  form.reset();
  document.getElementById("serviceNote").className = "form-note";
  document.getElementById("serviceModalTitle").textContent = service ? "Edit Service" : "Add Service";
  document.getElementById("serviceId").value = service ? service.id : "";
  document.getElementById("serviceTitle").value = service ? service.title : "";
  document.getElementById("serviceDescription").value = service ? service.description : "";
  document.getElementById("servicePrice").value = service ? (service.price_range || "") : "";
  document.getElementById("serviceIcon").value = service ? (service.icon || "") : "";
  openModal("serviceModal");
}

function initServiceForm() {
  document.getElementById("addServiceBtn").addEventListener("click", () => openServiceModal());

  const form = document.getElementById("serviceForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.getElementById("serviceNote");
    note.className = "form-note";

    const id = document.getElementById("serviceId").value;
    const payload = {
      title: document.getElementById("serviceTitle").value.trim(),
      description: document.getElementById("serviceDescription").value.trim(),
      price_range: document.getElementById("servicePrice").value.trim() || null,
      icon: document.getElementById("serviceIcon").value || null,
    };

    if (!payload.title || !payload.description) {
      note.textContent = "Title and description are required.";
      note.classList.add("error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";

    try {
      if (id) {
        await Api.updateService(id, payload);
      } else {
        await Api.createService(payload);
      }
      showToast("Service saved.");
      closeModal("serviceModal");
      await loadAdminServices();
      loadOverviewStats();
    } catch (err) {
      note.textContent = err.message;
      note.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Service";
    }
  });
}

/* ---------------- Reviews ---------------- */

async function loadAdminReviews() {
  const tbody = document.querySelector("#reviewsTable tbody");
  const cards = document.getElementById("reviewsCards");
  tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Loading reviews…</td></tr>`;
  cards.innerHTML = "";

  try {
    const reviews = await Api.getReviews();

    if (reviews.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No reviews yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    reviews.forEach((review) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(review.name)}</td>
        <td>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</td>
        <td>${escapeHtml(review.message)}</td>
        <td>${formatAdminDate(review.created_at)}</td>
      `;
      const actionsTd = document.createElement("td");
      const delOnly = document.createElement("div");
      delOnly.className = "row-actions";
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn danger";
      delBtn.setAttribute("aria-label", "Delete");
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
      delBtn.addEventListener("click", () => askConfirm("review", review.id, `${review.name}'s review`));
      delOnly.appendChild(delBtn);
      actionsTd.appendChild(delOnly);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);

      const card = document.createElement("div");
      card.className = "record-card";
      card.innerHTML = `
        <div class="rc-title">${escapeHtml(review.name)} — ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
        <div class="rc-meta">${formatAdminDate(review.created_at)}</div>
        <div class="rc-body">${escapeHtml(review.message)}</div>
      `;
      const cardDel = document.createElement("div");
      cardDel.className = "row-actions";
      cardDel.appendChild(delBtn.cloneNode(true));
      cardDel.querySelector("button").addEventListener("click", () => askConfirm("review", review.id, `${review.name}'s review`));
      card.appendChild(cardDel);
      cards.appendChild(card);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${err.message}</td></tr>`;
  }
}

/* ---------------- Messages ---------------- */

async function loadAdminMessages() {
  const tbody = document.querySelector("#messagesTable tbody");
  const cards = document.getElementById("messagesCards");
  tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Loading messages…</td></tr>`;
  cards.innerHTML = "";

  try {
    const messages = await Api.getAdminMessages();

    if (messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No messages yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    messages.forEach((msg) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(msg.name)}</td>
        <td>${escapeHtml(msg.contact)}</td>
        <td>${escapeHtml(msg.message)}</td>
        <td>${formatAdminDate(msg.created_at)}</td>
      `;
      const actionsTd = document.createElement("td");
      const wrap = document.createElement("div");
      wrap.className = "row-actions";
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn danger";
      delBtn.setAttribute("aria-label", "Delete");
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
      delBtn.addEventListener("click", () => askConfirm("message", msg.id, `the message from ${msg.name}`));
      wrap.appendChild(delBtn);
      actionsTd.appendChild(wrap);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);

      const card = document.createElement("div");
      card.className = "record-card";
      card.innerHTML = `
        <div class="rc-title">${escapeHtml(msg.name)}</div>
        <div class="rc-meta">${escapeHtml(msg.contact)} · ${formatAdminDate(msg.created_at)}</div>
        <div class="rc-body">${escapeHtml(msg.message)}</div>
      `;
      const cardDel = document.createElement("div");
      cardDel.className = "row-actions";
      cardDel.appendChild(delBtn.cloneNode(true));
      cardDel.querySelector("button").addEventListener("click", () => askConfirm("message", msg.id, `the message from ${msg.name}`));
      card.appendChild(cardDel);
      cards.appendChild(card);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${err.message}</td></tr>`;
  }
}

/* ---------------- Social links ---------------- */

async function loadAdminSocial() {
  const tbody = document.querySelector("#socialTable tbody");
  const cards = document.getElementById("socialCards");
  tbody.innerHTML = `<tr><td colspan="3" class="table-empty">Loading social links…</td></tr>`;
  cards.innerHTML = "";

  try {
    const links = await Api.getSocialLinks();

    if (links.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="table-empty">No social links yet — add your first one.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    links.forEach((link) => {
      const tr = document.createElement("tr");

      const platformTd = document.createElement("td");
      platformTd.textContent = link.platform;
      tr.appendChild(platformTd);

      const urlTd = document.createElement("td");
      urlTd.textContent = link.url;
      tr.appendChild(urlTd);

      const actionsTd = document.createElement("td");
      actionsTd.appendChild(buildActionButtons(
        () => openSocialModal(link),
        () => askConfirm("social", link.id, `your ${link.platform} link`)
      ));
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);

      const card = document.createElement("div");
      card.className = "record-card";
      card.innerHTML = `
        <div class="rc-title">${escapeHtml(link.platform)}</div>
        <div class="rc-body" style="word-break:break-all;">${escapeHtml(link.url)}</div>
      `;
      card.appendChild(buildActionButtons(
        () => openSocialModal(link),
        () => askConfirm("social", link.id, `your ${link.platform} link`)
      ));
      cards.appendChild(card);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="table-empty">${err.message}</td></tr>`;
  }
}

function openSocialModal(link = null) {
  const form = document.getElementById("socialForm");
  form.reset();
  document.getElementById("socialNote").className = "form-note";
  document.getElementById("socialModalTitle").textContent = link ? "Edit Social Link" : "Add Social Link";
  document.getElementById("socialId").value = link ? link.id : "";
  document.getElementById("socialPlatform").value = link ? link.platform : "instagram";
  document.getElementById("socialPlatform").disabled = !!link;
  document.getElementById("socialUrl").value = link ? link.url : "";
  openModal("socialModal");
}

function initSocialForm() {
  document.getElementById("addSocialBtn").addEventListener("click", () => openSocialModal());

  const form = document.getElementById("socialForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.getElementById("socialNote");
    note.className = "form-note";

    const id = document.getElementById("socialId").value;
    const url = document.getElementById("socialUrl").value.trim();

    if (!url) {
      note.textContent = "A URL is required.";
      note.classList.add("error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving…";

    try {
      if (id) {
        await Api.updateSocialLink(id, { url });
      } else {
        const platform = document.getElementById("socialPlatform").value;
        await Api.createSocialLink({ platform, url });
      }
      showToast("Social link saved.");
      closeModal("socialModal");
      await loadAdminSocial();
      loadOverviewStats();
    } catch (err) {
      note.textContent = err.message.includes("already has a link")
        ? "That platform already has a link — edit it instead."
        : err.message;
      note.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Link";
    }
  });
}

/* ---------------- Security ---------------- */

function initPasswordForm() {
  const form = document.getElementById("passwordForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.getElementById("passwordNote");
    note.className = "form-note";

    const current = document.getElementById("currentPassword").value;
    const next = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (next !== confirm) {
      note.textContent = "Passwords do not match.";
      note.classList.add("error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating…";

    try {
      await Api.changePassword(current, next);
      note.textContent = "Password updated successfully.";
      note.classList.add("success");
      form.reset();
    } catch (err) {
      note.textContent = err.message;
      note.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";
    }
  });
}

/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  initSectionNav();
  initModalClosers();
  initConfirmModal();
  initServiceForm();
  initSocialForm();
  initPasswordForm();

  loadOverviewStats();
  loadAdminServices();
  loadAdminReviews();
  loadAdminMessages();
  loadAdminSocial();
});