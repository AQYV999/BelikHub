// api/partnerships.js
// Partnerships CRUD endpoints
// POST /api/partnerships - Create a partnership request
// GET /api/partnerships - List partnerships (admin only for full list)

import { getAdminDb } from '../lib/firebase-admin.js';
import { requireAdmin, json } from '../lib/auth.js';

const VALID_PARTNERSHIP_STATUSES = ['new', 'contacted', 'approved', 'archived'];

function validatePartnership(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { body: 'request body must be a JSON object' };
  }

  const errors = {};
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const institution = typeof data.institution === 'string' ? data.institution.trim() : '';
  const need = typeof data.need === 'string' ? data.need.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';

  if (!name) {
    errors.name = 'name is required and must be a non-empty string';
  } else if (name.length > 100) {
    errors.name = 'name must be 100 characters or less';
  }

  if (!institution) {
    errors.institution = 'institution is required and must be a non-empty string';
  } else if (institution.length > 200) {
    errors.institution = 'institution must be 200 characters or less';
  }

  if (!need) {
    errors.need = 'need is required and must be a non-empty string';
  } else if (need.length > 500) {
    errors.need = 'need must be 500 characters or less';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'email must be a valid email address';
  } else if (email.length > 255) {
    errors.email = 'email must be 255 characters or less';
  }

  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.notes = 'notes must be a string';
    } else if (data.notes.trim().length > 1000) {
      errors.notes = 'notes must be 1000 characters or less';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export default async function handler(request, response) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // GET /api/partnerships
  if (request.method === 'GET') {
    try {
      const authResult = await requireAdmin(request, response);

      if (!authResult.success) {
        return json(response, authResult.status, { error: authResult.error });
      }

      const parsedLimit = parseInt(request.query?.limit, 10);
      const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100);
      const status = request.query?.status;

      if (status && (typeof status !== 'string' || !VALID_PARTNERSHIP_STATUSES.includes(status))) {
        return json(response, 400, { error: 'Invalid status filter' });
      }

      const db = getAdminDb();
      let query = db.collection('partnerships');
      if (status) {
        query = query.where('status', '==', status);
      }
      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();
      const partnerships = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      }));

      return json(response, 200, { partnerships, total: partnerships.length });
    } catch (error) {
      console.error('GET /api/partnerships error:', error);
      return json(response, 500, { error: 'Failed to fetch partnerships' });
    }
  }

  // POST /api/partnerships
  if (request.method === 'POST') {
    try {
      const body = request.body;
      const validationErrors = validatePartnership(body);

      if (validationErrors) {
        return json(response, 400, { error: 'Validation failed', details: validationErrors });
      }

      const db = getAdminDb();
      const partnershipData = {
        name: body.name.trim(),
        institution: body.institution.trim(),
        need: body.need.trim(),
        email: body.email.trim(),
        notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('partnerships').add(partnershipData);

      return json(response, 201, {
        id: docRef.id,
        ...partnershipData,
        createdAt: partnershipData.createdAt.toISOString(),
        updatedAt: partnershipData.updatedAt.toISOString()
      });
    } catch (error) {
      console.error('POST /api/partnerships error:', error);
      return json(response, 500, { error: 'Failed to create partnership request' });
    }
  }

  return json(response, 405, { error: 'Method not allowed' });
}