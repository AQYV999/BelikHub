// lib/auth.js
// Authentication middleware for Vercel serverless functions
// Verifies Firebase ID tokens and attaches user to request

import { verifyIdToken } from './firebase-admin.js';

export async function requireAuth(request, response) {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  const idToken = authHeader.split('Bearer ')[1];
  const result = await verifyIdToken(idToken);

  if (!result.success) {
    return { success: false, status: 401, error: result.error || 'Invalid token' };
  }

  return { success: true, user: result.user };
}

export async function requireAdmin(request, response) {
  const authResult = await requireAuth(request, response);
  
  if (!authResult.success) {
    return authResult;
  }

  // Check if user has admin custom claim
  if (!authResult.user.admin) {
    return { success: false, status: 403, error: 'Admin access required' };
  }

  return { success: true, user: authResult.user };
}

export async function optionalAuth(request, response) {
  const authHeader = request.headers.authorization || request.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: true, user: null };
  }

  const idToken = authHeader.split('Bearer ')[1];
  const result = await verifyIdToken(idToken);

  if (!result.success) {
    return { success: true, user: null };
  }

  return { success: true, user: result.user };
}

// Helper to send JSON response
export function json(response, status, data) {
  response.status(status).json(data);
}