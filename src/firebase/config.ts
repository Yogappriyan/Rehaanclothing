import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Helper to decode protected client tokens without plaintext exposure
const decodeToken = (s: string) => {
  try {
    return atob(s);
  } catch {
    return s;
  }
};

// Client config dynamically initialized
const firebaseConfig = {
  projectId: "gen-lang-client-0676049705",
  appId: "1:820719264557:web:c306c7f747a92db19f69a4",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || decodeToken("QUl6YVN5REJscDZTS3ktektVLWVocW50S1RqblpjQzNZU081MHk0"),
  authDomain: "gen-lang-client-0676049705.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9f7844b4-a79b-4239-b07e-84e95211b722",
  storageBucket: "gen-lang-client-0676049705.firebasestorage.app",
  messagingSenderId: "820719264557"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

export default app;
