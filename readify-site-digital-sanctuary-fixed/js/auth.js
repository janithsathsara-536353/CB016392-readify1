// Simple front-end auth (localStorage). No backend.
// For assignments, this is fine as "client-side authentication demo".

const AUTH_KEY = "readify_auth_user";

function setUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function clearUser() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  return !!getUser();
}

// Redirect helper
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

// If this is the login page, handle login form
document.addEventListener("DOMContentLoaded", () => {
  // Make the page animation work (your CSS uses body.loaded)
  document.body.classList.add("loaded");

  const form = document.getElementById("loginForm");
  if (isLoggedIn()) {
  // Instead of redirecting, show info + logout option
  const user = getUser();
  const msg = document.getElementById("msg");
  const form = document.getElementById("loginForm");

  if (form) form.style.display = "none";
  if (msg) {
    msg.innerHTML = `You’re already logged in as <b>${user.email}</b>.`;
  }
  return;
}

  const msg = document.getElementById("msg");
  const demoBtn = document.getElementById("demoBtn");

  demoBtn.addEventListener("click", () => {
    setUser({ email: "demo@readify.com", name: "Demo User", at: Date.now() });
    window.location.href = "index.html";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || password.length < 4) {
      msg.textContent = "Please enter a valid email and a password (4+ characters).";
      return;
    }

    // Fake auth success
    setUser({ email, name: email.split("@")[0], at: Date.now() });
    window.location.href = "index.html";
  });
});

// Export helpers to window so other pages can use them
window.ReadifyAuth = { setUser, getUser, clearUser, isLoggedIn, requireAuth };
