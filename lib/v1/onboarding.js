// lib/v1/onboarding.js
// Multirole onboarding and profile management with secure atomic linkCode redemption

import { getAdminDb as defaultGetAdminDb, getAdminAuth as defaultGetAdminAuth } from '../firebase-admin.js';
import { requireAuth as defaultRequireAuth, PUBLIC_SELF_ASSIGN_ROLES, extractRoles, json } from '../auth.js';
import { setCors, parseJsonBody } from './http.js';

/**
 * Atomically redeem a resident linkCode inside a Firestore transaction.
 * @param {object} params
 * @param {object} params.db
 * @param {string} params.uid
 * @param {string | null} [params.springId]
 * @param {string} params.linkCode
 * @returns {Promise<{ success: true, residentId: string, residentData: object } | { success: false, status: number, error: string }>}
 */
export async function redeemLinkCode({ db, uid, springId, linkCode }) {
  if (!linkCode || typeof linkCode !== 'string' || !linkCode.trim()) {
    return { success: false, status: 400, error: 'Kode tautan tidak valid' };
  }
  const cleanCode = linkCode.trim();
  const upperCode = cleanCode.toUpperCase();

  // Search candidate resident by linkCode or claimedLinkCode
  let residentDoc = null;
  let linkSnap = await db.collection('residents').where('linkCode', '==', upperCode).get();
  if (linkSnap.empty && upperCode !== cleanCode) {
    linkSnap = await db.collection('residents').where('linkCode', '==', cleanCode).get();
  }

  if (!linkSnap.empty) {
    residentDoc = (springId ? linkSnap.docs.find((d) => d.data().springId === springId) : null) || linkSnap.docs[0];
  } else {
    // Check if it was already claimed
    let claimedSnap = await db.collection('residents').where('claimedLinkCode', '==', upperCode).get();
    if (claimedSnap.empty && upperCode !== cleanCode) {
      claimedSnap = await db.collection('residents').where('claimedLinkCode', '==', cleanCode).get();
    }
    if (!claimedSnap.empty) {
      residentDoc = (springId ? claimedSnap.docs.find((d) => d.data().springId === springId) : null) || claimedSnap.docs[0];
    }
  }

  if (!residentDoc) {
    return { success: false, status: 400, error: 'Kode tautan tidak ditemukan atau tidak valid' };
  }

  const residentRef = db.collection('residents').doc(residentDoc.id);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(residentRef);
      if (!freshDoc.exists) {
        const err = new Error('Data warga tidak ditemukan');
        err.status = 400;
        throw err;
      }

      const residentData = freshDoc.data();

      // Check if already claimed / used
      if (residentData.userId != null) {
        const err = new Error('Kode tautan sudah digunakan oleh akun lain');
        err.status = 409;
        throw err;
      }

      // Check springId match
      if (springId && residentData.springId && residentData.springId !== springId) {
        const err = new Error('Mata air tidak sesuai dengan data warga');
        err.status = 400;
        throw err;
      }

      // Check expiration
      if (residentData.linkCodeExpiresAt) {
        let isExpired = false;
        if (typeof residentData.linkCodeExpiresAt.toDate === 'function') {
          isExpired = residentData.linkCodeExpiresAt.toDate().getTime() <= Date.now();
        } else {
          const exp = new Date(residentData.linkCodeExpiresAt);
          if (!isNaN(exp.getTime())) {
            isExpired = exp.getTime() <= Date.now();
          }
        }
        if (isExpired) {
          const err = new Error('Kode tautan sudah kedaluwarsa');
          err.status = 400;
          throw err;
        }
      }

      // Atomically update resident: set userId, clear linkCode, record claimedLinkCode
      transaction.update(residentRef, {
        userId: uid,
        linkCode: null,
        claimedLinkCode: upperCode,
        updatedAt: new Date().toISOString()
      });

      return { residentId: freshDoc.id, residentData };
    });

    return { success: true, residentId: result.residentId, residentData: result.residentData };
  } catch (err) {
    return {
      success: false,
      status: err.status || 500,
      error: err.message || 'Gagal menautkan kode warga'
    };
  }
}

/**
 * Handle initial onboarding for mobile app users
 * POST /api/v1/onboarding
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleOnboarding(request, response, deps = {}) {
  setCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Unauthorized' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { role, name, phone, springId, linkCode, donorType, organizationName } = body;

  if (!role || typeof role !== 'string') {
    return json(response, 400, { error: 'Role wajib diisi' });
  }

  if (!PUBLIC_SELF_ASSIGN_ROLES.includes(role)) {
    return json(response, 403, {
      error: 'Role tidak diizinkan untuk pendaftaran mandiri. Hanya warga, donatur, atau relawan yang diizinkan.'
    });
  }

  const getAdminAuth = deps.getAdminAuth || defaultGetAdminAuth;
  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  // If role is warga and linkCode is provided, redeem linkCode first before modifying claims or user doc
  let claimedResidentId = null;
  let claimedResidentSpringId = null;
  let linkStatus = 'pending';

  if (role === 'warga') {
    if (linkCode && typeof linkCode === 'string' && linkCode.trim()) {
      const redeemResult = await redeemLinkCode({
        db,
        uid: auth.user.uid,
        springId: typeof springId === 'string' ? springId.trim() : null,
        linkCode: linkCode.trim()
      });

      if (!redeemResult.success) {
        return json(response, redeemResult.status, { error: redeemResult.error });
      }

      claimedResidentId = redeemResult.residentId;
      claimedResidentSpringId = redeemResult.residentData?.springId || null;
      linkStatus = 'linked';
    } else {
      linkStatus = 'pending';
    }
  }

  // Preserve existing claims (admin: true, pengelola, etc.)
  const userRecord = await adminAuth.getUser(auth.user.uid);
  const currentClaims = userRecord.customClaims || {};
  const existingRoles = Array.isArray(currentClaims.roles) ? currentClaims.roles : [];
  const mergedRoles = Array.from(new Set([...existingRoles, role]));

  const newClaims = {
    ...currentClaims,
    roles: mergedRoles
  };
  if (currentClaims.admin === true || auth.user.admin === true || mergedRoles.includes('admin')) {
    newClaims.admin = true;
  }

  await adminAuth.setCustomUserClaims(auth.user.uid, newClaims);

  // Update Firestore users/{uid}
  const userRef = db.collection('users').doc(auth.user.uid);
  const existingDoc = await userRef.get();
  const existingData = existingDoc.exists ? existingDoc.data() : {};

  const userUpdates = {
    roles: mergedRoles,
    updatedAt: new Date().toISOString()
  };

  if (typeof name === 'string' && name.trim()) {
    userUpdates.name = name.trim();
  }
  if (typeof phone === 'string' && phone.trim()) {
    userUpdates.phone = phone.trim();
  }

  if (role === 'warga') {
    userUpdates.springId = typeof springId === 'string' && springId.trim()
      ? springId.trim()
      : (claimedResidentSpringId || existingData.springId || null);
    userUpdates.residentId = claimedResidentId !== null ? claimedResidentId : (existingData.residentId || null);
    userUpdates.residentLinkStatus = linkStatus;
  } else if (role === 'donatur') {
    userUpdates.donorType = donorType === 'organization' ? 'organization' : 'individual';
    if (userUpdates.donorType === 'organization') {
      userUpdates.organizationName = typeof organizationName === 'string' && organizationName.trim()
        ? organizationName.trim()
        : (existingData.organizationName || null);
    }
  }

  await userRef.set(userUpdates, { merge: true });

  const finalUserData = {
    uid: auth.user.uid,
    email: auth.user.email,
    name: userUpdates.name || existingData.name || auth.user.displayName || null,
    roles: mergedRoles,
    residentId: userUpdates.residentId !== undefined ? userUpdates.residentId : (existingData.residentId || null),
    residentLinkStatus: userUpdates.residentLinkStatus !== undefined ? userUpdates.residentLinkStatus : (existingData.residentLinkStatus || null),
    springId: userUpdates.springId !== undefined ? userUpdates.springId : (existingData.springId || null),
    donorType: userUpdates.donorType !== undefined ? userUpdates.donorType : (existingData.donorType || null),
    organizationName: userUpdates.organizationName !== undefined ? userUpdates.organizationName : (existingData.organizationName || null),
    phone: userUpdates.phone !== undefined ? userUpdates.phone : (existingData.phone || null)
  };

  return json(response, 200, {
    success: true,
    user: finalUserData
  });
}

/**
 * Handle updating profile fields & optional linkCode redemption
 * PATCH /api/v1/profile
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleUpdateProfile(request, response, deps = {}) {
  setCors(response, 'PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Unauthorized' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { name, phone, donorType, organizationName, springId, linkCode } = body;

  if (donorType !== undefined && donorType !== null) {
    if (!['individual', 'organization'].includes(donorType)) {
      return json(response, 400, { error: 'donorType harus "individual" atau "organization"' });
    }
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();
  const userRef = db.collection('users').doc(auth.user.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  const effectiveSpringId = (typeof springId === 'string' && springId.trim())
    ? springId.trim()
    : userData.springId;

  let claimedResidentId = null;
  let claimedResidentSpringId = null;
  let newLinkStatus = null;

  if (linkCode && typeof linkCode === 'string' && linkCode.trim()) {
    const redeemResult = await redeemLinkCode({
      db,
      uid: auth.user.uid,
      springId: effectiveSpringId,
      linkCode: linkCode.trim()
    });

    if (!redeemResult.success) {
      return json(response, redeemResult.status, { error: redeemResult.error });
    }

    claimedResidentId = redeemResult.residentId;
    claimedResidentSpringId = redeemResult.residentData?.springId || null;
    newLinkStatus = 'linked';
  }

  const updates = {
    updatedAt: new Date().toISOString()
  };

  if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : null;
  if (phone !== undefined) updates.phone = typeof phone === 'string' ? phone.trim() : null;
  if (donorType !== undefined) updates.donorType = donorType;
  if (organizationName !== undefined) updates.organizationName = typeof organizationName === 'string' ? organizationName.trim() : null;
  if (springId !== undefined) {
    updates.springId = typeof springId === 'string' ? springId.trim() : null;
  } else if (claimedResidentSpringId) {
    updates.springId = claimedResidentSpringId;
  }

  if (claimedResidentId !== null) {
    updates.residentId = claimedResidentId;
    updates.residentLinkStatus = newLinkStatus;
  }

  await userRef.set(updates, { merge: true });

  const updatedDoc = await userRef.get();
  const updatedData = updatedDoc.data();

  return json(response, 200, {
    success: true,
    user: {
      uid: auth.user.uid,
      email: auth.user.email,
      roles: extractRoles(auth.user),
      ...updatedData
    }
  });
}
