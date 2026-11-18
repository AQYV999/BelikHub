// lib/v1/springs-admin.js
// Admin CRUD handlers for springs and per-spring retribution/QRIS settings

import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import { requireRole as defaultRequireRole, requireAuth as defaultRequireAuth, json } from '../auth.js';
import { setCors, parseJsonBody, formatIso } from './http.js';
import { resolveSignedReadUrl as defaultResolveSignedReadUrl } from './uploads.js';
import { SPRINGS } from '../springs-seed.js';

/**
 * Admin-only POST /api/v1/springs
 * Supports { seedBaseline: true } to idempotently copy baseline springs,
 * or creates a new spring with required fields.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleCreateSpring(request, response, deps = {}) {
  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Admin access required' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  // Case 1: Seed baseline springs idempotently
  if (body.seedBaseline === true) {
    const seeded = [];
    for (const spring of SPRINGS) {
      await db.collection('springs').doc(spring.id).set(spring, { merge: true });
      seeded.push(spring.id);
    }
    return json(response, 200, {
      success: true,
      message: `Berhasil memuat ${seeded.length} mata air baseline`,
      seededCount: seeded.length,
      springIds: seeded
    });
  }

  // Case 2: Create a new custom spring
  const { id, name, village, district, regency, coordinates_public } = body;

  if (!id || typeof id !== 'string' || !id.trim()) {
    return json(response, 400, { error: 'id mata air wajib diisi (contoh: SPR-005)' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return json(response, 400, { error: 'name mata air wajib diisi' });
  }
  if (!village || typeof village !== 'string' || !village.trim()) {
    return json(response, 400, { error: 'village (desa) wajib diisi' });
  }
  if (!district || typeof district !== 'string' || !district.trim()) {
    return json(response, 400, { error: 'district (kecamatan) wajib diisi' });
  }
  if (!regency || typeof regency !== 'string' || !regency.trim()) {
    return json(response, 400, { error: 'regency (kabupaten) wajib diisi' });
  }
  if (!coordinates_public || typeof coordinates_public !== 'object' ||
      typeof coordinates_public.lat !== 'number' || typeof coordinates_public.lng !== 'number') {
    return json(response, 400, { error: 'coordinates_public wajib berupa objek { lat, lng } dengan nilai numerik' });
  }

  const cleanId = id.trim();
  const existing = await db.collection('springs').doc(cleanId).get();
  if (existing.exists) {
    return json(response, 409, { error: `Mata air dengan ID ${cleanId} sudah ada` });
  }

  const newSpring = {
    ...body,
    id: cleanId,
    name: name.trim(),
    village: village.trim(),
    district: district.trim(),
    regency: regency.trim(),
    coordinates_public: {
      lat: coordinates_public.lat,
      lng: coordinates_public.lng
    },
    createdByUid: auth.user.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('springs').doc(cleanId).set(newSpring);

  return json(response, 201, { success: true, spring: newSpring });
}

/**
 * Admin-only PATCH /api/v1/springs/:id
 * @param {object} request
 * @param {object} response
 * @param {string | object} [springIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleUpdateSpring(request, response, springIdOrDeps, maybeDeps = {}) {
  const springId = typeof springIdOrDeps === 'string'
    ? springIdOrDeps
    : (request.query?.id || request.query?.springId || null);
  const deps = typeof springIdOrDeps === 'object' && springIdOrDeps !== null ? springIdOrDeps : maybeDeps;

  setCors(response, 'PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Admin access required' });
  }

  if (!springId || typeof springId !== 'string') {
    return json(response, 400, { error: 'ID mata air wajib disertakan' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();
  const docRef = db.collection('springs').doc(springId);
  const existing = await docRef.get();

  if (!existing.exists) {
    return json(response, 404, { error: `Mata air dengan ID ${springId} tidak ditemukan` });
  }

  const updates = {
    ...body,
    updatedAt: new Date().toISOString()
  };
  delete updates.id; // Prevent changing ID

  await docRef.set(updates, { merge: true });
  const updatedDoc = await docRef.get();

  return json(response, 200, { success: true, spring: updatedDoc.data() });
}

/**
 * Authenticated GET /api/v1/springs/:id/settings
 * Returns retribution and QRIS settings for a specific spring.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [springIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleGetSpringSettings(request, response, springIdOrDeps, maybeDeps = {}) {
  const springId = typeof springIdOrDeps === 'string'
    ? springIdOrDeps
    : (request.query?.id || request.query?.springId || null);
  const deps = typeof springIdOrDeps === 'object' && springIdOrDeps !== null ? springIdOrDeps : maybeDeps;

  setCors(response, 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Unauthorized' });
  }

  if (!springId || typeof springId !== 'string') {
    return json(response, 400, { error: 'ID mata air wajib disertakan' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();
  const snap = await db.collection('spring_settings').doc(springId).get();
  const resolveSignedUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

  if (!snap.exists) {
    return json(response, 200, {
      springId,
      defaultMonthlyFee: 15000,
      paymentInstructions: 'Silakan hubungi pengelola mata air setempat untuk instruksi pembayaran retribusi.',
      qrisImagePath: null,
      qrisReadUrl: null,
      isFallback: true
    });
  }

  const data = snap.data();
  const qrisReadUrl = await resolveSignedUrl(data.qrisImagePath, deps);

  return json(response, 200, {
    springId,
    defaultMonthlyFee: Number(data.defaultMonthlyFee) || 15000,
    paymentInstructions: data.paymentInstructions || '',
    qrisImagePath: data.qrisImagePath || null,
    qrisReadUrl,
    isFallback: false,
    updatedByUid: data.updatedByUid || null,
    updatedAt: formatIso(data.updatedAt)
  });
}

/**
 * Admin-only PUT /api/v1/springs/:id/settings
 * Updates retribution and QRIS settings for a specific spring.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [springIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handlePutSpringSettings(request, response, springIdOrDeps, maybeDeps = {}) {
  const springId = typeof springIdOrDeps === 'string'
    ? springIdOrDeps
    : (request.query?.id || request.query?.springId || null);
  const deps = typeof springIdOrDeps === 'object' && springIdOrDeps !== null ? springIdOrDeps : maybeDeps;

  setCors(response, 'PUT, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PUT') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Admin access required' });
  }

  if (!springId || typeof springId !== 'string') {
    return json(response, 400, { error: 'ID mata air wajib disertakan' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { defaultMonthlyFee, paymentInstructions, qrisImagePath: rawQrisImagePath } = body;

  const fee = Number(defaultMonthlyFee);
  if (isNaN(fee) || fee <= 0) {
    return json(response, 400, { error: 'defaultMonthlyFee harus berupa angka lebih besar dari 0' });
  }

  if (!paymentInstructions || typeof paymentInstructions !== 'string' || !paymentInstructions.trim()) {
    return json(response, 400, { error: 'paymentInstructions wajib diisi' });
  }

  let qrisImagePath = null;
  if (rawQrisImagePath !== undefined && rawQrisImagePath !== null && rawQrisImagePath !== '') {
    if (typeof rawQrisImagePath !== 'string') {
      return json(response, 400, { error: 'qrisImagePath harus berupa string path' });
    }
    const cleanPath = rawQrisImagePath.trim();
    if (cleanPath.includes('..') || !cleanPath.startsWith('uploads/qris_image/')) {
      return json(response, 400, {
        error: 'qrisImagePath tidak valid: harus diawali uploads/qris_image/ dan tidak boleh mengandung traversal (..)'
      });
    }
    qrisImagePath = cleanPath;
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();
  const nowIso = new Date().toISOString();

  const settingsData = {
    springId,
    defaultMonthlyFee: fee,
    paymentInstructions: paymentInstructions.trim(),
    qrisImagePath,
    updatedByUid: auth.user.uid,
    updatedAt: nowIso
  };

  await db.collection('spring_settings').doc(springId).set(settingsData, { merge: true });

  const resolveSignedUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;
  const qrisReadUrl = await resolveSignedUrl(qrisImagePath, deps);

  return json(response, 200, {
    success: true,
    settings: {
      springId,
      defaultMonthlyFee: fee,
      paymentInstructions: paymentInstructions.trim(),
      qrisImagePath,
      qrisReadUrl,
      isFallback: false,
      updatedByUid: auth.user.uid,
      updatedAt: nowIso
    }
  });
}
