// register.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        role: "user",
        createdAt: serverTimestamp()
      });

      alert("Registration successful");
      window.location.href = "login.html";

    } catch (error) {
      alert(error.message);
    }
  });
}
