// admin.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const adminEmail = document.getElementById("adminEmail");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (user && adminEmail) {
    adminEmail.textContent = `Logged in as: ${user.email}`;
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
