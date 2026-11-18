// api/reports.js
// GET  /api/reports  - daftar laporan PUBLIK (hanya yang approved, tanpa data pribadi)
//                      ?mine=1 untuk laporan pelapor sendiri (semua status + koordinat asli)
//                      admin boleh ?scope=all untuk semua status + koordinat asli
// POST /api/reports  - buat laporan (wajib login, menerima photoUrl atau photoPath)

import crypto from 'crypto';
import { getAdminDb as defaultGetAdminDb } from '../lib/firebase-admin.js';
import {
  requireAuth as defaultRequireAuth,
  optionalAuth as defaultOptionalAuth,
  extractRoles,
  json
} from '../lib/auth.js';
import { parseJsonBody } from '../lib/v1/http.js';
import { resolveSignedReadUrl as defaultResolveSignedReadUrl } from '../lib/v1/uploads.js';

const MAX_PER_DAY = 10;
const VALID_REPORT_TYPES = [
  'Survei Mata Air',
  'Restorasi Mata Air',
  'Penanaman Pohon',
  'Pembangunan Rorak'
];
const VALID_STATUSES = ['pending', 'approved', 'rejected'];
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
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { body: 'body tidak valid' };

  const reportType = typeof data.reportType === 'string' ? data.reportType.trim() : '';
  if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
    errors.reportType = 'reportType tidak valid';
  }
  if (typeof data.location !== 'string' || !data.location.trim() || data.location.trim().length > 200) {
    errors.location = 'location wajib, maksimal 200 karakter';
  }
  if (typeof data.notes !== 'string' || !data.notes.trim() || data.notes.trim().length > 2000) {
    errors.notes = 'notes wajib, maksimal 2000 karakter';
  }

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
    if (
      typeof data.photoUrl !== 'string' ||
      data.photoUrl.trim().length > 1000 ||
      !PHOTO_PREFIXES.some((p) => data.photoUrl.trim().startsWith(p))
    ) {
      errors.photoUrl = 'photoUrl harus berasal dari Firebase Storage';
    }
  }

  if (data.photoPath !== undefined && data.photoPath !== null) {
    if (
      typeof data.photoPath !== 'string' ||
      data.photoPath.trim().length === 0 ||
      data.photoPath.trim().length > 300 ||
      data.photoPath.includes('..') ||
      !/^uploads\/report_photo\/[A-Za-z0-9._/-]+$/.test(data.photoPath.trim())
    ) {
      errors.photoPath = 'photoPath tidak valid';
    }
  }

  return Object.keys(errors).length ? errors : null;
}

// Samarkan koordinat ke grid ~5,5 km (0,05 derajat), ditambah offset deterministik opsional berbasis GEO_SALT.
function fuzz(n, id = '', axis = 'lat') {
  const snapped = Math.round(n / 0.05) * 0.05;
  const salt = process.env.GEO_SALT;
  if (!salt || !id) return Number(snapped.toFixed(4));
  const digest = crypto.createHmac('sha256', salt).update(`${id}:${axis}`).digest();
  const unit = (digest.readUInt16BE(0) / 65535) - 0.5;
  return Number((snapped + unit * 0.015).toFixed(4));
}

function iso(v) {
  return v?.toDate?.()?.toISOString() || (v instanceof Date ? v.toISOString() : v) || null;
}

export function createReportsHandler(deps = {}) {
  const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
  const requireAuth = deps.requireAuth || defaultRequireAuth;
  const optionalAuth = deps.optionalAuth || defaultOptionalAuth;
  const resolveSignedReadUrl = deps.resolveSignedReadUrl || defaultResolveSignedReadUrl;

  return async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') return response.status(200).end();

    // ---------- GET ----------
    if (request.method === 'GET') {
      try {
        const isMine = request.query?.mine === '1' || request.query?.mine === 'true';

        // Support ?mine=1: authenticated user's own reports (all statuses, exact coords)
        if (isMine) {
          const auth = await requireAuth(request, response, deps);
          if (!auth.success) {
            return json(response, auth.status || 401, { error: auth.error || 'Unauthorized' });
          }

          const parsedLimit = parseInt(request.query?.limit, 10);
          const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100);

          const db = getAdminDb();
          const snap = await db
            .collection('reports')
            .where('userId', '==', auth.user.uid)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

          const rows = await Promise.all(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .map(async (r) => {
                const hasCoord = typeof r.lat === 'number' && typeof r.lng === 'number';
                let photoUrl = r.photoUrl || null;
                if (r.photoPath) {
                  const signed = await resolveSignedReadUrl(r.photoPath, deps);
                  if (signed) photoUrl = signed;
                }
                const base = {
                  id: r.id,
                  reportType: r.reportType,
                  location: r.location,
                  notes: r.notes,
                  photoUrl,
                  status: r.status,
                  points: r.points !== undefined ? r.points : calculatePoints(r.reportType),
                  createdAt: iso(r.createdAt)
                };
                if (r.photoPath) {
                  base.photoPath = r.photoPath;
                }
                if (hasCoord) {
                  base.lat = r.lat;
                  base.lng = r.lng;
                }
                return base;
              })
          );

          response.setHeader('Cache-Control', 'private, no-store');
          return json(response, 200, { reports: rows, total: rows.length });
        }

        // Public / non-mine GET
        const auth = await optionalAuth(request, response, deps);
        const isAdmin = !!auth.user?.admin || extractRoles(auth.user).includes('admin');
        const scopeAllRequested = request.query?.scope === 'all';
        const wantAll = isAdmin && scopeAllRequested;
        const parsedLimit = parseInt(request.query?.limit, 10);
        const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100);

        const statusFilter = request.query?.status;
        if (wantAll && statusFilter && (typeof statusFilter !== 'string' || !VALID_STATUSES.includes(statusFilter))) {
          return json(response, 400, { error: 'Invalid status filter' });
        }

        const db = getAdminDb();
        let q = db.collection('reports');
        if (!wantAll) q = q.where('status', '==', 'approved');
        else if (statusFilter) q = q.where('status', '==', statusFilter);

        const snap = await q.orderBy('createdAt', 'desc').limit(limit).get();
        const rows = await Promise.all(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .map(async (r) => {
              const hasCoord = typeof r.lat === 'number' && typeof r.lng === 'number';
              let photoUrl = r.photoUrl || null;
              if (r.photoPath) {
                const signed = await resolveSignedReadUrl(r.photoPath, deps);
                if (signed) photoUrl = signed;
              }
              const base = {
                id: r.id,
                reportType: r.reportType,
                location: r.location,
                notes: r.notes,
                photoUrl,
                status: r.status,
                createdAt: iso(r.createdAt)
              };
              if (hasCoord) {
                base.lat = wantAll ? r.lat : fuzz(r.lat, r.id, 'lat');
                base.lng = wantAll ? r.lng : fuzz(r.lng, r.id, 'lng');
              }
              if (wantAll) {
                base.authorName = r.authorName;
                base.authorEmail = r.authorEmail;
                base.points = r.points !== undefined ? r.points : calculatePoints(r.reportType);
                if (r.photoPath) {
                  base.photoPath = r.photoPath;
                }
              }
              return base;
            })
        );

        response.setHeader('Cache-Control', scopeAllRequested || wantAll ? 'private, no-store' : 'public, s-maxage=60');
        return json(response, 200, { reports: rows, total: rows.length });
      } catch (error) {
        console.error('GET /api/reports error:', error);
        return json(response, 500, { error: 'Failed to fetch reports' });
      }
    }

    // ---------- POST ----------
    if (request.method === 'POST') {
      try {
        const auth = await requireAuth(request, response, deps);
        if (!auth.success) return json(response, auth.status, { error: auth.error });

        const body = parseJsonBody(request) || (typeof request.body === 'object' ? request.body : null);
        const errors = validateReport(body);
        if (errors) return json(response, 400, { error: 'Validation failed', details: errors });

        const db = getAdminDb();

        // Batas harian per pengguna (urutan terbaru lebih dulu sesuai index userId+createdAt)
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const mine = await db
          .collection('reports')
          .where('userId', '==', auth.user.uid)
          .orderBy('createdAt', 'desc')
          .limit(MAX_PER_DAY + 5)
          .get();
        const recent = mine.docs.filter((d) => {
          const cd = d.data().createdAt;
          const ms = cd?.toMillis?.() ?? (cd instanceof Date ? cd.getTime() : new Date(cd).getTime());
          return ms > since;
        }).length;
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
          photoUrl: typeof body.photoUrl === 'string' && body.photoUrl.trim() ? body.photoUrl.trim() : null,
          photoPath: typeof body.photoPath === 'string' && body.photoPath.trim() ? body.photoPath.trim() : null,
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
        const resPayload = {
          id: ref.id,
          reportType: data.reportType,
          location: data.location,
          status: data.status,
          points: data.points,
          createdAt: now.toISOString()
        };
        if (data.photoPath) {
          resPayload.photoPath = data.photoPath;
        }
        return json(response, 201, resPayload);
      } catch (error) {
        console.error('POST /api/reports error:', error);
        return json(response, 500, { error: 'Failed to create report' });
      }
    }

    return json(response, 405, { error: 'Method not allowed' });
  };
}

export default createReportsHandler();
