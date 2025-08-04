// assets/js/firebase-config.js
// IMPORTANT: Replace these placeholder values with your actual Firebase project configuration.
// You can find this in your Firebase project settings -> "Your apps" -> "Web app"
// For OJT demonstration purposes, security is relaxed in Firestore rules.
// In a production environment, these should be securely managed (e.g., environment variables)
// and Firebase Security Rules MUST be much stricter.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCX3kBHEjObjXqRg_JxHqhXEYa5SchfQO4",
  authDomain: "lifewood-website-ea508.firebaseapp.com",
  projectId: "lifewood-website-ea508",
  storageBucket: "lifewood-website-ea508.firebasestorage.app",
  messagingSenderId: "571237626141",
  appId: "1:571237626141:web:b1946fc28b4ab13f1331f4",
  measurementId: "G-W3NBM4Z49E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); // 'app' is defined here
const auth = getAuth(app);
const db = getFirestore(app);

// Export 'app' along with other Firebase modules
export { app, auth, db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, firebaseConfig };