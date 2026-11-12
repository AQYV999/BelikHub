// lib/firebase-admin.js
// Firebase Admin SDK initialization for server-side (Vercel serverless functions)
// JANGAN commit file service-account.json. Gunakan environment variables di Vercel.

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function normalizePrivateKey(raw) {
  if (!raw) return raw;
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n');
  const match = /^-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----$/.exec(key.trim());
  if (match) {
    const body = match[1].replace(/\s+/g, '');
    key = `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`;
  }
  return key;
}

let adminApp;
let adminAuth;
let adminDb;
let adminStorage;

export function getAdminApp() {
  if (adminApp) return adminApp;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

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
  } catch (error) {
    console.error('Firebase Admin init error:', error);
    throw error;
  }
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
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Invalid or expired authentication token', code: error?.code || 'auth/error' };
  }
}

// Helper: get user by UID
export async function getUserByUid(uid) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(uid);
    return { success: true, user: userRecord };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper: set custom claims (e.g., admin role)
export async function setAdminClaim(uid, isAdmin = true) {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, { admin: isAdmin });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper: create custom token (for server-side session creation if needed)
export async function createCustomToken(uid, claims = {}) {
  try {
    const auth = getAdminAuth();
    const token = await auth.createCustomToken(uid, claims);
    return { success: true, token };
  } catch (error) {
    return { success: false, error: error.message };
  }
}