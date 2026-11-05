// api/reports.js
// Reports CRUD endpoints
// POST /api/reports - Create a report (requires auth)
// GET /api/reports - List reports (optional auth)

import { getAdminDb } from '../lib/firebase-admin.js';
import { requireAuth, optionalAuth, json } from '../lib/auth.js';

function validateReport(data) {
  const errors = {};
  
  if (!data.reportType || typeof data.reportType !== 'string') {
    errors.reportType = 'reportType is required and must be a string';
  } else if (data.reportType.length > 100) {
    errors.reportType = 'reportType must be 100 characters or less';
  }
  
  if (!data.location || typeof data.location !== 'string') {
    errors.location = 'location is required and must be a string';
  } else if (data.location.length > 200) {
    errors.location = 'location must be 200 characters or less';
  }
  
  if (!data.notes || typeof data.notes !== 'string') {
    errors.notes = 'notes is required and must be a string';
  } else if (data.notes.length > 2000) {
    errors.notes = 'notes must be 2000 characters or less';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}

function calculatePoints(reportType) {
  const type = (reportType || '').toLowerCase();
  if (type.includes('restor')) return 1000;
  if (type.includes('rorak')) return 500;
  return 100;
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

  // GET /api/reports
  if (request.method === 'GET') {
    try {
      const authResult = await optionalAuth(request, response);
      const limit = Math.min(parseInt(request.query.limit) || 50, 100);
      const status = request.query.status;
      
      let query = db.collection('reports').orderBy('createdAt', 'desc').limit(limit);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.get();
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      }));
      
      return json(response, 200, { reports, total: reports.length });
    } catch (error) {
      console.error('GET /api/reports error:', error);
      return json(response, 500, { error: 'Failed to fetch reports' });
    }
  }

  // POST /api/reports
  if (request.method === 'POST') {
    try {
      const authResult = await requireAuth(request, response);
      if (!authResult.success) {
        return json(response, authResult.status, { error: authResult.error });
      }

      const body = request.body;
      const validationErrors = validateReport(body);
      
      if (validationErrors) {
        return json(response, 400, { error: 'Validation failed', details: validationErrors });
      }

      const points = calculatePoints(body.reportType);
      
      const reportData = {
        userId: authResult.user.uid,
        authorName: authResult.user.name || authResult.user.email?.split('@')[0] || 'Anonymous',
        authorEmail: authResult.user.email,
        reportType: body.reportType.trim(),
        location: body.location.trim(),
        notes: body.notes.trim(),
        points,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('reports').add(reportData);
      
      return json(response, 201, {
        id: docRef.id,
        ...reportData,
        createdAt: reportData.createdAt.toISOString(),
        updatedAt: reportData.updatedAt.toISOString()
      });
    } catch (error) {
      console.error('POST /api/reports error:', error);
      return json(response, 500, { error: 'Failed to create report' });
    }
  }

  return json(response, 405, { error: 'Method not allowed' });
}