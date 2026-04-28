const user = localStorage.getItem("user");

const container = document.getElementById("reportsContainer");
const emptyMsg = document.getElementById("emptyMsg");

async function loadReports() {
  if (!user) {
    emptyMsg.style.display = "block";
    emptyMsg.textContent = "Login to see history";
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:5000/history/${user}`);
    const data = await res.json();

    container.innerHTML = "";

    if (!data || data.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    emptyMsg.style.display = "none";

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "report-card";

      card.innerHTML = `
        <div class="report-top">
          <span class="verdict">${item.verdict}</span>
          <span class="score">${item.credibility}/100</span>
        </div>

        <div class="text-preview">
          ${item.text.substring(0, 120)}...
        </div>

        <div class="flags">
          ${
            item.flags && item.flags.length
              ? item.flags.map(f => `<span class="flag">${f}</span>`).join("")
              : "<span>No flags</span>"
          }
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading reports</p>";
  }
}

loadReports();