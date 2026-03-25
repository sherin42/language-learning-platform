import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().role !== "admin") {
    window.location.href = "dashboard.html";
  }
});
