// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnoj4xJhzP8PoZqbv1SNH2xyS_pQtZ7vw",
  authDomain: "project-c-2d1fb.firebaseapp.com",
  projectId: "project-c-2d1fb",
  storageBucket: "project-c-2d1fb.firebasestorage.app",
  messagingSenderId: "399580064120",
  appId: "1:399580064120:web:7f44568c9929f3bdea408d",
  measurementId: "G-DH3N9CB5PE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
