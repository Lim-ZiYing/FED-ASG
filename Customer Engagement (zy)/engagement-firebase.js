// engagement-firebase.js
import { db } from "./firebase.js";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =============================
   REVIEWS (stalls/{stallId}/reviews)
============================= */
export function listenReviews(stallId, callback) {
  const q = query(collection(db, "stalls", stallId, "reviews"), orderBy("tsMs", "desc"));
  return onSnapshot(q, (snap) => {
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(reviews);
  });
}

export async function addReview(stallId, { rating, comment }) {
  await addDoc(collection(db, "stalls", stallId, "reviews"), {
    stallId,
    rating,
    comment,
    ts: serverTimestamp(),
    tsMs: Date.now()
  });
}

/* =============================
   COMPLAINTS (stalls/{stallId}/complaints)
============================= */
export function listenComplaints(stallId, callback) {
  const q = query(collection(db, "stalls", stallId, "complaints"), orderBy("tsMs", "desc"));
  return onSnapshot(q, (snap) => {
    const complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(complaints);
  });
}

export async function addComplaint(stallId, payload) {
  await addDoc(collection(db, "stalls", stallId, "complaints"), {
    stallId,
    issue: payload.issue,
    details: payload.details,
    priority: payload.priority || "Low",
    contact: payload.contact || "",
    status: payload.status || "Submitted",
    ts: serverTimestamp(),
    tsMs: Date.now()
  });
}

export async function markComplaintResolved(stallId, complaintDocId) {
  const ref = doc(db, "stalls", stallId, "complaints", complaintDocId);
  await updateDoc(ref, {
    status: "Resolved",
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  });
}

/* =============================
   LIKES (stalls/{stallId}/menuLikes/{itemId})
============================= */
export function listenMenuLikes(stallId, callback) {
  const colRef = collection(db, "stalls", stallId, "menuLikes");
  return onSnapshot(colRef, (snap) => {
    const map = {};
    snap.forEach(d => { map[d.id] = d.data(); }); // { itemId: {count} }
    callback(map);
  });
}

export async function ensureLikeDoc(stallId, itemId) {
  const ref = doc(db, "stalls", stallId, "menuLikes", itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { count: 0, createdAt: serverTimestamp() }, { merge: true });
  }
}

export async function toggleLikeCount(stallId, itemId, isLiking) {
  const ref = doc(db, "stalls", stallId, "menuLikes", itemId);
  await ensureLikeDoc(stallId, itemId);
  await updateDoc(ref, {
    count: increment(isLiking ? 1 : -1),
    updatedAt: serverTimestamp()
  });
}
