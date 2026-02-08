import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const historyBody = document.getElementById("historyBody");
const gradeFilter = document.getElementById("gradeFilter");

gradeFilter.addEventListener("change", loadHistory);
loadHistory();

async function loadHistory() {
  historyBody.innerHTML = "";

  try {
    const q = query(collection(db, "inspections"), orderBy("date", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      historyBody.innerHTML = `<tr><td colspan="6">No records found.</td></tr>`;
      return;
    }

    let records = [];
    snap.forEach(d => records.push({ id: d.id, ...d.data() }));

    const filter = gradeFilter.value;
    if (filter) {
      records = records.filter(r => r.grade === filter);
    }

    records.forEach(r => {
      // ✅ SAFE date handling
      let dateText = "-";
      if (r.date && typeof r.date.toDate === "function") {
        dateText = r.date.toDate().toLocaleString();
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td data-label="Date">${dateText}</td>
      <td data-label="Stall">${r.stallId} - ${r.stallName}</td>
      <td data-label="Officer">${r.officer}</td>
      <td data-label="Score">${r.total}</td>
      <td data-label="Grade">${r.grade}</td>
      <td data-label="Action">
        <button onclick="location.href='dashboard.html?id=${r.id}'">View</button>
      </td>
    `;


      historyBody.appendChild(tr);
    });

  } catch (err) {
    console.error("History load error:", err);
    historyBody.innerHTML =
      `<tr><td colspan="6">Error loading history.</td></tr>`;
  }
}
