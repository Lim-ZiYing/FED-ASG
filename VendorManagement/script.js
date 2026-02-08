import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let stallId = null;


// 🔹 Get current vendor stall
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Please login first.");
    window.location.href = "../UserAccountManagement/index.html";
    return;
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.data();

  stallId = userData.stallId;

  loadMenuItems();
});


// 🔹 Add Item
document.getElementById("menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!stallId) {
    alert("Stall not loaded yet.");
    return;
  }

  const name = document.getElementById("itemName").value;
  const price = document.getElementById("itemPrice").value;
  const cuisine = document.getElementById("itemCuisine").value;

  await addDoc(collection(db, "stalls", stallId, "items"), {
    name,
    price,
    cuisine
  });

  document.getElementById("menuForm").reset();
});


// 🔹 Load Items (Realtime)
function loadMenuItems() {
  const list = document.getElementById("menuList");

  onSnapshot(collection(db, "stalls", stallId, "items"), (snapshot) => {
    list.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const li = document.createElement("li");

      li.innerHTML = `
        ${item.name} - $${item.price}
        <button data-id="${docSnap.id}">Delete</button>
      `;

      li.querySelector("button").addEventListener("click", async () => {
        await deleteDoc(doc(db, "stalls", stallId, "items", docSnap.id));
      });

      list.appendChild(li);
    });
  });
}