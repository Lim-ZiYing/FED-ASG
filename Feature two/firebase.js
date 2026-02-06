// Feature two/firebase.js (CONFIG / COMPAT version)

const firebaseConfig = {
  apiKey: "AIzaSyAL8H-6QQcdpIKnZyngdVYnBjSXNdYaCKE",
  authDomain: "fed-assignment-607f5.firebaseapp.com",
  projectId: "fed-assignment-607f5",
  storageBucket: "fed-assignment-607f5.appspot.com",
  messagingSenderId: "865290865679",
  appId: "1:865290865679:web:fa9903ebfb2705f3b8a77a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore reference (GLOBAL)
const db = firebase.firestore();
