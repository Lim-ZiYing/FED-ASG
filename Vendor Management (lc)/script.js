import { auth, db } from "./firebase.js";

import { 
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const STALL_ID = "demoStall";   // 🔥 Fixed stall

document.getElementById("menuForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await addDoc(collection(db, "stalls", STALL_ID, "items"), {
    name: itemName.value,
    price: parseFloat(itemPrice.value),
    cuisines: itemCuisine.value.split(",").map(c => c.trim()),
    createdAt: new Date()
  });

  e.target.reset();
  loadMenu();
});

async function loadMenu(){

  menuList.innerHTML = "";

  const snapshot = await getDocs(
    collection(db, "stalls", STALL_ID, "items")
  );

  snapshot.forEach(docSnap => {

    const item = docSnap.data();

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - $${item.price}
      <button onclick="deleteItem('${docSnap.id}')">Delete</button>
    `;

    menuList.appendChild(li);
  });
}

window.deleteItem = async (id) => {
  await deleteDoc(doc(db, "stalls", STALL_ID, "items", id));
  loadMenu();
};

loadMenu();
