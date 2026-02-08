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


// ================= REGISTER =================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let stallId = null;

    // If vendor → create stall
    if (role === "vendor") {
      const stallRef = await addDoc(collection(db, "stalls"), {
        name: name + "'s Stall",
        ownerId: user.uid,
        createdAt: new Date()
      });
      stallId = stallRef.id;
    }

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role,
      stallId
    });

    alert("Registration successful!");
  } catch (error) {
    alert(error.message);
  }
});


// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));

        if (!userSnap.exists()) {
            alert("User record not found in database.");
            return;
        }

        const userData = userSnap.data();

        // 🔥 REDIRECT BASED ON ROLE
        if (userData.role === "vendor") {
            window.location.href = "../vendor.html";
        }
        else if (userData.role === "nea" || userData.role === "NEA Officer") {
            window.location.href = "../officer.html";
        }
        else if (userData.role === "patron") {
            window.location.href = "../Customer Engagement (zy)/index.html";
        }

    } catch (error) {
        alert(error.message);
    }
});
