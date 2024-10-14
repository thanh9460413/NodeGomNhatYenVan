import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDXXOikQd3P1qxodkApktjN-GznKHxMqbs",
  authDomain: "gomsuyenvan.firebaseapp.com",
  databaseURL: "https://gomsuyenvan-default-rtdb.firebaseio.com",
  projectId: "gomsuyenvan",
  storageBucket: "gomsuyenvan.appspot.com",
  messagingSenderId: "265332355511",
  appId: "1:265332355511:web:770a66afd2a81101afb832",
  measurementId: "G-6V4Y3X0WYT"
};
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);