// ---------------- TAB SWITCH ----------------
const tabs       = document.querySelectorAll(".tab");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");

function switchTab(tabName) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));

  if (tabName === "signup") {
    signinForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    document.getElementById("formTitle").textContent    = "Create an Account";
    document.getElementById("formSubtitle").textContent = "Join Veritas today. It's free.";
  } else {
    signupForm.classList.add("hidden");
    signinForm.classList.remove("hidden");
    document.getElementById("formTitle").textContent    = "Log In to Your Account";
    document.getElementById("formSubtitle").textContent = "Welcome back. Please enter your credentials below.";
  }
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

// ---------------- LINK SWITCH ----------------
// data-switch="signup" or data-switch="signin"
document.querySelectorAll("[data-switch]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab(link.dataset.switch);
  });
});

// ---------------- PASSWORD TOGGLE ----------------
document.querySelectorAll(".toggle-pw").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (input.type === "password") {
      input.type      = "text";
      btn.textContent = "Hide";
    } else {
      input.type      = "password";
      btn.textContent = "Show";
    }
  });
});

// ---------------- PASSWORD STRENGTH ----------------
const signupPassword = document.getElementById("signupPassword");
const strengthFill   = document.getElementById("strengthFill");
const strengthLabel  = document.getElementById("strengthLabel");

signupPassword.addEventListener("input", () => {
  const val = signupPassword.value;
  let score = 0;
  if (val.length >= 8)              score++;
  if (/[A-Z]/.test(val))            score++;
  if (/[0-9]/.test(val))            score++;
  if (/[^A-Za-z0-9]/.test(val))     score++;

  const levels = [
    { label: "Too short", color: "#e74c3c", width: "10%" },
    { label: "Weak",      color: "#e74c3c", width: "25%" },
    { label: "Fair",      color: "#f39c12", width: "50%" },
    { label: "Good",      color: "#2ecc71", width: "75%" },
    { label: "Strong",    color: "#27ae60", width: "100%" },
  ];

  if (val.length === 0) {
    strengthFill.style.width  = "0";
    strengthLabel.textContent = "Password strength";
  } else {
    const level = levels[score];
    strengthFill.style.width           = level.width;
    strengthFill.style.backgroundColor = level.color;
    strengthLabel.textContent          = level.label;
  }
});

// ---------------- STATUS HELPER ----------------
function showStatus(msg, isError = false) {
  const el = document.getElementById("statusMessage");
  el.textContent = msg;
  el.className   = "status-message " + (isError ? "status-error" : "status-success");
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 4000);
}

// ---------------- LOGIN ----------------
signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("signinEmail").value.trim();
  const password = document.getElementById("signinPassword").value;

  try {
    const res  = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.error) {
      showStatus(data.error, true);
      return;
    }

    localStorage.setItem("user", data.username);
    showStatus("Login successful! Redirecting…");
    setTimeout(() => window.location.href = "index.html", 1000);

  } catch (err) {
    console.error(err);
    showStatus("Connection error — is the backend running?", true);
  }
});

// ---------------- SIGNUP ----------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm  = document.getElementById("signupConfirm").value;

  if (password !== confirm) {
    showStatus("Passwords do not match", true);
    return;
  }

  try {
    const res  = await fetch("http://127.0.0.1:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (data.error) {
      showStatus(data.error, true);
      return;
    }

    localStorage.setItem("user", data.username);
    showStatus("Account created! Redirecting…");
    setTimeout(() => window.location.href = "index.html", 1000);

  } catch (err) {
    console.error(err);
    showStatus("Connection error — is the backend running?", true);
  }
});

// ---------------- MENU ----------------
const menuBtn      = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("hidden");
});

document.addEventListener("click", () => menuDropdown.classList.add("hidden"));

// Show logout option if already logged in
const currentUser = localStorage.getItem("user");
if (currentUser && currentUser !== "null" && currentUser !== "undefined") {
  const logoutItem = document.getElementById("logoutItem");
  if (logoutItem) {
    logoutItem.classList.remove("hidden");
    logoutItem.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user");
      window.location.reload();
    });
  }
}

// ---------------- FORGOT PASSWORD ----------------
document.getElementById("forgotLink").addEventListener("click", (e) => {
  e.preventDefault();
  showStatus("Password reset coming soon.", false);
});

// ---------------- YEAR ----------------
document.getElementById("year").textContent = new Date().getFullYear();