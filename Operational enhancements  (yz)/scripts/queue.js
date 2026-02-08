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

// URL param: ?stall=Ah%20Hock%20Chicken%20Rice
const params = new URLSearchParams(window.location.search);
const selectedStall = decodeURIComponent(params.get("stall") || "");
const stallTitleEl = document.getElementById("stallTitle");
const backBtn = document.getElementById("backBtn");

stallTitleEl.textContent = selectedStall ? selectedStall : "Queue";
backBtn.addEventListener("click", () => window.location.href = "main.html");

// UI elements
const queueListEl = document.getElementById("queueList");
const totalWaitingEl = document.getElementById("totalWaiting");
const nowServingNoEl = document.getElementById("nowServingNo");
const nowServingHintEl = document.getElementById("nowServingHint");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let activeOrders = []; // [{docId, orderId, itemsForThisStall, statusText, statusIndex, createdAt}]
let nowIndex = 0;

function safeText(v, fallback = "—") {
  return (v === null || v === undefined || v === "") ? fallback : String(v);
}

function clampNowIndex() {
  if (activeOrders.length === 0) nowIndex = 0;
  else if (nowIndex < 0) nowIndex = 0;
  else if (nowIndex >= activeOrders.length) nowIndex = activeOrders.length - 1;
}

function render() {
  clampNowIndex();

  const now = activeOrders[nowIndex] || null;

  totalWaitingEl.textContent = String(activeOrders.length);

  if (!now) {
    nowServingNoEl.textContent = "—";
    nowServingHintEl.textContent = "No active orders.";
  } else {
    nowServingNoEl.textContent = safeText(now.orderId, "ORD-????");
    nowServingHintEl.textContent = safeText(now.statusText, "Preparing");
  }

  if (activeOrders.length === 0) {
    queueListEl.innerHTML = `<div class="empty">No active orders in queue.</div>`;
    return;
  }

  queueListEl.innerHTML = activeOrders.map((o, idx) => {
    const isServing = idx === nowIndex;

    const itemsHtml = (o.itemsForThisStall || [])
      .map(it => `<li>${safeText(it.name)} × ${safeText(it.qty, 1)}</li>`)
      .join("");

    return `
      <div class="orderCard ${isServing ? "servingCard" : ""}">
        <div class="rowTop">
          <div class="orderNo">${safeText(o.orderId)}</div>
          <div class="statusPill">${safeText(o.statusText, "Preparing")}</div>
        </div>

        <ul class="items">${itemsHtml}</ul>

        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btnDark" data-ready="${o.docId}">Ready</button>
          <button class="btnDark" data-complete="${o.docId}">Completed</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-ready]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const docId = btn.getAttribute("data-ready");
      await markReady(docId);
    });
  });

  document.querySelectorAll("[data-complete]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const docId = btn.getAttribute("data-complete");
      await markCompleted(docId);
    });
  });
}

async function markReady(docId) {
  const ref = doc(db, "orders", docId);
  await updateDoc(ref, {
    statusText: "Ready",
    statusIndex: 1,
    updatedAt: serverTimestamp()
  });
}

async function markCompleted(docId) {
  const ref = doc(db, "orders", docId);
  await updateDoc(ref, {
    statusText: "Completed",
    statusIndex: 2,
    completedAt: serverTimestamp()
  });
}

// Prev/Next changes "now serving" in UI only
prevBtn.addEventListener("click", () => {
  nowIndex -= 1;
  render();
});
nextBtn.addEventListener("click", () => {
  nowIndex += 1;
  render();
});

// Listen to Firebase orders in real-time
const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "asc"));

onSnapshot(ordersQuery, (snapshot) => {
  const all = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

  activeOrders = [];

  all.forEach(order => {
    // ignore completed orders
    if ((order.statusText || "") === "Completed") return;

    if (!Array.isArray(order.items)) return;

    // orders can contain multiple stalls -> vendor sees only their items
    const itemsForStall = order.items.filter(it => it.stall === selectedStall);

    if (itemsForStall.length > 0) {
      activeOrders.push({
        docId: order.docId,
        orderId: order.orderId,
        itemsForThisStall: itemsForStall,
        statusText: order.statusText || "Preparing",
        statusIndex: typeof order.statusIndex === "number" ? order.statusIndex : 0,
        createdAt: order.createdAt || null
      });
    }
  });

  clampNowIndex();
  render();
});
