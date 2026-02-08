import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  setDoc, 
  doc, 
  addDoc,
  collection
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

document.getElementById("registerBtn").addEventListener("click", async () => {

  const name = regName.value;
  const email = regEmail.value;
  const password = regPassword.value;
  const role = regRole.value;

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let stallId = null;

  if(role === "vendor"){

    const stallRef = await addDoc(collection(db, "stalls"), {
      name: name + "'s Stall",
      ownerId: user.uid,
      createdAt: new Date()
    });

    stallId = stallRef.id;
  }

  await setDoc(doc(db, "users", user.uid), {
    name: name,
    email: email,
    role: role,
    stallId: stallId
  });

  alert("Registration successful!");
});