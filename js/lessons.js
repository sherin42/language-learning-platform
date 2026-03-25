// lessons.js (ADMIN SIDE)

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */
const lessonForm = document.getElementById("lessonForm");
const lessonMsg = document.getElementById("lessonMsg");

/* =========================
   SUBMIT LESSON
========================= */
if (lessonForm) {
  lessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // BASIC FIELDS
    const language = document.getElementById("lessonLanguage").value;
    const title = document.getElementById("lessonTitle").value.trim();
    const description = document.getElementById("lessonDescription").value.trim();
    const content = document.getElementById("lessonContent").value.trim();
    const category = document.getElementById("lessonCategory").value;
    const order = Number(document.getElementById("lessonOrder").value);

    // MEDIA FIELDS
    const imageUrl = document.getElementById("lessonImageUrl").value.trim();
    const videoType = document.getElementById("videoType").value;
    const videoUrl = document.getElementById("videoUrl").value.trim();
    const audioUrl = document.getElementById("lessonAudioUrl").value.trim();

    /* =========================
       VALIDATION
    ========================= */
    if (!title || !description || !content || !category || !order) {
      alert("Please fill all required fields including lesson order");
      return;
    }

    if (order <= 0) {
      alert("Lesson order must be greater than 0");
      return;
    }

    /* =========================
       VIDEO LOGIC
    ========================= */
    let finalVideoUrl = "";
    let finalVideoType = "";

    if (videoType && videoUrl) {
      finalVideoType = videoType;
      finalVideoUrl = videoUrl;
    }

    /* =========================
       SAVE TO FIRESTORE
    ========================= */
    try {
      await addDoc(collection(db, "lessons"), {
        language,
        title,
        description,
        content,
        category,
        order, // ✅ IMPORTANT FOR SEQUENCE

        imageUrl: imageUrl || "",
        videoType: finalVideoType || "",
        videoUrl: finalVideoUrl || "",
        audioUrl: audioUrl || "",

        createdAt: serverTimestamp()
      });

      lessonMsg.textContent = "✅ Lesson added successfully!";
      lessonMsg.classList.add("show");

      lessonForm.reset();

    } catch (error) {
      console.error(error);
      alert("❌ Failed to add lesson");
    }
  });
}
