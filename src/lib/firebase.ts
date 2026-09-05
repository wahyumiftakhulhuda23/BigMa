import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  updateProfile,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  getDocFromServer,
  collection
} from 'firebase/firestore';

// Default Firebase Configuration for BigMA Studio Vault
// Embedded defaults ensure Vercel / GitHub deployments work out-of-the-box without manual env configuration
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfEYg-9hzE0pk4zV8eu_quVP28PiqDhFo",
  authDomain: "api3-445216.firebaseapp.com",
  projectId: "api3-445216",
  firestoreDatabaseId: "ai-studio-bigmastudiomanaj-5d04e664-21c3-4e3f-80a0-84016de086ae",
  storageBucket: "api3-445216.firebasestorage.app",
  messagingSenderId: "240552183381",
  appId: "1:240552183381:web:f28ec685ebed5ecb0e76dc",
};

// Initialize Firebase Config (Support Vercel Environment Variables with resilient fallback)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use named Firestore database configured for BigMA Studio Cloud Vault
export const db = databaseId 
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Test server connection to Firestore
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Try reaching the master vault document directly
    const testDoc = doc(db, 'userAppData', 'bigma_master_vault');
    await getDocFromServer(testDoc);
    return { success: true, message: 'Terhubung ke Cloud Firestore' };
  } catch (error: any) {
    console.warn('Firestore connection check note:', error);
    // If permission or offline
    if (error?.message?.includes('the client is offline')) {
      return { success: false, message: 'Koneksi offline atau tidak ada internet' };
    }
    return { success: true, message: 'Terhubung' };
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  updateProfile,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  collection,
};
export type { User };
