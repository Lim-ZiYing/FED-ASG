// Feature two/app.js
import { db } from "./firebase.js";
import { collection, getDocs } from "firebase/firestore";

// Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// DOM
const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

// This will be filled from Firebase
let stalls = [];

// ---------- START ----------
document.addEventListener("DOMContentLoaded", async () => {
  // If this page has menu, load menu from Firebase
  if (menuDiv) {
    stalls = await loadMenuFromFirestore();
    renderMenuPage();
  }

  // If this page has cart
  const cartList = document.getElementById("cartList");
  if (cartList) {
    renderCartPage();
  }

  // If this page has payment result
  const resultText = document.getElementById("resultText");
  if (resultText) {
    handlePaymentResult(resultText);
  }
});

// ---------- FIREBASE: LOAD MENU ----------
async function loadMenuFromFirestore() {
  // 1) Load stall documents
  const stallsSnap = await getDocs(collection(db, "stalls"));

  const loaded = [];

  for (const stallDoc of stallsSnap.docs) {
    const stallData = stallDoc.data();

    // 2) Load items subcollection for each stall
    const itemsSnap = await getDocs(collection(db, "stalls", stallDoc.id, "items"));

    const items = itemsSnap.docs
      .map((d) => d.data())
      .sort((a, b) => Number(a.id) - Number(b.id)); // sort by item id

    loaded.push({
      name: stallData.name,
      items
    });
  }

  // sort stalls by name (optional)
  loaded.sort((a, b) => a.name.localeCompare(b.name));

  return loaded;
}

// ---------- MENU PAGE ----------
function renderMenuPage() {
  menuDiv.innerHTML = "";

  stalls.forEach((stall) => {
    const stallDiv = document.createElement("div");
    stallDiv.className = "stall";

    const h3 = document.createElement("h3");
    h3.textContent = stall.name;
    stallDiv.appendChild(h3);

    stall.items.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "food";

      const infoDiv = document.createElement("div");
      infoDiv.innerHTML = `<span>${escapeHtml(item.name)}</span>
        <span style="margin-left:10px;">$${Number(item.price).toFixed(2)}</span>`;
      itemDiv.appendChild(infoDiv);

      const btn = document.createElement("button");
      btn.textContent = "Add";
      btn.addEventListener("click", () => addToCart(stall.name, item.id));
      itemDiv.appendChild(btn);

      stallDiv.appendChild(itemDiv);
    });

    menuDiv.appendChild(stallDiv);
  });

  updateTotal();
}

function addToCart(stallName, itemId) {
  const stall = stalls.find((s) => s.name === stallName);
  if (!stall) return;

  const item = stall.items.find((i) => String(i.id) === String(itemId));
  if (!item) return;

  // ✅ Better cart: store quantity instead of duplicates
  const existing = cart.find(
    (c) => c.stall === stallName && String(c.id) === String(itemId)
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      stall: stallName,
      qty: 1
    });
  }

  saveCart();
  updateTotal();
}

function updateTotal() {
  if (!totalPriceDiv) return;
  const total = cart.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
  totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

window.goCart = function goCart() {
  window.location.href = "cart.html";
};

// ---------- CART PAGE ----------
function renderCartPage() {
  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartList) return;

  cartList.innerHTML = "";

  const total = cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "order-item";

    div.innerHTML = `
      <div>
        ${escapeHtml(item.name)} (${escapeHtml(item.stall)})
        - $${Number(item.price).toFixed(2)}
        x ${item.qty || 1}
      </div>
      <button data-index="${index}">Remove</button>
    `;

    div.querySelector("button").addEventListener("click", () => removeItem(index));

    cartList.appendChild(div);
  });

  if (cartTotal) cartTotal.textContent = "Total: $" + total.toFixed(2);
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartPage();
}

window.goCheckout = function goCheckout() {
  window.location.href = "checkout.html";
};

// ---------- PAYMENT ----------
window.makePayment = function makePayment() {
  const success = Math.random() > 0.3;
  localStorage.setItem("paymentResult", success ? "success" : "fail");
  window.location.href = "payment.html";
};

function handlePaymentResult(resultText) {
  const result = localStorage.getItem("paymentResult");

  if (result === "success") {
    resultText.textContent = "Payment Successful!";
    cart = [];
    saveCart();
  } else if (result === "fail") {
    resultText.textContent = "Payment Failed!";
  }

  localStorage.removeItem("paymentResult");
}

window.backHome = function backHome() {
  location.href = "index.html";
};

// ---------- HELPER ----------
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
