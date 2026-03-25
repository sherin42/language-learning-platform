import { auth, db } from "./firebase.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
doc,
getDoc,
setDoc,
serverTimestamp,
collection,
query,
orderBy,
getDocs,
addDoc,
where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


/* =========================
GET LESSON ID
========================= */

const params = new URLSearchParams(window.location.search);
const lessonId = params.get("lessonId");


/* =========================
DOM ELEMENTS
========================= */

const quizContainer = document.getElementById("quizContainer");
const submitBtn = document.getElementById("submitQuizBtn");
const resultBox = document.getElementById("result");


/* =========================
STATE
========================= */

let quizQuestions = [];
let currentUser = null;
let alreadyCompleted = false;


/* =========================
AUTH
========================= */

onAuthStateChanged(auth, async user => {

if(!user){
window.location.href="login.html";
return;
}

currentUser = user;


const backBtn = document.getElementById("backToLesson");

if(backBtn){
  backBtn.onclick = () => {
    window.location.href = `lesson.html?id=${lessonId}`;
  };
}

await checkIfAlreadyCompleted();
await loadQuiz();

});


/* =========================
CHECK IF QUIZ ALREADY DONE
========================= */

async function checkIfAlreadyCompleted(){

const resultSnap = await getDocs(
  query(
    collection(db,"quizResults"),
    where("userId","==",currentUser.uid),
    where("lessonId","==",lessonId)
  )
);

if(!resultSnap.empty){
  alreadyCompleted = true;
}

if(alreadyCompleted){
  submitBtn.disabled = true;
  submitBtn.textContent = "Quiz Already Completed";
}

}


/* =========================
LOAD QUIZ
========================= */

async function loadQuiz(){

const quizSnap = await getDoc(doc(db,"quizzes",lessonId));

if(!quizSnap.exists()){
quizContainer.innerHTML="<p>No quiz available for this lesson.</p>";
submitBtn.style.display="none";
return;
}

quizQuestions = quizSnap.data().questions || [];

renderQuiz();

}


/* =========================
RENDER QUIZ
========================= */

function renderQuiz(){

quizContainer.innerHTML="";

quizQuestions.forEach((q,i)=>{

const div=document.createElement("div");
div.className="quiz-question";

div.innerHTML=`

<p><strong>Question ${i+1}</strong></p>
<p>${q.question}</p>

${q.options.map((opt,index)=>`

<label class="quiz-option">
<input type="radio" name="q-${i}" value="${index}">
${opt}
</label><br>

`).join("")}

`;

quizContainer.appendChild(div);

});

}


/* =========================
SUBMIT QUIZ
========================= */

submitBtn.onclick = async ()=>{

if(alreadyCompleted) return;

let score = 0;

/* CHECK ANSWERS */

quizQuestions.forEach((q,i)=>{

const options = document.querySelectorAll(`input[name="q-${i}"]`);

options.forEach(opt=>{

const label = opt.parentElement;

opt.disabled = true;

/* CORRECT ANSWER */

if(Number(opt.value) === q.correctIndex){
label.style.color="green";
label.style.fontWeight="bold";
}

/* WRONG SELECTION */

if(opt.checked && Number(opt.value) !== q.correctIndex){
label.style.color="red";
}

});

/* COUNT SCORE */

const selected = document.querySelector(`input[name="q-${i}"]:checked`);

if(selected && Number(selected.value) === q.correctIndex){
score++;
}

});


/* =========================
SHOW RESULT
========================= */

resultBox.style.display="block";

resultBox.innerHTML=`

<h3>🎯 Score: ${score} / ${quizQuestions.length}</h3>

<p>
${score === quizQuestions.length
? "Excellent! Perfect score! 🎉"
: "Review the correct answers above."}
</p>

`;


/* =========================
SAVE QUIZ RESULT
========================= */

await addDoc(
collection(db,"quizResults"),
{
userId: currentUser.uid,
lessonId: lessonId,
score: score,
total: quizQuestions.length,
createdAt: serverTimestamp()
}
);


/* =========================
MARK LESSON COMPLETE
========================= */

await setDoc(
doc(db,"progress",currentUser.uid,"lessons",lessonId),
{
completed:true,
completedAt:serverTimestamp()
}
);


/* =========================
NEXT LESSON BUTTON
========================= */

const nextBtn = document.createElement("button");

nextBtn.className = "next-lesson-btn";
nextBtn.innerHTML = `
  <span>Next Lesson</span>
  <span class="arrow">→</span>
`;

nextBtn.onclick = async () => {

  const lessonSnap = await getDoc(doc(db,"lessons",lessonId));
  const lessonData = lessonSnap.data();

  /* ✅ GET LESSONS OF SAME LANGUAGE + CATEGORY */
  const lessonsSnap = await getDocs(
    query(
      collection(db,"lessons"),
      where("language","==",lessonData.language),
      where("category","==",lessonData.category),
      orderBy("order")
    )
  );

  const lessons = lessonsSnap.docs.map(d=>({
    id: d.id,
    ...d.data()
  }));

  /* FIND CURRENT INDEX */
  const index = lessons.findIndex(l=>l.id === lessonId);

  /* GO NEXT IN SAME CATEGORY */
  if(index >= 0 && index < lessons.length - 1){

    window.location.href = `lesson.html?id=${lessons[index+1].id}`;

  } else {

    /* ✅ MOVE TO NEXT CATEGORY */
    const CATEGORY_ORDER = ["Beginner","Intermediate","Advanced"];
    const currentIndex = CATEGORY_ORDER.indexOf(lessonData.category);

    if(currentIndex < CATEGORY_ORDER.length - 1){

      const nextCategory = CATEGORY_ORDER[currentIndex + 1];

      const nextLessonsSnap = await getDocs(
        query(
          collection(db,"lessons"),
          where("language","==",lessonData.language),
          where("category","==",nextCategory),
          orderBy("order")
        )
      );

      if(!nextLessonsSnap.empty){
        const nextLesson = nextLessonsSnap.docs[0];
        window.location.href = `lesson.html?id=${nextLesson.id}`;
        return;
      }
    }

    /* FINAL FALLBACK */
    window.location.href = "all_lessons.html";
  }

};

resultBox.appendChild(document.createElement("br"));
resultBox.appendChild(nextBtn);


submitBtn.disabled=true;

};