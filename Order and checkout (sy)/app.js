
function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Checkout add-ons storage
function saveCheckoutState(state) {
  localStorage.setItem("checkoutState", JSON.stringify(state));
}
function loadCheckoutState() {
  return JSON.parse(localStorage.getItem("checkoutState")) || {
    takeaway: false,
    deliveryFee: 0,
    deliveryLabel: "None",
    paymentMethod: "card",
  };
}

// ============================
// DOM references (per page)
// ============================
const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");

const checkoutList = document.getElementById("checkoutList");
const checkoutTotal = document.getElementById("checkoutTotal");
const addonTakeaway = document.getElementById("addonTakeaway");
const paymentRadios = document.querySelectorAll('input[name="paymethod"]');

const resultText = document.getElementById("resultText");
const orderHistoryDiv = document.getElementById("orderHistory");

// ============================
// Load menu from Firestore
// stalls -> items subcollection
// ============================
async function loadMenuFromFirestore() {
  const stallsSnap = await db.collection("stalls").get();
  const stalls = [];

  for (const stallDoc of stallsSnap.docs) {
    const stall = stallDoc.data();

    const itemsSnap = await db
      .collection("stalls")
      .doc(stallDoc.id)
      .collection("items")
      .get();

    const items = itemsSnap.docs
      .map((d) => {
        const x = d.data();
        return {
          id: safeNumber(x.id),
          name: x.name || "",
          price: safeNumber(x.price),
        };
      })
      .sort((a, b) => a.id - b.id);

    stalls.push({
      id: stallDoc.id,
      name: stall.name || "",
      items,
    });
  }

  stalls.sort((a, b) => a.name.localeCompare(b.name));
  return stalls;
}

// ============================
// MENU PAGE
// ============================
function renderMenuPage(stalls) {
  if (!menuDiv) return;
  menuDiv.innerHTML = "";

  stalls.forEach((stall) => {
    const stallDiv = document.createElement("section");
    stallDiv.className = "stall";
    stallDiv.innerHTML = `<h2 class="stall-title">${escapeHtml(stall.name)}</h2>`;

    stall.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "food";

      row.innerHTML = `
        <div class="food-left">
          <div class="food-name">${escapeHtml(item.name)}</div>
        </div>
        <div class="food-right">
          <div class="food-price">$${safeNumber(item.price).toFixed(2)}</div>
          <button class="btn" type="button">Add</button>
        </div>
      `;

      row.querySelector("button").addEventListener("click", () => {
        addToCart(stall.name, item);
      });

      stallDiv.appendChild(row);
    });

    menuDiv.appendChild(stallDiv);
  });
}

function addToCart(stallName, item) {
  const found = cart.find((x) => x.stall === stallName && x.id === item.id);

  if (found) {
    found.qty = safeNumber(found.qty) + 1;
  } else {
    cart.push({
      id: safeNumber(item.id),
      name: item.name,
      price: safeNumber(item.price),
      stall: stallName,
      qty: 1,
    });
  }

  saveCart();
  updateMenuTotal();
}

function updateMenuTotal() {
  if (!totalPriceDiv) return;

  const total = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

// ============================
// CART PAGE
// ============================
function renderCartPage() {
  if (!cartList || !cartTotal) return;

  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = `<p>Your cart is empty.</p>`;
    cartTotal.textContent = "Total: $0.00";
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-title">${escapeHtml(item.name)}
        <span class="muted">(${escapeHtml(item.stall)})</span>
      </div>
      <div class="cart-row">
        <span>$${safeNumber(item.price).toFixed(2)} × ${safeNumber(item.qty)}</span>
        <button class="btn small" type="button">Remove</button>
      </div>
    `;

    div.querySelector("button").addEventListener("click", () => {
      cart.splice(index, 1);
      saveCart();
      renderCartPage();
    });

    cartList.appendChild(div);
  });

  const total = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  cartTotal.textContent = "Total: $" + total.toFixed(2);
}

// ============================
// CHECKOUT PAGE
// ============================
function renderCheckoutPage() {
  if (!checkoutList || !checkoutTotal) return;

  checkoutList.innerHTML = "";

  if (cart.length === 0) {
    checkoutList.innerHTML = `<p>No items to checkout.</p>`;
    checkoutTotal.textContent = "Total: $0.00";
    return;
  }

  cart.forEach((item) => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <div><b>${escapeHtml(item.name)}</b>
        <span class="muted">(${escapeHtml(item.stall)})</span>
      </div>
      <div>$${safeNumber(item.price).toFixed(2)} × ${safeNumber(item.qty)}</div>
    `;
    checkoutList.appendChild(div);
  });

  // Restore previous selections
  const state = loadCheckoutState();
  if (addonTakeaway) addonTakeaway.checked = !!state.takeaway;

  document.querySelectorAll('input[name="delivery"]').forEach((r) => {
    if (safeNumber(r.value) === safeNumber(state.deliveryFee)) r.checked = true;
  });

  if (paymentRadios && paymentRadios.length) {
    paymentRadios.forEach((r) => {
      if (r.value === state.paymentMethod) r.checked = true;
    });
  }

  wireCheckoutOptions();
  updateCheckoutTotal();
}

function wireCheckoutOptions() {
  if (addonTakeaway) {
    addonTakeaway.addEventListener("change", () => {
      updateCheckoutTotal();
      persistCheckoutState();
    });
  }

  document.querySelectorAll('input[name="delivery"]').forEach((r) => {
    r.addEventListener("change", () => {
      updateCheckoutTotal();
      persistCheckoutState();
    });
  });

  if (paymentRadios && paymentRadios.length) {
    paymentRadios.forEach((r) => r.addEventListener("change", persistCheckoutState));
  }
}

function getSelectedDelivery() {
  const selected = document.querySelector('input[name="delivery"]:checked');
  if (!selected) return { fee: 0, label: "None" };

  const label = selected.dataset?.label || selected.id || "Delivery";
  return { fee: safeNumber(selected.value), label };
}

function getSelectedPaymentMethod() {
  const selected = document.querySelector('input[name="paymethod"]:checked');
  return selected ? selected.value : "card";
}

function persistCheckoutState() {
  const { fee, label } = getSelectedDelivery();
  const state = {
    takeaway: addonTakeaway ? addonTakeaway.checked : false,
    deliveryFee: fee,
    deliveryLabel: label,
    paymentMethod: getSelectedPaymentMethod(),
  };
  saveCheckoutState(state);
}

function updateCheckoutTotal() {
  if (!checkoutTotal) return;

  const base = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  const takeawayFee = addonTakeaway && addonTakeaway.checked ? 0.3 : 0;
  const { fee: deliveryFee } = getSelectedDelivery();

  const total = base + takeawayFee + deliveryFee;
  checkoutTotal.textContent = "Total: $" + total.toFixed(2);
}

// ============================
// PAYMENT PAGE
// ============================
async function handlePaymentPage() {
  if (!resultText) return;

  const ok = Math.random() > 0.3;
  if (!ok) {
    resultText.textContent = "Payment Failed ❌";
    return;
  }

  const base = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  const state = loadCheckoutState();

  const takeawayFee = state.takeaway ? 0.3 : 0;
  const deliveryFee = safeNumber(state.deliveryFee);
  const total = base + takeawayFee + deliveryFee;

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);

  resultText.textContent = "Payment Successful ✅ Saving order...";

  await db.collection("orders").add({
    orderId,
    statusText: "Paid",
    paymentMethod: state.paymentMethod,
    addons: {
      takeaway: !!state.takeaway,
      takeawayFee,
      deliveryType: state.deliveryLabel,
      deliveryFee,
    },
    totals: {
      itemsSubtotal: base,
      total,
    },
    items: cart,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  cart = [];
  saveCart();
  resultText.textContent = `Payment Successful ✅ Order saved! (${orderId})`;
}

// ============================
// ORDER HISTORY PAGE
// ============================
function formatDate(ts) {
  if (!ts) return "-";
  // Firestore Timestamp -> JS Date
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

async function renderOrderHistory() {
  if (!orderHistoryDiv) return;

  orderHistoryDiv.innerHTML = `<p>Loading…</p>`;

  try {
    const snap = await db.collection("orders").orderBy("updatedAt", "desc").get();

    const countEl = document.getElementById("orderCount");
    if (countEl) countEl.textContent = `${snap.size} order(s)`;

    if (snap.empty) {
      orderHistoryDiv.innerHTML = `<div class="card"><b>No orders yet.</b><div class="muted">Make a payment to generate an order.</div></div>`;
      return;
    }

    orderHistoryDiv.innerHTML = "";

    snap.forEach((doc) => {
      const o = doc.data();

      const orderId = o.orderId || doc.id;
      const status = (o.statusText || o.status || "Unknown").toLowerCase();
      const isPaid = status.includes("paid");

      const created = o.createdAt || o.updatedAt;
      const dateText = formatDate(created);

      const items = Array.isArray(o.items) ? o.items : [];
      const itemsSubtotal = o.totals?.itemsSubtotal ?? 0;
      const total = o.totals?.total ?? o.total ?? 0;

      const paymentMethod = o.paymentMethod || "-";
      const takeawayFee = o.addons?.takeawayFee ?? 0;
      const deliveryFee = o.addons?.deliveryFee ?? 0;
      const deliveryType = o.addons?.deliveryType ?? "None";

      const card = document.createElement("div");
      card.className = "card";

      const itemsHtml = items
        .slice(0, 5)
        .map((it) => {
          const qty = Number(it.qty || 1);
          const price = Number(it.price || 0);
          const line = (price * qty).toFixed(2);

          return `
            <div class="item-row">
              <div class="left">
                <div><b>${escapeHtml(it.name)}</b></div>
                <div class="muted">${escapeHtml(it.stall || "")} • $${price.toFixed(2)} × ${qty}</div>
              </div>
              <div>$${line}</div>
            </div>
          `;
        })
        .join("");

      const moreCount = items.length > 5 ? (items.length - 5) : 0;

      card.innerHTML = `
        <div class="card-head">
          <div class="order-id">${escapeHtml(orderId)}</div>
          <div class="badge ${isPaid ? "paid" : "fail"}">${isPaid ? "PAID" : "FAILED"}</div>
        </div>

        <div class="meta">
          <div><span>Date</span>${escapeHtml(dateText)}</div>
          <div><span>Payment</span>${escapeHtml(paymentMethod)}</div>
          <div><span>Delivery</span>${escapeHtml(deliveryType)} (+$${Number(deliveryFee).toFixed(2)})</div>
          <div><span>Takeaway</span>+$${Number(takeawayFee).toFixed(2)}</div>
        </div>

        <div class="items">
          ${itemsHtml}
          ${moreCount ? `<div class="muted">+ ${moreCount} more item(s)…</div>` : ``}
        </div>

        <div class="total-line">
          <div>Total</div>
          <div>$${Number(total).toFixed(2)}</div>
        </div>
      `;

      orderHistoryDiv.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    orderHistoryDiv.innerHTML = `<div class="card"><b>Cannot load orders.</b><div class="muted">Check Firestore rules / console error.</div></div>`;
  }
}


// ============================
// Navigation functions
// ============================
function goCart() { location.href = "cart.html"; }
function goCheckout() { persistCheckoutState(); location.href = "checkout.html"; }
function makePayment() { persistCheckoutState(); location.href = "payment.html"; }

window.goCart = goCart;
window.goCheckout = goCheckout;
window.makePayment = makePayment;

// ============================
// Page init
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (menuDiv) {
      const stalls = await loadMenuFromFirestore();
      renderMenuPage(stalls);
      updateMenuTotal();
    }

    if (cartList) renderCartPage();
    if (checkoutList) renderCheckoutPage();
    if (resultText) await handlePaymentPage();
    if (orderHistoryDiv) await renderOrderHistory();
  } catch (e) {
    console.error("Init error:", e);
  }
});
