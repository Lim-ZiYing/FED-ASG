import { auth, db } from "./firebase.js";

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  setDoc, 
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// REGISTER
document.getElementById("registerForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  try {

    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      role
    });

    alert("Registration successful!");

  } catch(error){
    alert(error.message);
  }
});


// LOGIN
document.getElementById("loginForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {

    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    const userSnap =
      await getDoc(doc(db, "users", userCredential.user.uid));

    alert("Login successful!");

  } catch(error){
    alert(error.message);
  }
});
