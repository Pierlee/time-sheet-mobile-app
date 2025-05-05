// constants/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC_UjxuUBRjuDuafUuqLIFjjMsdCWlRkiw",
  authDomain: "payrollapp-164aa.firebaseapp.com",
  databaseURL: "https://payrollapp-164aa-default-rtdb.firebaseio.com", // ✅ IMPORTANT for Realtime DB
  projectId: "payrollapp-164aa",
  storageBucket: "payrollapp-164aa.appspot.com",
  messagingSenderId: "511463129327",
  appId: "1:511463129327:web:81d0d9364ad04fba3f5b1a"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); // ✅ Realtime DB
