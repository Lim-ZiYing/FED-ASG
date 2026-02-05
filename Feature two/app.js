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




// -------- MENU PAGE --------
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

if (menuDiv) {
    stalls.forEach(stall => {
        const stallDiv = document.createElement("div");
        stallDiv.className = "stall";
        stallDiv.innerHTML = `<h3>${stall.name}</h3>`;

        const itemsDiv = document.createElement("div");
        itemsDiv.className = "items";

        stall.items.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            const h4 = document.createElement("h4");
            h4.textContent = item.name;

            const p = document.createElement("p");
            p.textContent = `$${item.price.toFixed(2)}`;

            const btn = document.createElement("button");
            btn.textContent = "Add";
            btn.addEventListener("click", () => addToCart(stall.name, item.id));

            card.appendChild(h4);
            card.appendChild(p);
            card.appendChild(btn);

            itemsDiv.appendChild(card);
        });

        stallDiv.appendChild(itemsDiv);
        menuDiv.appendChild(stallDiv);
    });

    updateTotal();
}

function addToCart(stallName, itemId) {
    const stall = stalls.find(s => s.name === stallName);
    const item = stall.items.find(i => i.id === itemId);
    cart.push({ ...item, stall: stallName });

    saveCart();
    updateTotal();
}

function updateTotal() {
    if (!totalPriceDiv) return;
    let total = 0;
    cart.forEach(i => total += i.price);
    totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function goCart() {
    window.location.href = "cart.html";
}


// -------- CART PAGE --------
const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");

if (cartList) {
    renderCartPage();
}

function renderCartPage() {
    cartList.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const div = document.createElement("div");
        div.className = "order-item";
        div.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.stall}</p>
            <p>$${item.price.toFixed(2)}</p>
            <button onclick="removeItem(${index})">Remove</button>
        `;
        cartList.appendChild(div);
    });

    cartTotal.textContent = "Total: $" + total.toFixed(2);
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartPage();
}


function goCheckout() {
    window.location.href = "checkout.html";
}

// -------- CHECKOUT --------
function makePayment() {
    const success = Math.random() > 0.3;
    if (success) {
        window.location.href = "payment.html";
    } else {
        window.location.href = "payment.html?status=fail";
    }
}

// -------- RESULT --------
const resultText = document.getElementById("resultText");
const result = localStorage.getItem("paymentResult"); // read result from storage
let Cart = JSON.parse(localStorage.getItem("cart")) || [];

if (resultText) {
    if (result === "success") {
        resultText.textContent = "Payment Successful!";
        cart = [];       // clear cart
        localStorage.setItem("cart", JSON.stringify(cart)); // save empty cart
    } else if (result === "fail") {
        resultText.textContent = "Payment Failed!";
    }
}

// -------- PAYMENT --------
function makePayment() {
    const success = Math.random() > 0.3;
    if (success) {
        localStorage.setItem("paymentResult", "success");
        window.location.href = "payment.html";
    } else {
        localStorage.setItem("paymentResult", "fail");
        window.location.href = "payment.html?status=fail";
    }
}

function backHome() {
    location.href = "index.html";
}


// -------- STORAGE --------
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}
