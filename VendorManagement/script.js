import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("addItemForm");
const menuList = document.getElementById("menuList");
const successMessage = document.getElementById("successMessage");

/* ===============================
   LOAD MENU ITEMS FROM FIREBASE
================================= */
async function loadMenuItems() {
    menuList.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "items"));

    querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const li = document.createElement("li");

        li.innerHTML = `
            ${item.name} - $${item.price}
            <button data-id="${docSnap.id}">Delete</button>
        `;

        // DELETE BUTTON
        li.querySelector("button").addEventListener("click", async () => {
            await deleteDoc(doc(db, "items", docSnap.id));
            loadMenuItems();
        });

        menuList.appendChild(li);
    });
}

/* ===============================
   ADD ITEM TO FIREBASE
================================= */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const price = document.getElementById("itemPrice").value.trim();
    const cuisinesInput = document.getElementById("itemCuisines").value;

    if (!name || !price) {
        alert("Please fill in required fields.");
        return;
    }

    const cuisines = cuisinesInput
        .split(",")
        .map(c => c.trim())
        .filter(c => c !== "");

    try {
        await addDoc(collection(db, "items"), {
            name: name,
            price: Number(price),
            cuisines: cuisines,
            createdAt: serverTimestamp()
        });

        // SUCCESS MESSAGE
        successMessage.innerText = "✅ Item successfully added to Firebase!";
        successMessage.style.display = "block";

        setTimeout(() => {
            successMessage.style.display = "none";
        }, 3000);

        form.reset();
        loadMenuItems();

    } catch (error) {
        alert("Error: " + error.message);
    }
});

loadMenuItems();