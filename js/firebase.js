import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDE7-VLK2jf_TngFAUoVZCBfws3M5VXLZM",
  authDomain: "language-learning-platfo-fa50f.firebaseapp.com",
  projectId: "language-learning-platfo-fa50f",
  storageBucket: "language-learning-platfo-fa50f.firebasestorage.app",
  messagingSenderId: "440392156554",
  appId: "1:440392156554:web:2fb0507db69de6c721f473"
};

/* ✅ IMPORTANT: EXPORT app */
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);