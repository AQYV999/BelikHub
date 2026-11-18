// lib/v1/admin-users.js
// Admin-only user management: listing users and updating multirole claims + managedSpringIds

import { getAdminDb as defaultGetAdminDb, getAdminAuth as defaultGetAdminAuth } from '../firebase-admin.js';
import { requireRole as defaultRequireRole, VALID_ROLES, extractRoles, json } from '../auth.js';
import { setCors, parseJsonBody, formatIso } from './http.js';

/**
 * Admin-only GET /api/v1/admin/users
 * Lists platform users merging Firebase Auth records with Firestore user profile data.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleListUsers(request, response, deps = {}) {
  setCors(response, 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const getAdminAuth = deps.getAdminAuth || defaultGetAdminAuth;
    const db = getAdminDb();
    const adminAuth = getAdminAuth();

    // 1. Fetch Firebase Auth user records
    const authUsersMap = new Map();
    try {
      if (typeof adminAuth.listUsers === 'function') {
        const listResult = await adminAuth.listUsers(1000);
        for (const u of listResult.users || []) {
          authUsersMap.set(u.uid, u);
        }
      }
    } catch (e) {
      console.warn('Could not list auth users:', e);
    }

    // 2. Fetch Firestore users collection
    const usersSnap = await db.collection('users').get();
    const firestoreUsersMap = new Map();
    usersSnap.forEach((doc) => {
      firestoreUsersMap.set(doc.id, doc.data());
    });

    // 3. Merge by UID
    const allUids = new Set([...authUsersMap.keys(), ...firestoreUsersMap.keys()]);
    const users = [];

    for (const uid of allUids) {
      const authUser = authUsersMap.get(uid);
      const fsUser = firestoreUsersMap.get(uid) || {};

      const claimsRoles = authUser?.customClaims ? extractRoles(authUser.customClaims) : [];
      const roles = Array.isArray(fsUser.roles) && fsUser.roles.length > 0
        ? fsUser.roles
        : claimsRoles;

      users.push({
        uid,
        email: authUser?.email || fsUser.email || null,
        name: authUser?.displayName || fsUser.name || null,
        phone: authUser?.phoneNumber || fsUser.phone || null,
        roles: Array.isArray(roles) ? roles : [],
        managedSpringIds: Array.isArray(fsUser.managedSpringIds) ? fsUser.managedSpringIds : [],
        springId: fsUser.springId || null,
        residentId: fsUser.residentId || null,
        residentLinkStatus: fsUser.residentLinkStatus || null,
        donorType: fsUser.donorType || null,
        organizationName: fsUser.organizationName || null,
        points: Number(fsUser.points) || 0,
        createdAt: authUser?.metadata?.creationTime || fsUser.createdAt || null,
        updatedAt: formatIso(fsUser.updatedAt)
      });
    }

    return json(response, 200, {
      success: true,
      users
    });
  } catch (error) {
    console.error('handleListUsers error:', error);
    return json(response, 500, { error: 'Gagal mengambil daftar pengguna' });
  }
}

/**
 * Admin-only PATCH /api/v1/admin/users/:uid/roles
 * Updates custom claims (roles + admin boolean) in Firebase Auth and mirrors to Firestore users/{uid}.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [targetUidOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleSetUserRoles(request, response, targetUidOrDeps, maybeDeps = {}) {
  const targetUid = typeof targetUidOrDeps === 'string'
    ? targetUidOrDeps
    : (request.query?.uid || request.query?.id || null);
  const deps = typeof targetUidOrDeps === 'object' && targetUidOrDeps !== null ? targetUidOrDeps : maybeDeps;

  setCors(response, 'PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (!targetUid || typeof targetUid !== 'string' || !targetUid.trim()) {
    return json(response, 400, { error: 'UID pengguna target wajib disertakan' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { roles: rawRoles, managedSpringIds: rawManagedSpringIds } = body;

  if (!Array.isArray(rawRoles)) {
    return json(response, 400, { error: 'roles harus berupa array peran (roles)' });
  }

  // Validate all roles against VALID_ROLES
  for (const r of rawRoles) {
    if (typeof r !== 'string' || !VALID_ROLES.includes(r.trim())) {
      return json(response, 400, {
        error: `Peran '${r}' tidak valid: harus salah satu dari [${VALID_ROLES.join(', ')}]`
      });
    }
  }

  const cleanRoles = Array.from(new Set(rawRoles.map((r) => r.trim())));
  const isAdmin = cleanRoles.includes('admin');

  let cleanManagedSpringIds = null;
  if (rawManagedSpringIds !== undefined) {
    if (!Array.isArray(rawManagedSpringIds)) {
      return json(response, 400, { error: 'managedSpringIds harus berupa array string' });
    }
    cleanManagedSpringIds = rawManagedSpringIds.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const getAdminAuth = deps.getAdminAuth || defaultGetAdminAuth;
    const db = getAdminDb();
    const adminAuth = getAdminAuth();

    // 1. Fetch existing user auth record to preserve other custom claims if any
    let existingClaims = {};
    try {
      if (typeof adminAuth.getUser === 'function') {
        const userRecord = await adminAuth.getUser(targetUid.trim());
        existingClaims = userRecord.customClaims || {};
      }
    } catch (e) {
      console.warn(`Could not get auth user for ${targetUid}:`, e.message);
    }

    const newClaims = {
      ...existingClaims,
      roles: cleanRoles,
      admin: isAdmin
    };

    // 2. Set custom claims in Firebase Auth
    if (typeof adminAuth.setCustomUserClaims === 'function') {
      await adminAuth.setCustomUserClaims(targetUid.trim(), newClaims);
    }

    // 3. Mirror roles + managedSpringIds in Firestore users/{uid}
    const nowIso = new Date().toISOString();
    const updatePayload = {
      roles: cleanRoles,
      updatedAt: nowIso
    };

    if (cleanManagedSpringIds !== null) {
      updatePayload.managedSpringIds = cleanManagedSpringIds;
    }

    await db.collection('users').doc(targetUid.trim()).set(updatePayload, { merge: true });

    return json(response, 200, {
      success: true,
      message: 'Peran pengguna berhasil diperbarui',
      user: {
        uid: targetUid.trim(),
        roles: cleanRoles,
        managedSpringIds: cleanManagedSpringIds !== null ? cleanManagedSpringIds : undefined
      }
    });
  } catch (error) {
    console.error('handleSetUserRoles error:', error);
    return json(response, 500, { error: 'Gagal memperbarui peran pengguna' });
  }
}
