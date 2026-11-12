// api/admin/reports/[id]/status.js
// PATCH /api/admin/reports/:id/status  - wajib admin
// Saat laporan pertama kali disetujui, poin otomatis masuk ke users/{uid}.

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebase-admin.js';
import { requireAdmin, json } from '../../../../lib/auth.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'PATCH') return json(response, 405, { error: 'Method not allowed' });

  try {
    const auth = await requireAdmin(request, response);
    if (!auth.success) return json(response, auth.status, { error: auth.error });

    const reportId = request.query?.id;
    if (typeof reportId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(reportId)) {
      return json(response, 400, { error: 'Valid Report ID is required' });
    }

    const body = request.body;
    const status = body && typeof body === 'object' ? body.status : undefined;
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
      return json(response, 400, { error: 'Invalid status', validStatuses: VALID_STATUSES });
    }

    const db = getAdminDb();
    const reportRef = db.collection('reports').doc(reportId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(reportRef);
      if (!snap.exists) return { notFound: true };

      const report = snap.data();
      const firstApproval = status === 'approved' && !report.pointsAwarded;

      tx.update(reportRef, {
        status,
        updatedAt: new Date(),
        reviewedBy: auth.user.uid,
        reviewedAt: new Date(),
        ...(firstApproval ? { pointsAwarded: true } : {})
      });

      if (firstApproval && report.userId) {
        tx.set(
          db.collection('users').doc(report.userId),
          {
            points: FieldValue.increment(report.points || 0),
            approvedReports: FieldValue.increment(1)
          },
          { merge: true }
        );
      }
      return { ok: true, awarded: firstApproval ? report.points || 0 : 0 };
    });

    if (result.notFound) return json(response, 404, { error: 'Report not found' });
    return json(response, 200, { id: reportId, status, pointsAwarded: result.awarded });
  } catch (error) {
    console.error('PATCH /api/admin/reports/:id/status error:', error);
    return json(response, 500, { error: 'Failed to update report status' });
  }
}
