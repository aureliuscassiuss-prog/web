import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyC0DxeyEvvifCHdUI58Z3t4rSGwkZrWkIM",
    authDomain: "extrovertsite-77ef0.firebaseapp.com",
    projectId: "extrovertsite-77ef0",
    storageBucket: "extrovertsite-77ef0.firebasestorage.app",
    messagingSenderId: "93667213336",
    appId: "1:93667213336:web:024c3b48138d593819c36d",
    measurementId: "G-V3SX0GNJ38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics;

// Analytics is optional and may fail in some environments (like server-side rendering or non-browser)
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Firebase Analytics failed to initialize", e);
    }
}

export { app, auth, db, analytics };
