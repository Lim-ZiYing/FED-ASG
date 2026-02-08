import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";




// ---------- HEADER LOGIC (REPLACE WITH THIS) ----------

const params = new URLSearchParams(window.location.search);
const selectedStall = params.get("stall");
const stallTitleEl = document.getElementById("stallTitle");
const backBtn = document.getElementById("backBtn");

console.log("Selected stall from URL:", selectedStall);

if (selectedStall) {
  stallTitleEl.textContent = decodeURIComponent(selectedStall);
} else {
  stallTitleEl.textContent = "Queue";
}

backBtn.addEventListener("click", () => {
  window.location.href = "main.html";
});


// UI elements
const queueListEl = document.getElementById("queueList");
const totalWaitingEl = document.getElementById("totalWaiting");
const nowServingNoEl = document.getElementById("nowServingNo");
const nowServingHintEl = document.getElementById("nowServingHint");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const ordersListEl = document.getElementById("ordersList");

// Local page state (simple)
// We keep "Now Serving" only in UI to avoid messing with teammates' statusText.
let activeOrders = [];  // array of { id(docId), orderId, items, statusText, statusIndex, createdAt }
let nowIndex = 0;

// Helpers
function safeText(v, fallback = "—") {
  return (v === null || v === undefined || v === "") ? fallback : String(v);
}
function pillClass(type) {
  if (type === "SERVING") return "pill serving";
  if (type === "COMPLETED") return "pill completed";
  return "pill waiting";
}
function clampNowIndex() {
  if (activeOrders.length === 0) nowIndex = 0;
  else if (nowIndex < 0) nowIndex = 0;
  else if (nowIndex >= activeOrders.length) nowIndex = activeOrders.length - 1;
}

// Render UI
function render() {
  clampNowIndex();

  const now = activeOrders[nowIndex] ?? null;
  const nowDocId = now?.id ?? null;

  // LEFT TOP: Current Queue
  if (activeOrders.length === 0) {
    queueListEl.innerHTML = `<div class="empty">No active orders in queue.</div>`;
  } else {
    queueListEl.innerHTML = activeOrders.map(o => {
      const isServing = o.id === nowDocId;
      const statusLabel = isServing ? "Serving" : safeText(o.statusText, "Waiting");

      return `
        <div class="queueRow">
          <div class="queueNum">${safeText(o.orderId, "ORD-????")}</div>
          <div class="${pillClass(isServing ? "SERVING" : "WAITING")}">${statusLabel}</div>
        </div>
      `;
    }).join("");
  }

  // Total waiting = active - 1 (if any serving)
  const waitingCount = activeOrders.length === 0 ? 0 : Math.max(0, activeOrders.length - 1);
  totalWaitingEl.textContent = String(waitingCount);

  // LEFT BOTTOM: Now Serving box
  if (!now) {
    nowServingNoEl.textContent = "—";
    nowServingHintEl.textContent = "No active orders.";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    nowServingNoEl.textContent = safeText(now.orderId, "ORD-????");
    const itemsCount = Array.isArray(now.items) ? now.items.length : 0;
    nowServingHintEl.textContent = `Serving ${itemsCount} item(s).`;

    prevBtn.disabled = nowIndex <= 0;
    nextBtn.disabled = nowIndex >= activeOrders.length - 1;
  }

  // RIGHT: New Orders list + Completed button
  if (activeOrders.length === 0) {
    ordersListEl.innerHTML = `<div class="empty">No new orders.</div>`;
  } else {
    ordersListEl.innerHTML = activeOrders.map(o => `
      <div class="orderCard">
        <div class="orderHeader">
          <div class="orderNo">${safeText(o.orderId, "ORD-????")}</div>
          <div class="${pillClass("WAITING")}">${safeText(o.statusText, "Waiting")}</div>
        </div>

        <ul class="items">
          <li>${safeText(o.itemName, "Item")} × ${safeText(o.qty, 1)}</li>
        </ul>


        <div style="margin-top:10px; display:flex; gap:10px;">
          <button class="btnDark" data-complete="${o.docId}">Completed</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll("[data-complete]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const docId = btn.getAttribute("data-complete");
        await markCompleted(docId);
      });
    });
  }
}

async function markCompleted(docId) {
  const ref = doc(db, "orders", docId);
  await updateDoc(ref, {
    statusText: "Completed",
    statusIndex: 2,
    completedAt: serverTimestamp()
  });

}

// Prev/Next changes serving order (UI only)
prevBtn.addEventListener("click", () => {
  nowIndex -= 1;
  render();
});
nextBtn.addEventListener("click", () => {
  nowIndex += 1;
  render();
});

// Listen to Firebase orders in real-time
// Sort by createdAt so queue is oldest -> newest
const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "asc"));

onSnapshot(ordersQuery, (snapshot) => {
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // RESET queue
  activeOrders = [];

  all.forEach(order => {
    // ignore completed orders
    if ((order.statusText ?? "") === "Completed") return;

    // only take items that belong to THIS stall
    if (!Array.isArray(order.items)) return;

    order.items
      .filter(it => it.stall === decodeURIComponent(selectedStall))
      .forEach(it => {
        activeOrders.push({
          docId: order.id,           // Firestore document ID
          orderId: order.orderId,    // ORD-7764
          itemName: it.name,
          qty: it.qty,
          statusText: order.statusText
        });
      });
  });

  clampNowIndex();
  render();
});

