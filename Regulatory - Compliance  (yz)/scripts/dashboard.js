import { db } from "../firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");

// Top info
const stallTitle = document.getElementById("stallTitle");
const officerText = document.getElementById("officerText");
const dateText = document.getElementById("dateText");

// Text centers
const tClean = document.getElementById("tClean");
const tHandle = document.getElementById("tHandle");
const tPest = document.getElementById("tPest");
const tStorage = document.getElementById("tStorage");
const tTotal = document.getElementById("tTotal");

// Summary
const totalScoreText = document.getElementById("totalScoreText");
const bigGrade = document.getElementById("bigGrade");
const remarksText = document.getElementById("remarksText");


// Chart instances
let chartClean, chartHandle, chartPest, chartStorage, chartTotal;

if (!id) {
  stallTitle.textContent = "No inspection selected.";
} else {
  loadDashboard(id);
}

async function loadDashboard(docId) {
  const ref = doc(db, "inspections", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    stallTitle.textContent = "Inspection not found.";
    return;
  }

  const r = snap.data();

  // Title info
  stallTitle.textContent = `${r.stallId} - ${r.stallName}`;
  officerText.textContent = r.officer || "-";
  dateText.textContent = r.date?.toDate ? r.date.toDate().toLocaleString() : "-";

  // Scores
  const clean = r.scores?.cleanliness ?? 0;
  const handle = r.scores?.handling ?? 0;
  const pest = r.scores?.pest ?? 0;
  const storage = r.scores?.storage ?? 0;
  const total = r.total ?? (clean + handle + pest + storage);
  const grade = r.grade || calcGrade(total);

  // Update center texts
  tClean.textContent = `${clean}/30`;
  tHandle.textContent = `${handle}/30`;
  tPest.textContent = `${pest}/20`;
  tStorage.textContent = `${storage}/20`;
  tTotal.textContent = `${total}/100`;

  // Summary
  totalScoreText.textContent = total;
  remarksText.textContent = r.remarks ? r.remarks : "-";

  setBigGrade(grade);

  // Draw charts
  chartClean = drawDonut("cClean", clean, 30, chartClean);
  chartHandle = drawDonut("cHandle", handle, 30, chartHandle);
  chartPest = drawDonut("cPest", pest, 20, chartPest);
  chartStorage = drawDonut("cStorage", storage, 20, chartStorage);
  chartTotal = drawDonut("cTotal", total, 100, chartTotal);
}

function calcGrade(total) {
  if (total >= 90) return "A";
  if (total >= 75) return "B";
  if (total >= 60) return "C";
  return "D";
}

function setBigGrade(grade) {
  bigGrade.textContent = grade;

  bigGrade.classList.remove("gA", "gB", "gC", "gD");
  if (grade === "A") bigGrade.classList.add("gA");
  else if (grade === "B") bigGrade.classList.add("gB");
  else if (grade === "C") bigGrade.classList.add("gC");
  else bigGrade.classList.add("gD");
}


// Simple doughnut: score vs remaining
function drawDonut(canvasId, score, max, existingChart) {
  const ctx = document.getElementById(canvasId);

  if (existingChart) existingChart.destroy();

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Score", "Remaining"],
      datasets: [{
        data: [score, Math.max(0, max - score)]
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { display: false } // keep it simple like your sketch
      }
    }
  });
}
