// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBnmqWRY6lV54meFvO89QeXwtd28w81FcY",
  authDomain: "rtx3090-28439.firebaseapp.com",
  databaseURL: "https://rtx3090-28439-default-rtdb.firebaseio.com",
  projectId: "rtx3090-28439",
  storageBucket: "rtx3090-28439.firebasestorage.app",
  messagingSenderId: "178612030690",
  appId: "1:178612030690:web:883189ced2ed3a78e3e2bb",
  measurementId: "G-PTKK9Y8HK5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
