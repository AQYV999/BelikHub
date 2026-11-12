// api/orders.js
// POST /api/orders - Permintaan pemesanan rorak, pendaftaran tukang rorak, dan RSVP agenda lapangan

import { getAdminDb } from '../lib/firebase-admin.js';
import { json, optionalAuth } from '../lib/auth.js';

const VALID_ORDER_TYPES = ['rorak_order', 'rorak_maker', 'agenda_rsvp'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeDetails(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const entries = Object.entries(raw).slice(0, 10);
  const out = {};
  for (const [k, v] of entries) {
    const key = String(k).slice(0, 50);
    if (typeof v === 'string') {
      out[key] = v.trim().slice(0, 500);
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      out[key] = v;
    } else if (typeof v === 'boolean') {
      out[key] = v;
    }
  }
  return out;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const data = request.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return json(response, 400, { error: 'Payload permintaan tidak valid.' });
    }

    const type = typeof data.type === 'string' && data.type.trim() ? data.type.trim() : 'rorak_order';
    if (!VALID_ORDER_TYPES.includes(type)) {
      return json(response, 400, { error: 'Tipe permintaan tidak dikenal.' });
    }

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';

    if (name.length < 2 || name.length > 120) {
      return json(response, 400, { error: 'Nama lengkap wajib diisi (2–120 karakter).' });
    }
    if (phone.length < 8 || phone.length > 30) {
      return json(response, 400, { error: 'Nomor WhatsApp / telepon wajib diisi (8–30 karakter).' });
    }

    const auth = await optionalAuth(request, response);
    const rawEmail = typeof data.email === 'string' ? data.email.trim() : (auth.user?.email || '');
    if (rawEmail && (rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail))) {
      return json(response, 400, { error: 'Format alamat email tidak valid.' });
    }

    const record = {
      type,
      name,
      phone,
      email: rawEmail || null,
      userId: auth.user?.uid || null,
      details: sanitizeDetails(data.details),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = getAdminDb();
    const docRef = await db.collection('community_actions').add(record);

    return json(response, 201, {
      success: true,
      id: docRef.id,
      message: 'Permintaan Anda berhasil diterima dan akan ditindaklanjuti oleh koordinator lapangan.'
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return json(response, 503, { error: 'Layanan sementara tidak tersedia. Silakan coba lagi.' });
  }
}
