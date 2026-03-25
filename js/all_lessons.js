import { auth } from "./firebase.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
getFirestore,
collection,
getDocs,
doc,
getDoc,
query,
orderBy,
where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const db = getFirestore();

const container = document.getElementById("lessonsContainer");
const filterBtns = document.querySelectorAll("[data-cat]");

let currentUser = null;
let selectedLanguage = null;
let selectedCategory = "All";

const CATEGORY_ORDER = ["Beginner","Intermediate","Advanced"];
const PREVIEW_COUNT = 5; // 🔥 LIMIT


/* ======================
AUTH
====================== */

onAuthStateChanged(auth, async user=>{

if(!user){
window.location.href="login.html";
return;
}

currentUser=user;

const userSnap = await getDoc(doc(db,"users",user.uid));
selectedLanguage = userSnap.data().selectedLanguage;

loadLessons();

});


/* ======================
FILTER BUTTONS
====================== */

filterBtns.forEach(btn=>{

btn.onclick=()=>{

filterBtns.forEach(b=>b.classList.remove("active"));
btn.classList.add("active");

selectedCategory = btn.dataset.cat;

loadLessons();

};

});


/* ======================
CHECK CATEGORY COMPLETION
====================== */

async function isCategoryCompleted(lessons, progressMap){

if(!lessons.length) return false;

for(const lesson of lessons){
if(!progressMap[lesson.id]){
return false;
}
}

return true;

}


/* ======================
LOAD LESSONS
====================== */

async function loadLessons(){

container.innerHTML="";

/* GET LESSONS */

const lessonsSnap = await getDocs(
query(
collection(db,"lessons"),
where("language","==",selectedLanguage),
orderBy("order")
)
);

/* USER PROGRESS */

const progressSnap = await getDocs(
collection(db,"progress",currentUser.uid,"lessons")
);

const progressMap={};

progressSnap.forEach(doc=>{
progressMap[doc.id]=true;
});


/* GROUP LESSONS */

const grouped={
Beginner:[],
Intermediate:[],
Advanced:[]
};

lessonsSnap.forEach(docSnap=>{

const lesson={id:docSnap.id,...docSnap.data()};

if(grouped[lesson.category]){
grouped[lesson.category].push(lesson);
}

});


/* ======================
RENDER
====================== */

let previousCategoryCompleted = true;

for(const category of CATEGORY_ORDER){

if(selectedCategory !== "All" && selectedCategory !== category) continue;

const lessons = grouped[category];
if(!lessons.length) continue;

/* CATEGORY UNLOCK */

const categoryUnlocked = previousCategoryCompleted;

/* CATEGORY SECTION */

const section=document.createElement("div");
section.className="category-section";

/* TITLE */

const title=document.createElement("h3");
title.textContent=category;
title.style.color="white";
title.style.margin="20px 0";

section.appendChild(title);

/* LOCK MESSAGE */

if(!categoryUnlocked){

const lockMsg=document.createElement("p");
lockMsg.textContent="🔒 Complete previous category to unlock";
lockMsg.style.color="#ffb3b3";

section.appendChild(lockMsg);

section.style.opacity="0.6";

}

/* GRID */

const row=document.createElement("div");
row.className="lesson-grid";

section.appendChild(row);

/* 🔥 SHOW MORE STATE */

let expanded = false;

/* 🔥 RENDER FUNCTION */

function renderLessons(){

row.innerHTML="";

let previousCompleted = true;

const visibleLessons = expanded
? lessons
: lessons.slice(0, PREVIEW_COUNT);

for(const lesson of visibleLessons){

const lessonDone = progressMap[lesson.id];

const card=document.createElement("div");
card.className="lesson-card-small";

let status="🔒 Locked";
let clickable=false;

/* LOCK LOGIC */

if(categoryUnlocked && previousCompleted){

if(lessonDone){
status="✅ Completed";
clickable=true;
}else{
status="▶ Start Lesson";
clickable=true;
}

}

card.innerHTML=`
<h4>${lesson.title}</h4>
<p>${lesson.description || ""}</p>
<strong>${status}</strong>
`;

if(clickable){
card.onclick=()=>{
window.location.href=`lesson.html?id=${lesson.id}`;
};
}else{
card.style.opacity="0.5";
card.style.cursor="not-allowed";
}

row.appendChild(card);

previousCompleted = lessonDone;

}

/* 🔥 TOGGLE BUTTON */

if(lessons.length > PREVIEW_COUNT){

const toggleBtn = document.createElement("button");
toggleBtn.className = "show-more-btn";

toggleBtn.textContent = expanded
? "Show Less ▲"
: "Show More ▼";

toggleBtn.onclick = ()=>{
expanded = !expanded;
renderLessons();
};

row.appendChild(toggleBtn);

}

}

/* INITIAL RENDER */

renderLessons();

container.appendChild(section);

/* CATEGORY COMPLETE */

previousCategoryCompleted = await isCategoryCompleted(lessons, progressMap);

}

}