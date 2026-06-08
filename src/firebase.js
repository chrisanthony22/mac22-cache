// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Replace this object with the EXACT one from your Firebase Console!
const firebaseConfig = {
  apiKey: "AIzaSyDJVdGuIBRaFIcCLSvW1jySpHRYNt7wbNE",
  authDomain: "mac22-cache.firebaseapp.com",
  projectId: "mac22-cache",
  storageBucket: "mac22-cache.firebasestorage.app",
  messagingSenderId: "700376696789",
  appId: "1:700376696789:web:90d74ccfc3cdd7ed8edf5c",
  measurementId: "G-D8Q9QKH2V6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firestore Database
export const db = getFirestore(app);