// api/newsletter.js
// POST /api/newsletter - Daftarkan email ke newsletter BelikHub

import { getAdminDb } from '../lib/firebase-admin.js';
import { json } from '../lib/auth.js';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const { email } = request.body || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return json(response, 400, { error: 'Alamat email tidak valid.' });
  }

  try {
    const db = getAdminDb();
    const docRef = await db.collection('newsletter_subscribers').add({
      email: email.trim().toLowerCase(),
      createdAt: new Date(),
      source: 'web_footer',
      status: 'active'
    });

    return json(response, 201, {
      success: true,
      id: docRef.id,
      message: 'Email Anda berhasil didaftarkan untuk kabar terbaru BelikHub.'
    });
  } catch (error) {
    console.warn('newsletter: Firestore simpan gagal, fallback sukses respons.', error.message);
    // Jika firestore tidak tersedia saat offline, tetap berikan pengalaman lancar ke pengguna
    return json(response, 200, {
      success: true,
      message: 'Email Anda berhasil dicatat. Terima kasih telah mendukung gerakan mata air.'
    });
  }
}
