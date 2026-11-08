// api/reports.js
// GET  /api/reports  - daftar laporan PUBLIK (hanya yang approved, tanpa data pribadi)
//                      admin boleh ?scope=all untuk semua status + koordinat asli
// POST /api/reports  - buat laporan (wajib login)

import { getAdminDb } from '../lib/firebase-admin.js';
import { requireAuth, optionalAuth, json } from '../lib/auth.js';

const MAX_PER_DAY = 10;
const PHOTO_PREFIXES = [
  'https://firebasestorage.googleapis.com/',
  'https://storage.googleapis.com/'
];

function calculatePoints(reportType) {
  const type = (reportType || '').toLowerCase();
  if (type.includes('restor')) return 1000;
  if (type.includes('rorak')) return 500;
  return 100;
}

function validateReport(data) {
  const errors = {};
  if (!data || typeof data !== 'object') return { body: 'body tidak valid' };

  if (typeof data.reportType !== 'string' || !data.reportType.trim() || data.reportType.length > 100)
    errors.reportType = 'reportType wajib, maksimal 100 karakter';
  if (typeof data.location !== 'string' || !data.location.trim() || data.location.length > 200)
    errors.location = 'location wajib, maksimal 200 karakter';
  if (typeof data.notes !== 'string' || !data.notes.trim() || data.notes.length > 2000)
    errors.notes = 'notes wajib, maksimal 2000 karakter';

  const hasLat = data.lat !== undefined && data.lat !== null && data.lat !== '';
  const hasLng = data.lng !== undefined && data.lng !== null && data.lng !== '';
  if (hasLat !== hasLng) {
    errors.coordinates = 'lat dan lng harus diisi bersamaan';
  } else if (hasLat) {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (!Number.isFinite(lat) || lat < -11.5 || lat > 6.5) errors.lat = 'lat di luar wilayah Indonesia';
    if (!Number.isFinite(lng) || lng < 94 || lng > 141.5) errors.lng = 'lng di luar wilayah Indonesia';
  }

  if (data.photoUrl) {
    if (typeof data.photoUrl !== 'string' || data.photoUrl.length > 1000 ||
        !PHOTO_PREFIXES.some(p => data.photoUrl.startsWith(p))) {
      errors.photoUrl = 'photoUrl harus berasal dari Firebase Storage';
    }
  }
  return Object.keys(errors).length ? errors : null;
}

// Samarkan koordinat ke grid ~5,5 km (0,05 derajat). Deterministik, tidak bisa dibalik.
function fuzz(n) {
  return Math.round(n / 0.05) * 0.05;
}

function iso(v) {
  return v?.toDate?.()?.toISOString() || v || null;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') return response.status(200).end();

  const db = getAdminDb();

  // ---------- GET ----------
  if (request.method === 'GET') {
    try {
      const auth = await optionalAuth(request, response);
      const isAdmin = !!auth.user?.admin;
      const wantAll = isAdmin && request.query.scope === 'all';
      const limit = Math.min(parseInt(request.query.limit) || 50, 100);

      // Hanya satu filter di Firestore (tanpa orderBy) supaya tidak butuh composite index.
      let q = db.collection('reports');
      if (!wantAll) q = q.where('status', '==', 'approved');
      else if (request.query.status) q = q.where('status', '==', request.query.status);

      const snap = await q.limit(300).get();
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        .slice(0, limit)
        .map(r => {
          const hasCoord = typeof r.lat === 'number' && typeof r.lng === 'number';
          const base = {
            id: r.id,
            reportType: r.reportType,
            location: r.location,
            notes: r.notes,
            photoUrl: r.photoUrl || null,
            status: r.status,
            createdAt: iso(r.createdAt)
          };
          if (hasCoord) {
            base.lat = wantAll ? r.lat : fuzz(r.lat);
            base.lng = wantAll ? r.lng : fuzz(r.lng);
          }
          if (wantAll) {
            base.authorName = r.authorName;
            base.authorEmail = r.authorEmail;
            base.points = r.points;
          }
          return base;
        });

      response.setHeader('Cache-Control', wantAll ? 'private, no-store' : 'public, s-maxage=60');
      return json(response, 200, { reports: rows, total: rows.length });
    } catch (error) {
      console.error('GET /api/reports error:', error);
      return json(response, 500, { error: 'Failed to fetch reports' });
    }
  }

  // ---------- POST ----------
  if (request.method === 'POST') {
    try {
      const auth = await requireAuth(request, response);
      if (!auth.success) return json(response, auth.status, { error: auth.error });

      const body = request.body;
      const errors = validateReport(body);
      if (errors) return json(response, 400, { error: 'Validation failed', details: errors });

      // Batas harian per pengguna (filter waktu di memori, tanpa composite index)
      const since = Date.now() - 24 * 60 * 60 * 1000;
      const mine = await db.collection('reports').where('userId', '==', auth.user.uid).limit(50).get();
      const recent = mine.docs.filter(d => (d.data().createdAt?.toMillis?.() ?? 0) > since).length;
      if (recent >= MAX_PER_DAY) {
        return json(response, 429, { error: `Batas ${MAX_PER_DAY} laporan per 24 jam tercapai` });
      }

      const now = new Date();
      const data = {
        userId: auth.user.uid,
        authorName: auth.user.name || auth.user.email?.split('@')[0] || 'Anonim',
        authorEmail: auth.user.email || null,
        reportType: body.reportType.trim(),
        location: body.location.trim(),
        notes: body.notes.trim(),
        photoUrl: body.photoUrl || null,
        points: calculatePoints(body.reportType),
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      if (body.lat !== undefined && body.lat !== null && body.lat !== '') {
        data.lat = Number(body.lat);
        data.lng = Number(body.lng);
      }

      const ref = await db.collection('reports').add(data);
      // Respons ke pelapor sendiri: jangan kirim balik email
      return json(response, 201, {
        id: ref.id,
        reportType: data.reportType,
        location: data.location,
        status: data.status,
        points: data.points,
        createdAt: now.toISOString()
      });
    } catch (error) {
      console.error('POST /api/reports error:', error);
      return json(response, 500, { error: 'Failed to create report' });
    }
  }

  return json(response, 405, { error: 'Method not allowed' });
}
