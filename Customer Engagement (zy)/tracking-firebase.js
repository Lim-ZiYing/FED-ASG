// tracking firebase.js (FULL UPDATED)
// Works with:
// - orders created by .add() (random doc id) but has field orderId
// - orders updated by other teammates (statusText OR statusIndex)
// - tracking by URL ?orderId=ORD-1234 OR localStorage lastOrderId/orderTracking

import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const qs = (id) => document.getElementById(id);

const LS_LAST_ORDER_ID = "lastOrderId";      // from payment page
const LS_TRACKING = "orderTracking";         // your older local tracking object

let unsub = null;
let orderDocId = null;
let currentOrderId = null;

// ------------------------------
// Status mapping
// ------------------------------
function statusToIndex(statusText) {
  const s = String(statusText || "").toLowerCase().trim();

  // Treat "paid/received" as first stage (Preparing)
  if (
    s === "paid" ||
    s === "received" ||
    s === "new" ||
    s === "created" ||
    s === "preparing"
  ) return 0;

  if (s === "ready") return 1;
  if (s === "completed" || s === "complete" || s === "done") return 2;

  return -1;
}

function indexToStatus(idx) {
  if (idx === 0) return "Preparing";
  if (idx === 1) return "Ready";
  if (idx === 2) return "Completed";
  return "—";
}

// ------------------------------
// UI render
// ------------------------------
function render(orderId, idx) {
  const idEl = qs("orderId");
  const statusEl = qs("orderStatus");

  if (idEl) idEl.textContent = orderId || "—";
  if (statusEl) statusEl.textContent = indexToStatus(idx);

  ["step0", "step1", "step2"].forEach((stepId, stepIdx) => {
    const el = qs(stepId);
    if (!el) return;
    el.classList.toggle("active", idx >= stepIdx && idx !== -1);
  });
}

// ------------------------------
// Helpers to pick orderId
// ------------------------------
function getOrderIdFromUrl() {
  const u = new URL(window.location.href);
  const id = u.searchParams.get("orderId");
  return id ? id.trim() : "";
}

function getOrderIdFromLocalStorage() {
  // 1) newest standard: lastOrderId set by payment
  const last = localStorage.getItem(LS_LAST_ORDER_ID);
  if (last && last.trim()) return last.trim();

  // 2) older tracking object
  try {
    const t = JSON.parse(localStorage.getItem(LS_TRACKING));
    if (t && t.orderId) return String(t.orderId).trim();
  } catch {}

  return "";
}

// ------------------------------
// Find the Firestore doc that matches orderId
// (because create-order uses .add() so docId is random)
// ------------------------------
async function findOrderDocIdByOrderId(orderId) {
  // query orders where orderId == "ORD-xxxx"
  const q = query(collection(db, "orders"), where("orderId", "==", orderId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  // If multiple (shouldn't happen), take the first
  return snap.docs[0].id;
}

// ------------------------------
// Listen to order changes (live)
// ------------------------------
function startListening(docId, orderId) {
  if (unsub) unsub();
  unsub = null;

  const ref = doc(db, "orders", docId);

  unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      render(orderId, -1);
      return;
    }

    const d = snap.data() || {};

    // Prefer numeric statusIndex if present
    let idx =
      typeof d.statusIndex === "number"
        ? d.statusIndex
        : statusToIndex(d.statusText || d.status || d.state);

    // If still unknown, keep -1
    if (![0, 1, 2].includes(idx)) idx = -1;

    // Show ID from doc field if exists
    const showId = d.orderId || orderId;

    render(showId, idx);
  });
}

// ------------------------------
// Buttons (optional demo buttons)
// If your tracking page has these buttons, it will still work.
// If you don’t have them, it won’t crash.
// ------------------------------
async function safeUpdateStatus(idx) {
  if (!orderDocId) return alert("Order not found in Firestore yet.");
  if (!currentOrderId) return alert("No orderId loaded.");

  const ref = doc(db, "orders", orderDocId);

  await setDoc(
    ref,
    {
      orderId: currentOrderId,
      statusIndex: idx,
      statusText: indexToStatus(idx),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function setupButtons() {
  const btnNew = qs("newOrderBtn");
  const btnAdv = qs("advanceStatusBtn");
  const btnReset = qs("resetOrderBtn");

  // If your HTML doesn’t have these, ignore
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      alert(
        "For your real flow: orders should be created from the Payment/Create Order page.\nTracking page should only DISPLAY progress."
      );
    });
  }

  if (btnAdv) {
    btnAdv.addEventListener("click", async () => {
      // read current UI status and advance
      const currentText = qs("orderStatus")?.textContent || "—";
      let idx = statusToIndex(currentText);
      if (idx === -1) idx = 0;
      idx = Math.min(2, idx + 1);
      await safeUpdateStatus(idx);
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      // local-only reset
      localStorage.removeItem(LS_LAST_ORDER_ID);
      try {
        localStorage.setItem(LS_TRACKING, JSON.stringify({ orderId: "", statusIndex: -1 }));
      } catch {}
      render("—", -1);

      if (unsub) unsub();
      unsub = null;
      orderDocId = null;
      currentOrderId = null;
    });
  }
}

// ------------------------------
// Init
// ------------------------------
async function init() {
  setupButtons();

  // 1) pick orderId from URL first
  const urlOrderId = getOrderIdFromUrl();
  const localOrderId = getOrderIdFromLocalStorage();

  currentOrderId = urlOrderId || localOrderId;

  if (!currentOrderId) {
    render("—", -1);
    return;
  }

  // Save for convenience (so you can open tracking page directly later)
  localStorage.setItem(LS_LAST_ORDER_ID, currentOrderId);

  // 2) find docId by orderId
  try {
    orderDocId = await findOrderDocIdByOrderId(currentOrderId);

    if (!orderDocId) {
      // Not found yet — maybe Firestore write failed or rules blocked
      render(currentOrderId, -1);
      return;
    }

    // 3) live listen
    startListening(orderDocId, currentOrderId);
  } catch (e) {
    console.warn("Tracking init failed:", e);
    render(currentOrderId, -1);
  }
}

document.addEventListener("DOMContentLoaded", init);
