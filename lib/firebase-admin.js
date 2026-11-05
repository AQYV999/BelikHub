// lib/firebase-admin.js
// Firebase Admin SDK initialization for server-side (Vercel serverless functions)
// JANGAN commit file service-account.json. Gunakan environment variables di Vercel.

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp;
let adminAuth;
let adminDb;
let adminStorage;

export function getAdminApp() {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in environment.'
    );
  }

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

  return adminApp;
}

export function getAdminAuth() {
  getAdminApp();
  return adminAuth;
}

export function getAdminDb() {
  getAdminApp();
  return adminDb;
}

export function getAdminStorage() {
  getAdminApp();
  return adminStorage;
}

// Helper: verify ID token from Firebase Auth (client)
export async function verifyIdToken(idToken) {
  const auth = getAdminAuth();
  try {
    const decoded = await auth.verifyIdToken(idToken);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper: get user by UID
export async function getUserByUid(uid) {
  const auth = getAdminAuth();
  try {
    const userRecord = await auth.getUser(uid);
    return { success: true, user: userRecord };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper: set custom claims (e.g., admin role)
export async function setAdminClaim(uid, isAdmin = true) {
  const auth = getAdminAuth();
  try {
    await auth.setCustomUserClaims(uid, { admin: isAdmin });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper: create custom token (for server-side session creation if needed)
export async function createCustomToken(uid, claims = {}) {
  const auth = getAdminAuth();
  try {
    const token = await auth.createCustomToken(uid, claims);
    return { success: true, token };
  } catch (error) {
    return { success: false, error: error.message };
  }
}