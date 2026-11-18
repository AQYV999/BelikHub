// lib/auth.js
// Authentication and multirole authorization middleware for Vercel serverless functions
// Verifies Firebase ID tokens and attaches user and roles to request

import { verifyIdToken as defaultVerifyIdToken } from './firebase-admin.js';

export const VALID_ROLES = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];
export const PUBLIC_SELF_ASSIGN_ROLES = ['warga', 'donatur', 'relawan'];

/**
 * Extract valid roles from decoded token / claims.
 * Maps legacy { admin: true } claim to include 'admin'.
 * Deduplicates and filters against VALID_ROLES.
 * @param {object} decodedToken
 * @returns {string[]}
 */
export function extractRoles(decodedToken) {
  if (!decodedToken || typeof decodedToken !== 'object') {
    return [];
  }

  const rolesSet = new Set();

  if (Array.isArray(decodedToken.roles)) {
    for (const r of decodedToken.roles) {
      if (typeof r === 'string' && VALID_ROLES.includes(r)) {
        rolesSet.add(r);
      }
    }
  }

  if (decodedToken.admin === true) {
    rolesSet.add('admin');
  }

  return Array.from(rolesSet);
}

/**
 * Check if caller has management access to a specific spring.
 * Admin has access to all springs.
 * Pengelola has access only to springs listed in managedSpringIds.
 * @param {string[]} roles
 * @param {string[]} managedSpringIds
 * @param {string} springId
 * @returns {boolean}
 */
export function hasSpringAccess(roles, managedSpringIds, springId) {
  if (!springId || typeof springId !== 'string') {
    return false;
  }
  if (!Array.isArray(roles)) {
    return false;
  }

  if (roles.includes('admin')) {
    return true;
  }

  if (roles.includes('pengelola')) {
    return Array.isArray(managedSpringIds) && managedSpringIds.includes(springId);
  }

  return false;
}

/**
 * Require authenticated caller with at least one role from allowedRoles.
 * @param {object} request
 * @param {object} response
 * @param {string[]} allowedRoles
 * @param {object} [deps={}]
 * @returns {Promise<{ success: true, user: object, roles: string[] } | { success: false, status: number, error: string }>}
 */
export async function requireRole(request, response, allowedRoles = [], deps = {}) {
  const authHeader = request.headers.authorization || request.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return { success: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  let user = null;
  try {
    const verify = deps.verifyIdToken || defaultVerifyIdToken;
    const result = await verify(idToken);
    if (result && result.success && result.user) {
      user = result.user;
    } else if (result && result.uid) {
      user = result;
    } else if (result && result.success === false) {
      return { success: false, status: 401, error: result.error || 'Invalid or expired authentication token' };
    } else {
      return { success: false, status: 401, error: 'Invalid or expired authentication token' };
    }
  } catch {
    return { success: false, status: 401, error: 'Invalid or expired authentication token' };
  }

  const roles = extractRoles(user);
  const isAllowed = Array.isArray(allowedRoles) && allowedRoles.some((role) => roles.includes(role));

  if (!isAllowed) {
    return {
      success: false,
      status: 403,
      error: `Forbidden: requires one of [${allowedRoles.join(', ')}]`
    };
  }

  return { success: true, user, roles };
}

/**
 * Require valid authentication (any role)
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function requireAuth(request, response, deps = {}) {
  const authHeader = request.headers.authorization || request.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return { success: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  try {
    const verify = deps.verifyIdToken || defaultVerifyIdToken;
    const result = await verify(idToken);

    if (result && result.success && result.user) {
      return { success: true, user: result.user };
    }
    if (result && result.uid) {
      return { success: true, user: result };
    }
    return { success: false, status: 401, error: result?.error || 'Invalid or expired authentication token' };
  } catch {
    return { success: false, status: 401, error: 'Invalid or expired authentication token' };
  }
}

/**
 * Require admin access (custom claim admin: true or 'admin' role)
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function requireAdmin(request, response, deps = {}) {
  const authResult = await requireAuth(request, response, deps);

  if (!authResult.success) {
    return authResult;
  }

  const roles = extractRoles(authResult.user);
  if (!authResult.user.admin && !roles.includes('admin')) {
    return { success: false, status: 403, error: 'Admin access required' };
  }

  return { success: true, user: authResult.user, roles };
}

/**
 * Optional authentication middleware
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function optionalAuth(request, response, deps = {}) {
  const authHeader = request.headers.authorization || request.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: true, user: null };
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return { success: true, user: null };
  }

  try {
    const verify = deps.verifyIdToken || defaultVerifyIdToken;
    const result = await verify(idToken);

    if (result && result.success && result.user) {
      return { success: true, user: result.user };
    }
    if (result && result.uid) {
      return { success: true, user: result };
    }
    return { success: true, user: null };
  } catch {
    return { success: true, user: null };
  }
}

/**
 * Helper to send JSON response
 * @param {object} response
 * @param {number} status
 * @param {object} data
 */
export function json(response, status, data) {
  response.status(status).json(data);
}
