import { db, app } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

/* =========================
   🔥 SECONDARY AUTH (NO LOGOUT)
========================= */
const secondaryApp = initializeApp(app.options, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

/* =========================
   PRIMARY AUTH (ADMIN)
========================= */
const auth = getAuth();

/* =========================
   DOM
========================= */
const usersContainer = document.getElementById("usersContainer");
const addUserBtn = document.getElementById("addUserBtn");

const editOverlay = document.getElementById("editOverlay");
const modalTitle = document.getElementById("modalTitle");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editPassword = document.getElementById("editPassword");
const editRole = document.getElementById("editRole");
const editSelectedLanguage = document.getElementById("editSelectedLanguage");
const saveUserBtn = document.getElementById("saveUserBtn");
const cancelUserBtn = document.getElementById("cancelUserBtn");
const closeEditBtn = document.getElementById("closeEditBtn");

const viewOverlay = document.getElementById("viewOverlay");
const closeViewBtn = document.getElementById("closeViewBtn");
const viewContent = document.getElementById("viewContent");
const viewTitle = document.getElementById("viewTitle");

let currentUserId = null;
let isEditMode = false;

/* =========================
   LOAD LANGUAGES
========================= */
async function loadLanguagesDropdown(selectedValue = "") {
  editSelectedLanguage.innerHTML = `<option value="">Select Language</option>`;

  const snap = await getDocs(collection(db, "languages"));

  snap.forEach(docSnap => {
    const lang = docSnap.data();

    const option = document.createElement("option");
    option.value = lang.name;
    option.textContent = lang.name;

    if (lang.name === selectedValue) option.selected = true;

    editSelectedLanguage.appendChild(option);
  });
}

/* =========================
   LOAD USERS
========================= */
async function loadUsers() {
  usersContainer.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));

  snap.forEach(docSnap => {
    const u = docSnap.data();

    usersContainer.innerHTML += `
      <tr>
        <td>${u.name || ""}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <button class="btn btn-info btn-sm view-btn" data-id="${docSnap.id}">View</button>
          
          <button class="btn btn-danger btn-sm delete-btn" data-id="${docSnap.id}">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   EVENTS
========================= */
usersContainer.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("view-btn")) openView(id);
  if (e.target.classList.contains("edit-btn")) openEdit(id);
  if (e.target.classList.contains("delete-btn")) deleteUser(id);
});

/* =========================
   ADD USER
========================= */
if (addUserBtn) {
  addUserBtn.onclick = async () => {
    isEditMode = false;
    currentUserId = null;

    modalTitle.textContent = "Add User";

    editName.value = "";
    editEmail.value = "";
    editPassword.value = "";
    editRole.value = "user";

    await loadLanguagesDropdown();

    openEditModal();
  };
}

/* =========================
   VIEW USER
========================= */
async function openView(id) {
  const snap = await getDoc(doc(db, "users", id));
  const d = snap.data();

  viewTitle.textContent = "User Details";

  viewContent.innerHTML = `
    <p><b>Name:</b> ${d.name}</p>
    <p><b>Email:</b> ${d.email}</p>
    <p><b>Role:</b> ${d.role}</p>
    <p><b>Language:</b> ${d.selectedLanguage || "-"}</p>
  `;

  viewOverlay.style.display = "flex";
}

/* =========================
   EDIT USER
========================= */
async function openEdit(id) {
  isEditMode = true;
  currentUserId = id;

  const snap = await getDoc(doc(db, "users", id));
  const d = snap.data();

  editName.value = d.name;
  editEmail.value = d.email;
  editPassword.value = ""; // not editable
  editRole.value = d.role;

  await loadLanguagesDropdown(d.selectedLanguage || "");

  openEditModal();
}

/* =========================
   DELETE USER
========================= */
async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;

  await deleteDoc(doc(db, "users", id));
  loadUsers();
}

/* =========================
   SAVE USER (FIXED)
========================= */
saveUserBtn.onclick = async () => {
  const name = editName.value.trim();
  const email = editEmail.value.trim();
  const password = editPassword.value.trim();
  const role = editRole.value;
  const selectedLanguage = editSelectedLanguage.value;

  if (!email) return alert("Email required");

  if (isEditMode) {
    await updateDoc(doc(db, "users", currentUserId), {
      name,
      email,
      role,
      selectedLanguage
    });
  } else {
    if (!password) return alert("Password required");

    try {
      // 🔥 CREATE USER WITHOUT LOGGING OUT ADMIN
      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        role,
        selectedLanguage,
        createdAt: serverTimestamp()
      });

      alert("User created successfully!");

    } catch (err) {
      alert(err.message);
      return;
    }
  }

  closeEditModal();
  loadUsers();
};

/* =========================
   MODALS
========================= */
function openEditModal() {
  editOverlay.style.display = "flex";
}

function closeEditModal() {
  editOverlay.style.display = "none";
  currentUserId = null;
  isEditMode = false;
}

function closeViewModal() {
  viewOverlay.style.display = "none";
}

/* =========================
   CLOSE BUTTONS
========================= */
closeEditBtn.onclick = closeEditModal;
cancelUserBtn.onclick = closeEditModal;
closeViewBtn.onclick = closeViewModal;

/* =========================
   INIT
========================= */
loadUsers();