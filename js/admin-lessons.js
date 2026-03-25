import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   SAFE DOM GETTER
========================= */
function el(id) {
  return document.getElementById(id);
}

/* =========================
   DOM
========================= */
const container = el("adminLessonsContainer");
const languageSelect = el("adminLanguageSelect");

const editOverlay = el("editOverlay");

const editTitle = el("editTitle");
const editDescription = el("editDescription");
const editContent = el("editContent");
const editCategory = el("editCategory");
const editLanguage = el("editLanguage");

const editImageUrl = el("editImageUrl");
const editVideoUrl = el("editVideoUrl");
const editAudioUrl = el("editAudioUrl");

const editImagePreview = el("editImagePreview");
const editVideoPreview = el("editVideoPreview");
const editYouTubePreview = el("editYouTubePreview");
const editAudioPreview = el("editAudioPreview");

const saveEditBtn = el("saveEditBtn");
const closeEditBtn = el("closeEdit");
const cancelEditBtn = el("cancelEditBtn");

let currentLessonId = null;

/* =========================
   EVENT DELEGATION
========================= */
if (container) {
  container.addEventListener("click", (e) => {

    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const quizBtn = e.target.closest(".manage-quiz-btn");

    if (editBtn) {
      editLesson(editBtn.dataset.id);
      return;
    }

    if (deleteBtn) {
      deleteLesson(deleteBtn.dataset.id);
      return;
    }

    if (quizBtn) {
      const lessonId = quizBtn.dataset.id;
      window.location.href =
        `admin-quiz.html?lessonId=${lessonId}`;
    }
  });
}

/* =========================
   LOAD LANGUAGES
========================= */
async function loadLanguages() {

  if (!languageSelect || !editLanguage) return;

  languageSelect.innerHTML = "";
  editLanguage.innerHTML = "";

  const snap = await getDocs(collection(db, "languages"));

  if (snap.empty) {
    languageSelect.innerHTML = `<option>No languages</option>`;
    return;
  }

  snap.forEach(docSnap => {
    const lang = docSnap.data().name;

    const optionMain = document.createElement("option");
    optionMain.value = lang;
    optionMain.textContent = lang;
    languageSelect.appendChild(optionMain);

    const optionEdit = document.createElement("option");
    optionEdit.value = lang;
    optionEdit.textContent = lang;
    editLanguage.appendChild(optionEdit);
  });

  loadLessons(languageSelect.value);
}

/* =========================
   LOAD LESSONS (WITH CATEGORY + SHOW MORE)
========================= */
async function loadLessons(selectedLanguage) {

  if (!container) return;

  container.innerHTML = "";

  const lessonsSnap = await getDocs(
    query(
      collection(db, "lessons"),
      where("language", "==", selectedLanguage),
      orderBy("order")
    )
  );

  if (lessonsSnap.empty) {
    container.innerHTML =
      `<p style="color:white">No lessons for ${selectedLanguage}</p>`;
    return;
  }

  /* GROUP BY CATEGORY */
  const grouped = {
    Beginner: [],
    Intermediate: [],
    Advanced: []
  };

  lessonsSnap.forEach(docSnap => {
    const lesson = { id: docSnap.id, ...docSnap.data() };
    if (grouped[lesson.category]) {
      grouped[lesson.category].push(lesson);
    }
  });

  /* RENDER EACH CATEGORY */
  Object.keys(grouped).forEach(category => {

    const lessons = grouped[category];
    if (!lessons.length) return;

    const section = document.createElement("div");
    section.className = "mb-5";

    const title = document.createElement("h3");
    title.textContent = category;
    title.style.color = "white";
    title.style.marginBottom = "20px";

    const grid = document.createElement("div");
    grid.className = "admin-lessons-list"; // uses your CSS grid

    let expanded = false;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn btn-outline-light mt-3";

    function renderLessons() {

      grid.innerHTML = "";

      const visibleLessons = expanded
        ? lessons
        : lessons.slice(0, 3);

      visibleLessons.forEach(lesson => {
        grid.appendChild(createLessonCard(lesson));
      });

      toggleBtn.textContent = expanded
        ? "Show Less ▲"
        : "Show More ▼";
    }

    toggleBtn.onclick = () => {
      expanded = !expanded;
      renderLessons();
    };

    renderLessons();

    section.appendChild(title);
    section.appendChild(grid);

    if (lessons.length > 3) {
      section.appendChild(toggleBtn);
    }

    container.appendChild(section);
  });
}

/* =========================
   CREATE CARD
========================= */
function createLessonCard(lesson) {

  const card = document.createElement("div");
  card.className = "lesson-card";

  const imageHTML = lesson.imageUrl
    ? `<img src="${formatPath(lesson.imageUrl)}">`
    : "";

  let videoHTML = "";
  if (lesson.videoUrl) {
    if (isYouTube(lesson.videoUrl)) {
      videoHTML = `
        <iframe
          src="https://www.youtube.com/embed/${extractYouTubeId(lesson.videoUrl)}"
          allowfullscreen>
        </iframe>`;
    } else {
      videoHTML = `
        <video controls>
          <source src="${formatPath(lesson.videoUrl)}">
        </video>`;
    }
  }

  const audioHTML = lesson.audioUrl
    ? `<audio controls>
         <source src="${formatPath(lesson.audioUrl)}">
       </audio>`
    : "";

  card.innerHTML = `
    <h4>${lesson.title}</h4>
    <p><strong>Description:</strong> ${lesson.description || ""}</p>
    <p><strong>Content:</strong> ${lesson.content || ""}</p>
    ${imageHTML}
    ${videoHTML}
    ${audioHTML}
    <div class="lesson-actions">
      <button class="btn btn-warning edit-btn" data-id="${lesson.id}">Edit</button>
      <button class="btn btn-danger delete-btn" data-id="${lesson.id}">Delete</button>
      <button class="btn btn-info manage-quiz-btn" data-id="${lesson.id}">Manage Quizzes</button>
    </div>
  `;

  return card;
}

/* =========================
   DELETE
========================= */
async function deleteLesson(id) {
  if (!confirm("Delete this lesson?")) return;
  await deleteDoc(doc(db, "lessons", id));
  loadLessons(languageSelect.value);
}

/* =========================
   EDIT
========================= */
async function editLesson(id) {

  currentLessonId = id;

  const snap = await getDoc(doc(db, "lessons", id));
  if (!snap.exists()) return;

  const l = snap.data();

  editTitle.value = l.title || "";
  editDescription.value = l.description || "";
  editContent.value = l.content || "";
  editCategory.value = l.category || "Beginner";
  editLanguage.value = l.language || "";

  editImageUrl.value = l.imageUrl || "";
  editVideoUrl.value = l.videoUrl || "";
  editAudioUrl.value = l.audioUrl || "";

  resetPreviews();

  /* IMAGE */
  if (editImagePreview && l.imageUrl) {
    editImagePreview.src = formatPath(l.imageUrl);
    editImagePreview.style.display = "block";
  }

  /* VIDEO */
  if (l.videoUrl) {
    if (isYouTube(l.videoUrl)) {
      if (editYouTubePreview) {
        editYouTubePreview.src =
          "https://www.youtube.com/embed/" +
          extractYouTubeId(l.videoUrl);
        editYouTubePreview.style.display = "block";
      }
    } else {
      if (editVideoPreview) {
        editVideoPreview.src = formatPath(l.videoUrl);
        editVideoPreview.style.display = "block";
      }
    }
  }

  /* AUDIO */
  if (editAudioPreview && l.audioUrl) {
    editAudioPreview.src = formatPath(l.audioUrl);
    editAudioPreview.style.display = "block";
  }

  editOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/* =========================
   SAVE
========================= */
if (saveEditBtn) {
  saveEditBtn.onclick = async function (e) {

    e.preventDefault();
    if (!currentLessonId) return;

    await updateDoc(doc(db, "lessons", currentLessonId), {
      title: editTitle.value.trim(),
      description: editDescription.value.trim(),
      content: editContent.value.trim(),
      category: editCategory.value,
      language: editLanguage.value,
      imageUrl: editImageUrl.value.trim(),
      videoUrl: editVideoUrl.value.trim(),
      audioUrl: editAudioUrl.value.trim()
    });

    closeModal();
    loadLessons(languageSelect.value);
  };
}

/* =========================
   CLOSE MODAL
========================= */
function closeModal() {
  if (editOverlay) editOverlay.style.display = "none";
  document.body.style.overflow = "auto";
  currentLessonId = null;
}

if (closeEditBtn) closeEditBtn.onclick = closeModal;
if (cancelEditBtn) cancelEditBtn.onclick = closeModal;

if (editOverlay) {
  editOverlay.addEventListener("click", (e) => {
    if (e.target === editOverlay) closeModal();
  });
}

/* =========================
   HELPERS
========================= */
function formatPath(path) {
  if (!path) return "";
  if (!path.startsWith("http")) {
    return "./" + path.replace(/^\.?\//, "");
  }
  return path;
}

function resetPreviews() {

  if (editImagePreview) {
    editImagePreview.style.display = "none";
    editImagePreview.src = "";
  }

  if (editVideoPreview) {
    editVideoPreview.style.display = "none";
    editVideoPreview.src = "";
  }

  if (editYouTubePreview) {
    editYouTubePreview.style.display = "none";
    editYouTubePreview.src = "";
  }

  if (editAudioPreview) {
    editAudioPreview.style.display = "none";
    editAudioPreview.src = "";
  }
}

function isYouTube(url) {
  return url && (url.includes("youtube.com") || url.includes("youtu.be"));
}

function extractYouTubeId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : "";
}

/* =========================
   INIT
========================= */
if (languageSelect) {
  languageSelect.addEventListener("change", () => {
    loadLessons(languageSelect.value);
  });
}

loadLanguages();