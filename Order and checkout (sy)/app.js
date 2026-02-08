function cartIsEmpty() {
  return !Array.isArray(cart) || cart.length === 0;
}

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
          imageUrl: x.imageUrl || ""
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
           <img class="food-img"
              src="${escapeHtml(item.imageUrl || 'https://via.placeholder.com/80')}"
               alt="${escapeHtml(item.name)}">
          <div class="food-info">
         <div class="food-name">${escapeHtml(item.name)}</div>
        </div>
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

  // ✅ Block payment if cart empty
  if (!Array.isArray(cart) || cart.length === 0) {
    resultText.textContent = "Cart is empty. Please add items before paying.";
    return;
  }

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

  // ✅ Save into Firestore using orderId as doc ID
  const orderDocRef = db.collection("orders").doc(orderId);

  await orderDocRef.set({
    orderId,
    statusText: "Received",
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
  }, { merge: true });

  // ✅ Save for tracking page
  localStorage.setItem("lastOrderId", orderId);

  // Clear cart
  cart = [];
  saveCart();

  // ✅ Instead of auto redirect, show options
  // Update the UI with buttons
  resultText.innerHTML = `
    <div style="margin-top:10px; font-weight:700;">
      Payment Successful ✅ Order created: <span style="color:#2563eb;">${orderId}</span>
    </div>

    <div style="margin-top:12px; color:#6b7280;">
      Would you like to track your order now?
    </div>

    <div style="margin-top:14px; display:flex; gap:12px; flex-wrap:wrap;">
      <button id="trackNowBtn" style="
        padding:10px 16px; border-radius:10px; border:none;
        background:#2563eb; color:#fff; font-weight:700; cursor:pointer;">
        Track Order
      </button>

      <button id="trackLaterBtn" style="
        padding:10px 16px; border-radius:10px; border:1px solid #e5e7eb;
        background:#fff; color:#111827; font-weight:700; cursor:pointer;">
        Not Now
      </button>
    </div>
  `;

  // ✅ Track Order → go tracking page with orderId
  document.getElementById("trackNowBtn").addEventListener("click", () => {
    // change path if your folders are different
    window.location.href =
      "../Customer Engagement (zy)/tracking.html?orderId=" + encodeURIComponent(orderId);
  });

  // ✅ Not Now → go home page (or anywhere your team wants)
  document.getElementById("trackLaterBtn").addEventListener("click", () => {
    // change this to the page your team wants after payment
    window.location.href = "home.html";
  });
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
      orderHistoryDiv.innerHTML = `
        <div class="card">
          <b>No orders yet.</b>
          <div class="muted">Make a payment to generate an order.</div>
        </div>
      `;
      return;
    }

    orderHistoryDiv.innerHTML = "";

    snap.forEach((doc) => {
      const o = doc.data();

      const orderId = o.orderId || doc.id;

      // ✅ Robust PAID detection (works with old + new formats)
      const rawStatus = String(o.statusText ?? o.status ?? "").trim().toLowerCase();
      const totalValue = Number(o?.totals?.total ?? o.total ?? 0);

      const isPaid =
        rawStatus === "paid" ||
        rawStatus.includes("paid") ||
        rawStatus === "success" ||
        rawStatus.includes("success") ||
        o.statusIndex === 1 ||
        o.paid === true ||
        totalValue > 0;

      const created = o.createdAt || o.updatedAt;
      const dateText = formatDate(created);

      const items = Array.isArray(o.items) ? o.items : [];

      const paymentMethod = o.paymentMethod || "-";
      const takeawayFee = Number(o.addons?.takeawayFee ?? 0);
      const deliveryFee = Number(o.addons?.deliveryFee ?? 0);
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
                <div class="muted">${escapeHtml(it.stall || "")} • $${price.toFixed(
                  2
                )} × ${qty}</div>
              </div>
              <div>$${line}</div>
            </div>
          `;
        })
        .join("");

      const moreCount = items.length > 5 ? items.length - 5 : 0;

      card.innerHTML = `
        <div class="card-head">
          <div class="order-id">${escapeHtml(orderId)}</div>
          <div class="badge ${isPaid ? "paid" : "fail"}">${isPaid ? "PAID" : "FAILED"}</div>
        </div>

        <div class="meta">
          <div><span>Date</span>${escapeHtml(dateText)}</div>
          <div><span>Payment</span>${escapeHtml(paymentMethod)}</div>
          <div><span>Delivery</span>${escapeHtml(deliveryType)} (+$${deliveryFee.toFixed(2)})</div>
          <div><span>Takeaway</span>+$${takeawayFee.toFixed(2)}</div>
        </div>

        <div class="items">
          ${itemsHtml}
          ${moreCount ? `<div class="muted">+ ${moreCount} more item(s)…</div>` : ``}
        </div>

        <div class="total-line">
          <div>Total</div>
          <div>$${totalValue.toFixed(2)}</div>
        </div>
      `;

      orderHistoryDiv.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    orderHistoryDiv.innerHTML = `
      <div class="card">
        <b>Cannot load orders.</b>
        <div class="muted">Check Firestore rules / console error.</div>
      </div>
    `;
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
