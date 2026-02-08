import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const qs = (id) => document.getElementById(id);

const statusName = (i) => {
  if (i === 0) return "Preparing";
  if (i === 1) return "Ready";
  if (i === 2) return "Completed";
  return "—";
};

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem("orderTracking")) || { orderId: "", statusIndex: -1 };
  } catch {
    return { orderId: "", statusIndex: -1 };
  }
};

const saveLocal = (v) => localStorage.setItem("orderTracking", JSON.stringify(v));

const setBackendMsg = (txt) => {
  const el = qs("backendMsg");
  if (el) el.textContent = txt;
};

let currentOrder = loadLocal();
let unsub = null;

// 1) If URL has ?orderId=ORD-1234, use that
const urlParams = new URLSearchParams(window.location.search);
const urlOrderId = urlParams.get("orderId");

// 2) If create order saved lastOrderId, use that
const lastOrderId = localStorage.getItem("lastOrderId");

// pick best orderId source
if (urlOrderId) {
  currentOrder.orderId = urlOrderId;
  if (currentOrder.statusIndex === -1) currentOrder.statusIndex = 0;
  saveLocal(currentOrder);
} else if (!currentOrder.orderId && lastOrderId) {
  currentOrder.orderId = lastOrderId;
  if (currentOrder.statusIndex === -1) currentOrder.statusIndex = 0;
  saveLocal(currentOrder);
}

function render() {
  qs("orderId").textContent = currentOrder.orderId || "—";
  qs("orderStatus").textContent = statusName(currentOrder.statusIndex);

  ["step0", "step1", "step2"].forEach((id, idx) => {
    const el = qs(id);
    if (!el) return;
    el.classList.toggle("active", currentOrder.statusIndex >= idx && currentOrder.statusIndex !== -1);
  });
}

async function writeOrderToFirestore() {
  if (!currentOrder.orderId) return;

  // IMPORTANT: doc ID = orderId, so everyone can find it easily
  const ref = doc(db, "orders", currentOrder.orderId);

  await setDoc(
    ref,
    {
      orderId: currentOrder.orderId,
      statusIndex: currentOrder.statusIndex,
      statusText: statusName(currentOrder.statusIndex),
      updatedAt: serverTimestamp(),
      // only set createdAt if doc is new
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

function listenToOrder(orderId) {
  if (unsub) unsub();
  const ref = doc(db, "orders", orderId);

  unsub = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();

      currentOrder = {
        orderId: d.orderId || orderId,
        statusIndex: typeof d.statusIndex === "number" ? d.statusIndex : -1
      };

      saveLocal(currentOrder);
      render();
      setBackendMsg("Backend: Firebase Firestore connected ✅");
    },
    (err) => {
      console.warn(err);
      setBackendMsg("Backend: Firestore blocked by rules/network ⚠️");
    }
  );
}

// ---- init
render();

(async () => {
  try {
    // If we already have an orderId, try to load it and listen
    if (currentOrder.orderId) {
      const ref = doc(db, "orders", currentOrder.orderId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const d = snap.data();
        currentOrder.statusIndex =
          typeof d.statusIndex === "number" ? d.statusIndex : currentOrder.statusIndex;
        saveLocal(currentOrder);
        render();
      } else {
        // if doc doesn't exist, create a starter doc
        await writeOrderToFirestore();
      }

      listenToOrder(currentOrder.orderId);
    } else {
      setBackendMsg("Backend: connected ✅ (no order selected yet)");
    }
  } catch (e) {
    console.warn(e);
    setBackendMsg("Backend: Firestore error ⚠️");
  }
})();

// ---- buttons
qs("newOrderBtn").addEventListener("click", async () => {
  // demo create (your real create-order page should do this instead)
  currentOrder = {
    orderId: "ORD-" + Math.floor(1000 + Math.random() * 9000),
    statusIndex: 0
  };

  localStorage.setItem("lastOrderId", currentOrder.orderId);
  saveLocal(currentOrder);
  render();

  try {
    await writeOrderToFirestore();
    listenToOrder(currentOrder.orderId);
  } catch (e) {
    console.warn(e);
    setBackendMsg("Backend: Firestore write blocked ⚠️");
  }
});

qs("advanceStatusBtn").addEventListener("click", async () => {
  if (!currentOrder.orderId) return alert("No order selected.");

  currentOrder.statusIndex = Math.min(2, currentOrder.statusIndex + 1);
  saveLocal(currentOrder);
  render();

  try {
    await writeOrderToFirestore();
  } catch (e) {
    console.warn(e);
    setBackendMsg("Backend: Firestore write blocked ⚠️");
  }
});

qs("resetOrderBtn").addEventListener("click", () => {
  currentOrder = { orderId: "", statusIndex: -1 };
  saveLocal(currentOrder);
  render();

  if (unsub) unsub();
  unsub = null;

  setBackendMsg("Backend: connected ✅ (reset)");
});
