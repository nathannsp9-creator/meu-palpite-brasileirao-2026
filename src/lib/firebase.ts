
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🚨 CONFIGURAÇÃO "FORÇA BRUTA" - TESTE 🚨
// Estamos ignorando o .env e escrevendo direto para garantir que conecte no teste.
const firebaseConfig = {
  apiKey: "AIzaSyAi3jvaNlijsLbtL3lRu9BaO88FN6zInu4",
  authDomain: "meu-palpite-testes.firebaseapp.com",
  projectId: "meu-palpite-testes",
  storageBucket: "meu-palpite-testes.firebasestorage.app",
  messagingSenderId: "889026394469",
  appId: "1:889026394469:web:85d9f76cca42e6e424498c"
};

console.log("🔥 CONEXÃO FORÇADA: RODANDO NO TESTE (meu-palpite-testes) 🔥");

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


export const db = getFirestore(app);

export default app;
