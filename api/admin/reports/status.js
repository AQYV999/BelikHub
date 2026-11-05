// api/admin/reports/status.js
// Admin endpoint to update report status
// PATCH /api/admin/reports/:id/status - Requires admin auth

import { getAdminDb } from '../../../lib/firebase-admin.js';
import { requireAdmin, json } from '../../../lib/auth.js';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export default async function handler(request, response) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'PATCH') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAdmin(request, response);
    if (!authResult.success) {
      return json(response, authResult.status, { error: authResult.error });
    }

    // Extract report ID from URL
    // Vercel puts dynamic route params in request.query
    const reportId = request.query.id;
    
    if (!reportId) {
      return json(response, 400, { error: 'Report ID is required' });
    }

    const { status } = request.body;
    
    if (!status || !VALID_STATUSES.includes(status)) {
      return json(response, 400, { 
        error: 'Invalid status', 
        validStatuses: VALID_STATUSES 
      });
    }

    const db = getAdminDb();
    const reportRef = db.collection('reports').doc(reportId);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return json(response, 404, { error: 'Report not found' });
    }

    await reportRef.update({
      status,
      updatedAt: new Date(),
      reviewedBy: authResult.user.uid,
      reviewedAt: new Date()
    });

    const updatedDoc = await reportRef.get();
    const updatedData = updatedDoc.data();
    
    return json(response, 200, {
      id: updatedDoc.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
      reviewedAt: updatedData.reviewedAt?.toDate?.()?.toISOString() || updatedData.reviewedAt
    });
  } catch (error) {
    console.error('PATCH /api/admin/reports/:id/status error:', error);
    return json(response, 500, { error: 'Failed to update report status' });
  }
}