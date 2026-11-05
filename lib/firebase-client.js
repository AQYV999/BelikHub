// lib/firebase-client.js
// Firebase Client SDK initialization for browser (index.html)
// Environment variables are injected at build time or via Vercel Environment Variables

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as getFirebaseStorage, connectStorageEmulator } from 'firebase/storage';

let firebaseApp;
let firebaseAuth;
let firebaseDb;
let firebaseStorage;

export function getFirebaseConfig() {
  return {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
  };
}

export function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  const config = getFirebaseConfig();

  // Validate required config
  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Firebase config missing: ${missing.join(', ')}. Set VITE_FIREBASE_* environment variables.`);
  }

  firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
  firebaseAuth = getFirebaseAuth(firebaseApp);
  firebaseDb = getFirebaseFirestore(firebaseApp);
  firebaseStorage = getFirebaseStorage(firebaseApp);

  // Optional: connect to emulators in development
  if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
    const authEmulator = import.meta.env?.VITE_FIREBASE_AUTH_EMULATOR || process.env.VITE_FIREBASE_AUTH_EMULATOR;
    const firestoreEmulator = import.meta.env?.VITE_FIREBASE_FIRESTORE_EMULATOR || process.env.VITE_FIREBASE_FIRESTORE_EMULATOR;
    const storageEmulator = import.meta.env?.VITE_FIREBASE_STORAGE_EMULATOR || process.env.VITE_FIREBASE_STORAGE_EMULATOR;

    if (authEmulator) connectAuthEmulator(firebaseAuth, authEmulator, { disableWarnings: true });
    if (firestoreEmulator) connectFirestoreEmulator(firebaseDb, 'localhost', parseInt(firestoreEmulator, 10));
    if (storageEmulator) connectStorageEmulator(firebaseStorage, 'localhost', parseInt(storageEmulator, 10));
  }

  return firebaseApp;
}

export function getClientAuth() {
  if (!firebaseAuth) initializeFirebase();
  return firebaseAuth;
}

export function getClientFirestore() {
  if (!firebaseDb) initializeFirebase();
  return firebaseDb;
}

export function getClientStorage() {
  if (!firebaseStorage) initializeFirebase();
  return firebaseStorage;
}

// Auth helpers
export async function signUpWithEmail(email, password, displayName) {
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const auth = getClientAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  return result.user;
}

export async function signInWithEmail(email, password) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const auth = getClientAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutUser() {
  const { signOut } = await import('firebase/auth');
  await signOut(getClientAuth());
}

export function onAuthStateChanged(callback) {
  const { onAuthStateChanged: firebaseOnAuthStateChanged } = require('firebase/auth');
  return firebaseOnAuthStateChanged(getClientAuth(), callback);
}

export async function getIdToken(forceRefresh = false) {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

// Firestore helpers
export async function addReport(data) {
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
  const db = getClientFirestore();
  const ref = await addDoc(collection(db, 'reports'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'pending',
    points: calculatePoints(data.reportType)
  });
  return { id: ref.id, ...data, createdAt: new Date().toISOString() };
}

export async function getReports(limitCount = 100) {
  const { query, collection, orderBy, limit, getDocs } = await import('firebase/firestore');
  const db = getClientFirestore();
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addPartnership(data) {
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
  const db = getClientFirestore();
  const ref = await addDoc(collection(db, 'partnerships'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'new'
  });
  return { id: ref.id, ...data, createdAt: new Date().toISOString() };
}

export async function getPartnerships(limitCount = 100) {
  const { query, collection, orderBy, limit, getDocs } = await import('firebase/firestore');
  const db = getClientFirestore();
  const q = query(collection(db, 'partnerships'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateReportStatus(reportId, status) {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const db = getClientFirestore();
  await updateDoc(doc(db, 'reports', reportId), { status, updatedAt: serverTimestamp() });
  return { success: true };
}

export async function updatePartnershipStatus(partnershipId, status) {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const db = getClientFirestore();
  await updateDoc(doc(db, 'partnerships', partnershipId), { status, updatedAt: serverTimestamp() });
  return { success: true };
}

function calculatePoints(reportType) {
  const type = (reportType || '').toLowerCase();
  if (type.includes('restor')) return 1000;
  if (type.includes('rorak')) return 500;
  return 100;
}