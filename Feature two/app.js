import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let stalls = [];


const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");
const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const checkoutList = document.getElementById("checkoutList");
const checkoutTotal = document.getElementById("checkoutTotal");
const resultText = document.getElementById("resultText");


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


async function loadMenuFromFirestore() {
  const stallSnap = await getDocs(collection(db, "stalls"));
  const result = [];

  for (const docSnap of stallSnap.docs) {
    const stallData = docSnap.data();

    const itemsSnap = await getDocs(
      collection(db, "stalls", docSnap.id, "items")
    );

    const items = itemsSnap.docs
      .map(d => d.data())
      .sort((a, b) => a.id - b.id);

    result.push({
      name: stallData.name,
      items
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}


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
        <div>
          <span>${escapeHtml(item.name)}</span>
          <span style="margin-left:10px;">$${item.price.toFixed(2)}</span>
        </div>
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


function renderCartPage() {
  cartList.innerHTML = "";

  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "order-item";

    div.innerHTML = `
      <div>${item.name} (${item.stall}) - $${item.price.toFixed(2)} x ${item.qty}</div>
      <button>Remove</button>
    `;

    div.querySelector("button").onclick = () => removeItem(index);
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


function renderCheckoutPage() {
  checkoutList.innerHTML = "";

  cart.forEach(item => {
    const addons = [
      { name: "Extra Rice", price: 0.5 },
      { name: "Add Egg", price: 1.0 },
      { name: "Less Spicy", price: 0 }
    ];

    const wrap = document.createElement("div");
    wrap.className = "checkout-item";

    wrap.innerHTML = `
      <b>${item.name}</b> (${item.stall})<br>
      $${item.price.toFixed(2)} x ${item.qty}
      <div style="margin-top:6px;"><b>Add-ons</b></div>
    `;

    addons.forEach(addon => {
      const label = document.createElement("label");
      label.style.display = "block";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = item.selectedAddons.some(a => a.name === addon.name);

      cb.onchange = () => {
        if (cb.checked) {
          item.selectedAddons.push(addon);
        } else {
          item.selectedAddons =
            item.selectedAddons.filter(a => a.name !== addon.name);
        }
        saveCart();
        updateCheckoutTotal();
      };

      label.appendChild(cb);
      label.append(` ${addon.name} (+$${addon.price.toFixed(2)})`);
      wrap.appendChild(label);
    });

    checkoutList.appendChild(wrap);
  });

  updateCheckoutTotal();
}

function updateCheckoutTotal() {
  const total = cart.reduce((sum, item) => {
    const addonTotal = item.selectedAddons.reduce((s, a) => s + a.price, 0);
    return sum + (item.price + addonTotal) * item.qty;
  }, 0);

  checkoutTotal.textContent = "Total: $" + total.toFixed(2);
}


window.makePayment = function () {
  const success = Math.random() > 0.3;
  localStorage.setItem("paymentResult", success ? "success" : "fail");
  location.href = "payment.html";
};

async function handlePaymentResult(el) {
  const result = localStorage.getItem("paymentResult");

  if (result === "success") {
    el.textContent = "Payment Successful! Saving order...";

    if (!localStorage.getItem("memberId")) {
      localStorage.setItem(
        "memberId",
        prompt("Enter your name (for order history)")
      );
    }

    await addDoc(collection(db, "orders"), {
      createdBy: localStorage.getItem("memberId"),
      items: cart,
      total: cart.reduce((s, i) => {
        const addons = i.selectedAddons.reduce((x, a) => x + a.price, 0);
        return s + (i.price + addons) * i.qty;
      }, 0),
      status: "Preparing",
      createdAt: serverTimestamp()
    });

    cart = [];
    saveCart();
    el.textContent = "Payment Successful! Order saved ✅";
  } else {
    el.textContent = "Payment Failed!";
  }

  localStorage.removeItem("paymentResult");
}


window.goCart = () => location.href = "cart.html";
window.goCheckout = () => location.href = "checkout.html";
window.backHome = () => location.href = "menu.html";


function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
