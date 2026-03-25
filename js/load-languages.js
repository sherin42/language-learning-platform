import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const languageSelect = document.getElementById("lessonLanguage");

async function loadLanguages() {
  if (!languageSelect) return;

  languageSelect.innerHTML = `<option value="">Select language</option>`;

  const snap = await getDocs(collection(db, "languages"));

  snap.forEach(doc => {
    const data = doc.data();

    const option = document.createElement("option");
    option.value = data.name;
    option.textContent = data.name;

    languageSelect.appendChild(option);
  });
}

loadLanguages();
