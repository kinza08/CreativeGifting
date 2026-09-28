/* ============================================================
   api.js — single point of contact with the FastAPI backend.
   No other file should build a URL or call fetch() directly.
   ============================================================ */

const API_BASE_URL = "";
const TOKEN_KEY = "admin_access_token";

/**
 * Turns any failed fetch into a short, user-facing message
 * instead of leaking backend internals.
 */
async function parseErrorMessage(response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch (_) {
    /* body wasn't JSON — fall through to the generic message */
  }
  if (response.status === 404) return "We couldn't find that.";
  if (response.status >= 500) return "Something went wrong on our end. Please try again.";
  return "Something went wrong. Please try again.";
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
  } catch (networkError) {
    console.error("Network error calling", path, networkError);
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Same as request(), but attaches the admin JWT and redirects to
 * login automatically if the token is missing or has expired.
 */
async function authenticatedRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (networkError) {
    console.error("Network error calling", path, networkError);
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Same as authenticatedRequest(), but for file uploads: sends a
 * File as multipart/form-data instead of JSON. The browser sets
 * the Content-Type (with boundary) itself, so it's left out here.
 */
async function authenticatedUpload(path, file) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }

  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (networkError) {
    console.error("Network error calling", path, networkError);
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function redirectToLogin() {
  const inAdminFolder = window.location.pathname.includes("/admin/");
  window.location.href = inAdminFolder ? "login.html" : "admin/login.html";
}

/* ---------------- Public endpoints ---------------- */

const Api = {
  getServices: () => request("/services"),
  getReviews: () => request("/reviews"),
  createReview: (data) => request("/reviews", { method: "POST", body: JSON.stringify(data) }),
  sendMessage: (data) => request("/messages", { method: "POST", body: JSON.stringify(data) }),
  getSocialLinks: () => request("/social"),

  login: (username, password) =>
    request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  /* ---------------- Admin endpoints ---------------- */

  getAdminMessages: () => authenticatedRequest("/admin/messages"),
  deleteMessage: (id) => authenticatedRequest(`/admin/messages/${id}`, { method: "DELETE" }),

  createService: (data) =>
    authenticatedRequest("/admin/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) =>
    authenticatedRequest(`/admin/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id) => authenticatedRequest(`/admin/services/${id}`, { method: "DELETE" }),
  uploadServiceImage: (file) => authenticatedUpload("/admin/services/upload-image", file),

  deleteReview: (id) => authenticatedRequest(`/admin/reviews/${id}`, { method: "DELETE" }),

  createSocialLink: (data) =>
    authenticatedRequest("/admin/social", { method: "POST", body: JSON.stringify(data) }),
  updateSocialLink: (id, data) =>
    authenticatedRequest(`/admin/social/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSocialLink: (id) => authenticatedRequest(`/admin/social/${id}`, { method: "DELETE" }),

  changePassword: (currentPassword, newPassword) =>
    authenticatedRequest("/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),
};