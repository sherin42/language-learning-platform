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
where,
orderBy,
getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
GET LESSON ID
========================= */

const params = new URLSearchParams(window.location.search);
const lessonId = params.get("id");

/* =========================
DOM
========================= */

const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const lessonContent = document.getElementById("lessonContent");

const lessonImage = document.getElementById("lessonImage");
const lessonVideo = document.getElementById("lessonVideo");
const lessonAudio = document.getElementById("lessonAudio");

const startQuizBtn = document.getElementById("startQuizBtn");
const completeBtn = document.getElementById("completeLessonBtn");

let currentUser = null;

/* =========================
NEXT LESSON FUNCTION
========================= */

async function createNextLessonButton(lessonId, lessonData){

  const nextBtn = document.createElement("button");

  nextBtn.className = "next-lesson-btn";
  nextBtn.innerHTML = `
    <span>Next Lesson</span>
    <span class="arrow">→</span>
  `;

  nextBtn.onclick = async () => {

    /* SAME CATEGORY */
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

    const index = lessons.findIndex(l=>l.id === lessonId);

    if(index >= 0 && index < lessons.length - 1){
      window.location.href = `lesson.html?id=${lessons[index+1].id}`;
      return;
    }

    /* NEXT CATEGORY */
    const CATEGORY_ORDER = ["Beginner","Intermediate","Advanced"];
    const currentIndex = CATEGORY_ORDER.indexOf(lessonData.category);

    if(currentIndex < CATEGORY_ORDER.length - 1){

      const nextCategory = CATEGORY_ORDER[currentIndex + 1];

      const nextSnap = await getDocs(
        query(
          collection(db,"lessons"),
          where("language","==",lessonData.language),
          where("category","==",nextCategory),
          orderBy("order")
        )
      );

      if(!nextSnap.empty){
        window.location.href = `lesson.html?id=${nextSnap.docs[0].id}`;
        return;
      }
    }

    /* FALLBACK */
    window.location.href = "all_lessons.html";
  };

  return nextBtn;
}

/* =========================
AUTH
========================= */

onAuthStateChanged(auth, async user => {

if(!user){
window.location.href="login.html";
return;
}

if(!lessonId){
lessonTitle.textContent = "Invalid Lesson";
return;
}

currentUser = user;

/* RESET UI */

lessonImage.style.display="none";
lessonVideo.innerHTML="";
lessonAudio.style.display="none";

startQuizBtn.style.display="block";
completeBtn.style.display="block";

/* LOAD LESSON */

const lessonSnap = await getDoc(doc(db,"lessons",lessonId));

if(!lessonSnap.exists()){
lessonTitle.textContent="Lesson not found";
return;
}

const lesson = lessonSnap.data();

/* TEXT */

lessonTitle.textContent = lesson.title || "";
lessonDescription.textContent = lesson.description || "";
lessonContent.textContent = lesson.content || "";

/* IMAGE */

if(lesson.imageUrl){
lessonImage.src = lesson.imageUrl;
lessonImage.style.display="block";
}

/* VIDEO */

if(lesson.videoUrl){

if(isYouTube(lesson.videoUrl)){

lessonVideo.innerHTML = `
<iframe
width="100%"
height="315"
src="https://www.youtube.com/embed/${getYouTubeId(lesson.videoUrl)}"
frameborder="0"
allowfullscreen
style="border-radius:12px">
</iframe>
`;

}else{

lessonVideo.innerHTML = `
<video controls style="width:100%;border-radius:12px">
<source src="${lesson.videoUrl}">
</video>
`;

}

}

/* AUDIO */

if(lesson.audioUrl){
lessonAudio.src = lesson.audioUrl;
lessonAudio.style.display="block";
}

/* CHECK PROGRESS */

const progressSnap = await getDoc(
doc(db,"progress",user.uid,"lessons",lessonId)
);

if(progressSnap.exists()){

completeBtn.disabled=true;
completeBtn.textContent="✅ Completed";
startQuizBtn.style.display="none";

/* ADD NEXT BUTTON */
const nextBtn = await createNextLessonButton(lessonId, lesson);
completeBtn.parentElement.appendChild(nextBtn);

return;
}

/* CHECK QUIZ */

const quizSnap = await getDoc(doc(db,"quizzes",lessonId));

if(quizSnap.exists()){

completeBtn.style.display="none";

startQuizBtn.onclick = ()=>{
window.location.href=`quiz.html?lessonId=${lessonId}`;
};

}else{

startQuizBtn.style.display="none";

completeBtn.onclick = async ()=>{

await setDoc(
doc(db,"progress",user.uid,"lessons",lessonId),
{
completed:true,
completedAt:serverTimestamp()
}
);

completeBtn.textContent="✅ Completed";
completeBtn.disabled=true;

/* ADD NEXT BUTTON */
const nextBtn = await createNextLessonButton(lessonId, lesson);
completeBtn.parentElement.appendChild(nextBtn);

};

}

});

/* =========================
HELPERS
========================= */

function isYouTube(url){
return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url){
const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
return match ? match[1] : "";
}