// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBiqlTDnopMTid1maVNYD5qWP9PjvmPZfU",
  authDomain: "twiller-251e8.firebaseapp.com",
  projectId: "twiller-251e8",
  storageBucket: "twiller-251e8.firebasestorage.app",
  messagingSenderId: "253760766033",
  appId: "1:253760766033:web:2b06031f6958577a9a3870"
};

// Initialize Firebase 
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
