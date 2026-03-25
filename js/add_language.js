import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const form = document.getElementById("languageForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("langName").value.trim();
  const code = document.getElementById("langCode").value.trim().toLowerCase();
  const active = document.getElementById("langActive").checked;

  if (!name || !code) {
    alert("Please fill all fields");
    return;
  }

  // Prevent duplicate language codes
  const q = query(
    collection(db, "languages"),
    where("code", "==", code)
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    alert("Language code already exists");
    return;
  }

  await addDoc(collection(db, "languages"), {
    name,
    code,
    active,
    createdAt: serverTimestamp()
  });

  msg.textContent = "✅ Language added successfully";
  msg.style.display = "block";

  form.reset();
  document.getElementById("langActive").checked = true;
});
