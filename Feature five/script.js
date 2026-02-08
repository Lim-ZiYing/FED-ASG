import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyAL8H-6QQcdpIKnZynqdVYnBjSXNdYaCKE",
  authDomain: "fed-assignment-607f5.firebaseapp.com",
  projectId: "fed-assignment-607f5",
  storageBucket: "fed-assignment-607f5.firebasestorage.app",
  messagingSenderId: "865290865679",
  appId: "1:865290865679:web:fa9903ebfb2705f3b8a77a",
  measurementId: "G-CH6JWEQ7E2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let stallId;

onAuthStateChanged(auth, async (user) => {

  if(user){
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    stallId = userData.stallId;
    loadMenu();
  } else {
    window.location.href = "../UserAccountManagement/index.html";
  }
});

addItemBtn.addEventListener("click", async () => {

  await addDoc(collection(db, "stalls", stallId, "items"), {
    name: itemName.value,
    price: parseFloat(itemPrice.value),
    cuisines: itemCuisine.value.split(",").map(c => c.trim()),
    createdAt: new Date()
  });

  loadMenu();
});

async function loadMenu(){

  menuList.innerHTML = "";

  const snapshot = await getDocs(
    collection(db, "stalls", stallId, "items")
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

window.deleteItem = async (id)=>{
  await deleteDoc(doc(db, "stalls", stallId, "items", id));
  loadMenu();
};