// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXOHdsOt8QZ2qKJp4FZy8_7PGQ_Y_4fUM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "finder-webapp.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://finder-webapp-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "finder-webapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "finder-webapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "794334030709",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:794334030709:web:d6b69e69feab8beabce094"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
