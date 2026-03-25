import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const db = getFirestore();

const select = document.getElementById("languageSelect");
const btn = document.getElementById("saveLanguageBtn");

let currentUser = null;

/* ======================
   AUTH CHECK
====================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.data();

  /* 🚫 If already selected → go dashboard */
  if (userData?.selectedLanguage) {
    window.location.href = "dashboard.html";
    return;
  }

  /* ======================
     LOAD ACTIVE LANGUAGES
  ====================== */

  select.innerHTML = `<option value="">Select Language</option>`;

  const q = query(
    collection(db, "languages"),
    where("active", "==", true)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    select.innerHTML = `<option>No languages available</option>`;
    btn.disabled = true;
    return;
  }

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const option = document.createElement("option");
    option.value = data.name;
    option.textContent = data.name;

    select.appendChild(option);
  });

});

/* ======================
   SAVE LANGUAGE
====================== */

btn.onclick = async () => {

  const lang = select.value;

  if (!lang) {
    alert("Please select a language");
    return;
  }

  await updateDoc(doc(db, "users", currentUser.uid), {
    selectedLanguage: lang
  });

  window.location.href = "dashboard.html";
};