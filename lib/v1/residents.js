// lib/v1/residents.js
// Resident management, 6-char uppercase link codes, and pending Warga account linking

import crypto from 'crypto';
import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import {
  requireRole as defaultRequireRole,
  hasSpringAccess,
  json
} from '../auth.js';
import { setCors, parseJsonBody } from './http.js';

export const LINK_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LINK_CODE_EXPIRY_DAYS = 7;

/**
 * Generate a cryptographically secure uppercase alphanumeric link code.
 * Uses alphabet excluding confusing characters: B, 8, G, 6, I, 1, O, 0.
 * @param {number} [length=6]
 * @returns {string}
 */
export function generateRandomLinkCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, LINK_CODE_ALPHABET.length);
    code += LINK_CODE_ALPHABET[idx];
  }
  return code;
}

/**
 * Resolve managedSpringIds for pengelola from users/{uid} with auth claim fallback.
 * @param {object} db
 * @param {string} uid
 * @param {object} [authUser]
 * @returns {Promise<string[]>}
 */
export async function resolveManagedSpringIds(db, uid, authUser) {
  if (!uid) return [];
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc && userDoc.exists) {
      const data = userDoc.data();
      if (Array.isArray(data.managedSpringIds)) {
        return data.managedSpringIds;
      }
    }
  } catch {
    // fallback
  }

  if (Array.isArray(authUser?.managedSpringIds)) {
    return authUser.managedSpringIds;
  }
  return [];
}

/**
 * List residents and pending Warga link requests.
 * Pengelola sees residents and pending users for managedSpringIds.
 * Admin sees all or filtered by query springId.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleListResidents(request, response, deps = {}) {
  setCors(response, 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  const isAdmin = auth.roles.includes('admin');
  const querySpringId = request.query?.springId ? String(request.query.springId).trim() : null;

  let scopedSpringIds = null; // null means all (for admin without querySpringId)

  if (isAdmin) {
    if (querySpringId) {
      scopedSpringIds = [querySpringId];
    }
  } else {
    // pengelola: enforce managedSpringIds lookup from users/{uid}
    const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
    if (querySpringId) {
      if (!managedSpringIds.includes(querySpringId)) {
        return json(response, 403, {
          error: `Forbidden: Anda tidak memiliki akses ke mata air ${querySpringId}`
        });
      }
      scopedSpringIds = [querySpringId];
    } else {
      scopedSpringIds = managedSpringIds;
    }
  }

  // If pengelola manages 0 springs, return empty list
  if (scopedSpringIds && scopedSpringIds.length === 0) {
    return json(response, 200, {
      success: true,
      residents: [],
      pendingUsers: [],
      pendingLinkRequests: []
    });
  }

  try {
    // 1. Fetch residents
    let residents = [];
    if (scopedSpringIds && scopedSpringIds.length === 1) {
      const snap = await db.collection('residents').where('springId', '==', scopedSpringIds[0]).get();
      residents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      const snap = await db.collection('residents').get();
      residents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (scopedSpringIds) {
        residents = residents.filter((r) => scopedSpringIds.includes(r.springId));
      }
    }

    // Sort residents by name
    residents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // 2. Fetch pending Warga users
    let pendingUsers = [];
    const usersSnap = await db
      .collection('users')
      .where('residentLinkStatus', '==', 'pending')
      .get();

    for (const d of usersSnap.docs) {
      const u = d.data();
      const userSpringId = u.springId || null;
      if (scopedSpringIds && userSpringId && !scopedSpringIds.includes(userSpringId)) {
        continue;
      }
      pendingUsers.push({
        uid: d.id,
        id: d.id,
        email: u.email || null,
        name: u.name || null,
        phone: u.phone || null,
        springId: userSpringId,
        residentLinkStatus: u.residentLinkStatus || 'pending',
        createdAt: u.createdAt || null
      });
    }

    return json(response, 200, {
      success: true,
      residents,
      pendingUsers,
      pendingLinkRequests: pendingUsers
    });
  } catch (error) {
    console.error('handleListResidents error:', error);
    return json(response, 500, { error: 'Gagal memuat daftar warga' });
  }
}

/**
 * Create a new resident doc (userId: null, active: true).
 * Validates springId, name, phone, monthlyFee > 0.
 * Enforces cross-spring access for pengelola.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleCreateResident(request, response, deps = {}) {
  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { springId, name, phone, monthlyFee } = body;

  if (!springId || typeof springId !== 'string' || !springId.trim()) {
    return json(response, 400, { error: 'springId mata air wajib diisi' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return json(response, 400, { error: 'Nama warga (name) wajib diisi' });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return json(response, 400, { error: 'Nomor telepon warga (phone) wajib diisi' });
  }
  const feeNum = Number(monthlyFee);
  if (monthlyFee === undefined || isNaN(feeNum) || feeNum <= 0) {
    return json(response, 400, { error: 'Tarif bulanan (monthlyFee) harus berupa angka positif' });
  }

  const cleanSpringId = springId.trim();
  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  // Cross-spring isolation check
  if (!auth.roles.includes('admin')) {
    const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
    if (!hasSpringAccess(auth.roles, managedSpringIds, cleanSpringId)) {
      return json(response, 403, {
        error: `Forbidden: Anda tidak memiliki akses ke mata air ${cleanSpringId}`
      });
    }
  }

  const newResident = {
    springId: cleanSpringId,
    name: name.trim(),
    phone: phone.trim(),
    monthlyFee: feeNum,
    active: true,
    userId: null,
    linkCode: null,
    linkCodeExpiresAt: null,
    createdByUid: auth.user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = await db.collection('residents').add(newResident);
    return json(response, 201, {
      success: true,
      resident: {
        id: docRef.id,
        ...newResident
      }
    });
  } catch (error) {
    console.error('handleCreateResident error:', error);
    return json(response, 500, { error: 'Gagal membuat data warga' });
  }
}

/**
 * Update resident fields or toggle active status.
 * @param {object} request
 * @param {object} response
 * @param {string} [residentId]
 * @param {object} [deps={}]
 */
export async function handleUpdateResident(request, response, residentId, deps = {}) {
  setCors(response, 'PATCH, POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH' && request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const id = residentId || request.query?.id || request.query?.residentId;
  if (!id || typeof id !== 'string') {
    return json(response, 400, { error: 'residentId wajib disertakan' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  const residentRef = db.collection('residents').doc(id);
  const residentSnap = await residentRef.get();
  if (!residentSnap.exists) {
    return json(response, 404, { error: 'Data warga tidak ditemukan' });
  }

  const residentData = residentSnap.data();

  // Cross-spring isolation check
  if (!auth.roles.includes('admin')) {
    const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
    if (!hasSpringAccess(auth.roles, managedSpringIds, residentData.springId)) {
      return json(response, 403, {
        error: `Forbidden: Anda tidak memiliki akses ke data warga mata air ${residentData.springId}`
      });
    }
  }

  const updates = {
    updatedAt: new Date().toISOString()
  };

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return json(response, 400, { error: 'Nama warga tidak boleh kosong' });
    }
    updates.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string' || !body.phone.trim()) {
      return json(response, 400, { error: 'Nomor telepon tidak boleh kosong' });
    }
    updates.phone = body.phone.trim();
  }

  if (body.monthlyFee !== undefined) {
    const fee = Number(body.monthlyFee);
    if (isNaN(fee) || fee <= 0) {
      return json(response, 400, { error: 'Tarif bulanan harus berupa angka positif' });
    }
    updates.monthlyFee = fee;
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      return json(response, 400, { error: 'Nilai active harus berupa boolean' });
    }
    updates.active = body.active;
  }

  try {
    await residentRef.update(updates);
    const updated = {
      ...residentData,
      ...updates,
      id
    };
    return json(response, 200, {
      success: true,
      resident: updated
    });
  } catch (error) {
    console.error('handleUpdateResident error:', error);
    return json(response, 500, { error: 'Gagal memperbarui data warga' });
  }
}

/**
 * Generate 6-char uppercase alphanumeric linkCode (7-day expiry) on unlinked resident.
 * @param {object} request
 * @param {object} response
 * @param {string} [residentId]
 * @param {object} [deps={}]
 */
export async function handleGenerateLinkCode(request, response, residentId, deps = {}) {
  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const id = residentId || request.query?.id || request.query?.residentId;
  if (!id || typeof id !== 'string') {
    return json(response, 400, { error: 'residentId wajib disertakan' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  const residentRef = db.collection('residents').doc(id);
  const residentSnap = await residentRef.get();
  if (!residentSnap.exists) {
    return json(response, 404, { error: 'Data warga tidak ditemukan' });
  }

  const residentData = residentSnap.data();

  // Cross-spring isolation check
  if (!auth.roles.includes('admin')) {
    const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
    if (!hasSpringAccess(auth.roles, managedSpringIds, residentData.springId)) {
      return json(response, 403, {
        error: `Forbidden: Anda tidak memiliki akses ke mata air ${residentData.springId}`
      });
    }
  }

  // Resident must be unlinked
  if (residentData.userId != null) {
    return json(response, 400, {
      error: 'Data warga sudah tertaut dengan akun pengguna'
    });
  }

  const linkCode = generateRandomLinkCode(6);
  const linkCodeExpiresAt = new Date(Date.now() + LINK_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  try {
    await residentRef.update({
      linkCode,
      linkCodeExpiresAt,
      updatedAt: new Date().toISOString()
    });

    return json(response, 200, {
      success: true,
      linkCode,
      linkCodeExpiresAt,
      residentId: id
    });
  } catch (error) {
    console.error('handleGenerateLinkCode error:', error);
    return json(response, 500, { error: 'Gagal membuat kode tautan' });
  }
}

/**
 * Approve pending Warga user link request inside a transaction.
 * Supports linking to an existing residentId or creating a new resident via createResident.
 * Backfills userId on any existing retribution_bills for that residentId.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleApproveLink(request, response, deps = {}) {
  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { userUid, residentId, createResident } = body;

  if (!userUid || typeof userUid !== 'string' || !userUid.trim()) {
    return json(response, 400, { error: 'userUid wajib diisi' });
  }

  if (!residentId && !createResident) {
    return json(response, 400, {
      error: 'Harus menyertakan residentId yang ada atau createResident'
    });
  }

  const cleanUid = userUid.trim();
  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  const userRef = db.collection('users').doc(cleanUid);
  const residentRef = residentId ? db.collection('residents').doc(String(residentId).trim()) : null;

  if (createResident) {
    const { name, phone, monthlyFee } = createResident;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return json(response, 400, { error: 'Nama warga (createResident.name) wajib diisi' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return json(response, 400, { error: 'Nomor telepon warga (createResident.phone) wajib diisi' });
    }
    const feeNum = Number(monthlyFee);
    if (monthlyFee === undefined || isNaN(feeNum) || feeNum <= 0) {
      return json(response, 400, {
        error: 'Tarif bulanan (createResident.monthlyFee) harus berupa angka positif'
      });
    }
  }

  const isAdmin = auth.roles.includes('admin');
  const managedSpringIds = isAdmin ? [] : await resolveManagedSpringIds(db, auth.user.uid, auth.user);

  let targetResidentId = null;

  try {
    const txResult = await db.runTransaction(async (transaction) => {
      // 1. Transactional read of user doc
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        const err = new Error('Pengguna tidak ditemukan');
        err.status = 404;
        throw err;
      }
      const userData = userSnap.data();

      // 2. Branch: Existing resident vs createResident
      if (residentRef) {
        // Transactional read of resident doc
        const residentSnap = await transaction.get(residentRef);
        if (!residentSnap.exists) {
          const err = new Error('Data warga tidak ditemukan');
          err.status = 404;
          throw err;
        }

        const residentData = residentSnap.data();

        // Cross-spring check
        if (!isAdmin) {
          if (!hasSpringAccess(auth.roles, managedSpringIds, residentData.springId)) {
            const err = new Error(`Forbidden: Anda tidak memiliki akses ke mata air ${residentData.springId}`);
            err.status = 403;
            throw err;
          }
        }

        // Concurrency check inside transaction: resident must not be already linked
        if (residentData.userId != null && residentData.userId !== cleanUid) {
          const err = new Error('Data warga sudah ditautkan ke akun pengguna lain');
          err.status = 409;
          throw err;
        }

        // Atomically link resident and user
        transaction.update(residentRef, {
          userId: cleanUid,
          linkCode: null,
          updatedAt: new Date().toISOString()
        });

        transaction.update(userRef, {
          residentId: residentRef.id,
          residentLinkStatus: 'linked',
          springId: residentData.springId,
          updatedAt: new Date().toISOString()
        });

        return { residentId: residentRef.id };
      } else {
        // createResident branch
        const targetSpring = (typeof createResident.springId === 'string' && createResident.springId.trim())
          ? createResident.springId.trim()
          : userData.springId;

        if (!targetSpring) {
          const err = new Error('springId wajib ditentukan pada createResident atau data pengguna');
          err.status = 400;
          throw err;
        }

        // Cross-spring check
        if (!isAdmin) {
          if (!hasSpringAccess(auth.roles, managedSpringIds, targetSpring)) {
            const err = new Error(`Forbidden: Anda tidak memiliki akses ke mata air ${targetSpring}`);
            err.status = 403;
            throw err;
          }
        }

        const newResidentRef = db.collection('residents').doc();
        const newResidentId = newResidentRef.id;

        transaction.set(newResidentRef, {
          id: newResidentId,
          springId: targetSpring,
          name: createResident.name.trim(),
          phone: createResident.phone.trim(),
          monthlyFee: Number(createResident.monthlyFee),
          active: true,
          userId: cleanUid,
          linkCode: null,
          linkCodeExpiresAt: null,
          createdByUid: auth.user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        transaction.update(userRef, {
          residentId: newResidentId,
          residentLinkStatus: 'linked',
          springId: targetSpring,
          updatedAt: new Date().toISOString()
        });

        return { residentId: newResidentId };
      }
    });

    targetResidentId = txResult.residentId;
  } catch (err) {
    if (err.status) {
      return json(response, err.status, { error: err.message });
    }
    console.error('handleApproveLink transaction error:', err);
    return json(response, 500, { error: 'Gagal menyetujui penautan warga' });
  }

  // Backfill userId on any existing retribution_bills for this residentId
  try {
    const billsSnap = await db
      .collection('retribution_bills')
      .where('residentId', '==', targetResidentId)
      .get();

    for (const billDoc of billsSnap.docs) {
      const b = billDoc.data();
      if (b.userId !== cleanUid) {
        await billDoc.ref.update({
          userId: cleanUid,
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error backfilling userId on bills:', err);
  }

  return json(response, 200, {
    success: true,
    residentId: targetResidentId,
    userUid: cleanUid
  });
}
