// This file seeds stall data into localStorage
// Run once per browser

const STALL_KEY = "hawker_stalls";

const stalls = [
  {
    stallId: "S001",
    stallName: "Ah Hock Chicken Rice",
    cuisine: "Chinese",
    unit: "#01-12"
  },
  {
    stallId: "S002",
    stallName: "Mdm Tan Noodles",
    cuisine: "Chinese",
    unit: "#01-15"
  },
  {
    stallId: "S003",
    stallName: "Spice Corner",
    cuisine: "Indian",
    unit: "#01-20"
  }
];

function Stalls() {
  const existing = localStorage.getItem(STALL_KEY);

  if (existing) {
    console.log("Stalls already exist in localStorage.");
    return;
  }

  localStorage.setItem(STALL_KEY, JSON.stringify(stalls));
  console.log("Stall data seeded successfully.");
}

// Run seed
Stalls();
