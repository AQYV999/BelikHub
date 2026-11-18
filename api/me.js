// api/me.js
// GET /api/me - Profil user saat ini (wajib login)

import { getAdminDb as defaultGetAdminDb, getAdminAuth as defaultGetAdminAuth } from '../lib/firebase-admin.js';
import { requireAuth, extractRoles, json } from '../lib/auth.js';
import { setCors } from '../lib/v1/http.js';

/**
 * Factory for GET /api/me handler supporting dependency injection for testing
 * @param {object} [deps={}]
 * @returns {Function}
 */
export function createMeHandler(deps = {}) {
  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const getAdminAuth = deps.getAdminAuth || defaultGetAdminAuth;

  return async function handler(request, response) {
    setCors(response, 'GET, OPTIONS');

    if (request.method === 'OPTIONS') {
      return response.status(200).end();
    }

    if (request.method !== 'GET') {
      return json(response, 405, { error: 'Method not allowed' });
    }

    try {
      const authResult = await requireAuth(request, response, deps);
      if (!authResult.success) {
        return json(response, authResult.status, { error: authResult.error });
      }

      const auth = getAdminAuth();
      const userRecord = await auth.getUser(authResult.user.uid);

      const db = getAdminDb();
      const userDoc = await db.collection('users').doc(authResult.user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const points = Number(userData.points) || 0;
      const profileName = typeof userData.name === 'string' ? userData.name : null;
      const roles = extractRoles(authResult.user);
      const isAdmin = Boolean(authResult.user.admin || roles.includes('admin'));

      return json(response, 200, {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || profileName || userRecord.email?.split('@')[0],
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata?.creationTime || null,
        lastLoginAt: userRecord.metadata?.lastSignInTime || null,
        role: isAdmin ? 'admin' : 'user',
        points,
        roles,
        managedSpringIds: Array.isArray(userData.managedSpringIds) ? userData.managedSpringIds : [],
        springId: typeof userData.springId === 'string' ? userData.springId : null,
        residentId: typeof userData.residentId === 'string' ? userData.residentId : null,
        residentLinkStatus: typeof userData.residentLinkStatus === 'string' ? userData.residentLinkStatus : null,
        donorType: typeof userData.donorType === 'string' ? userData.donorType : null,
        phone: typeof userData.phone === 'string' ? userData.phone : userRecord.phoneNumber || null,
        organizationName: typeof userData.organizationName === 'string' ? userData.organizationName : null
      });
    } catch (error) {
      console.error('GET /api/me error:', error);
      return json(response, 500, { error: 'Failed to fetch user profile' });
    }
  };
}

const defaultHandler = createMeHandler();
export default defaultHandler;
