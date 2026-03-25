import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
getFirestore,
collection,
getDocs,
doc,
getDoc,
updateDoc,
query,
orderBy,
where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const db = getFirestore();

const lessonsContainer = document.getElementById("lessonsContainer");
const welcomeUser = document.getElementById("welcomeUser");
const logoutBtn = document.getElementById("logoutBtn");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const languageDropdown = document.getElementById("changeLanguage");

let currentUser = null;
let selectedLanguage = null;

const CATEGORY_ORDER = ["Beginner","Intermediate","Advanced"];
const PREVIEW_COUNT = 2;

/* ======================
   AUTH
====================== */

onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location.href="login.html";
return;
}

currentUser=user;

const userSnap = await getDoc(doc(db,"users",user.uid));
const userData = userSnap.data();

welcomeUser.textContent=`Welcome ${userData.name} 👋`;

selectedLanguage=userData.selectedLanguage;

/* 🔥 IMPORTANT: CHECK LANGUAGE */
if(!selectedLanguage){
window.location.href="select-language.html";
return;
}

await loadLanguages();
loadDashboard();

});

/* ======================
   LOAD LANGUAGES
====================== */

async function loadLanguages(){

languageDropdown.innerHTML="";

/* ONLY ACTIVE LANGUAGES */
const q = query(
collection(db,"languages"),
where("active","==",true)
);

const snap = await getDocs(q);

if(snap.empty){
languageDropdown.innerHTML = `<option>No languages available</option>`;
return;
}

let languageExists = false;

snap.forEach(docSnap=>{

const lang = docSnap.data().name;

/* Check if selected still valid */
if(lang === selectedLanguage){
languageExists = true;
}

const option=document.createElement("option");
option.value=lang;
option.textContent=lang;

if(lang===selectedLanguage){
option.selected=true;
}

languageDropdown.appendChild(option);

});

/* HANDLE deleted/inactive language */
if(!languageExists){

selectedLanguage = snap.docs[0].data().name;

await updateDoc(doc(db,"users",currentUser.uid),{
selectedLanguage:selectedLanguage
});

languageDropdown.value = selectedLanguage;

}

/* CHANGE LANGUAGE */
languageDropdown.onchange = async ()=>{

selectedLanguage = languageDropdown.value;

await updateDoc(doc(db,"users",currentUser.uid),{
selectedLanguage:selectedLanguage
});

loadDashboard();

};

}

/* ======================
   LOAD DASHBOARD
====================== */

async function loadDashboard(){

lessonsContainer.innerHTML="";

if(!selectedLanguage) return;

/* FETCH LESSONS */
const lessonsSnap = await getDocs(
query(
collection(db,"lessons"),
where("language","==",selectedLanguage),
orderBy("order")
)
);

const lessons=[];

lessonsSnap.forEach(docSnap=>{
lessons.push({
id:docSnap.id,
...docSnap.data()
});
});

/* USER PROGRESS */
const progressSnap = await getDocs(
collection(db,"progress",currentUser.uid,"lessons")
);

const progressMap={};

progressSnap.forEach(doc=>{
progressMap[doc.id]=true;
});

/* PROGRESS COUNT */
let completedLessons=0;

lessons.forEach(l=>{
if(progressMap[l.id]) completedLessons++;
});

/* GROUP LESSONS */
const grouped={
Beginner:[],
Intermediate:[],
Advanced:[]
};

lessons.forEach(l=>{
if(grouped[l.category]) grouped[l.category].push(l);
});

let unlocked=true;

/* CATEGORY LOOP */

for(const category of CATEGORY_ORDER){

const list=grouped[category];
if(!list.length) continue;

const column=document.createElement("div");
column.className="category-column";

const title=document.createElement("h4");
title.className="category-title";
title.textContent=`${category} (${selectedLanguage})`;

column.appendChild(title);

let previousCompleted=true;

/* LIMIT TO 2 LESSONS */

for(let i=0;i<Math.min(PREVIEW_COUNT,list.length);i++){

const lesson=list[i];
const lessonDone=progressMap[lesson.id];

const card=document.createElement("div");
card.className="lesson-card";

let status="🔒 Locked";

if(unlocked && previousCompleted){

if(lessonDone){
status="✅ Completed";
}else{
status="▶ Start Lesson";
}

card.onclick=()=>{
window.location.href=`lesson.html?id=${lesson.id}`;
};

}else{

card.style.opacity="0.5";
card.style.cursor="not-allowed";

}

card.innerHTML=`
<h4>${lesson.title}</h4>
<p>${lesson.description || ""}</p>
<p><strong>${status}</strong></p>
`;

column.appendChild(card);

previousCompleted=lessonDone;

}

lessonsContainer.appendChild(column);

/* CATEGORY UNLOCK */
if(!list.every(l=>progressMap[l.id])) unlocked=false;

}

/* PROGRESS BAR */
const percent = lessons.length
? Math.round((completedLessons/lessons.length)*100)
: 0;

progressText.textContent=
`${completedLessons} / ${lessons.length} lessons completed (${percent}%)`;

progressFill.style.width=percent+"%";

}

/* ======================
   LOGOUT
====================== */

logoutBtn.onclick=async ()=>{
await signOut(auth);
window.location.href="login.html";
};