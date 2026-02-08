import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// URL param: ?stall=Ah%20Hock%20Chicken%20Rice
const params = new URLSearchParams(window.location.search);
const selectedStall = decodeURIComponent(params.get("stall") || "");
const stallTitleEl = document.getElementById("stallTitle");
const backBtn = document.getElementById("backBtn");

stallTitleEl.textContent = selectedStall ? selectedStall : "Queue";
backBtn.addEventListener("click", () => (window.location.href = "main.html"));

// UI elements
const queueListEl = document.getElementById("queueList");
const totalWaitingEl = document.getElementById("totalWaiting");
const nowServingNoEl = document.getElementById("nowServingNo");
const nowServingHintEl = document.getElementById("nowServingHint");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let activeOrders = []; // [{docId, orderId, itemsForThisStall, addons, createdAt}]
let nowIndex = 0;

function safeText(v, fallback = "—") {
  return v === null || v === undefined || v === "" ? fallback : String(v);
}

function clampNowIndex() {
  if (activeOrders.length === 0) nowIndex = 0;
  else if (nowIndex < 0) nowIndex = 0;
  else if (nowIndex >= activeOrders.length) nowIndex = activeOrders.length - 1;
}

function render() {
  clampNowIndex();

  const now = activeOrders[nowIndex] || null;

  // Total waiting: number of active orders for this stall
  totalWaitingEl.textContent = String(activeOrders.length);

  if (!now) {
    nowServingNoEl.textContent = "—";
    nowServingHintEl.textContent = "No active orders.";
  } else {
    nowServingNoEl.textContent = safeText(now.orderId, "ORD-????");

    const takeaway = !!now.addons?.takeaway;
    const deliveryType = now.addons?.deliveryType || "None";

    const flags = [
      takeaway ? "Takeaway" : "Dine-in",
      deliveryType !== "None" ? `Delivery (${deliveryType})` : null
    ].filter(Boolean);

    nowServingHintEl.textContent = flags.length
      ? `Serving • ${flags.join(" • ")}`
      : "Serving";
  }

  if (activeOrders.length === 0) {
    queueListEl.innerHTML = `<div class="empty">No active orders in queue.</div>`;
    return;
  }

  queueListEl.innerHTML = activeOrders
    .map((o, idx) => {
      const isServing = idx === nowIndex;

      const takeaway = !!o.addons?.takeaway;
      const deliveryType = o.addons?.deliveryType || "None";

      const itemsHtml = (o.itemsForThisStall || [])
        .map((it) => {
          const isReady = it.ready === true;

          return `
            <li>
              ${safeText(it.name)} × ${safeText(it.qty, 1)}
              <div class="subtext">
                ${takeaway ? "🥡 Takeaway" : "🍽 Dine-in"}
                ${deliveryType !== "None" ? ` • 🚚 Delivery (${safeText(deliveryType)})` : ""}
                ${isReady ? " • ✅ Ready" : ""}
              </div>
            </li>
          `;
        })
        .join("");

      // Vendor-side status pill (derived from their items)
      const anyReady = (o.itemsForThisStall || []).some((it) => it.ready === true);
      const statusLabel = anyReady ? "Ready" : "Preparing";

      return `
        <div class="orderCard ${isServing ? "servingCard" : ""}">
          <div class="rowTop">
            <div class="orderNo">${safeText(o.orderId)}</div>
            <div class="statusPill">${statusLabel}</div>
          </div>

          <ul class="items">${itemsHtml}</ul>

          <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btnDark" data-ready="${o.docId}">Ready</button>
            <button class="btnDark" data-complete="${o.docId}">Completed</button>
          </div>
        </div>
      `;
    })
    .join("");

  // Ready: only this stall's items become ready:true
  document.querySelectorAll("[data-ready]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const docId = btn.getAttribute("data-ready");
      await markReadyForStallItems(docId);
    });
  });

  // Completed: only this stall's items become completed:true
  document.querySelectorAll("[data-complete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const docId = btn.getAttribute("data-complete");
      await markCompletedForStallItems(docId);
    });
  });
}

// ---------- ITEM-LEVEL updates (the key fix) ----------
async function markReadyForStallItems(docId) {
  const ref = doc(db, "orders", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const items = Array.isArray(data.items) ? data.items : [];

  const updated = items.map((it) => {
    if (it.stall === selectedStall && it.completed !== true) {
      return { ...it, ready: true }; // ✅ item-level
    }
    return it;
  });

  await updateDoc(ref, {
    items: updated,
    updatedAt: serverTimestamp()
  });
}

async function markCompletedForStallItems(docId) {
  const ref = doc(db, "orders", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const items = Array.isArray(data.items) ? data.items : [];

  const updated = items.map((it) => {
    if (it.stall === selectedStall) {
      return { ...it, completed: true }; // ✅ item-level
    }
    return it;
  });

  // Only mark whole order completed if ALL items are completed
  const allDone = updated.length > 0 && updated.every((it) => it.completed === true);

  await updateDoc(ref, {
    items: updated,
    ...(allDone
      ? { statusText: "Completed", statusIndex: 2, completedAt: serverTimestamp() }
      : { updatedAt: serverTimestamp() })
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
  const all = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));

  activeOrders = [];

  all.forEach((order) => {
    if (!Array.isArray(order.items)) return;

    // Vendor sees only their stall's items that are NOT completed
    const itemsForStall = order.items.filter(
      (it) => it.stall === selectedStall && it.completed !== true
    );

    if (itemsForStall.length > 0) {
      activeOrders.push({
        docId: order.docId,
        orderId: order.orderId,
        itemsForThisStall: itemsForStall,
        addons: order.addons || {},
        createdAt: order.createdAt || null
      });
    }
  });

  clampNowIndex();
  render();
});
