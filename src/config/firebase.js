// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWb8a_dW3dUiOeUbpAOJr8CCIYpMlZQ9s",
  authDomain: "system-analysis-edd26.firebaseapp.com",
  projectId: "system-analysis-edd26",
  storageBucket: "system-analysis-edd26.app",
  messagingSenderId: "543923408578",
  appId: "1:543923408578:web:05724112ab527f4c3ef55b",
  measurementId: "G-SX4LGTT0WR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app); // Firestore database
export const auth = getAuth(app); // Firebase Authentication
export const storage = getStorage(app); // Firebase Storage

export default app;
