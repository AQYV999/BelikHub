// lib/v1/retributions.js
// Retribution billing engine, deterministic generation, proof submission, cash recording, and verification

import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import {
  requireRole as defaultRequireRole,
  hasSpringAccess,
  json
} from '../auth.js';
import { setCors, parseJsonBody, isValidPeriod } from './http.js';
import { resolveSignedReadUrl as defaultResolveSignedReadUrl } from './uploads.js';
import { resolveManagedSpringIds } from './residents.js';

export const VALID_PAYMENT_METHODS = ['cash', 'transfer', 'qris'];

/**
 * List retribution bills with role-based scoping and financial summary.
 * - Warga: only sees own bills (userId === uid or residentId === userDoc.residentId).
 * - Pengelola: filtered to managedSpringIds.
 * - Admin: sees all or filtered by query.
 * Resolves 1-hour signed read URLs for proofPath.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleListRetributions(request, response, deps = {}) {
  setCors(response, 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['warga', 'pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();
  const resolveUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

  const roles = auth.roles;
  const isAdmin = roles.includes('admin');
  const isPengelola = roles.includes('pengelola');
  const isWarga = roles.includes('warga');

  const querySpringId = request.query?.springId ? String(request.query.springId).trim() : null;
  const queryPeriod = request.query?.period ? String(request.query.period).trim() : null;
  const queryStatus = request.query?.status ? String(request.query.status).trim() : null;

  let bills = [];

  try {
    if (isAdmin) {
      const snap = await db.collection('retribution_bills').get();
      bills = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (querySpringId) {
        bills = bills.filter((b) => b.springId === querySpringId);
      }
      if (request.query?.residentId) {
        const queryResId = String(request.query.residentId).trim();
        bills = bills.filter((b) => b.residentId === queryResId);
      }
    } else if (isPengelola) {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);

      if (querySpringId) {
        if (!managedSpringIds.includes(querySpringId)) {
          return json(response, 403, {
            error: `Forbidden: Anda tidak memiliki akses ke tagihan mata air ${querySpringId}`
          });
        }
        const snap = await db.collection('retribution_bills').where('springId', '==', querySpringId).get();
        bills = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } else {
        if (managedSpringIds.length === 0) {
          bills = [];
        } else {
          const snap = await db.collection('retribution_bills').get();
          bills = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((b) => managedSpringIds.includes(b.springId));
        }
      }
    } else if (isWarga) {
      // Warga caller: load user doc to find residentId
      let residentId = null;
      try {
        const userDoc = await db.collection('users').doc(auth.user.uid).get();
        if (userDoc.exists) {
          residentId = userDoc.data().residentId || null;
        }
      } catch {
        // fallback
      }

      // Query by userId
      const userBillsSnap = await db.collection('retribution_bills').where('userId', '==', auth.user.uid).get();
      const userBills = userBillsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const seenIds = new Set(userBills.map((b) => b.id));
      bills = [...userBills];

      // Also query by residentId to guarantee zero missing bills
      if (residentId) {
        const residentBillsSnap = await db.collection('retribution_bills').where('residentId', '==', residentId).get();
        for (const d of residentBillsSnap.docs) {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            bills.push({ id: d.id, ...d.data() });
          }
        }
      }
    }

    // Apply period and status filters if supplied
    if (queryPeriod) {
      bills = bills.filter((b) => b.period === queryPeriod);
    }
    if (queryStatus) {
      bills = bills.filter((b) => b.status === queryStatus);
    }

    // Sort bills: period descending, createdAt descending
    bills.sort((a, b) => {
      const periodCompare = (b.period || '').localeCompare(a.period || '');
      if (periodCompare !== 0) return periodCompare;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    // Calculate financial summary
    let totalBilled = 0;
    let totalPaid = 0;
    let totalCash = 0;
    let totalNonCash = 0;
    let unpaidCount = 0;
    let pendingCount = 0;
    let paidCount = 0;

    for (const bill of bills) {
      const amount = Number(bill.amount) || 0;
      totalBilled += amount;

      if (bill.status === 'paid') {
        totalPaid += amount;
        paidCount++;
        if (bill.paymentMethod === 'cash') {
          totalCash += amount;
        } else {
          totalNonCash += amount;
        }
      } else if (bill.status === 'pending_verification') {
        pendingCount++;
      } else if (bill.status === 'unpaid') {
        unpaidCount++;
      }
    }

    // Resolve signed proof URLs concurrently via Promise.all to prevent sequential latency waterfalls
    await Promise.all(
      bills.map(async (bill) => {
        bill.proofUrl = bill.proofPath ? await resolveUrl(bill.proofPath, deps) : null;
      })
    );

    return json(response, 200, {
      success: true,
      bills,
      summary: {
        totalBilled,
        totalPaid,
        totalCash,
        totalNonCash,
        unpaidCount,
        pendingCount,
        paidCount
      }
    });
  } catch (error) {
    console.error('handleListRetributions error:', error);
    return json(response, 500, { error: 'Gagal memuat daftar tagihan retribusi' });
  }
}

/**
 * Idempotently generate retribution bills for active residents on a spring.
 * Deterministic doc ID: retribution_bills/${springId}_${residentId}_${period}
 * Skips already-existing bill documents.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleGenerateBills(request, response, deps = {}) {
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

  const { springId, period } = body;

  if (!springId || typeof springId !== 'string' || !springId.trim()) {
    return json(response, 400, { error: 'springId mata air wajib diisi' });
  }

  if (!period || typeof period !== 'string' || !isValidPeriod(period.trim())) {
    return json(response, 400, {
      error: 'Format periode tidak valid (harus YYYY-MM dengan bulan 01-12, contoh: 2026-11)'
    });
  }

  const cleanSpringId = springId.trim();
  const cleanPeriod = period.trim();

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

  try {
    // Query active residents for this spring
    const snap = await db.collection('residents').where('springId', '==', cleanSpringId).get();
    const activeResidents = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.active !== false);

    let createdCount = 0;
    let skippedCount = 0;

    for (const resident of activeResidents) {
      const docId = `${cleanSpringId}_${resident.id}_${cleanPeriod}`;
      const billRef = db.collection('retribution_bills').doc(docId);
      const existing = await billRef.get();

      if (existing.exists) {
        skippedCount++;
      } else {
        const newBill = {
          id: docId,
          springId: cleanSpringId,
          residentId: resident.id,
          residentName: resident.name || null,
          userId: resident.userId || null,
          period: cleanPeriod,
          amount: Number(resident.monthlyFee) || 0,
          status: 'unpaid',
          paymentMethod: null,
          proofPath: null,
          rejectionReason: null,
          paidAt: null,
          verifiedByUid: null,
          recordedByUid: null,
          generatedByUid: auth.user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await billRef.set(newBill);
        createdCount++;
      }
    }

    return json(response, 200, {
      success: true,
      createdCount,
      skippedCount,
      period: cleanPeriod,
      springId: cleanSpringId
    });
  } catch (error) {
    console.error('handleGenerateBills error:', error);
    return json(response, 500, { error: 'Gagal membuat tagihan retribusi' });
  }
}

/**
 * Handle bill lifecycle updates:
 * - action: 'submit_proof' (warga owner only; status unpaid|rejected -> pending_verification)
 * - action: 'record_cash' (pengelola with spring access or admin; sets status paid, method cash)
 * - action: 'approve' (pengelola with spring access or admin; status pending_verification -> paid)
 * - action: 'reject' (pengelola with spring access or admin; requires rejectionReason -> status rejected)
 * @param {object} request
 * @param {object} response
 * @param {string} [billId]
 * @param {object} [deps={}]
 */
export async function handleUpdateRetribution(request, response, billId, deps = {}) {
  setCors(response, 'PATCH, POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH' && request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireRoleFn = deps.requireRole || defaultRequireRole;
  const auth = await requireRoleFn(request, response, ['warga', 'pengelola', 'admin'], deps);
  if (!auth.success) {
    return json(response, auth.status || 403, { error: auth.error || 'Akses ditolak' });
  }

  const id = billId || request.query?.id || request.query?.billId;
  if (!id || typeof id !== 'string') {
    return json(response, 400, { error: 'billId wajib disertakan' });
  }

  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { action } = body;
  if (!action || typeof action !== 'string') {
    return json(response, 400, { error: 'Aksi (action) wajib disertakan' });
  }

  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const db = getAdminDb();

  const billRef = db.collection('retribution_bills').doc(id);
  const billSnap = await billRef.get();
  if (!billSnap.exists) {
    return json(response, 404, { error: 'Tagihan retribusi tidak ditemukan' });
  }

  const bill = billSnap.data();
  const isAdmin = auth.roles.includes('admin');

  // Case 1: submit_proof (Warga only)
  if (action === 'submit_proof') {
    // Check ownership: caller must be owner (userId === uid or residentId === userDoc.residentId)
    let isOwner = bill.userId === auth.user.uid;
    if (!isOwner) {
      try {
        const userDoc = await db.collection('users').doc(auth.user.uid).get();
        if (userDoc.exists && userDoc.data().residentId === bill.residentId) {
          isOwner = true;
        }
      } catch {
        // continue
      }
    }

    if (!isOwner) {
      return json(response, 403, {
        error: 'Forbidden: Anda bukan pemilik tagihan ini'
      });
    }

    if (bill.status === 'paid') {
      return json(response, 400, { error: 'Tagihan sudah lunas' });
    }
    if (bill.status === 'pending_verification') {
      return json(response, 400, { error: 'Tagihan sedang menunggu verifikasi' });
    }

    const { paymentMethod, proofPath } = body;
    if (!paymentMethod || !['transfer', 'qris'].includes(paymentMethod)) {
      return json(response, 400, {
        error: 'Metode pembayaran untuk upload bukti harus "transfer" atau "qris"'
      });
    }

    if (
      !proofPath ||
      typeof proofPath !== 'string' ||
      !proofPath.startsWith('uploads/retribution_proof/') ||
      proofPath.includes('..')
    ) {
      return json(response, 400, {
        error: 'proofPath tidak valid (harus diawali uploads/retribution_proof/ dan tidak boleh traversal)'
      });
    }

    const updates = {
      status: 'pending_verification',
      paymentMethod,
      proofPath: proofPath.trim(),
      submittedAt: new Date().toISOString(),
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    };

    if (!bill.userId) {
      updates.userId = auth.user.uid;
    }

    try {
      await billRef.update(updates);
      return json(response, 200, {
        success: true,
        bill: {
          ...bill,
          ...updates,
          id
        }
      });
    } catch (error) {
      console.error('submit_proof update error:', error);
      return json(response, 500, { error: 'Gagal mengirimkan bukti pembayaran' });
    }
  }

  // Case 2: record_cash (Pengelola with spring access or Admin)
  if (action === 'record_cash') {
    if (!auth.roles.includes('pengelola') && !isAdmin) {
      return json(response, 403, { error: 'Hanya pengelola atau admin yang dapat mencatat pembayaran tunai' });
    }

    if (!isAdmin) {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
      if (!hasSpringAccess(auth.roles, managedSpringIds, bill.springId)) {
        return json(response, 403, {
          error: `Forbidden: Anda tidak memiliki akses ke mata air ${bill.springId}`
        });
      }
    }

    if (bill.status === 'paid') {
      return json(response, 400, { error: 'Tagihan sudah berstatus lunas' });
    }

    const updates = {
      status: 'paid',
      paymentMethod: 'cash',
      recordedByUid: auth.user.uid,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await billRef.update(updates);
      return json(response, 200, {
        success: true,
        bill: {
          ...bill,
          ...updates,
          id
        }
      });
    } catch (error) {
      console.error('record_cash error:', error);
      return json(response, 500, { error: 'Gagal mencatat pembayaran tunai' });
    }
  }

  // Case 3: approve (Pengelola with spring access or Admin)
  if (action === 'approve') {
    if (!auth.roles.includes('pengelola') && !isAdmin) {
      return json(response, 403, { error: 'Hanya pengelola atau admin yang dapat menyetujui pembayaran' });
    }

    if (!isAdmin) {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
      if (!hasSpringAccess(auth.roles, managedSpringIds, bill.springId)) {
        return json(response, 403, {
          error: `Forbidden: Anda tidak memiliki akses ke mata air ${bill.springId}`
        });
      }
    }

    if (bill.status !== 'pending_verification') {
      return json(response, 400, {
        error: 'Hanya tagihan dengan status pending_verification yang dapat disetujui'
      });
    }

    const updates = {
      status: 'paid',
      verifiedByUid: auth.user.uid,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await billRef.update(updates);
      return json(response, 200, {
        success: true,
        bill: {
          ...bill,
          ...updates,
          id
        }
      });
    } catch (error) {
      console.error('approve retribution error:', error);
      return json(response, 500, { error: 'Gagal menyetujui pembayaran' });
    }
  }

  // Case 4: reject (Pengelola with spring access or Admin)
  if (action === 'reject') {
    if (!auth.roles.includes('pengelola') && !isAdmin) {
      return json(response, 403, { error: 'Hanya pengelola atau admin yang dapat menolak pembayaran' });
    }

    if (!isAdmin) {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);
      if (!hasSpringAccess(auth.roles, managedSpringIds, bill.springId)) {
        return json(response, 403, {
          error: `Forbidden: Anda tidak memiliki akses ke mata air ${bill.springId}`
        });
      }
    }

    if (bill.status !== 'pending_verification') {
      return json(response, 400, {
        error: 'Hanya tagihan dengan status pending_verification yang dapat ditolak'
      });
    }

    const { rejectionReason } = body;
    if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
      return json(response, 400, {
        error: 'Alasan penolakan (rejectionReason) wajib diisi'
      });
    }

    const updates = {
      status: 'rejected',
      rejectionReason: rejectionReason.trim(),
      rejectedByUid: auth.user.uid,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await billRef.update(updates);
      return json(response, 200, {
        success: true,
        bill: {
          ...bill,
          ...updates,
          id
        }
      });
    } catch (error) {
      console.error('reject retribution error:', error);
      return json(response, 500, { error: 'Gagal menolak pembayaran' });
    }
  }

  return json(response, 400, { error: `Aksi "${action}" tidak valid` });
}
