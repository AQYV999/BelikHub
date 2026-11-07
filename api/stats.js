// api/stats.js
// GET /api/stats - statistik publik laporan terverifikasi (tanpa data pribadi)

import { getAdminDb } from '../lib/firebase-admin.js';
import { json } from '../lib/auth.js';

const TYPES = ['Survei Mata Air', 'Restorasi Mata Air', 'Penanaman Pohon', 'Pembangunan Rorak'];

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const db = getAdminDb();
    const approved = db.collection('reports').where('status', '==', 'approved');

    const [totalSnap, typeSnaps, recentSnap] = await Promise.all([
      approved.count().get(),
      Promise.all(TYPES.map((t) => approved.where('reportType', '==', t).count().get())),
      approved.orderBy('createdAt', 'desc').limit(5).get()
    ]);

    const byType = {};
    TYPES.forEach((t, i) => {
      byType[t] = typeSnaps[i].data().count;
    });

    const recent = recentSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        reportType: d.reportType,
        location: d.location,
        createdAt: toIso(d.createdAt)
      };
    });

    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return json(response, 200, {
      totalApproved: totalSnap.data().count,
      byType,
      recent
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return json(response, 500, { error: 'Failed to fetch stats' });
  }
}