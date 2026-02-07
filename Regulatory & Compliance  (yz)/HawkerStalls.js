
const STALL_KEY = "hawker_stalls";

const stalls = [
  { stallId: "S001", stallName: "Ah Hock Chicken Rice", cuisine: "Chinese", unit: "#01-12" },
  { stallId: "S002", stallName: "Mdm Tan Noodles", cuisine: "Chinese", unit: "#01-15" },
  { stallId: "S003", stallName: "Spice Corner", cuisine: "Indian", unit: "#01-20" },
  { stallId: "S004", stallName: "Vegemania", cuisine: "Vegetarian", unit: "#01-23" },
  { stallId: "S005", stallName: "Nasi Pandang", cuisine: "Indonesian", unit: "#01-27" }
];

function Stalls() {
  let existing = [];

  try {
    existing = JSON.parse(localStorage.getItem(STALL_KEY)) || [];
  } catch (e) {
    existing = [];
  }

  // seed if empty / missing / corrupted
  if (!Array.isArray(existing) || existing.length === 0) {
    localStorage.setItem(STALL_KEY, JSON.stringify(stalls));
    console.log("Stall data seeded successfully.");
  } else {
    console.log("Stalls already exist in localStorage.");
  }
}

Stalls();
