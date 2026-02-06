// Feature two/app.js (CONFIG version)

// --------------------
// GLOBAL STATE
// --------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let stalls = [];

// --------------------
// PAGE ELEMENTS
// --------------------
const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");

const checkoutList = document.getElementById("checkoutList");
const checkoutTotal = document.getElementById("checkoutTotal");

const resultText = document.getElementById("resultText");

// --------------------
// START
// --------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (menuDiv) {
    stalls = await loadMenuFromFirestore();
    renderMenuPage();
  }

  if (cartList) {
    renderCartPage();
  }

  if (checkoutList) {
    renderCheckoutPage();
  }

  if (resultText) {
    handlePaymentResult(resultText);
  }
});

// --------------------
// LOAD MENU FROM FIRESTORE
// --------------------
async function loadMenuFromFirestore() {
  const snap = await db.collection("stalls").get();
  const result = [];

  for (const doc of snap.docs) {
    const stall = doc.data();
    const itemsSnap = await db
      .collection("stalls")
      .doc(doc.id)
      .collection("items")
      .get();

    const items = itemsSnap.docs
      .map(d => d.data())
      .sort((a, b) => a.id - b.id);

    result.push({ name: stall.name, items });
  }

  return result;
}

// --------------------
// MENU PAGE
// --------------------
function renderMenuPage() {
  menuDiv.innerHTML = "";

  stalls.forEach(stall => {
    const stallDiv = document.createElement("div");
    stallDiv.className = "stall";

    const h3 = document.createElement("h3");
    h3.textContent = stall.name;
    stallDiv.appendChild(h3);

    stall.items.forEach(item => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "food";

      itemDiv.innerHTML = `
        <span>${item.name}</span>
        <span style="margin-left:10px;">$${item.price.toFixed(2)}</span>
      `;

      const btn = document.createElement("button");
      btn.textContent = "Add";
      btn.onclick = () => addToCart(stall.name, item);

      itemDiv.appendChild(btn);
      stallDiv.appendChild(itemDiv);
    });

    menuDiv.appendChild(stallDiv);
  });

  updateMenuTotal();
}

function addToCart(stallName, item) {
  const existing = cart.find(
    c => c.id === item.id && c.stall === stallName
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      stall: stallName,
      qty: 1,
      selectedAddons: []
    });
  }

  saveCart();
  updateMenuTotal();
}

function updateMenuTotal() {
  if (!totalPriceDiv) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

// --------------------
// CART PAGE
// --------------------
function renderCartPage() {
  cartList.innerHTML = "";

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      ${item.name} (${item.stall}) - $${item.price.toFixed(2)} x ${item.qty}
      <button onclick="removeItem(${index})">Remove</button>
    `;
    cartList.appendChild(div);
  });

  updateCartTotal();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartPage();
}

function updateCartTotal() {
  if (!cartTotal) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotal.textContent = "Total: $" + total.toFixed(2);
}

// --------------------
// CHECKOUT + ADD-ONS
// --------------------
function renderCheckoutPage() {
  checkoutList.innerHTML = "";

  cart.forEach(item => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <b>${item.name}</b> (${item.stall})<br>
      $${item.price.toFixed(2)} x ${item.qty}
    `;
    checkoutList.appendChild(wrap);
  });

  updateCheckoutTotal();
}

function updateCheckoutTotal() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  checkoutTotal.textContent = "Total: $" + total.toFixed(2);
}

// --------------------
// PAYMENT
// --------------------
function makePayment() {
  localStorage.setItem("paymentResult", "success");
  location.href = "payment.html";
}

async function handlePaymentResult(el) {
  const result = localStorage.getItem("paymentResult");

  if (result === "success") {
    el.textContent = "Payment Successful! Saving order...";

    await db.collection("orders").add({
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      status: "Preparing",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    cart = [];
    saveCart();
    el.textContent = "Order saved ✅";
  } else {
    el.textContent = "Payment Failed!";
  }

  localStorage.removeItem("paymentResult");
}

// --------------------
// HELPERS
// --------------------
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function goCart() {
  location.href = "cart.html";
}

function goCheckout() {
  location.href = "checkout.html";
}
