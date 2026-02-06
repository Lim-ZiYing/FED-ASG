import { db } from "./firebase.js";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const ordersList = document.getElementById("ordersList");

// Optional: show only this member's orders
const memberId = localStorage.getItem("memberId");

async function loadOrders() {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  ordersList.innerHTML = "";

  if (snap.empty) {
    ordersList.innerHTML = "<p>No orders found.</p>";
    return;
  }

  snap.forEach(doc => {
    const order = doc.data();

    // Filter by member (optional but good)
    if (memberId && order.createdBy !== memberId) return;

    const div = document.createElement("div");
    div.className = "order-history-item";

    div.innerHTML = `
      <h4>Order by: ${order.createdBy}</h4>
      <p>Status: ${order.status}</p>
      <p>Total: $${order.total.toFixed(2)}</p>
      <ul>
        ${order.items.map(i => `
          <li>
            ${i.name} (${i.stall}) x ${i.qty}
            ${i.selectedAddons?.length
              ? `<br>Add-ons: ${i.selectedAddons.map(a => a.name).join(", ")}`
              : ""}
          </li>
        `).join("")}
      </ul>
      <hr>
    `;

    ordersList.appendChild(div);
  });
}

loadOrders();

window.goBack = function () {
  location.href = "menu.html";
};
