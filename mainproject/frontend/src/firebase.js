import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyD9jRcA-TF7AZWCOHHB_CQVMSoyeqJhN8E",
  authDomain: "business-employee-agent.firebaseapp.com",
  projectId: "business-employee-agent",
  storageBucket: "business-employee-agent.firebasestorage.app",
  messagingSenderId: "614702666945",
  appId: "1:614702666945:web:c7a1da95cee98a52e83040",
  measurementId: "G-M1EZBMTDG8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };