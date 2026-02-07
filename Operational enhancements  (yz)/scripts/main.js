import { db } from "./firebase.js"; // <-- adjust path if needed

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const STALLS_COLLECTION = "stalls";
const STALL_NAME_FIELD = "name";

const stallSelect = document.getElementById("stallSelect");
const openBtn = document.getElementById("openBtn");
const refreshBtn = document.getElementById("refreshBtn");
const msgEl = document.getElementById("msg");

console.log("db from firebase.js =", db); // ✅ should show Firestore object

function setMsg(text) {
  msgEl.textContent = text || "";
}

async function loadStallsFromFirebase() {
  stallSelect.innerHTML = `<option>Loading stalls...</option>`;
  stallSelect.disabled = true;
  openBtn.disabled = true;
  setMsg("Loading stalls from Firebase...");

  try {
    const snap = await getDocs(collection(db, STALLS_COLLECTION));
    const stalls = snap.docs
      .map(d => d.data()[STALL_NAME_FIELD])
      .filter(Boolean);

    if (stalls.length === 0) {
      stallSelect.innerHTML = `<option>No stalls found</option>`;
      setMsg("No stalls found (check collection/field).");
      return;
    }

    stallSelect.innerHTML = stalls
      .sort((a, b) => a.localeCompare(b))
      .map(name => `<option value="${encodeURIComponent(name)}">${name}</option>`)
      .join("");

    stallSelect.disabled = false;
    openBtn.disabled = false;
    setMsg(`Loaded ${stalls.length} stall(s).`);
  } catch (err) {
    console.error("FAILED TO LOAD STALLS:", err);
    stallSelect.innerHTML = `<option>Error loading stalls</option>`;
    setMsg("Error loading stalls. Check console + import path to firebase.js");
  }
}

openBtn.addEventListener("click", () => {
  const stallName = decodeURIComponent(stallSelect.value || "");
  if (!stallName) {
    setMsg("Please select a stall.");
    return;
  }
  location.href = `queue.html?stall=${encodeURIComponent(stallName)}`;
});

refreshBtn.addEventListener("click", loadStallsFromFirebase);

loadStallsFromFirebase();
