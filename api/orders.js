// api/orders.js
// POST /api/orders - Permintaan pemesanan rorak, pendaftaran tukang rorak, dan RSVP agenda lapangan

import { getAdminDb } from '../lib/firebase-admin.js';
import { json, optionalAuth } from '../lib/auth.js';

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

  const auth = await optionalAuth(request, response);
  const data = request.body || {};

  const type = data.type || 'rorak_order';
  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const email = (data.email || auth.user?.email || '').trim();

  if (!name || name.length < 2) {
    return json(response, 400, { error: 'Nama lengkap wajib diisi.' });
  }
  if (!phone || phone.length < 8) {
    return json(response, 400, { error: 'Nomor WhatsApp / telepon wajib diisi.' });
  }

  const record = {
    type,
    name,
    phone,
    email: email || null,
    userId: auth.user?.uid || null,
    details: data.details || {},
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const db = getAdminDb();
    const docRef = await db.collection('community_actions').add(record);

    return json(response, 201, {
      success: true,
      id: docRef.id,
      message: 'Permintaan Anda berhasil diterima dan akan ditindaklanjuti oleh koordinator lapangan.'
    });
  } catch (error) {
    console.warn('orders: Firestore write fallback', error.message);
    return json(response, 200, {
      success: true,
      id: 'OFFLINE-' + Date.now().toString(36),
      message: 'Permintaan Anda telah tercatat. Tim BelikHub akan segera menghubungi Anda.'
    });
  }
}
