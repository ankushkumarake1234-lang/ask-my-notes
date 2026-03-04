import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBZaPA_6dBik6o5l5uTVuhxs7_LqyLkHWc",
  authDomain: "ask-my-notes-7d62d.firebaseapp.com",
  projectId: "ask-my-notes-7d62d",
  storageBucket: "ask-my-notes-7d62d.firebasestorage.app",
  messagingSenderId: "963978334979",
  appId: "1:963978334979:web:4468bd36370a9491724f36",
  measurementId: "G-1XML86L4Z3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
