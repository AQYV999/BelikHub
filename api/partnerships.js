// api/partnerships.js
// Partnerships CRUD endpoints
// POST /api/partnerships - Create a partnership request
// GET /api/partnerships - List partnerships (admin only for full list)

import { getAdminDb } from '../lib/firebase-admin.js';
import { requireAuth, requireAdmin, optionalAuth, json } from '../lib/auth.js';

function validatePartnership(data) {
  const errors = {};
  
  if (!data.name || typeof data.name !== 'string') {
    errors.name = 'name is required and must be a string';
  } else if (data.name.length > 100) {
    errors.name = 'name must be 100 characters or less';
  }
  
  if (!data.institution || typeof data.institution !== 'string') {
    errors.institution = 'institution is required and must be a string';
  } else if (data.institution.length > 200) {
    errors.institution = 'institution must be 200 characters or less';
  }
  
  if (!data.need || typeof data.need !== 'string') {
    errors.need = 'need is required and must be a string';
  } else if (data.need.length > 500) {
    errors.need = 'need must be 500 characters or less';
  }
  
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'email must be a valid email address';
    } else if (data.email.length > 255) {
      errors.email = 'email must be 255 characters or less';
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

  const db = getAdminDb();

  // GET /api/partnerships
  if (request.method === 'GET') {
    try {
      const authResult = await optionalAuth(request, response);
      const limit = Math.min(parseInt(request.query.limit) || 50, 100);
      const status = request.query.status;
      
      // Non-admin users only see their own partnerships (if we track by userId)
      // For now, admin sees all, others see none (or we could add userId field)
      let query = db.collection('partnerships').orderBy('createdAt', 'desc').limit(limit);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
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

      const partnershipData = {
        name: body.name.trim(),
        institution: body.institution.trim(),
        need: body.need.trim(),
        email: body.email?.trim() || null,
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