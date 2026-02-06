// app.js (CONFIG/COMPAT)

// ----------------------
// CART STORAGE
// ----------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// ----------------------
// PAGE ELEMENTS
// ----------------------
const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");

const checkoutList = document.getElementById("checkoutList");
const checkoutTotal = document.getElementById("checkoutTotal");

const resultText = document.getElementById("resultText");

// Checkout options
const addonTakeaway = document.getElementById("addonTakeaway");

// ----------------------
// START
// ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Menu page
  if (menuDiv) {
    const stalls = await loadMenuFromFirestore();
    renderMenuPage(stalls);
    updateMenuTotal();
  }

  // Cart page
  if (cartList) {
    renderCartPage();
  }

  // Checkout page
  if (checkoutList) {
    renderCheckoutPage();
    wireCheckoutOptions();
  }

  // Payment page
  if (resultText) {
    await handlePaymentResult();
  }
});

// ----------------------
// FIRESTORE: Load menu
// stalls collection -> each stall doc has field: name
// each stall doc has subcollection: items (id, name, price)
// ----------------------
async function loadMenuFromFirestore() {
  const snap = await db.collection("stalls").get();
  const stalls = [];

  for (const doc of snap.docs) {
    const stallData = doc.data();

    const itemsSnap = await db
      .collection("stalls")
      .doc(doc.id)
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
      name: stallData.name || "",
      items
    });
  }

  stalls.sort((a, b) => a.name.localeCompare(b.name));
  return stalls;
}

// ----------------------
// MENU RENDER
// ----------------------
function renderMenuPage(stalls) {
  menuDiv.innerHTML = "";

  stalls.forEach(stall => {
    const stallDiv = document.createElement("div");
    stallDiv.className = "stall";

    const h3 = document.createElement("h3");
    h3.textContent = stall.name;
    stallDiv.appendChild(h3);

    stall.items.forEach(item => {
      const row = document.createElement("div");
      row.className = "food-row";

      const left = document.createElement("div");
      left.className = "food-left";
      left.innerHTML = `<div class="food-name">${escapeHtml(item.name)}</div>`;

      const mid = document.createElement("div");
      mid.className = "food-price";
      mid.textContent = `$${safeNumber(item.price).toFixed(2)}`;

      const right = document.createElement("div");
      const btn = document.createElement("button");
      btn.className = "pill";
      btn.textContent = "Add";
      btn.addEventListener("click", () => addToCart(stall.name, item));
      right.appendChild(btn);

      row.appendChild(left);
      row.appendChild(mid);
      row.appendChild(right);

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
      id: item.id,
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

// ----------------------
// CART PAGE
// ----------------------
function renderCartPage() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = `<p>Your cart is empty.</p>`;
    if (cartTotal) cartTotal.textContent = "Total: $0.00";
    return;
  }

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-title">${escapeHtml(item.name)} <small>(${escapeHtml(item.stall)})</small></div>
      <div class="cart-row">
        <span>$${safeNumber(item.price).toFixed(2)} x ${safeNumber(item.qty)}</span>
        <button class="mini" data-index="${index}">Remove</button>
      </div>
    `;

    div.querySelector("button").addEventListener("click", () => removeItem(index));
    cartList.appendChild(div);
  });

  const total = cart.reduce((s, i) => s + safeNumber(i.price) * safeNumber(i.qty), 0);
  cartTotal.textContent = "Total: $" + total.toFixed(2);
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartPage();
}

// ----------------------
// CHECKOUT PAGE (options)
// ----------------------
function renderCheckoutPage() {
  checkoutList.innerHTML = "";

  if (cart.length === 0) {
    checkoutList.innerHTML = "<p>No items to checkout.</p>";
    checkoutTotal.textContent = "Total: $0.00";
    return;
  }

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
      <div><b>${escapeHtml(item.name)}</b> <small>(${escapeHtml(item.stall)})</small></div>
      <div>$${safeNumber(item.price).toFixed(2)} x ${safeNumber(item.qty)}</div>
    `;
    checkoutList.appendChild(div);
  });

  updateCheckoutTotal();
}

function wireCheckoutOptions() {
  if (addonTakeaway) {
    addonTakeaway.addEventListener("change", updateCheckoutTotal);
  }

  const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
  deliveryRadios.forEach(r => r.addEventListener("change", updateCheckoutTotal));
}

function updateCheckoutTotal() {
  if (!checkoutTotal) return;

  const base = cart.reduce((s, i) => s + safeNumber(i.price) * safeNumber(i.qty), 0);

  const takeawayFee = addonTakeaway && addonTakeaway.checked ? 0.30 : 0;

  const deliverySelected = document.querySelector('input[name="delivery"]:checked');
  const deliveryFee = deliverySelected ? safeNumber(deliverySelected.value) : 0;

  const total = base + takeawayFee + deliveryFee;

  checkoutTotal.textContent = "Total: $" + total.toFixed(2);
}

// ----------------------
// PAYMENT (demo) + save order to Firestore
// ----------------------
function randomSuccess() {
  return Math.random() > 0.3;
}

async function handlePaymentResult() {
  const ok = randomSuccess();

  if (!ok) {
    resultText.textContent = "Payment Failed!";
    return;
  }

  resultText.textContent = "Payment Successful! Saving order...";

  // calculate checkout total again
  const base = cart.reduce((s, i) => s + safeNumber(i.price) * safeNumber(i.qty), 0);
  const takeawayFee = addonTakeaway && addonTakeaway.checked ? 0.30 : 0;
  const deliverySelected = document.querySelector('input[name="delivery"]:checked');
  const deliveryFee = deliverySelected ? safeNumber(deliverySelected.value) : 0;
  const total = base + takeawayFee + deliveryFee;

  // Save order
  await db.collection("orders").add({
    items: cart,
    fees: {
      takeaway: takeawayFee,
      delivery: deliveryFee
    },
    total: total,
    status: "Preparing",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // clear cart
  cart = [];
  saveCart();

  resultText.textContent = "Order saved ✅";
}

// ----------------------
// NAVIGATION (called from HTML onclick)
// ----------------------
function goCart() {
  location.href = "cart.html";
}
function goCheckout() {
  location.href = "checkout.html";
}
function makePayment() {
  location.href = "payment.html";
}
function backMenu() {
  location.href = "menu.html";
}
function backCart() {
  location.href = "cart.html";
}

// ----------------------
// HELPERS
// ----------------------
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
