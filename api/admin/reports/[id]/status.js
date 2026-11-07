// api/admin/reports/[id]/status.js
// PATCH /api/admin/reports/:id/status  (wajib admin)
// Body: { "status": "pending" | "approved" | "rejected" }
// Poin dikreditkan ke user HANYA saat laporan berubah menjadi 'approved',
// dan ditarik kembali bila laporan yang sudah 'approved' diubah ke status lain.

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebase-admin.js';
import { requireAdmin, json } from '../../../../lib/auth.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAdmin(request, response);
    if (!authResult.success) {
      return json(response, authResult.status, { error: authResult.error });
    }

    const reportId = request.query.id;
    if (!reportId || typeof reportId !== 'string') {
      return json(response, 400, { error: 'Report ID is required' });
    }

    const status = request.body && request.body.status;
    if (!status || !VALID_STATUSES.includes(status)) {
      return json(response, 400, {
        error: 'Invalid status',
        validStatuses: VALID_STATUSES
      });
    }

    const db = getAdminDb();
    const reportRef = db.collection('reports').doc(reportId);
    const reviewerUid = authResult.user.uid;

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(reportRef);
      if (!snap.exists) return null;

      const data = snap.data();
      const previous = data.status;
      const points = Number(data.points) || 0;
      const now = new Date();

      let delta = 0;
      if (previous !== 'approved' && status === 'approved') delta = points;
      else if (previous === 'approved' && status !== 'approved') delta = -points;

      const patch = {
        status,
        updatedAt: now,
        reviewedBy: reviewerUid,
        reviewedAt: now
      };

      tx.update(reportRef, patch);

      if (delta !== 0 && data.userId) {
        tx.set(
          db.collection('users').doc(data.userId),
          { points: FieldValue.increment(delta), updatedAt: now },
          { merge: true }
        );
      }

      return { id: snap.id, data: { ...data, ...patch } };
    });

    if (!result) {
      return json(response, 404, { error: 'Report not found' });
    }

    const d = result.data;
    return json(response, 200, {
      id: result.id,
      ...d,
      createdAt: toIso(d.createdAt),
      updatedAt: toIso(d.updatedAt),
      reviewedAt: toIso(d.reviewedAt)
    });
  } catch (error) {
    console.error('PATCH /api/admin/reports/:id/status error:', error);
    return json(response, 500, { error: 'Failed to update report status' });
  }
}