import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const STALL_ID = "demoStall";


// ADD ITEM
document.getElementById("menuForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const name = document.getElementById("itemName").value;
  const price = parseFloat(document.getElementById("itemPrice").value);
  const cuisines = document.getElementById("itemCuisine").value
                    .split(",")
                    .map(c => c.trim());

  try {

    const docRef = await addDoc(
      collection(db, "stalls", STALL_ID, "items"),
      {
        name,
        price,
        cuisines,
        createdAt: new Date()
      }
    );

    console.log("Item added with ID:", docRef.id);

    e.target.reset();
    loadMenu();

  } catch(error){
    alert(error.message);
  }
});


// LOAD MENU
async function loadMenu(){

  document.getElementById("menuList").innerHTML = "";

  const snapshot =
    await getDocs(collection(db, "stalls", STALL_ID, "items"));

  snapshot.forEach(docSnap => {

    const item = docSnap.data();

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - $${item.price}
      <button onclick="deleteItem('${docSnap.id}')">Delete</button>
    `;

    document.getElementById("menuList").appendChild(li);
  });
}


// DELETE
window.deleteItem = async (id) => {

  await deleteDoc(doc(db, "stalls", STALL_ID, "items", id));

  loadMenu();
};

loadMenu();
