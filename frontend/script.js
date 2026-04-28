console.log("JS WORKING");

// ---------------- USER ----------------
let currentUser = localStorage.getItem("user");

if (currentUser === "null" || currentUser === "undefined") {
  currentUser = null;
  localStorage.removeItem("user");
}

// ---------------- ELEMENTS ----------------
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userChip = document.getElementById("userChip");

const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn = document.getElementById("authLoggedIn");

const authModal = document.getElementById("authModal");
const modalClose = document.getElementById("modalClose");
const authToggle = document.getElementById("authToggle");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const nameField = document.getElementById("nameField");

const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");

let authMode = "login";

// ---------------- MENU ----------------
menuBtn?.addEventListener("click", () => {
  menuDropdown.classList.toggle("hidden");
});

// ---------------- UI ----------------
function updateUI() {
  if (currentUser) {
    authLoggedOut.classList.add("hidden");
    authLoggedIn.classList.remove("hidden");
    userChip.textContent = "👤 " + currentUser;
  } else {
    authLoggedOut.classList.remove("hidden");
    authLoggedIn.classList.add("hidden");
  }
}
updateUI();

// ---------------- AUTH ----------------
loginBtn?.addEventListener("click", () => {
  authModal.classList.remove("hidden");
  switchToLogin();
});

signupBtn?.addEventListener("click", () => {
  authModal.classList.remove("hidden");
  switchToSignup();
});

modalClose?.addEventListener("click", () => {
  authModal.classList.add("hidden");
});

authToggle?.addEventListener("click", () => {
  authMode === "login" ? switchToSignup() : switchToLogin();
});

function switchToSignup() {
  authMode = "signup";
  authTitle.textContent = "Sign Up";
  authSubmit.textContent = "Create Account";
  authToggle.textContent = "Already have an account?";
  nameField.classList.remove("hidden");
}

function switchToLogin() {
  authMode = "login";
  authTitle.textContent = "Log In";
  authSubmit.textContent = "Log In";
  authToggle.textContent = "Need an account?";
  nameField.classList.add("hidden");
}

// ---------------- AUTH SUBMIT ----------------
document.getElementById("authForm")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  if (authMode === "signup" && !name) {
    alert("Enter name");
    return;
  }

  currentUser = name || email;
  localStorage.setItem("user", currentUser);

  alert("Logged in as " + currentUser);

  authModal.classList.add("hidden");
  updateUI();
});

// ---------------- LOGOUT ----------------
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("user");
  currentUser = null;
  updateUI();
  alert("Logged out");
});

// ---------------- NAVIGATION ----------------
document.getElementById("menuReports")?.addEventListener("click", () => {
  if (!currentUser) {
    alert("Please login first");
    return;
  }
  window.location.href = "report.html";
});

// ---------------- VERIFY ----------------
const newsText = document.getElementById("newsText");
const resultCard = document.getElementById("resultCard");

const verdictText = document.getElementById("verdictText");
const credValue = document.getElementById("credValue");
const credFill = document.getElementById("credFill");
const flagsList = document.getElementById("flagsList");

// Fake AI results
const sampleResults = [
  {
    verdict: "REAL",
    credibility: 88,
    flags: ["No major red flags detected"]
  },
  {
    verdict: "FAKE",
    credibility: 32,
    flags: ["Sensational language detected", "Clickbait phrasing"]
  },
  {
    verdict: "UNCERTAIN",
    credibility: 60,
    flags: ["Lack of supporting data"]
  }
];

// Save to history
function saveToHistory(data, text) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  history.unshift({
    text: text,
    verdict: data.verdict,
    credibility: data.credibility,
    flags: data.flags
  });

  history = history.slice(0, 10);
  localStorage.setItem("history", JSON.stringify(history));
}

// Analyze
function analyze() {
  const text = newsText.value;

  if (text.length < 30) {
    alert("Enter at least 30 characters");
    return;
  }

  const data = sampleResults[Math.floor(Math.random() * sampleResults.length)];

  displayResult(data);
  saveToHistory(data, text);
}

// Prevent reload
document.getElementById("verifyBtn")?.addEventListener("click", function (e) {
  e.preventDefault();
  analyze();
});

// ---------------- DISPLAY ----------------
function displayResult(data) {
  verdictText.textContent = data.verdict;
  credValue.textContent = data.credibility + "/100";
  credFill.style.width = data.credibility + "%";

  flagsList.innerHTML = "";

  data.flags.forEach(f => {
    const li = document.createElement("li");
    li.textContent = f;
    flagsList.appendChild(li);
  });

  resultCard.classList.remove("hidden");
}

// ---------------- CLEAR ----------------
document.getElementById("clearBtn")?.addEventListener("click", () => {
  newsText.value = "";
  document.getElementById("sourceLink").value = "";
  document.getElementById("country").value = "";
  resultCard.classList.add("hidden");
});

// ---------------- YEAR ----------------
document.getElementById("year").textContent = new Date().getFullYear();

function analyze() {
  const text = document.getElementById("newsText").value;

  if (text.length < 30) {
    alert("Enter valid article");
    return;
  }

  const fakeData = {
    verdict: "⚠️ Potentially Misleading",
    credibility: Math.floor(Math.random() * 50) + 40,
    bias_label: "Center",
    bias_score: 50,
    flags: ["Clickbait detected", "No verified source"]
  };

  displayResult(fakeData);
}
