import { auth, db } from "./firebase.js";

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  setDoc, 
  doc, 
  addDoc,
  collection,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// REGISTER
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


// LOGIN
document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = loginEmail.value;
  const password = loginPassword.value;

  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));
  const userData = userSnap.data();

 alert("Login successful");
    alert("Patron logged in!");
  }
);
