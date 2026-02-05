// ===== Simple Student Version (Merged + Working) =====

document.addEventListener("DOMContentLoaded", () => {

  // localStorage keys
  const KEY_INSPECTIONS = "nea_inspections";
  const KEY_STALLS = "hawker_stalls";


  // 2) Get elements
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

  // 3) Load stalls from localStorage into dropdown
  loadStalls();

  // 4) Init preview + table
  updatePreview();
  renderHistory();

  // 5) Listeners
  [clean, handle, pest, storage].forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  gradeFilter.addEventListener("change", renderHistory);
  saveBtn.addEventListener("click", saveInspection);

  // ===== FUNCTIONS =====

  function getStalls() {
  try {
    return JSON.parse(localStorage.getItem("hawker_stalls")) || [];
  } catch {
    return [];
  }
}


  function loadStalls() {
    const stalls = getStalls();

    stallSelect.innerHTML = "";
    stalls.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.stallId;
      opt.textContent = `${s.stallId} - ${s.stallName}`;
      stallSelect.appendChild(opt);
    });
  }

  function getTotal() {
    const c = Number(clean.value) || 0;
    const h = Number(handle.value) || 0;
    const p = Number(pest.value) || 0;
    const s = Number(storage.value) || 0;
    return c + h + p + s;
  }

  function getGrade(total) {
    if (total >= 90) return "A";
    if (total >= 75) return "B";
    if (total >= 60) return "C";
    return "D";
  }

  function updatePreview() {
    const total = getTotal();
    const grade = getGrade(total);
    totalScoreEl.textContent = total;
    gradeEl.textContent = grade;
  }

  function readInspections() {
    const raw = localStorage.getItem(KEY_INSPECTIONS);
    return raw ? JSON.parse(raw) : [];
  }

  function writeInspections(list) {
    localStorage.setItem(KEY_INSPECTIONS, JSON.stringify(list));
  }

  function showRangeError(msg) {
    errorEl.textContent = msg;
  }

  function saveInspection() {
    errorEl.textContent = "";

    if (!officerName.value.trim()) {
      errorEl.textContent = "Officer name is required.";
      return;
    }

    // range check
    if (clean.value < 0 || clean.value > 30) return showRangeError("Cleanliness must be 0–30");
    if (handle.value < 0 || handle.value > 30) return showRangeError("Food Handling must be 0–30");
    if (pest.value < 0 || pest.value > 20) return showRangeError("Pest Control must be 0–20");
    if (storage.value < 0 || storage.value > 20) return showRangeError("Storage/Temp must be 0–20");

    const total = getTotal();
    const grade = getGrade(total);

    if ((grade === "C" || grade === "D") && !remarks.value.trim()) {
      errorEl.textContent = "Remarks are required for Grade C or D.";
      return;
    }

    const stalls = getStalls();
    const stallId = stallSelect.value;
    const stallName = stalls.find(s => s.stallId === stallId)?.stallName || "";

    const inspection = {
      id: Date.now(),
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

    const list = readInspections();
    list.unshift(inspection);
    writeInspections(list);

    // reset
    clean.value = 0;
    handle.value = 0;
    pest.value = 0;
    storage.value = 0;
    remarks.value = "";
    updatePreview();

    renderHistory();
    alert("Saved!");
  }

  function renderHistory() {
    const filter = gradeFilter.value;
    const list = readInspections();
    const showList = filter ? list.filter(x => x.grade === filter) : list;

    historyBody.innerHTML = "";

    if (showList.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6">No records found.</td>`;
      historyBody.appendChild(tr);
      return;
    }

    showList.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.stallId} - ${item.stallName}</td>
        <td>${item.officer}</td>
        <td>${item.total}</td>
        <td>${item.grade}</td>
        <td><button data-id="${item.id}">Delete</button></td>
      `;

      // simple delete button (no inline onclick)
      tr.querySelector("button").addEventListener("click", () => {
        deleteOne(item.id);
      });

      historyBody.appendChild(tr);
    });
  }

  function deleteOne(id) {
    const list = readInspections().filter(x => x.id !== id);
    writeInspections(list);
    renderHistory();
  }

});
