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



let cart = JSON.parse(localStorage.getItem("cart")) || [];


const menuDiv = document.getElementById("menu");
const totalPriceDiv = document.getElementById("totalPrice");

if (menuDiv) {
    renderMenuPage();
}

function renderMenuPage() {
    menuDiv.innerHTML = "";
    stalls.forEach(stall => {
        const stallDiv = document.createElement("div");
        stallDiv.className = "stall";

     
        const h3 = document.createElement("h3");
        h3.textContent = stall.name;
        stallDiv.appendChild(h3);


        stall.items.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "food";


            const infoDiv = document.createElement("div");
            infoDiv.innerHTML = `<span>${item.name}</span> <span style="margin-left: 10px;">$${item.price.toFixed(2)}</span>`;
            itemDiv.appendChild(infoDiv);


            const btn = document.createElement("button");
            btn.textContent = "Add";
            btn.addEventListener("click", () => addToCart(stall.name, item.id));
            itemDiv.appendChild(btn);

            stallDiv.appendChild(itemDiv);
        });

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
    const total = cart.reduce((sum, i) => sum + i.price, 0);
    totalPriceDiv.textContent = "Total: $" + total.toFixed(2);
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function goCart() {
    window.location.href = "cart.html";
}


const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");

if (cartList) {
    renderCartPage();
}

function renderCartPage() {
    cartList.innerHTML = "";
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "order-item";

        div.innerHTML = `
            <div>${item.name} (${item.stall}) - $${item.price.toFixed(2)}</div>
            <button onclick="removeItem(${index})">Remove</button>
        `;
        cartList.appendChild(div);
    });

    if (cartTotal) {
        cartTotal.textContent = "Total: $" + total.toFixed(2);
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartPage();
}

function goCheckout() {
    window.location.href = "checkout.html";
}


function makePayment() {
    const success = Math.random() > 0.3;
    if (success) {
        localStorage.setItem("paymentResult", "success");
    } else {
        localStorage.setItem("paymentResult", "fail");
    }
    window.location.href = "payment.html";
}


const resultText = document.getElementById("resultText");
const result = localStorage.getItem("paymentResult");

if (resultText) {
    if (result === "success") {
        resultText.textContent = "Payment Successful!";
        cart = [];
        saveCart();
    } else if (result === "fail") {
        resultText.textContent = "Payment Failed!";
    }
    localStorage.removeItem("paymentResult"); 
}

function backHome() {
    location.href = "index.html";
}
