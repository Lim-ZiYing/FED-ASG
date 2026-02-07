import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
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

  loadStalls();
  updatePreview();

  [clean, handle, pest, storage].forEach(inp => inp.addEventListener("input", updatePreview));
  saveBtn.addEventListener("click", saveInspection);

  async function loadStalls() {
    stallSelect.innerHTML = "";

    try {
      const q = query(collection(db, "stalls"), orderBy("stallId", "asc"));
      const snap = await getDocs(q);

      snap.forEach(docSnap => {
        const s = docSnap.data();
        const opt = document.createElement("option");
        opt.value = s.stallId;
        opt.textContent = `${s.stallId} - ${s.stallName}`;
        stallSelect.appendChild(opt);
      });

    } catch (err) {
      console.error(err);
      errorEl.textContent = "Failed to load stalls.";
    }
  }

  function getTotal() {
    return (Number(clean.value) || 0) +
           (Number(handle.value) || 0) +
           (Number(pest.value) || 0) +
           (Number(storage.value) || 0);
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

  async function saveInspection() {
    errorEl.textContent = "";

    if (!stallSelect.value) return errorEl.textContent = "No stalls available.";
    if (!officerName.value.trim()) return errorEl.textContent = "Officer name is required.";

    if (clean.value < 0 || clean.value > 30) return errorEl.textContent = "Cleanliness must be 0–30";
    if (handle.value < 0 || handle.value > 30) return errorEl.textContent = "Food Handling must be 0–30";
    if (pest.value < 0 || pest.value > 20) return errorEl.textContent = "Pest Control must be 0–20";
    if (storage.value < 0 || storage.value > 20) return errorEl.textContent = "Storage/Temp must be 0–20";

    const total = getTotal();
    const grade = getGrade(total);

    if ((grade === "C" || grade === "D") && !remarks.value.trim()) {
      return errorEl.textContent = "Remarks required for Grade C or D.";
    }

    const stallText = stallSelect.options[stallSelect.selectedIndex].textContent;
    const [stallId, ...rest] = stallText.split(" - ");
    const stallName = rest.join(" - ");

    const inspection = {
      date: new Date(), // stored as Firestore Timestamp
      stallId,
      stallName,
      officer: officerName.value.trim(),
      scores: {
        cleanliness: Number(clean.value) || 0,
        handling: Number(handle.value) || 0,
        pest: Number(pest.value) || 0,
        storage: Number(storage.value) || 0
      },
      total,
      grade,
      remarks: remarks.value.trim()
    };

    try {
      await addDoc(collection(db, "inspections"), inspection);
      alert("Saved!");
      location.href = "history.html";
    } catch (err) {
      console.error(err);
      errorEl.textContent = "Failed to save inspection.";
    }
  }
});
