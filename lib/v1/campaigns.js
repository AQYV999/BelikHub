// lib/v1/campaigns.js
// Public listing, admin creation & updates, and pengelola progress updates for revitalization campaigns

import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import {
  requireRole as defaultRequireRole,
  optionalAuth as defaultOptionalAuth,
  hasSpringAccess,
  json
} from '../auth.js';
import { resolveManagedSpringIds } from './residents.js';
import { resolveSignedReadUrl as defaultResolveSignedReadUrl } from './uploads.js';
import { setCors, parseJsonBody, formatIso, snapCoord } from './http.js';

export const VALID_CAMPAIGN_STATUSES = ['draft', 'active', 'completed'];

/**
 * Sanitize spring and coordinate data:
 * - snaps coordinates to ~5 km grid
 * - strips any permit_quota_lps or private data
 * @param {object} raw
 * @returns {object}
 */
function sanitizeCampaignData(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const cleaned = { ...raw };

  // NEVER expose permit_quota_lps
  delete cleaned.permit_quota_lps;
  delete cleaned.permitQuotaLps;

  // Snap coordinates if present
  if (cleaned.coordinates_public && typeof cleaned.coordinates_public === 'object') {
    cleaned.coordinates_public = {
      lat: snapCoord(cleaned.coordinates_public.lat),
      lng: snapCoord(cleaned.coordinates_public.lng)
    };
  } else if (cleaned.coordinates && typeof cleaned.coordinates === 'object') {
    cleaned.coordinates_public = {
      lat: snapCoord(cleaned.coordinates.lat),
      lng: snapCoord(cleaned.coordinates.lng)
    };
    delete cleaned.coordinates;
  }

  // Snap nested spring coordinates if present
  if (cleaned.spring && typeof cleaned.spring === 'object') {
    const springClean = { ...cleaned.spring };
    delete springClean.permit_quota_lps;
    delete springClean.permitQuotaLps;
    if (springClean.coordinates_public && typeof springClean.coordinates_public === 'object') {
      springClean.coordinates_public = {
        lat: snapCoord(springClean.coordinates_public.lat),
        lng: snapCoord(springClean.coordinates_public.lng)
      };
    }
    cleaned.spring = springClean;
  }

  return cleaned;
}

/**
 * Public GET /api/v1/campaigns
 * Returns list of revitalization campaigns with grid-snapped coordinates and resolved qrisReadUrls.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleListCampaigns(request, response, deps = {}) {
  setCors(response, 'GET, POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const optionalAuthFn = deps.optionalAuth || defaultOptionalAuth;
    await optionalAuthFn(request, response, deps);

    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();
    const resolveSignedUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

    let queryRef = db.collection('revitalization_campaigns');

    const statusFilter = request.query?.status ? String(request.query.status).trim() : null;
    const springIdFilter = request.query?.springId ? String(request.query.springId).trim() : null;

    if (statusFilter) {
      queryRef = queryRef.where('status', '==', statusFilter);
    }
    if (springIdFilter) {
      queryRef = queryRef.where('springId', '==', springIdFilter);
    }

    const snap = await queryRef.get();
    const campaignsRaw = [];
    snap.forEach((doc) => {
      campaignsRaw.push({ id: doc.id, ...doc.data() });
    });

    // Resolve qrisReadUrl concurrently using Promise.all
    const campaigns = await Promise.all(
      campaignsRaw.map(async (raw) => {
        const sanitized = sanitizeCampaignData(raw);
        let qrisReadUrl = null;
        if (sanitized.qrisImagePath) {
          qrisReadUrl = await resolveSignedUrl(sanitized.qrisImagePath, deps);
        }
        return {
          ...sanitized,
          qrisReadUrl,
          createdAt: formatIso(sanitized.createdAt),
          updatedAt: formatIso(sanitized.updatedAt)
        };
      })
    );

    return json(response, 200, {
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('handleListCampaigns error:', error);
    return json(response, 500, { error: 'Gagal mengambil daftar program revitalisasi' });
  }
}

/**
 * Public GET /api/v1/campaigns/:id
 * Returns campaign details with resolved qrisReadUrl and timeline updates with photoUrls.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [campaignIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleGetCampaign(request, response, campaignIdOrDeps, maybeDeps = {}) {
  const campaignId = typeof campaignIdOrDeps === 'string'
    ? campaignIdOrDeps
    : (request.query?.id || request.query?.campaignId || null);
  const deps = typeof campaignIdOrDeps === 'object' && campaignIdOrDeps !== null ? campaignIdOrDeps : maybeDeps;

  setCors(response, 'GET, PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (!campaignId || typeof campaignId !== 'string') {
    return json(response, 400, { error: 'ID program revitalisasi wajib disertakan' });
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();
    const resolveSignedUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

    const campaignSnap = await db.collection('revitalization_campaigns').doc(campaignId).get();
    if (!campaignSnap.exists) {
      return json(response, 404, { error: 'Program revitalisasi tidak ditemukan' });
    }

    const rawData = { id: campaignSnap.id, ...campaignSnap.data() };
    const sanitized = sanitizeCampaignData(rawData);

    // Fetch updates for this campaign
    let updatesSnap = null;
    try {
      updatesSnap = await db.collection('revitalization_updates')
        .where('campaignId', '==', campaignId)
        .get();
    } catch {
      updatesSnap = null;
    }

    const updatesRaw = [];
    if (updatesSnap) {
      updatesSnap.forEach((doc) => {
        updatesRaw.push({ id: doc.id, ...doc.data() });
      });
    }

    // Sort updates by createdAt descending
    updatesRaw.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Resolve photoUrls concurrently
    const updates = await Promise.all(
      updatesRaw.map(async (u) => {
        let photoUrl = null;
        if (u.photoPath) {
          photoUrl = await resolveSignedUrl(u.photoPath, deps);
        }
        return {
          ...u,
          photoUrl,
          createdAt: formatIso(u.createdAt)
        };
      })
    );

    // Resolve qrisReadUrl
    let qrisReadUrl = null;
    if (sanitized.qrisImagePath) {
      qrisReadUrl = await resolveSignedUrl(sanitized.qrisImagePath, deps);
    }

    return json(response, 200, {
      success: true,
      campaign: {
        ...sanitized,
        qrisReadUrl,
        updates,
        createdAt: formatIso(sanitized.createdAt),
        updatedAt: formatIso(sanitized.updatedAt)
      }
    });
  } catch (error) {
    console.error('handleGetCampaign error:', error);
    return json(response, 500, { error: 'Gagal mengambil detail program revitalisasi' });
  }
}

/**
 * Admin-only POST /api/v1/campaigns
 * Creates a new revitalization campaign.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleCreateCampaign(request, response, deps = {}) {
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
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const {
    springId,
    title,
    description,
    targetAmount,
    paymentInstructions,
    qrisImagePath: rawQrisImagePath,
    status
  } = body;

  if (!springId || typeof springId !== 'string' || !springId.trim()) {
    return json(response, 400, { error: 'springId wajib disertakan' });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return json(response, 400, { error: 'title (judul) program wajib diisi' });
  }
  const target = Number(targetAmount);
  if (typeof target !== 'number' || isNaN(target) || target <= 0) {
    return json(response, 400, { error: 'targetAmount harus berupa angka positif' });
  }

  let cleanQrisImagePath = null;
  if (rawQrisImagePath !== undefined && rawQrisImagePath !== null && rawQrisImagePath !== '') {
    if (typeof rawQrisImagePath !== 'string') {
      return json(response, 400, { error: 'qrisImagePath harus berupa string path' });
    }
    const clean = rawQrisImagePath.trim();
    if (!clean.startsWith('uploads/qris_image/') || clean.includes('..')) {
      return json(response, 400, {
        error: 'qrisImagePath tidak valid: harus diawali uploads/qris_image/ dan tidak boleh mengandung traversal (..)'
      });
    }
    cleanQrisImagePath = clean;
  }

  const campaignStatus = VALID_CAMPAIGN_STATUSES.includes(status) ? status : 'active';

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();

    // Verify spring exists
    const cleanSpringId = springId.trim();
    const springSnap = await db.collection('springs').doc(cleanSpringId).get();
    const springData = springSnap.exists ? springSnap.data() : null;

    const campaignId = body.id && typeof body.id === 'string'
      ? body.id.trim()
      : `CAMP-${Date.now()}`;

    const nowIso = new Date().toISOString();
    const newCampaign = {
      id: campaignId,
      springId: cleanSpringId,
      springName: springData?.name || cleanSpringId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      targetAmount: target,
      collectedAmount: 0,
      progressPercent: 0,
      paymentInstructions: typeof paymentInstructions === 'string' ? paymentInstructions.trim() : '',
      qrisImagePath: cleanQrisImagePath,
      status: campaignStatus,
      createdByUid: auth.user.uid,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await db.collection('revitalization_campaigns').doc(campaignId).set(newCampaign);

    return json(response, 201, {
      success: true,
      campaign: newCampaign
    });
  } catch (error) {
    console.error('handleCreateCampaign error:', error);
    return json(response, 500, { error: 'Gagal membuat program revitalisasi' });
  }
}

/**
 * Admin-only PATCH /api/v1/campaigns/:id
 * Updates revitalization campaign details.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [campaignIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleUpdateCampaign(request, response, campaignIdOrDeps, maybeDeps = {}) {
  const campaignId = typeof campaignIdOrDeps === 'string'
    ? campaignIdOrDeps
    : (request.query?.id || request.query?.campaignId || null);
  const deps = typeof campaignIdOrDeps === 'object' && campaignIdOrDeps !== null ? campaignIdOrDeps : maybeDeps;

  setCors(response, 'PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (!campaignId || typeof campaignId !== 'string') {
    return json(response, 400, { error: 'ID program revitalisasi wajib disertakan' });
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

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();

    const campaignRef = db.collection('revitalization_campaigns').doc(campaignId);
    const snap = await campaignRef.get();
    if (!snap.exists) {
      return json(response, 404, { error: 'Program revitalisasi tidak ditemukan' });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim();
    }
    if (body.targetAmount !== undefined) {
      const target = Number(body.targetAmount);
      if (typeof target !== 'number' || isNaN(target) || target <= 0) {
        return json(response, 400, { error: 'targetAmount harus berupa angka positif' });
      }
      updates.targetAmount = target;
    }
    if (typeof body.paymentInstructions === 'string') {
      updates.paymentInstructions = body.paymentInstructions.trim();
    }
    if (body.status !== undefined) {
      if (!VALID_CAMPAIGN_STATUSES.includes(body.status)) {
        return json(response, 400, {
          error: `status tidak valid: harus salah satu dari ${VALID_CAMPAIGN_STATUSES.join(', ')}`
        });
      }
      updates.status = body.status;
    }
    if (body.qrisImagePath !== undefined) {
      if (body.qrisImagePath === null || body.qrisImagePath === '') {
        updates.qrisImagePath = null;
      } else if (typeof body.qrisImagePath === 'string') {
        const clean = body.qrisImagePath.trim();
        if (!clean.startsWith('uploads/qris_image/') || clean.includes('..')) {
          return json(response, 400, {
            error: 'qrisImagePath tidak valid: harus diawali uploads/qris_image/ dan tidak boleh mengandung traversal (..)'
          });
        }
        updates.qrisImagePath = clean;
      }
    }

    await campaignRef.set(updates, { merge: true });
    const updatedSnap = await campaignRef.get();

    return json(response, 200, {
      success: true,
      campaign: { id: updatedSnap.id, ...updatedSnap.data() }
    });
  } catch (error) {
    console.error('handleUpdateCampaign error:', error);
    return json(response, 500, { error: 'Gagal memperbarui program revitalisasi' });
  }
}

/**
 * POST /api/v1/campaigns/:id/updates
 * Pengelola (for managed springs) or Admin posts a progress update.
 * Atomically writes to revitalization_updates and updates campaign.progressPercent.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [campaignIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleCreateCampaignUpdate(request, response, campaignIdOrDeps, maybeDeps = {}) {
  const campaignId = typeof campaignIdOrDeps === 'string'
    ? campaignIdOrDeps
    : (request.query?.id || request.query?.campaignId || null);
  const deps = typeof campaignIdOrDeps === 'object' && campaignIdOrDeps !== null ? campaignIdOrDeps : maybeDeps;

  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (!campaignId || typeof campaignId !== 'string') {
    return json(response, 400, { error: 'ID program revitalisasi wajib disertakan' });
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

  const { title, notes, progressPercent, photoPath: rawPhotoPath, spentAmount } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return json(response, 400, { error: 'title (judul update) wajib diisi' });
  }

  const progressNum = Number(progressPercent);
  if (
    typeof progressPercent !== 'number' ||
    isNaN(progressNum) ||
    progressNum < 0 ||
    progressNum > 100
  ) {
    return json(response, 400, { error: 'progressPercent harus berupa angka 0-100' });
  }

  let cleanPhotoPath = null;
  if (rawPhotoPath !== undefined && rawPhotoPath !== null && rawPhotoPath !== '') {
    if (typeof rawPhotoPath !== 'string') {
      return json(response, 400, { error: 'photoPath harus berupa string' });
    }
    const clean = rawPhotoPath.trim();
    if (!clean.startsWith('uploads/revitalization_photo/') || clean.includes('..')) {
      return json(response, 400, {
        error: 'photoPath tidak valid: harus diawali uploads/revitalization_photo/ dan tidak boleh mengandung traversal (..)'
      });
    }
    cleanPhotoPath = clean;
  }

  let cleanSpentAmount = null;
  if (spentAmount !== undefined && spentAmount !== null) {
    const spentNum = Number(spentAmount);
    if (typeof spentNum === 'number' && !isNaN(spentNum) && spentNum >= 0) {
      cleanSpentAmount = spentNum;
    }
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();

    const campaignRef = db.collection('revitalization_campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      return json(response, 404, { error: 'Program revitalisasi tidak ditemukan' });
    }

    const campaignData = campaignSnap.data();

    // Cross-spring privilege check for pengelola
    if (!auth.roles.includes('admin')) {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
      if (!hasSpringAccess(auth.roles, managedSpringIds, campaignData.springId)) {
        return json(response, 403, {
          error: `Forbidden: Anda tidak memiliki akses ke mata air ${campaignData.springId}`
        });
      }
    }

    const updateId = `UPD-${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const updateData = {
      id: updateId,
      campaignId,
      springId: campaignData.springId,
      authorUid: auth.user.uid,
      authorName: auth.user.displayName || auth.user.name || 'Pengelola',
      authorRole: auth.roles.includes('admin') ? 'admin' : 'pengelola',
      title: title.trim(),
      notes: typeof notes === 'string' ? notes.trim() : '',
      progressPercent: Math.round(progressNum),
      photoPath: cleanPhotoPath,
      spentAmount: cleanSpentAmount,
      createdAt: nowIso
    };

    // Run Firestore transaction to atomically create update + update parent campaign
    await db.runTransaction(async (transaction) => {
      const freshCampaign = await transaction.get(campaignRef);
      if (!freshCampaign.exists) {
        const err = new Error('Program revitalisasi tidak ditemukan');
        err.status = 404;
        throw err;
      }
      const updateRef = db.collection('revitalization_updates').doc(updateId);
      transaction.set(updateRef, updateData);
      transaction.update(campaignRef, {
        progressPercent: Math.round(progressNum),
        updatedAt: nowIso
      });
    });

    return json(response, 201, {
      success: true,
      update: updateData
    });
  } catch (error) {
    if (error.status) {
      return json(response, error.status, { error: error.message });
    }
    console.error('handleCreateCampaignUpdate error:', error);
    return json(response, 500, { error: 'Gagal membuat update progres revitalisasi' });
  }
}
