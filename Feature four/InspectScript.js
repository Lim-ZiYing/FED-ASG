// inspections.js (Firebase version, student simple)

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  // ===== Get elements =====
  const stallSelect = document.getElementById("stallSelect");
  const officerName = document.getElementById("officerName");
  const clean = document.getElementById("clean");
  const handle = document.getElementById("handle");
  const pest = document.getElementById("pest");
  const storage = document.getElementById("storage");
  const remarks = document.getElementById("remarks");

  const totalScoreEl = document.getElementById("totalScore");
  const gradeEl = document.getElementById("grade");
  const errorEl = document.getElementById("error");

  const saveBtn = document.getElementById("saveBtn");
  const historyBody = document.getElementById("historyBody");
  const gradeFilter = document.getElementById("gradeFilter");

  // ===== Init =====
  loadStalls();
  updatePreview();
  renderHistory();

  // ===== Listeners =====
  [clean, handle, pest, storage].forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  gradeFilter.addEventListener("change", renderHistory);
  saveBtn.addEventListener("click", saveInspection);

  // ===== FUNCTIONS =====

  // Load stalls from Firebase (collection: stalls)
  async function loadStalls() {
    stallSelect.innerHTML = "";

    try {
      const snap = await getDocs(collection(db, "stalls"));

      snap.forEach(docSnap => {
        const s = docSnap.data();
        const opt = document.createElement("option");
        opt.value = s.stallId;
        opt.textContent = `${s.stallId} - ${s.stallName}`;
        stallSelect.appendChild(opt);
      });

    } catch (err) {
      console.error(err);
      errorEl.textContent = "Failed to load stalls from Firebase.";
    }
  }

  function getTotal() {
    return (
      Number(clean.value) +
      Number(handle.value) +
      Number(pest.value) +
      Number(storage.value)
    );
  }

  function getGrade(total) {
    if (total >= 90) return "A";
    if (total >= 75) return "B";
    if (total >= 60) return "C";
    return "D";
  }

  function updatePreview() {
    const total = getTotal();
    totalScoreEl.textContent = total;
    gradeEl.textContent = getGrade(total);
  }

  function showError(msg) {
    errorEl.textContent = msg;
  }

  // Save inspection to Firebase (collection: inspections)
  async function saveInspection() {
    errorEl.textContent = "";

    if (!officerName.value.trim()) {
      showError("Officer name is required.");
      return;
    }

    if (clean.value < 0 || clean.value > 30) return showError("Cleanliness must be 0–30");
    if (handle.value < 0 || handle.value > 30) return showError("Food Handling must be 0–30");
    if (pest.value < 0 || pest.value > 20) return showError("Pest Control must be 0–20");
    if (storage.value < 0 || storage.value > 20) return showError("Storage/Temp must be 0–20");

    const total = getTotal();
    const grade = getGrade(total);

    if ((grade === "C" || grade === "D") && !remarks.value.trim()) {
      showError("Remarks required for Grade C or D.");
      return;
    }

    const stallText = stallSelect.options[stallSelect.selectedIndex].textContent;
    const [stallId, stallName] = stallText.split(" - ");

    const inspection = {
      date: new Date().toLocaleString(),
      stallId,
      stallName,
      officer: officerName.value.trim(),
      scores: {
        cleanliness: Number(clean.value),
        handling: Number(handle.value),
        pest: Number(pest.value),
        storage: Number(storage.value)
      },
      total,
      grade,
      remarks: remarks.value.trim()
    };

    try {
      await addDoc(collection(db, "inspections"), inspection);

      // reset form
      clean.value = handle.value = pest.value = storage.value = 0;
      remarks.value = "";
      updatePreview();

      alert("Inspection saved to Firebase!");
      renderHistory();

    } catch (err) {
      console.error(err);
      showError("Failed to save inspection.");
    }
  }

  // Load inspection history from Firebase
  async function renderHistory() {
    historyBody.innerHTML = "";

    try {
      const q = query(
        collection(db, "inspections"),
        orderBy("date", "desc")
      );

      const snap = await getDocs(q);
      let records = [];

      snap.forEach(d => records.push({ id: d.id, ...d.data() }));

      const filter = gradeFilter.value;
      if (filter) {
        records = records.filter(r => r.grade === filter);
      }

      if (records.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="6">No records found.</td></tr>`;
        return;
      }

      records.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.date}</td>
          <td>${item.stallId} - ${item.stallName}</td>
          <td>${item.officer}</td>
          <td>${item.total}</td>
          <td>${item.grade}</td>
          <td><button>Delete</button></td>
        `;

        tr.querySelector("button").addEventListener("click", async () => {
          await deleteDoc(collection(db, "inspections").doc(item.id));
          renderHistory();
        });

        historyBody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
      historyBody.innerHTML = `<tr><td colspan="6">Error loading history.</td></tr>`;
    }
  }

});
