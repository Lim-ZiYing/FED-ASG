import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore } from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

export const auth = getAuth(app);
export const db = getFirestore(app);