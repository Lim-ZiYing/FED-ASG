// tracking-firestore.js (FULL)
// Firestore style: auto document ID, orderId stored as a FIELD (matches your teammate)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, getDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ✅ your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAL8H-6QQcdpIKnZynqdVYnBjSXNdYaCKE",
  authDomain: "fed-assignment-607f5.firebaseapp.com",
  projectId: "fed-assignment-607f5",
  storageBucket: "fed-assignment-607f5.firebasestorage.app",
  messagingSenderId: "865290865679",
  appId: "1:865290865679:web:fa9903ebfb2705f3b8a77a",
  measurementId: "G-CH6JWEQ7E2"
};

const qs = (id)=>document.getElementById(id);

// ---------- local fallback ----------
const LS_KEY = "orderTrackingV2";
function loadLocal(){
  try{
    return JSON.parse(localStorage.getItem(LS_KEY)) || {
      orderDocId: "",
      orderId: "",
      statusIndex: -1
    };
  }catch{
    return { orderDocId:"", orderId:"", statusIndex:-1 };
  }
}
function saveLocal(v){
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}

function statusName(i){
  if(i===0) return "Preparing";
  if(i===1) return "Ready";
  if(i===2) return "Completed";
  return "—";
}

let current = loadLocal();
let unsub = null;

// ---------- UI ----------
function render(){
  qs("orderId").textContent = current.orderId || "—";
  qs("orderStatus").textContent = statusName(current.statusIndex);

  ["step0","step1","step2"].forEach((id,idx)=>{
    const el = qs(id);
    if(!el) return;
    el.classList.toggle("active", current.statusIndex >= idx && current.statusIndex !== -1);
  });
}

function setBackendMsg(txt){
  const el = qs("backendMsg");
  if(el) el.textContent = txt;
}

// ---------- Firestore init (safe) ----------
let db = null;
let firebaseOk = false;

try{
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseOk = true;
  setBackendMsg("Backend: Firebase Firestore connected ✅");
}catch(e){
  firebaseOk = false;
  setBackendMsg("Backend: Firebase failed, using localStorage only ⚠️");
  console.warn(e);
}

// ---------- Listen to a specific order doc ----------
function listenOrderDoc(orderDocId){
  if(!firebaseOk || !orderDocId) return;
  if(unsub) unsub();

  const ref = doc(db, "orders", orderDocId);
  unsub = onSnapshot(ref, (snap)=>{
    if(!snap.exists()) return;
    const d = snap.data();

    current = {
      orderDocId: snap.id,
      orderId: d.orderId || current.orderId,
      statusIndex: typeof d.statusIndex === "number" ? d.statusIndex : current.statusIndex
    };
    saveLocal(current);
    render();
  });
}

// ---------- Create order (auto doc id) ----------
async function createNewOrder(){
  // Always update UI immediately
  const newOrderId = "ORD-" + Math.floor(1000 + Math.random()*9000);

  current = { orderDocId:"", orderId:newOrderId, statusIndex:0 };
  saveLocal(current);
  render();

  // If Firestore is available, write a new document with auto ID
  if(firebaseOk){
    try{
      const ordersRef = collection(db, "orders");

      // Match teammate style: createdAt, fees, items...
      const docRef = await addDoc(ordersRef, {
        orderId: newOrderId,
        statusIndex: 0,
        statusText: "Preparing",
        createdAt: serverTimestamp(),

        // Optional fields (keeps structure similar to teammate)
        fees: { delivery: 0, takeaway: 0 },
        items: [
          { id: 1, name: "Steamed Chicken Rice", price: 4, qty: 1, stall: "Ah Hock Chicken Rice" }
        ]
      });

      current.orderDocId = docRef.id;
      saveLocal(current);
      render();
      listenOrderDoc(docRef.id);

    }catch(e){
      console.warn("Firestore create blocked, local only", e);
      setBackendMsg("Backend: Firestore write blocked (rules). Using localStorage ⚠️");
    }
  }
}

// ---------- Update status in same doc ----------
async function advanceStatus(){
  if(!current.orderId) return alert("Create a new order first.");

  current.statusIndex = Math.min(2, current.statusIndex + 1);
  saveLocal(current);
  render();

  if(firebaseOk && current.orderDocId){
    try{
      const ref = doc(db, "orders", current.orderDocId);
      await setDoc(ref, {
        statusIndex: current.statusIndex,
        statusText: statusName(current.statusIndex),
        updatedAt: serverTimestamp()
      }, { merge:true });

    }catch(e){
      console.warn("Firestore update blocked", e);
      setBackendMsg("Backend: Firestore write blocked (rules). Using localStorage ⚠️");
    }
  }
}

function resetOrder(){
  if(unsub) unsub();
  unsub = null;

  current = { orderDocId:"", orderId:"", statusIndex:-1 };
  saveLocal(current);
  render();
}

// ---------- On load ----------
render();

// If we already have a saved orderDocId, listen to it
if(firebaseOk && current.orderDocId){
  listenOrderDoc(current.orderDocId);
}

// buttons
qs("newOrderBtn").addEventListener("click", createNewOrder);
qs("advanceStatusBtn").addEventListener("click", advanceStatus);
qs("resetOrderBtn").addEventListener("click", resetOrder);
