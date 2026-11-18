// lib/v1/donations.js
// Donations listing, submission, and atomic transaction-safe verification engine

import { FieldValue as adminFieldValue } from 'firebase-admin/firestore';
import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import {
  requireAuth as defaultRequireAuth,
  requireRole as defaultRequireRole,
  extractRoles,
  json
} from '../auth.js';
import { resolveSignedReadUrl as defaultResolveSignedReadUrl } from './uploads.js';
import { setCors, parseJsonBody, formatIso } from './http.js';

export const VALID_DONOR_TYPES = ['individual', 'organization'];
export const MIN_DONATION_AMOUNT = 1000;

/**
 * Return an increment object compatible with both real Firestore and mock-firebase
 * @param {number} amount
 * @param {object} [deps={}]
 * @returns {object}
 */
function getFieldValueIncrement(amount, deps = {}) {
  if (deps.FieldValue && typeof deps.FieldValue.increment === 'function') {
    return deps.FieldValue.increment(amount);
  }
  try {
    const inc = adminFieldValue.increment(amount);
    // Attach _methodName for mock-firebase test double compatibility
    inc._methodName = 'FieldValue.increment';
    return inc;
  } catch {
    return { _methodName: 'FieldValue.increment', operand: amount };
  }
}

/**
 * GET /api/v1/donations
 * Lists donations. Donors see only their own; Admins see all.
 * Concurrently resolves proofUrls using Promise.all.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleListDonations(request, response, deps = {}) {
  setCors(response, 'GET, POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Autentikasi diperlukan' });
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();
    const resolveSignedUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

    const roles = extractRoles(auth.user);
    const isAdmin = Boolean(auth.user.admin || roles.includes('admin'));

    let queryRef = db.collection('donations');

    if (!isAdmin) {
      // Donors only see their own donations
      queryRef = queryRef.where('donorUid', '==', auth.user.uid);
    } else {
      // Admin optional query filters
      if (request.query?.campaignId) {
        queryRef = queryRef.where('campaignId', '==', String(request.query.campaignId).trim());
      }
      if (request.query?.status) {
        queryRef = queryRef.where('status', '==', String(request.query.status).trim());
      }
    }

    const snap = await queryRef.get();
    const donationsRaw = [];
    snap.forEach((doc) => {
      donationsRaw.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt descending
    donationsRaw.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Concurrently resolve signed proofUrls
    const donations = await Promise.all(
      donationsRaw.map(async (d) => {
        let proofUrl = null;
        if (d.proofPath) {
          proofUrl = await resolveSignedUrl(d.proofPath, deps);
        }
        return {
          ...d,
          proofUrl,
          createdAt: formatIso(d.createdAt),
          updatedAt: formatIso(d.updatedAt)
        };
      })
    );

    return json(response, 200, {
      success: true,
      donations
    });
  } catch (error) {
    console.error('handleListDonations error:', error);
    return json(response, 500, { error: 'Gagal mengambil riwayat donasi' });
  }
}

/**
 * POST /api/v1/donations
 * Creates a new donation with pending_verification status.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleCreateDonation(request, response, deps = {}) {
  setCors(response, 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Autentikasi diperlukan' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const {
    campaignId,
    amount,
    donorType: rawDonorType,
    organizationName,
    isAnonymous,
    paymentMethod,
    proofPath: rawProofPath
  } = body;

  if (!campaignId || typeof campaignId !== 'string' || !campaignId.trim()) {
    return json(response, 400, { error: 'campaignId wajib disertakan' });
  }

  const amountNum = Number(amount);
  if (typeof amount !== 'number' || isNaN(amountNum) || amountNum < MIN_DONATION_AMOUNT) {
    return json(response, 400, {
      error: `Nominal donasi minimal Rp ${MIN_DONATION_AMOUNT.toLocaleString('id-ID')}`
    });
  }

  let donorType = 'individual';
  if (rawDonorType !== undefined && rawDonorType !== null) {
    if (!VALID_DONOR_TYPES.includes(rawDonorType)) {
      return json(response, 400, {
        error: `donorType tidak valid: harus salah satu dari ${VALID_DONOR_TYPES.join(', ')}`
      });
    }
    donorType = rawDonorType;
  }

  let cleanProofPath = null;
  if (rawProofPath !== undefined && rawProofPath !== null && rawProofPath !== '') {
    if (typeof rawProofPath !== 'string') {
      return json(response, 400, { error: 'proofPath harus berupa string' });
    }
    const clean = rawProofPath.trim();
    if (!clean.startsWith('uploads/donation_proof/') || clean.includes('..')) {
      return json(response, 400, {
        error: 'proofPath tidak valid: harus diawali uploads/donation_proof/ dan tidak boleh mengandung traversal (..)'
      });
    }
    cleanProofPath = clean;
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();

    // Verify campaign exists and is active
    const cleanCampaignId = campaignId.trim();
    const campaignSnap = await db.collection('revitalization_campaigns').doc(cleanCampaignId).get();
    if (!campaignSnap.exists) {
      return json(response, 404, { error: 'Program revitalisasi tidak ditemukan' });
    }

    const campaign = campaignSnap.data();
    if (campaign.status !== 'active') {
      return json(response, 400, { error: 'Program revitalisasi tidak sedang aktif' });
    }

    const donationId = body.id && typeof body.id === 'string'
      ? body.id.trim()
      : `DON-${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const nowIso = new Date().toISOString();
    const donationData = {
      id: donationId,
      campaignId: cleanCampaignId,
      campaignTitle: campaign.title,
      springId: campaign.springId,
      springName: campaign.springName || null,
      donorUid: auth.user.uid,
      donorName: body.donorName || auth.user.displayName || auth.user.name || 'Donatur',
      donorEmail: auth.user.email || null,
      donorType,
      organizationName: donorType === 'organization'
        ? (typeof organizationName === 'string' ? organizationName.trim() : null)
        : null,
      isAnonymous: Boolean(isAnonymous),
      amount: amountNum,
      paymentMethod: typeof paymentMethod === 'string' ? paymentMethod.trim() : 'transfer',
      proofPath: cleanProofPath,
      status: 'pending_verification',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await db.collection('donations').doc(donationId).set(donationData);

    return json(response, 201, {
      success: true,
      donation: donationData
    });
  } catch (error) {
    console.error('handleCreateDonation error:', error);
    return json(response, 500, { error: 'Gagal membuat donasi' });
  }
}

/**
 * Admin-only PATCH /api/v1/donations/:id
 * Verifies or rejects a donation.
 * Critical review focus #1:
 * MUST read both donation and campaign inside db.runTransaction (transaction.get),
 * assert donation.status === 'pending_verification' (fail with 409 otherwise),
 * and atomically mark verified + increment campaign.collectedAmount.
 * @param {object} request
 * @param {object} response
 * @param {string | object} [donationIdOrDeps]
 * @param {object} [maybeDeps={}]
 */
export async function handleVerifyDonation(request, response, donationIdOrDeps, maybeDeps = {}) {
  const donationId = typeof donationIdOrDeps === 'string'
    ? donationIdOrDeps
    : (request.query?.id || request.query?.donationId || null);
  const deps = typeof donationIdOrDeps === 'object' && donationIdOrDeps !== null ? donationIdOrDeps : maybeDeps;

  setCors(response, 'PATCH, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  if (!donationId || typeof donationId !== 'string') {
    return json(response, 400, { error: 'ID donasi wajib disertakan' });
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

  const { action, rejectionReason } = body;
  if (action !== 'approve' && action !== 'reject') {
    return json(response, 400, { error: "Aksi harus berupa 'approve' atau 'reject'" });
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();
    const nowIso = new Date().toISOString();

    const donationRef = db.collection('donations').doc(donationId);

    await db.runTransaction(async (transaction) => {
      // 1. Read donation inside transaction
      const donationSnap = await transaction.get(donationRef);
      if (!donationSnap.exists) {
        const err = new Error('Donasi tidak ditemukan');
        err.status = 404;
        throw err;
      }

      const donation = donationSnap.data();

      // 2. Strict status check to prevent race condition & double-crediting
      if (donation.status !== 'pending_verification') {
        const err = new Error(
          `Donasi sudah diproses sebelumnya (status saat ini: ${donation.status}). Approval kedua tidak diizinkan.`
        );
        err.status = 409;
        throw err;
      }

      // 3. Process action
      if (action === 'approve') {
        const campaignRef = db.collection('revitalization_campaigns').doc(donation.campaignId);
        const campaignSnap = await transaction.get(campaignRef);

        transaction.update(donationRef, {
          status: 'verified',
          verifiedByUid: auth.user.uid,
          verifiedAt: nowIso,
          updatedAt: nowIso
        });

        if (campaignSnap.exists) {
          const inc = getFieldValueIncrement(Number(donation.amount), deps);
          transaction.update(campaignRef, {
            collectedAmount: inc,
            updatedAt: nowIso
          });
        }
      } else {
        // action === 'reject'
        transaction.update(donationRef, {
          status: 'rejected',
          rejectionReason: typeof rejectionReason === 'string' && rejectionReason.trim()
            ? rejectionReason.trim()
            : 'Ditolak oleh admin',
          verifiedByUid: auth.user.uid,
          verifiedAt: nowIso,
          updatedAt: nowIso
        });
      }
    });

    return json(response, 200, {
      success: true,
      message: action === 'approve' ? 'Donasi berhasil disetujui' : 'Donasi berhasil ditolak',
      donationId,
      status: action === 'approve' ? 'verified' : 'rejected'
    });
  } catch (error) {
    if (error.status) {
      return json(response, error.status, { error: error.message });
    }
    console.error('handleVerifyDonation error:', error);
    return json(response, 500, { error: 'Gagal memproses verifikasi donasi' });
  }
}
