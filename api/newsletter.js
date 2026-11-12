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

  try {
    const body = request.body;
    const rawEmail = body && typeof body === 'object' && !Array.isArray(body) ? body.email : null;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.length > 254 || !emailRegex.test(email)) {
      return json(response, 400, { error: 'Alamat email tidak valid.' });
    }

    const db = getAdminDb();
    const docRef = await db.collection('newsletter_subscribers').add({
      email,
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
    console.error('POST /api/newsletter error:', error);
    return json(response, 503, { error: 'Layanan sementara tidak tersedia. Silakan coba lagi.' });
  }
}
