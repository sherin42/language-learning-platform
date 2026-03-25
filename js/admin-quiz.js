import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   GET LESSON ID
========================= */
const params = new URLSearchParams(window.location.search);
const lessonId = params.get("lessonId");

if (!lessonId) {
  alert("Invalid lesson ID");
  throw new Error("Lesson ID missing");
}

/* =========================
   DOM
========================= */
const backToLessonsBtn = document.getElementById("backToLessonsBtn");

const lessonTitleEl = document.getElementById("lessonTitle");
const quizList = document.getElementById("quizList");
const addQuizBtn = document.getElementById("addQuizBtn");

const quizModal = document.getElementById("quizModal");
const closeModal = document.getElementById("closeModal");
const saveQuestionBtn = document.getElementById("saveQuestionBtn");

const questionInput = document.getElementById("questionInput");
const optionsContainer = document.getElementById("optionsContainer");
const correctSelect = document.getElementById("correctSelect");

let questions = [];
let editIndex = null;

/* =========================
   LOAD LESSON TITLE
========================= */
async function loadLessonTitle() {
  const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
  if (lessonSnap.exists()) {
    lessonTitleEl.textContent =
      "Quizzes for: " + lessonSnap.data().title;
  }
}

/* =========================
   LOAD QUIZ
========================= */
async function loadQuiz() {
  const snap = await getDoc(doc(db, "quizzes", lessonId));
  questions = snap.exists() ? snap.data().questions || [] : [];
  renderList();
}

/* =========================
   RENDER LIST
========================= */
function renderList() {

  quizList.innerHTML = "";

  if (questions.length === 0) {
    quizList.innerHTML =
      "<p>No questions added yet.</p>";
    return;
  }

  questions.forEach((q, index) => {

    const div = document.createElement("div");
    div.className = "quiz-card";

    div.innerHTML = `
      <strong>${index + 1}. ${q.question}</strong>
      <ul>
        ${q.options.map((opt,i)=>`
          <li ${q.correctIndex===i ? 'style="color:green;font-weight:bold;"':''}>
            ${opt}
          </li>
        `).join("")}
      </ul>

      <button class="btn btn-sm btn-warning me-2"
        onclick="window.editQuestion(${index})">
        Edit
      </button>

      <button class="btn btn-sm btn-danger"
        onclick="window.deleteQuestion(${index})">
        Delete
      </button>
    `;

    quizList.appendChild(div);
  });
}

/* =========================
   OPEN MODAL
========================= */
function openModal(isEdit=false){

  quizModal.style.display = "flex";

  if(!isEdit){
    questionInput.value="";
    correctSelect.value="";
    optionsContainer.innerHTML="";
    editIndex=null;
  }

  renderOptionInputs();
}

/* =========================
   CLOSE MODAL
========================= */
function closeQuizModal(){
  quizModal.style.display="none";
}

closeModal.onclick = closeQuizModal;
quizModal.onclick = (e)=>{
  if(e.target===quizModal) closeQuizModal();
};

/* =========================
   ADD BUTTON
========================= */
addQuizBtn.onclick = ()=> openModal();

/* =========================
   OPTION INPUTS
========================= */
function renderOptionInputs(options=["","","",""]){

  optionsContainer.innerHTML="";

  for(let i=0;i<4;i++){
    optionsContainer.innerHTML+=`
      <div class="mb-2">
        <label>Option ${i+1}</label>
        <input class="form-control option-input"
          data-index="${i}"
          value="${options[i] || ""}">
      </div>
    `;
  }
}

/* =========================
   SAVE QUESTION
========================= */
saveQuestionBtn.onclick = async ()=>{

  const question = questionInput.value.trim();
  const optionInputs =
    document.querySelectorAll(".option-input");

  const options = [];
  optionInputs.forEach(inp=>{
    options.push(inp.value.trim());
  });

  const correctIndex =
    parseInt(correctSelect.value);

  if(!question || options.some(o=>!o) || isNaN(correctIndex)){
    alert("Fill all fields properly");
    return;
  }

  const newQuestion = {
    question,
    options,
    correctIndex
  };

  if(editIndex!==null){
    questions[editIndex]=newQuestion;
  }else{
    questions.push(newQuestion);
  }

  await setDoc(doc(db,"quizzes",lessonId),{
    lessonId,
    questions,
    updatedAt: serverTimestamp()
  });

  closeQuizModal();
  renderList();
};

/* =========================
   EDIT
========================= */
window.editQuestion = (index) => {

  const q = questions[index];

  editIndex = index;

  // Open modal FIRST
  quizModal.style.display = "flex";

  // Set question
  questionInput.value = q.question;

  // Render options with existing values
  renderOptionInputs(q.options);

  // Set correct answer AFTER rendering options
  correctSelect.value = q.correctIndex;
};

/* =========================
   DELETE
========================= */
window.deleteQuestion = async (index)=>{

  if(!confirm("Delete this question?")) return;

  questions.splice(index,1);

  await setDoc(doc(db,"quizzes",lessonId),{
    lessonId,
    questions,
    updatedAt: serverTimestamp()
  });

  renderList();
};

/* =========================
   INIT
========================= */
loadLessonTitle();
loadQuiz();

if (backToLessonsBtn) {
  backToLessonsBtn.onclick = () => {
    window.location.href = "admin-lessons.html";
  };
}