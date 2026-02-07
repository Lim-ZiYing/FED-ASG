import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const listEl = document.getElementById("orderList");

function money(n) {
  if (typeof n !== "number") return "-";
  return `$${n.toFixed(2)}`;
}

function formatDate(ts) {
  if (!ts) return "-";
  // Firestore Timestamp
  if (ts.toDate) return ts.toDate().toLocaleString();
  // If stored as string/number
  return new Date(ts).toLocaleString();
}

function safeText(v) {
  return v === undefined || v === null || v === "" ? "-" : String(v);
}

function renderOrderCard(order) {
  const docId = order.id;
  const orderId = order.orderId || docId;
  const statusText = order.statusText || "Unknown";
  const updatedAt = formatDate(order.updatedAt);

  // Optional fields (will show "-" if not present)
  const payment = safeText(order.paymentMethod);
  const total = order.totals?.total;
  const deliveryType = safeText(order.addons?.deliveryType);
  const deliveryFee = order.addons?.deliveryFee;
  const takeaway = order.addons?.takeaway ? "Yes" : "No";
  const takeawayFee = order.addons?.takeawayFee;

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="row">
      <div>
        <div class="id">${orderId}</div>
        <div class="small">Updated: ${updatedAt}</div>
      </div>
      <div class="status">${statusText}</div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Payment</div>
        <div class="value">${payment}</div>
      </div>

      <div>
        <div class="label">Total</div>
        <div class="value">${total != null ? money(total) : "-"}</div>
      </div>

      <div>
        <div class="label">Delivery</div>
        <div class="value">${deliveryType} ${deliveryFee != null ? `(${money(deliveryFee)})` : ""}</div>
      </div>

      <div>
        <div class="label">Takeaway</div>
        <div class="value">${takeaway} ${takeawayFee != null ? `(${money(takeawayFee)})` : ""}</div>
      </div>
    </div>
  `;

  // Items (optional)
  if (Array.isArray(order.items) && order.items.length > 0) {
    const itemsDiv = document.createElement("div");
    itemsDiv.className = "items";

    const itemsTitle = document.createElement("div");
    itemsTitle.className = "label";
    itemsTitle.textContent = "Items";
    itemsDiv.appendChild(itemsTitle);

    order.items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "itemRow";
      const name = safeText(it.name);
      const qty = Number(it.qty || 0);
      const price = Number(it.price || 0);
      row.innerHTML = `<span>${name} x${qty}</span><span>${money(price * qty)}</span>`;
      itemsDiv.appendChild(row);
    });

    card.appendChild(itemsDiv);
  }

  return card;
}

async function loadOrders() {
  try {
    loadingEl.style.display = "block";
    emptyEl.style.display = "none";
    errorEl.textContent = "";
    listEl.innerHTML = "";

    // ✅ Query all orders (no filters)
    const q = query(collection(db, "orders"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    loadingEl.style.display = "none";

    if (orders.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    orders.forEach((o) => listEl.appendChild(renderOrderCard(o)));
  } catch (err) {
    console.error(err);
    loadingEl.style.display = "none";
    errorEl.textContent =
      "Cannot load orders. Check: (1) Firestore rules (2) your firebase config (3) updatedAt field exists.";
  }
}

loadOrders();
