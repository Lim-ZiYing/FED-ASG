import { db } from "./firebase.js";
import { doc, writeBatch } from "firebase/firestore";

// 🔥 ONE-TIME MENU DATA
const stalls = [
  {
    name: "Ah Hock Chicken Rice",
    items: [
      { id: 1, name: "Roasted Chicken Rice", price: 4.50 },
      { id: 2, name: "Steamed Chicken Rice", price: 4.00 },
      { id: 3, name: "Char Siew Rice", price: 4.80 }
    ]
  },
  {
    name: "Mdm Tan Noodles",
    items: [
      { id: 4, name: "Laksa", price: 5.50 },
      { id: 5, name: "Wanton Mee", price: 5.00 },
      { id: 6, name: "Char Kway Teow", price: 5.50 }
    ]
  },
  {
    name: "Western Stall",
    items: [
      { id: 7, name: "Chicken Chop", price: 7.50 },
      { id: 8, name: "Fish & Chips", price: 8.00 },
      { id: 9, name: "Beef Burger", price: 6.80 }
    ]
  },
  {
    name: "Drinks Stall",
    items: [
      { id: 10, name: "Bubble Tea", price: 3.00 },
      { id: 11, name: "Iced Lemon Tea", price: 2.50 },
      { id: 12, name: "Canned Coke", price: 1.80 }
    ]
  }
];

function toId(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}


export async function uploadMenuToFirestore() {
  const batch = writeBatch(db);

  for (const stall of stalls) {
    const stallId = toId(stall.name);
    batch.set(doc(db, "stalls", stallId), { name: stall.name });

    for (const item of stall.items) {
      batch.set(
        doc(db, "stalls", stallId, "items", String(item.id)),
        item
      );
    }
  }

  await batch.commit();
  console.log("✅ Menu uploaded to Firestore");
}
