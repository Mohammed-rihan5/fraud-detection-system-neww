// ---------------- USER STATE ----------------
let currentUser = localStorage.getItem("user");

if (currentUser === "null" || currentUser === "undefined") {
  currentUser = null;
  localStorage.removeItem("user");
}

// ---------------- ELEMENTS ----------------
const loginBtn      = document.getElementById("loginBtn");
const signupBtn     = document.getElementById("signupBtn");
const logoutBtn     = document.getElementById("logoutBtn");
const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn  = document.getElementById("authLoggedIn");
const userChip      = document.getElementById("userChip");
const menuBtn       = document.getElementById("menuBtn");
const menuDropdown  = document.getElementById("menuDropdown");
const authModal     = document.getElementById("authModal");
const modalClose    = document.getElementById("modalClose");
const authTitle     = document.getElementById("authTitle");
const authSub       = document.getElementById("authSub");
const authForm      = document.getElementById("authForm");
const authSubmit    = document.getElementById("authSubmit");
const authToggle    = document.getElementById("authToggle");
const nameField     = document.getElementById("nameField");
const newsText      = document.getElementById("newsText");
const resultCard    = document.getElementById("resultCard");
const verdictText   = document.getElementById("verdictText");
const credValue     = document.getElementById("credValue");
const credFill      = document.getElementById("credFill");
const flagsList     = document.getElementById("flagsList");
const verifyBtn     = document.getElementById("verifyBtn");
const clearBtn      = document.getElementById("clearBtn");

// ---------------- UPDATE UI ----------------
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

// ---------------- MENU ----------------
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("hidden");
  menuBtn.setAttribute("aria-expanded", !menuDropdown.classList.contains("hidden"));
});

// Stop clicks inside dropdown from closing it
menuDropdown.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", () => {
  menuDropdown.classList.add("hidden");
  menuBtn.setAttribute("aria-expanded", "false");
});

// ---------------- REPORTS MENU ITEM ----------------
document.getElementById("menuReports").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  menuDropdown.classList.add("hidden");
  if (!currentUser) {
    openModal(false);
    return;
  }
  window.location.href = "report.html";
});

// ---------------- MODAL ----------------
let isSignup = false;

function openModal(signup = false) {
  isSignup = signup;
  authForm.reset();
  setModalMode(signup);
  authModal.classList.remove("hidden");
}

function closeModal() {
  authModal.classList.add("hidden");
  authForm.reset();
}

function setModalMode(signup) {
  isSignup = signup;
  if (signup) {
    authTitle.textContent  = "Create Account";
    authSub.textContent    = "Join Veritas today.";
    authSubmit.textContent = "Sign Up";
    authToggle.textContent = "Already have an account?";
    nameField.classList.remove("hidden");
    nameField.querySelector("input").required = true;
  } else {
    authTitle.textContent  = "Log In";
    authSub.textContent    = "Welcome back to Veritas.";
    authSubmit.textContent = "Log In";
    authToggle.textContent = "Need an account?";
    nameField.classList.add("hidden");
    nameField.querySelector("input").required = false;
  }
}

loginBtn.addEventListener("click",  () => openModal(false));
signupBtn.addEventListener("click", () => openModal(true));
modalClose.addEventListener("click", closeModal);
authToggle.addEventListener("click", () => setModalMode(!isSignup));

authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ---------------- AUTH SUBMIT ----------------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const name     = document.getElementById("name").value.trim();

  const endpoint = isSignup
    ? "http://127.0.0.1:5000/signup"
    : "http://127.0.0.1:5000/login";

  const body = isSignup
    ? { username: name, email, password }
    : { email, password };

  authSubmit.textContent = "Please wait…";
  authSubmit.disabled    = true;

  try {
    const res  = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    currentUser = data.username;
    localStorage.setItem("user", currentUser);
    closeModal();
    updateUI();
    alert(isSignup ? "Account created!" : "Login successful!");

  } catch (err) {
    console.error(err);
    alert("Connection error — is the backend running?");
  } finally {
    authSubmit.textContent = isSignup ? "Sign Up" : "Log In";
    authSubmit.disabled    = false;
  }
});

// ---------------- LOGOUT ----------------
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  currentUser = null;
  updateUI();
});

// ---------------- VERIFY ----------------
verifyBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!currentUser) {
    openModal(false);
    return;
  }

  const text    = newsText.value.trim();
  const source  = document.getElementById("sourceLink").value.trim();
  const country = document.getElementById("country").value;

  if (text.length < 30) {
    alert("Enter at least 30 characters");
    return;
  }

  verifyBtn.textContent = "Analyzing…";
  verifyBtn.disabled    = true;
  resultCard.classList.add("hidden");

  try {
    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, text, source, country })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    displayResult(data);

  } catch (err) {
    console.error(err);
    alert("Backend error — is the server running?");
  } finally {
    verifyBtn.textContent = "Verify Article";
    verifyBtn.disabled    = false;
  }
});

// ---------------- DISPLAY RESULT ----------------
function displayResult(data) {
  const cred = data.credibility;

  verdictText.textContent = data.verdict;
  credValue.textContent   = cred + "/100";
  credFill.style.width    = cred + "%";

  if (data.bias_score !== undefined) {
    document.getElementById("biasMarker").style.left = data.bias_score + "%";
    document.getElementById("biasLabel").textContent = data.bias_label || "";
  }

  flagsList.innerHTML = "";
  if (!data.flags || data.flags.length === 0) {
    flagsList.innerHTML = "<li>No red flags detected</li>";
  } else {
    data.flags.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      flagsList.appendChild(li);
    });
  }

  resultCard.classList.remove("hidden");

  setTimeout(() => {
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

// ---------------- CLEAR ----------------
clearBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  newsText.value = "";
  document.getElementById("sourceLink").value = "";
  document.getElementById("country").value    = "";
  document.getElementById("mediaPreview").innerHTML = "";
  document.getElementById("charCount").textContent  = "0 characters";
  resultCard.classList.add("hidden");
});

// ---------------- CHAR COUNT ----------------
newsText.addEventListener("input", () => {
  document.getElementById("charCount").textContent = newsText.value.length + " characters";
});

// ---------------- MEDIA UPLOAD ----------------
document.getElementById("addMediaBtn").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function () {
  const preview = document.getElementById("mediaPreview");
  preview.innerHTML = "";
  Array.from(this.files).forEach(file => {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.style.cssText = "max-height:120px;border-radius:4px;margin:4px;object-fit:cover";
      preview.appendChild(img);
    } else {
      const vid = document.createElement("video");
      vid.src      = url;
      vid.controls = true;
      vid.style.cssText = "max-height:120px;border-radius:4px;margin:4px";
      preview.appendChild(vid);
    }
  });
});

// ---------------- YEAR ----------------
document.getElementById("year").textContent = new Date().getFullYear();