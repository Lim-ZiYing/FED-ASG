import { db } from "../firebase.js";
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

  const q = query(collection(db, "inspections"), orderBy("date", "desc"));
  const snap = await getDocs(q);

  let records = [];
  snap.forEach(d => records.push({ id: d.id, ...d.data() }));

  const filter = gradeFilter.value;
  if (filter) records = records.filter(r => r.grade === filter);

  if (records.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="6">No records found.</td></tr>`;
    return;
  }

  records.forEach(r => {
    const dateText = r.date?.toDate ? r.date.toDate().toLocaleString() : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dateText}</td>
      <td>${r.stallId} - ${r.stallName}</td>
      <td>${r.officer}</td>
      <td>${r.total}</td>
      <td>${r.grade}</td>
      <td><button data-id="${r.id}">View</button></td>
    `;

    tr.querySelector("button").addEventListener("click", () => {
      location.href = `dashboard.html?id=${r.id}`;
    });

    historyBody.appendChild(tr);
  });
}
