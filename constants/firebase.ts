// constants/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC_UjxuUBRjuDuafUuqLIFjjMsdCWlRkiw",
  authDomain: "payrollapp-164aa.firebaseapp.com",
  projectId: "payrollapp-164aa",
  storageBucket: "payrollapp-164aa.appspot.com", // fixed typo in your `firebasestorage.app`
  messagingSenderId: "511463129327",
  appId: "1:511463129327:web:81d0d9364ad04fba3f5b1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore
export const db = getFirestore(app);
