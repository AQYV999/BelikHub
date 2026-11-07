// api/reports.js
// GET  /api/reports            -> publik: hanya 'approved', koordinat DISAMARKAN, tanpa data pribadi
// GET  /api/reports?mine=1     -> laporan milik user login (semua status, koordinat asli)
// GET  /api/reports?status=... -> admin saja
// GET  ...&before=<ISO date>   -> paginasi (ambil yang lebih lama dari tanggal itu)
// POST /api/reports            -> buat laporan (wajib login + email terverifikasi)

import { createHmac } from 'node:crypto';
import { getAdminDb, getAdminStorage } from '../lib/firebase-admin.js';
import { requireAuth, optionalAuth, json } from '../lib/auth.js';

const REPORT_TYPES = {
  'Survei Mata Air': 100,
  'Restorasi Mata Air': 1000,
  'Penanaman Pohon': 100,
  'Pembangunan Rorak': 500
};

const VALID_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_CONDITIONS = ['healthy', 'attention'];
const MAX_PHOTO_BYTES = 1500000;

function validateReport(data) {
  const errors = {};

  if (!data || typeof data !== 'object') {
    return { body: 'Request body must be a JSON object' };
  }

  if (
    typeof data.reportType !== 'string' ||
    !Object.prototype.hasOwnProperty.call(REPORT_TYPES, data.reportType)
  ) {
    errors.reportType = `reportType must be one of: ${Object.keys(REPORT_TYPES).join(', ')}`;
  }

  if (typeof data.location !== 'string' || data.location.trim().length === 0) {
    errors.location = 'location is required and must be a non-empty string';
  } else if (data.location.length > 200) {
    errors.location = 'location must be 200 characters or less';
  }

  if (typeof data.notes !== 'string' || data.notes.trim().length === 0) {
    errors.notes = 'notes is required and must be a non-empty string';
  } else if (data.notes.length > 2000) {
    errors.notes = 'notes must be 2000 characters or less';
  }

  if (typeof data.lat !== 'number' || !Number.isFinite(data.lat) || data.lat < -11.5 || data.lat > 6.5) {
    errors.lat = 'lat must be a number within Indonesia (-11.5 to 6.5)';
  }

  if (typeof data.lng !== 'number' || !Number.isFinite(data.lng) || data.lng < 94.5 || data.lng > 141.5) {
    errors.lng = 'lng must be a number within Indonesia (94.5 to 141.5)';
  }

  if (data.condition !== undefined && !VALID_CONDITIONS.includes(data.condition)) {
    errors.condition = `condition must be one of: ${VALID_CONDITIONS.join(', ')}`;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// Foto: data URL JPEG base64 (sudah diperkecil di browser). Divalidasi ulang di server.
function parsePhoto(photo) {
  if (photo === undefined || photo === null || photo === '') return { buffer: null };
  if (typeof photo !== 'string' || photo.length > 2000000) return { error: 'photo is too large' };
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(photo);
  if (!match) return { error: 'photo must be a JPEG data URL' };
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) return { error: 'photo is too large' };
  if (!(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    return { error: 'photo is not a valid JPEG' };
  }
  return { buffer };
}

// Samarkan koordinat: geser 1-5 km, arah dan jarak ditentukan HMAC rahasia + id laporan.
// Hasil stabil (tidak berubah tiap request) dan tidak bisa dibalik tanpa GEO_SALT.
function blurCoords(lat, lng, id) {
  const secret = process.env.GEO_SALT || process.env.FIREBASE_PRIVATE_KEY || 'belikhub-fallback-salt';
  const h = createHmac('sha256', secret).update(id).digest();
  const angle = (h.readUInt32BE(0) / 0xffffffff) * 2 * Math.PI;
  const distance = 1000 + (h.readUInt32BE(4) / 0xffffffff) * 4000;
  const dLat = (distance * Math.cos(angle)) / 111320;
  const dLng = (distance * Math.sin(angle)) / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  const round = (n) => Math.round(n * 10000) / 10000;
  return { lat: round(lat + dLat), lng: round(lng + dLng) };
}

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

async function photoUrlFor(path) {
  if (!path) return null;
  try {
    const [url] = await getAdminStorage()
      .bucket()
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
    return url;
  } catch (error) {
    console.error('signed url error:', error.message);
    return null;
  }
}

// Lengkap: hanya pemilik laporan atau admin
async function serializeFull(doc) {
  const { photoPath, ...d } = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
    reviewedAt: toIso(d.reviewedAt),
    photoUrl: await photoUrlFor(photoPath)
  };
}

// Publik: tanpa email, userId, nama, catatan, dan koordinat asli
async function serializePublic(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    reportType: d.reportType,
    location: d.location,
    status: d.status,
    condition: d.condition || 'healthy',
    lat: d.geoPublic ? d.geoPublic.lat : null,
    lng: d.geoPublic ? d.geoPublic.lng : null,
    createdAt: toIso(d.createdAt),
    photoUrl: await photoUrlFor(d.photoPath)
  };
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const db = getAdminDb();

    // ---------- GET ----------
    if (request.method === 'GET') {
      const authResult = await optionalAuth(request, response);
      const user = authResult.user;
      const isAdmin = !!(user && user.admin);
      const limit = Math.min(parseInt(request.query.limit, 10) || 50, 100);
      const wantsMine = request.query.mine === '1' || request.query.mine === 'true';
      const status = request.query.status;
      const before = request.query.before;

      let query = db.collection('reports');
      let full = false;

      if (wantsMine) {
        if (!user) {
          return json(response, 401, { error: 'Login required' });
        }
        query = query.where('userId', '==', user.uid);
        full = true;
      } else if (isAdmin) {
        if (status && VALID_STATUSES.includes(status)) {
          query = query.where('status', '==', status);
        }
        full = true;
      } else {
        query = query.where('status', '==', 'approved');
      }

      query = query.orderBy('createdAt', 'desc');
      if (typeof before === 'string' && !Number.isNaN(Date.parse(before))) {
        query = query.startAfter(new Date(before));
      }

      const snapshot = await query.limit(limit).get();
      const reports = await Promise.all(snapshot.docs.map((doc) => (full ? serializeFull(doc) : serializePublic(doc))));

      return json(response, 200, { reports, total: reports.length });
    }

    // ---------- POST ----------
    if (request.method === 'POST') {
      const authResult = await requireAuth(request, response);
      if (!authResult.success) {
        return json(response, authResult.status, { error: authResult.error });
      }

      if (authResult.user.email_verified !== true) {
        return json(response, 403, {
          error: 'Verifikasi email dulu sebelum mengirim laporan.',
          code: 'email-not-verified'
        });
      }

      const body = request.body;
      const validationErrors = validateReport(body);
      if (validationErrors) {
        return json(response, 400, { error: 'Validation failed', details: validationErrors });
      }

      const photo = parsePhoto(body.photo);
      if (photo.error) {
        return json(response, 400, { error: 'Validation failed', details: { photo: photo.error } });
      }

      const ref = db.collection('reports').doc();
      let photoPath = null;

      if (photo.buffer) {
        photoPath = `reports/${ref.id}.jpg`;
        try {
          await getAdminStorage()
            .bucket()
            .file(photoPath)
            .save(photo.buffer, { contentType: 'image/jpeg', resumable: false });
        } catch (error) {
          console.error('photo upload error:', error);
          return json(response, 502, { error: 'Gagal mengunggah foto. Coba tanpa foto atau ulangi nanti.' });
        }
      }

      const now = new Date();
      const reportData = {
        userId: authResult.user.uid,
        authorName: authResult.user.name || authResult.user.email?.split('@')[0] || 'Anonymous',
        authorEmail: authResult.user.email || null,
        reportType: body.reportType,
        location: body.location.trim(),
        notes: body.notes.trim(),
        condition: body.condition || 'healthy',
        geo: { lat: body.lat, lng: body.lng },
        geoPublic: blurCoords(body.lat, body.lng, ref.id),
        photoPath,
        points: REPORT_TYPES[body.reportType],
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };

      await ref.set(reportData);

      return json(response, 201, {
        id: ref.id,
        reportType: reportData.reportType,
        location: reportData.location,
        points: reportData.points,
        status: reportData.status,
        createdAt: now.toISOString()
      });
    }

    return json(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(`${request.method} /api/reports error:`, error);
    return json(response, 500, {
      error: request.method === 'POST' ? 'Failed to create report' : 'Failed to fetch reports'
    });
  }
}