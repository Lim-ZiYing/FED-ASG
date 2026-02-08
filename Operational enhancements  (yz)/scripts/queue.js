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

// ---------- HEADER LOGIC ----------
const params = new URLSearchParams(window.location.search);
const selectedStall = params.get("stall");
const stallTitleEl = document.getElementById("stallTitle");
const backBtn = document.getElementById("backBtn");

console.log("Selected stall from URL:", selectedStall);

const stallName = selectedStall ? decodeURIComponent(selectedStall) : "";
stallTitleEl.textContent = stallName || "Queue";

backBtn.addEventListener("click", () => {
  window.location.href = "main.html";
});

// ---------- UI elements ----------
const queueListEl = document.getElementById("queueList");
const totalWaitingEl = document.getElementById("totalWaiting");
const nowServingNoEl = document.getElementById("nowServingNo");
const nowServingHintEl = document.getElementById("nowServingHint");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const ordersListEl = document.getElementById("ordersList");

// ---------- Local state ----------
// Each entry = ONE item for this stall
// { docId, orderId, itemIndex, itemName, qty, statusText }
let activeOrders = [];
let nowIndex = 0;

// ---------- Helpers ----------
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

// ---------- Render ----------
function render() {
  clampNowIndex();

  const now = activeOrders[nowIndex] ?? null;
  const nowDocId = now?.docId ?? null; // ✅ use docId (not id)

  // LEFT TOP: Current Queue
  if (activeOrders.length === 0) {
    queueListEl.innerHTML = `<div class="empty">No active orders in queue.</div>`;
  } else {
    queueListEl.innerHTML = activeOrders.map(o => {
      const isServing = o.docId === nowDocId && o.itemIndex === now?.itemIndex;
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
    nowServingHintEl.textContent = `Serving 1 item (${safeText(now.itemName, "Item")}).`; // ✅ item-level

    prevBtn.disabled = nowIndex <= 0;
    nextBtn.disabled = nowIndex >= activeOrders.length - 1;
  }

  // RIGHT: Orders list + Completed button
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
          <li>
            ${safeText(o.itemName, "Item")} × ${safeText(o.qty, 1)}
            <div class="subtext">
              ${o.takeaway ? "🥡 Takeaway" : "🍽 Dine-in"}
            </div>
          </li>
        </ul>


        <div class="orderActions">
          <button class="btnDark"
            data-doc="${o.docId}"
            data-index="${o.itemIndex}">
            Completed
          </button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll('button[data-doc]').forEach(btn => {
      btn.addEventListener("click", async () => {
        const docId = btn.dataset.doc;
        const itemIndex = Number(btn.dataset.index);

        console.log("Complete clicked:", { docId, itemIndex });

        await markCompleted(docId, itemIndex);
      });
    });
  }
}

// ---------- Complete ONE item ----------
async function markCompleted(docId, itemIndex) {
  try {
    const ref = doc(db, "orders", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= items.length) {
      console.error("Invalid itemIndex:", itemIndex, "items length:", items.length);
      return;
    }

    // ✅ mark only this item completed
    items[itemIndex] = { ...items[itemIndex], completed: true };

    // Optional: set order completed if ALL items completed
    const allDone = items.length > 0 && items.every(it => it.completed === true);

    await updateDoc(ref, {
      items,
      ...(allDone ? {
        statusText: "Completed",
        statusIndex: 2,
        completedAt: serverTimestamp()
      } : {})
    });

    console.log("Item marked completed OK:", { docId, itemIndex, allDone });
  } catch (err) {
    console.error("markCompleted failed:", err);
  }
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

// ---------- Firestore realtime ----------
const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "asc"));

onSnapshot(ordersQuery, (snapshot) => {
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  activeOrders = [];

  all.forEach(order => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach((it, index) => {
      const sameStall = it.stall === stallName;
      const notDone = it.completed !== true;

      if (sameStall && notDone) {
        activeOrders.push({
          docId: order.id,
          orderId: order.orderId,
          itemIndex: index,
          itemName: it.name,
          qty: it.qty ?? 1,
          statusText: order.statusText,
          takeaway: !!order.addons?.takeaway 
        });
      }
    });
  });

  clampNowIndex();
  render();
});
