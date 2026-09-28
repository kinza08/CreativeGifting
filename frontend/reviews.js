/* ============================================================
   reviews.js — fetch, render, modal. Movement is pure CSS.
   ============================================================ */

function starString(rating) {
  const filled = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch (_) { return ""; }
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch (_) { return ""; }
}

function buildReviewCard(review, isClone = false) {
  const card = document.createElement("article");
  card.className = "review-card";

  if (isClone) {
    card.setAttribute("aria-hidden", "true");
  } else {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Read full review by ${review.name || "Anonymous"}`);
    const open = () => openReviewView(review);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  const stars = document.createElement("div");
  stars.className = "review-stars";
  stars.textContent = starString(review.rating);
  card.appendChild(stars);

  const msg = document.createElement("p");
  msg.className = "review-msg";
  msg.textContent = review.message;
  card.appendChild(msg);

  const meta = document.createElement("div");
  meta.className = "review-meta";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = review.name;
  const date = document.createElement("span");
  date.textContent = formatDate(review.created_at);
  meta.appendChild(name);
  meta.appendChild(date);
  card.appendChild(meta);

  return card;
}

let _reviewsLoaded = false;

async function loadReviews() {
  const track = document.getElementById("reviewTrack");
  if (!track) return;
  if (_reviewsLoaded) return;
  _reviewsLoaded = true;

  track.innerHTML = '<p class="state-message">Loading reviews…</p>';

  try {
    const all = await Api.getReviews();
    const reviews = Array.isArray(all) ? all : [];
    console.log("[reviews] API returned", reviews.length);

    if (reviews.length === 0) {
      track.innerHTML = '<p class="state-message">Be the first to leave a review.</p>';
      return;
    }

    // Duplicate the set twice (3 copies total) so the CSS animation
    // can loop seamlessly even when there are only a few reviews.
    track.innerHTML = "";
    for (let copy = 0; copy < 3; copy++) {
      reviews.forEach((r) => track.appendChild(buildReviewCard(r, copy > 0)));
    }

    // Set the animation-duration based on how many cards we have.
    // More cards => longer duration, so the speed stays consistent.
    const seconds = reviews.length * 6;
    track.style.animationDuration = `${seconds}s`;
    track.classList.add("scrolling");

    console.log("[reviews] rendered", track.children.length, "cards, duration", seconds + "s");
  } catch (err) {
    console.error("[reviews] load failed:", err);
    track.innerHTML = `<p class="state-message">${err.message}</p>`;
    _reviewsLoaded = false;
  }
}

/* ---------- read-only review view ---------- */
function openReviewView(review) {
  const overlay = document.getElementById("reviewModal");
  if (!overlay) return;

  const title = overlay.querySelector("#reviewModalTitle");
  const form  = overlay.querySelector("#reviewForm");
  const old   = overlay.querySelector("#reviewView");
  if (old) old.remove();

  if (form)  form.style.display = "none";
  if (title) title.textContent  = "Review";

  const view = document.createElement("div");
  view.id = "reviewView";
  view.className = "review-view";

  const stars = document.createElement("div");
  stars.className = "review-stars large";
  stars.textContent = starString(review.rating);
  view.appendChild(stars);

  const body = document.createElement("p");
  body.className = "review-full";
  body.textContent = review.message;
  view.appendChild(body);

  const meta = document.createElement("div");
  meta.className = "review-meta";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = review.name;
  const date = document.createElement("span");
  date.textContent = formatDateTime(review.created_at);
  meta.append(name, date);
  view.appendChild(meta);

  if (form && form.parentNode) {
    form.parentNode.insertBefore(view, form);
  } else {
    overlay.querySelector(".modal").appendChild(view);
  }

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeReviewView() {
  const overlay = document.getElementById("reviewModal");
  if (!overlay) return;
  const view = overlay.querySelector("#reviewView");
  if (view) view.remove();
  const form = overlay.querySelector("#reviewForm");
  if (form) form.style.display = "";
  const title = overlay.querySelector("#reviewModalTitle");
  if (title) title.textContent = "Leave a Review";
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- submission modal ---------- */
let _modalBound = false;

function initReviewModal() {
  if (_modalBound) return;
  const overlay = document.getElementById("reviewModal");
  const openBtns = document.querySelectorAll("[data-open-review]");
  const closeBtn = document.getElementById("reviewModalClose");
  const form = document.getElementById("reviewForm");
  if (!overlay || !form) return;
  _modalBound = true;

  const stars    = form.querySelectorAll(".star-select button");
  const starWrap = form.querySelector(".star-select");
  let selectedRating = 0;

  function paint(r) {
    stars.forEach((s) => s.classList.toggle("filled", Number(s.dataset.value) <= r));
  }

  stars.forEach((s) => {
    s.addEventListener("click", () => {
      selectedRating = Number(s.dataset.value);
      paint(selectedRating);
    });
    s.addEventListener("mouseenter", () => paint(Number(s.dataset.value)));
  });
  if (starWrap) starWrap.addEventListener("mouseleave", () => paint(selectedRating));

  function openModal() {
    const v = overlay.querySelector("#reviewView");
    if (v) v.remove();
    if (form) form.style.display = "";
    const t = overlay.querySelector("#reviewModalTitle");
    if (t) t.textContent = "Leave a Review";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  openBtns.forEach((b) =>
    b.addEventListener("click", (e) => { e.preventDefault(); openModal(); })
  );

  if (closeBtn) closeBtn.addEventListener("click", closeReviewView);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeReviewView(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeReviewView();
  });

  const note = document.getElementById("reviewNote");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    note.className = "form-note";

    const name = form.reviewerName.value.trim();
    const message = form.reviewerMessage.value.trim();

    if (!name || !message || selectedRating < 1) {
      note.textContent = "Please add your name, a review, and a star rating.";
      note.classList.add("error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      await Api.createReview({ name, message, rating: selectedRating });
      note.textContent = "Thank you for your review!";
      note.classList.add("success");
      form.reset();
      selectedRating = 0;
      paint(0);

      _reviewsLoaded = false;
      await loadReviews();

      setTimeout(closeReviewView, 1200);
    } catch (err) {
      note.textContent = err.message;
      note.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Review";
    }
  });
}

let _booted = false;
function boot() {
  if (_booted) return;
  _booted = true;
  loadReviews();
  initReviewModal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}