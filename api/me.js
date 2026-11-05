// api/me.js
// Get current user profile
// GET /api/me - Requires authentication

import { getAdminDb, getAdminAuth } from '../lib/firebase-admin.js';
import { requireAuth, json } from '../lib/auth.js';

export default async function handler(request, response) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAuth(request, response);
    if (!authResult.success) {
      return json(response, authResult.status, { error: authResult.error });
    }

    const auth = getAdminAuth();
    const userRecord = await auth.getUser(authResult.user.uid);
    
    // Optionally fetch additional user data from Firestore
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(authResult.user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    return json(response, 200, {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userData.name || userRecord.email?.split('@')[0],
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
      lastLoginAt: userRecord.metadata.lastSignInTime,
      role: authResult.user.admin ? 'admin' : 'user',
      ...userData
    });
  } catch (error) {
    console.error('GET /api/me error:', error);
    return json(response, 500, { error: 'Failed to fetch user profile' });
  }
}