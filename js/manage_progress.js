import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const progressContainer = document.getElementById("progressContainer");
const languageFilter = document.getElementById("languageFilter");
const searchUser = document.getElementById("searchUser");

const totalUsersEl = document.getElementById("totalUsers");
const activeUsersEl = document.getElementById("activeUsers");
const avgProgressEl = document.getElementById("avgProgress");

/* =========================
   REQUEST CONTROL
========================= */
let currentRequest = 0;

/* =========================
   LOAD LANGUAGES
========================= */
async function loadLanguageFilter() {
  const snap = await getDocs(collection(db, "languages"));

  languageFilter.innerHTML = `<option value="">All Languages</option>`;

  snap.forEach(doc => {
    const lang = doc.data();

    const option = document.createElement("option");
    option.value = lang.name;
    option.textContent = lang.name;

    languageFilter.appendChild(option);
  });
}

/* =========================
   LOAD PROGRESS
========================= */
async function loadProgress() {

  const requestId = ++currentRequest;

  progressContainer.innerHTML = "";

  const filterLang = languageFilter.value;
  const search = searchUser.value.toLowerCase();

  const usersSnap = await getDocs(collection(db, "users"));
  const lessonsSnap = await getDocs(collection(db, "lessons"));

  if (requestId !== currentRequest) return;

  /* =========================
     MAP LESSONS
  ========================= */
  const lessonsByLang = {};
  const lessonLangMap = {};

  lessonsSnap.forEach(doc => {
    const lesson = doc.data();
    const lang = lesson.language || "Unknown";

    lessonLangMap[doc.id] = lang;

    if (!lessonsByLang[lang]) lessonsByLang[lang] = [];
    lessonsByLang[lang].push(doc.id);
  });

  let totalUsers = 0;
  let activeUsers = 0;
  let totalProgress = 0;
  let rowCount = 0;

  const renderedRows = new Set(); // prevent duplicates
  let hasData = false; // 🔥 fix "No data" bug

  /* =========================
     LOOP USERS
  ========================= */
  for (const userDoc of usersSnap.docs) {

    if (requestId !== currentRequest) return;

    const user = userDoc.data();
    const userId = userDoc.id;
    const userName = user.name || "Unknown";

    if (search && !userName.toLowerCase().includes(search)) continue;

    const progressSnap = await getDocs(
      collection(db, "progress", userId, "lessons")
    );

    if (progressSnap.empty) continue;

    totalUsers++;

    const progressMap = {};
    const userLangSet = new Set();

    progressSnap.forEach(doc => {
      const lessonId = doc.id;
      const data = doc.data();

      progressMap[lessonId] = data;

      const lang = lessonLangMap[lessonId];
      if (lang) userLangSet.add(lang);
    });

    /* =========================
       LOOP LANGUAGES
    ========================= */
    for (const lang of userLangSet) {

      const key = userId + "_" + lang;

      if (renderedRows.has(key)) continue;
      renderedRows.add(key);

      if (filterLang && lang !== filterLang) continue;

      const lessonIds = lessonsByLang[lang] || [];

      let completed = 0;
      let lastActive = null;

      lessonIds.forEach(lessonId => {

        const progress = progressMap[lessonId];

        if (progress?.completed) {
          completed++;

          if (progress.completedAt) {
            const d = new Date(progress.completedAt.seconds * 1000);
            if (!lastActive || d > lastActive) lastActive = d;
          }
        }
      });

      const totalLessons = lessonIds.length;

      const percent =
        totalLessons > 0
          ? Math.round((completed / totalLessons) * 100)
          : 0;

      totalProgress += percent;
      rowCount++;

      if (lastActive) activeUsers++;

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${userName}</td>

        <td>${lang}</td>

        <td>
          <div class="progress">
            <div class="progress-bar bg-success"
              style="width:${percent}%">
              ${percent}%
            </div>
          </div>
        </td>

        <td>${completed} / ${totalLessons}</td>

        <td>${lastActive ? lastActive.toLocaleString() : "-"}</td>

        <td>
          <button class="btn btn-info btn-sm view-btn"
            data-user="${userId}"
            data-lang="${lang}">
            View
          </button>

          <button class="btn btn-danger btn-sm reset-btn"
            data-user="${userId}"
            data-lang="${lang}">
            Reset
          </button>
        </td>
      `;

      progressContainer.appendChild(tr);
      hasData = true; // 🔥 mark data exists
    }
  }

  /* =========================
     STATS
  ========================= */
  totalUsersEl.textContent = totalUsers;
  activeUsersEl.textContent = activeUsers;
  avgProgressEl.textContent =
    rowCount ? Math.round(totalProgress / rowCount) + "%" : "0%";

  /* =========================
     EMPTY STATE
  ========================= */
  if (!hasData) {
    progressContainer.innerHTML =
      `<tr><td colspan="6" class="text-center">No data</td></tr>`;
  }
}

/* =========================
   ACTIONS
========================= */
progressContainer.addEventListener("click", async (e) => {

  const viewBtn = e.target.closest(".view-btn");
  const resetBtn = e.target.closest(".reset-btn");

  if (viewBtn) {
    const userId = viewBtn.dataset.user;
    const lang = viewBtn.dataset.lang;

    window.location.href =
      `progress_view.html?userId=${userId}&lang=${lang}`;
  }

  if (resetBtn) {

    const userId = resetBtn.dataset.user;
    const lang = resetBtn.dataset.lang;

    if (!confirm("Reset this language progress?")) return;

    const lessonsSnap = await getDocs(collection(db, "lessons"));

    for (const lessonDoc of lessonsSnap.docs) {

      const lesson = lessonDoc.data();

      if (lesson.language === lang) {
        await deleteDoc(
          doc(db, "progress", userId, "lessons", lessonDoc.id)
        );
      }
    }

    loadProgress();
  }
});

/* =========================
   EVENTS (DEBOUNCE SEARCH)
========================= */
let timer;

searchUser.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(loadProgress, 300);
});

languageFilter.addEventListener("change", loadProgress);

/* =========================
   INIT
========================= */
loadLanguageFilter();
loadProgress();