let menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];

document.getElementById("menuForm").addEventListener("submit", function(e){
    e.preventDefault();

    let item = {
        id: Date.now(),
        name: itemName.value,
        price: parseFloat(itemPrice.value),
        cuisines: itemCuisine.value.split(",").map(c => c.trim())
    };

    menuItems.push(item);
    localStorage.setItem("menuItems", JSON.stringify(menuItems));
    displayMenu();
    this.reset();
});

function displayMenu(){
    let list = document.getElementById("menuList");
    list.innerHTML = "";

    menuItems.forEach(item => {
        let li = document.createElement("li");
        li.innerHTML = `
            ${item.name} - $${item.price} 
            <button onclick="deleteItem(${item.id})">Delete</button>
        `;
        list.appendChild(li);
    });
}

function deleteItem(id){
    menuItems = menuItems.filter(item => item.id !== id);
    localStorage.setItem("menuItems", JSON.stringify(menuItems));
    displayMenu();
}

displayMenu();