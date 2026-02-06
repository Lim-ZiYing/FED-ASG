// ============================
// Helpers + Cart Storage
// ============================
function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      .map(d => {
        const x = d.data();
        return {
          id: safeNumber(x.id),
          name: x.name || "",
          price: safeNumber(x.price)
        };
      })
      .sort((a, b) => a.id - b.id);

    stalls.push({
      id: stallDoc.id,
      name: stall.name || "",
      items
    });
  }

  stalls.sort((a, b) => a.name.localeCompare(b.name));
  return stalls;
}

// ============================
// MENU PAGE
// ============================
function renderMenuPage(stalls) {
  menuDiv.innerHTML = "";

  stalls.forEach(stall => {
    const stallDiv = document.createElement("section");
    stallDiv.className = "stall";

    stallDiv.innerHTML = `<h2 class="stall-title">${escapeHtml(stall.name)}</h2>`;

    stall.items.forEach(item => {
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
  const found = cart.find(x => x.stall === stallName && x.id === item.id);

  if (found) {
    found.qty = safeNumber(found.qty) + 1;
  } else {
    cart.push({
      id: safeNumber(item.id),
      name: item.name,
      price: safeNumber(item.price),
      stall: stallName,
      qty: 1
    });
  }

  saveCart();
  updateMenuTotal();
}

function updateMenuTotal() {
  if (!totalPriceDiv) return;

  const total = cart.reduce((sum, i) => {
    return sum + safeNumber(i.price) * safeNumber(i.qty);
  }, 0);

  totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

// ============================
// CART PAGE
// ============================
function renderCartPage() {
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
      <div class="cart-title">${escapeHtml(item.name)} <span class="muted">(${escapeHtml(item.stall)})</span></div>
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
// CHECKOUT PAGE (add-ons)
// ============================
function renderCheckoutPage() {
  checkoutList.innerHTML = "";

  if (cart.length === 0) {
    checkoutList.innerHTML = `<p>No items to checkout.</p>`;
    checkoutTotal.textContent = "Total: $0.00";
    return;
  }

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <div><b>${escapeHtml(item.name)}</b> <span class="muted">(${escapeHtml(item.stall)})</span></div>
      <div>$${safeNumber(item.price).toFixed(2)} × ${safeNumber(item.qty)}</div>
    `;
    checkoutList.appendChild(div);
  });

  wireCheckoutOptions();
  updateCheckoutTotal();
}

function wireCheckoutOptions() {
  if (addonTakeaway) addonTakeaway.addEventListener("change", updateCheckoutTotal);

  document.querySelectorAll('input[name="delivery"]').forEach(r => {
    r.addEventListener("change", updateCheckoutTotal);
  });
}

function getSelectedDeliveryFee() {
  const selected = document.querySelector('input[name="delivery"]:checked');
  return selected ? safeNumber(selected.value) : 0;
}

function updateCheckoutTotal() {
  if (!checkoutTotal) return;

  const base = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  const takeawayFee = addonTakeaway && addonTakeaway.checked ? 0.30 : 0;
  const deliveryFee = getSelectedDeliveryFee();

  const total = base + takeawayFee + deliveryFee;
  checkoutTotal.textContent = "Total: $" + total.toFixed(2);
}

// ============================
// PAYMENT (demo) + save order
// ============================
async function handlePaymentPage() {
  const ok = Math.random() > 0.3;

  if (!ok) {
    resultText.textContent = "Payment Failed ❌";
    return;
  }

  // compute final total with add-ons (if checkout page options existed)
  const base = cart.reduce((sum, i) => sum + safeNumber(i.price) * safeNumber(i.qty), 0);
  // If user came directly without toggles, fees become 0
  const takeawayFee = 0;
  const deliveryFee = 0;
  const total = base + takeawayFee + deliveryFee;

  resultText.textContent = "Payment Successful ✅ Saving order...";

  await db.collection("orders").add({
    items: cart,
    fees: { takeaway: takeawayFee, delivery: deliveryFee },
    total,
    status: "Paid",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  cart = [];
  saveCart();

  resultText.textContent = "Payment Successful ✅ Order saved!";
}


async function renderOrderHistory() {
  orderHistoryDiv.innerHTML = "<p>Loading...</p>";

  const snap = await db.collection("orders").orderBy("createdAt", "desc").get();

  if (snap.empty) {
    orderHistoryDiv.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  orderHistoryDiv.innerHTML = "";

  snap.forEach(doc => {
    const o = doc.data();
    const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
    const total = safeNumber(o.total).toFixed(2);

    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div><b>Order:</b> ${doc.id}</div>
      <div><b>Items:</b> ${itemsCount}</div>
      <div><b>Total:</b> $${total}</div>
      <div class="muted"><b>Status:</b> ${escapeHtml(o.status || "Unknown")}</div>
    `;

    orderHistoryDiv.appendChild(card);
  });
}

function goCart() { location.href = "cart.html"; }
function goCheckout() { location.href = "checkout.html"; }
function makePayment() { location.href = "payment.html"; }

document.addEventListener("DOMContentLoaded", async () => {
  if (menuDiv) {
    const stalls = await loadMenuFromFirestore();
    renderMenuPage(stalls);
    updateMenuTotal();
  }

  if (cartList) {
    renderCartPage();
  }

  if (checkoutList) {
    renderCheckoutPage();
  }

  if (resultText) {
    await handlePaymentPage();
  }

  if (orderHistoryDiv) {
    await renderOrderHistory();
  }
});
