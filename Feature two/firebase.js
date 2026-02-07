import firebase from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";

const firebaseConfig = {
  apiKey: "AIzaSyAL8H-6QQcdpIKnZyngdVYnBjSXNdYaCKE",
  authDomain: "fed-assignment-607f5.firebaseapp.com",
  projectId: "fed-assignment-607f5",
  storageBucket: "fed-assignment-607f5.firebasestorage.app",
  messagingSenderId: "865290865679",
  appId: "1:865290865679:web:fa9903ebfb2705f3b8a77a",
  measurementId: "G-CH6JWEQ7E2",
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
export const FieldValue = firebase.firestore.FieldValue;

