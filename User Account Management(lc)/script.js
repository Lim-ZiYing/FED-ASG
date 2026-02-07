let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

document.getElementById("registerForm").addEventListener("submit", function(e){
    e.preventDefault();

    let user = {
        name: regName.value,
        email: regEmail.value,
        password: regPassword.value,
        role: regRole.value
    };

    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful!");
});

document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault();

    let email = loginEmail.value;
    let password = loginPassword.value;

    let foundUser = users.find(user => 
        user.email === email && user.password === password
    );

    if(foundUser){
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        showProfile(foundUser);
    } else {
        alert("Invalid login credentials");
    }
});

function showProfile(user){
    document.getElementById("profileSection").style.display = "block";
    document.getElementById("profileInfo").innerText =
        `Name: ${user.name} | Role: ${user.role}`;
}

function logout(){
    localStorage.removeItem("currentUser");
    location.reload();
}

if(currentUser){
    showProfile(currentUser);
}