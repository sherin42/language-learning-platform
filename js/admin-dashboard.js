import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   LOAD COUNTS
========================= */
async function loadCounts() {

  const languages = await getDocs(collection(db,"languages"));
  const lessons = await getDocs(collection(db,"lessons"));
  const users = await getDocs(collection(db,"users"));
  const quizResults = await getDocs(collection(db,"quizResults"));

  document.getElementById("totalLanguages").textContent = languages.size;
  document.getElementById("totalLessons").textContent = lessons.size;
  document.getElementById("totalUsers").textContent = users.size;
  document.getElementById("totalQuizAttempts").textContent = quizResults.size;
}

/* =========================
   RECENT ACTIVITY
========================= */
async function loadActivity() {

  /* USERS */
  const usersSnap = await getDocs(
    query(collection(db,"users"), orderBy("createdAt","desc"), limit(5))
  );

  let userHTML = "";
  usersSnap.forEach(doc=>{
    const u = doc.data();

    const time = u.createdAt
      ? new Date(u.createdAt.seconds * 1000).toLocaleString()
      : "";

    userHTML += `
      <div class="activity-item">
        <strong>${u.email || "User"}</strong>
        <span class="badge badge-time float-end">${time}</span>
      </div>
    `;
  });

  document.getElementById("recentUsers").innerHTML =
    userHTML || "No users";


  /* QUIZ */
  const quizSnap = await getDocs(
    query(collection(db,"quizResults"), orderBy("createdAt","desc"), limit(5))
  );

  let quizHTML = "";
  quizSnap.forEach(doc=>{
    const q = doc.data();

    const time = q.createdAt
      ? new Date(q.createdAt.seconds * 1000).toLocaleString()
      : "";

    quizHTML += `
      <div class="activity-item">
        Score: ${q.score}/${q.total}
        <span class="badge badge-time float-end">${time}</span>
      </div>
    `;
  });

  document.getElementById("recentQuizAttempts").innerHTML =
    quizHTML || "No attempts";
}

/* =========================
   TOP USERS (LEADERBOARD)
========================= */
async function loadTopUsers() {

  const usersSnap = await getDocs(collection(db,"users"));

  let leaderboard = [];

  for (const userDoc of usersSnap.docs) {

    const user = userDoc.data();

    const progressSnap = await getDocs(
      collection(db,"progress",userDoc.id,"lessons")
    );

    let completed = 0;

    progressSnap.forEach(doc=>{
      if(doc.data().completed) completed++;
    });

    if(completed > 0){
      leaderboard.push({
        name: user.name || user.email || "User",
        completed
      });
    }
  }

  // Sort descending
  leaderboard.sort((a,b)=>b.completed - a.completed);

  const top = leaderboard.slice(0,5);

  let html = "";

  top.forEach((user, index)=>{

    let medal = "";
    if(index === 0) medal = "🥇";
    else if(index === 1) medal = "🥈";
    else if(index === 2) medal = "🥉";

    html += `
      <div class="activity-item">
        <span class="rank">${medal || (index+1)}</span>
        ${user.name}
        <span class="float-end">${user.completed} lessons</span>
      </div>
    `;
  });

  document.getElementById("topUsers").innerHTML =
    html || "No data";
}

/* =========================
   CHARTS
========================= */
async function loadCharts(){

  /* ========= LANGUAGE DISTRIBUTION ========= */
  const lessonsSnap = await getDocs(collection(db,"lessons"));

  let languageCount = {};

  lessonsSnap.forEach(doc=>{
    const lang = doc.data().language || "Unknown";
    languageCount[lang] = (languageCount[lang] || 0) + 1;
  });

  const langCtx = document.getElementById("languageChart");

  if (langCtx) {
    new Chart(langCtx, {
      type: "pie",
      data: {
        labels: Object.keys(languageCount),
        datasets: [{
          data: Object.values(languageCount),
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b"
          ]
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  /* ========= DAILY ACTIVITY ========= */
  const quizSnap = await getDocs(collection(db,"quizResults"));

  let dailyCount = {
    Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0
  };

  quizSnap.forEach(doc=>{
    const data = doc.data();

    if (!data.createdAt) return;

    const date = new Date(data.createdAt.seconds * 1000);
    const day = date.toLocaleString("en-US",{ weekday:"short" });

    if(dailyCount[day] !== undefined){
      dailyCount[day]++;
    }
  });

  const actCtx = document.getElementById("activityChart");

  if (actCtx) {
    new Chart(actCtx, {
      type: "bar",
      data: {
        labels: Object.keys(dailyCount),
        datasets: [{
          label: "Quiz Attempts",
          data: Object.values(dailyCount),
          backgroundColor: "#4e73df"
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

/* =========================
   INIT
========================= */
loadCounts();
loadActivity();
loadTopUsers();
loadCharts();