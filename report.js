const user = localStorage.getItem("user");

// Only warn — DO NOT force redirect
if (!user) {
  alert("You are not logged in. Showing empty reports.");
}

// Buttons
document.getElementById("homeBtn").onclick = () => {
  window.location.href = "index.html";
};

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("user");
  alert("Logged out");
  window.location.href = "login.html";
};

// Load reports
async function loadReports() {
  if (!user) return;

  try {
    const res = await fetch(`http://127.0.0.1:5000/history/${user}`);
    const data = await res.json();

    const container = document.getElementById("reportsContainer");
    const emptyMsg = document.getElementById("emptyMsg");

    container.innerHTML = "";

    if (!data.length) {
      emptyMsg.style.display = "block";
      return;
    }

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "report-card";

      card.innerHTML = `
        <div class="report-top">
          <span class="verdict ${item.verdict}">${item.verdict}</span>
          <span class="score">${item.credibility}/100</span>
        </div>

        <div class="text-preview">
          ${item.text.substring(0, 120)}...
        </div>

        <div class="flags">
          ${
            item.flags.length
              ? item.flags.map(f => `<span class="flag">${f}</span>`).join("")
              : "<span>No flags</span>"
          }
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading reports");
  }
}

loadReports();