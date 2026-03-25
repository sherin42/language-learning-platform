import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");
const lang = params.get("lang");

async function loadProgress() {

  if (!userId || !lang) return;

  const lessonList = document.getElementById("lessonList");
  lessonList.innerHTML = "";

  /* =========================
     GET USER
  ========================= */
  const userSnap = await getDoc(doc(db, "users", userId));

  if (!userSnap.exists()) {
    document.getElementById("userName").textContent = "User not found";
    return;
  }

  const user = userSnap.data();

  document.getElementById("userName").textContent =
    `${user.name} (${lang}) Progress`;

  /* =========================
     GET LESSONS
  ========================= */
  const lessonsSnap = await getDocs(collection(db, "lessons"));

  const languageLessons = lessonsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(l => l.language === lang);

  const totalLessons = languageLessons.length;

  /* =========================
     GROUP BY CATEGORY
  ========================= */
  const categoryMap = {};

  languageLessons.forEach(lesson => {
    const category = lesson.category || "General";

    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }

    categoryMap[category].push(lesson);
  });

  /* =========================
     SORT CATEGORY ORDER
  ========================= */
  const categoryOrder = ["Beginner", "Intermediate", "Advanced"];

  const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  /* =========================
     GET PROGRESS
  ========================= */
  const progressSnap = await getDocs(
    collection(db, "progress", userId, "lessons")
  );

  const progressMap = {};
  progressSnap.forEach(doc => {
    progressMap[doc.id] = doc.data();
  });

  /* =========================
     GET QUIZ RESULTS
  ========================= */
  const quizSnap = await getDocs(collection(db, "quizResults"));

  const quizMap = {};

  quizSnap.forEach(doc => {
    const data = doc.data();

    if (data.userId !== userId) return;

    if (!quizMap[data.lessonId]) {
      quizMap[data.lessonId] = [];
    }

    quizMap[data.lessonId].push(data);
  });

  let completed = 0;

  /* =========================
     BUILD UI
  ========================= */
  for (const category of sortedCategories) {

    const lessons = categoryMap[category];

    // SORT lessons by order
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

    // CATEGORY HEADER
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `
      <td colspan="4" style="background:#e9ecef;font-weight:bold;">
        📘 ${category}
      </td>
    `;
    lessonList.appendChild(headerRow);

    for (const lesson of lessons) {

      const progress = progressMap[lesson.id];
      const isCompleted = progress?.completed === true;

      if (isCompleted) completed++;

      /* ===== QUIZ DATA ===== */
      const attempts = quizMap[lesson.id] || [];

      let bestScore = "-";

      if (attempts.length > 0) {
        let best = attempts[0];

        attempts.forEach(a => {
          if (a.score > best.score) best = a;
        });

        bestScore = `${best.score} / ${best.total}`;
      }

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${lesson.title || "Untitled"}</td>

        <td>
          <span class="badge ${
            isCompleted ? "bg-success" : "bg-secondary"
          }">
            ${isCompleted ? "Completed" : "Pending"}
          </span>
        </td>

        <td>${bestScore}</td>

        <td>
          ${
            progress?.completedAt
              ? new Date(progress.completedAt.seconds * 1000).toLocaleString()
              : "-"
          }
        </td>
      `;

      lessonList.appendChild(tr);
    }
  }

  /* =========================
     PROGRESS BAR
  ========================= */
  const percent =
    totalLessons > 0
      ? Math.round((completed / totalLessons) * 100)
      : 0;

  document.getElementById("progressBar").style.width =
    percent + "%";

  document.getElementById("progressText").textContent =
    `${completed} / ${totalLessons} lessons completed (${percent}%)`;

  /* =========================
     EMPTY STATE
  ========================= */
  if (totalLessons === 0) {
    lessonList.innerHTML =
      `<tr><td colspan="4" class="text-center">No lessons available</td></tr>`;
  }
}

loadProgress();