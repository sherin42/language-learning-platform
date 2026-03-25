import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   DOM
========================= */
const container = document.getElementById("languagesContainer");

const editOverlay = document.getElementById("editOverlay");
const editName = document.getElementById("editName");
const editCode = document.getElementById("editCode");
const editActive = document.getElementById("editActive");

const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let currentLanguageId = null;

/* =========================
   LOAD LANGUAGES
========================= */
async function loadLanguages() {

  container.innerHTML = "";

  const snap = await getDocs(collection(db, "languages"));

  if (snap.empty) {
    container.innerHTML =
      `<p class="text-white">No active languages available</p>`;
    return;
  }

  snap.forEach(docSnap=>{
    const lang = { id: docSnap.id, ...docSnap.data() };
    container.appendChild(createCard(lang));
  });
}

/* =========================
   CREATE CARD
========================= */
function createCard(lang){

  const card = document.createElement("div");
  card.className = "language-card";

  const badge = lang.active
    ? `<span class="badge bg-success">Active</span>`
    : `<span class="badge bg-secondary">Inactive</span>`;

  card.innerHTML = `
    <h5>${lang.name}</h5>
    <p><strong>Code:</strong> ${lang.code}</p>
    ${badge}

    <div class="language-actions">
      <button class="btn btn-warning btn-sm edit-btn"
        data-id="${lang.id}">Edit</button>

      <button class="btn btn-danger btn-sm delete-btn"
        data-id="${lang.id}">Delete</button>
    </div>
  `;

  return card;
}

/* =========================
   EVENT DELEGATION
========================= */
container.addEventListener("click", (e)=>{

  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if(editBtn){
    editLanguage(editBtn.dataset.id);
  }

  if(deleteBtn){
    deleteLanguage(deleteBtn.dataset.id);
  }
});

/* =========================
   DELETE
========================= */
async function deleteLanguage(id){

  if(!confirm("Delete this language?")) return;

  await deleteDoc(doc(db,"languages",id));

  loadLanguages();
}

/* =========================
   EDIT
========================= */
async function editLanguage(id){

  currentLanguageId = id;

  const snap = await getDoc(doc(db,"languages",id));
  if(!snap.exists()) return;

  const data = snap.data();

  editName.value = data.name || "";
  editCode.value = data.code || "";
  editActive.checked = data.active || false;

  editOverlay.style.display = "flex";
}

/* =========================
   SAVE EDIT
========================= */
saveEditBtn.onclick = async ()=>{

  const name = editName.value.trim();
  const code = editCode.value.trim().toLowerCase();
  const active = editActive.checked;

  if(!name || !code){
    alert("All fields required");
    return;
  }

  // Prevent duplicate codes
  const q = query(
    collection(db,"languages"),
    where("code","==",code)
  );

  const snap = await getDocs(q);

  if(!snap.empty){
    const existingId = snap.docs[0].id;
    if(existingId !== currentLanguageId){
      alert("Language code already exists");
      return;
    }
  }

  await updateDoc(doc(db,"languages",currentLanguageId),{
    name,
    code,
    active
  });

  closeModal();
  loadLanguages();
};

/* =========================
   CLOSE MODAL
========================= */
function closeModal(){
  editOverlay.style.display = "none";
  currentLanguageId = null;
}

cancelEditBtn.onclick = closeModal;

editOverlay.addEventListener("click",(e)=>{
  if(e.target === editOverlay){
    closeModal();
  }
});

/* INIT */
loadLanguages();