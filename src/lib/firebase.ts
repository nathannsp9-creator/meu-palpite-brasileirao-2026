// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAi3jvaNlijsLbtL3lRu9BaO88FN6zInu4",
  authDomain: "meu-palpite-testes.firebaseapp.com",
  projectId: "meu-palpite-testes",
  storageBucket: "meu-palpite-testes.firebasestorage.app",
  messagingSenderId: "889026394469",
  appId: "1:889026394469:web:85d9f76cca42e6e424498c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
