import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes("login")) {
        window.location.href = "dashboard.html";
    }
});


import { auth } from "./firebase.js";
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

/* ================= REGISTER ================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Registration successful");
                window.location.href = "login.html";
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}

/* ================= LOGIN ================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Login successful");
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}
