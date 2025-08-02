// firebase/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_UjxuUBRjuDuafUuqLIFjjMsdCWlRkiw",
  authDomain: "payrollapp-164aa.firebaseapp.com",
  databaseURL: "https://payrollapp-164aa-default-rtdb.firebaseio.com",
  projectId: "payrollapp-164aa",
  storageBucket: "payrollapp-164aa.appspot.com", // fixed typo here
  messagingSenderId: "511463129327",
  appId: "1:511463129327:web:81d0d9364ad04fba3f5b1a"
};

// Prevent re-initializing during hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
