// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDWb8a_dW3dUiOeUbpAOJr8CCIYpMlZQ9s",
  authDomain: "system-analysis-edd26.firebaseapp.com",
  projectId: "system-analysis-edd26",
  storageBucket: "system-analysis-edd26.firebasestorage.app",
  messagingSenderId: "543923408578",
  appId: "1:543923408578:web:05724112ab527f4c3ef55b",
  measurementId: "G-SX4LGTT0WR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
