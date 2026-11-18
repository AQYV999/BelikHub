// tests/backend/auth-and-me.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_ROLES,
  PUBLIC_SELF_ASSIGN_ROLES,
  extractRoles,
  requireRole,
  hasSpringAccess
} from '../../lib/auth.js';
import {
  setCors,
  parseJsonBody,
  formatIso,
  isValidPeriod,
  snapCoord
} from '../../lib/v1/http.js';
import { createMeHandler } from '../../api/me.js';
import {
  createMockDb,
  createMockAuth,
  createMockReq,
  createMockRes
} from './helpers/mock-firebase.js';

describe('Task 1: Multirole Auth & Extended /api/me', () => {
  describe('Roles constants & extractRoles', () => {
    it('defines VALID_ROLES and PUBLIC_SELF_ASSIGN_ROLES correctly', () => {
      assert.deepEqual(VALID_ROLES, ['warga', 'pengelola', 'relawan', 'donatur', 'admin']);
      assert.deepEqual(PUBLIC_SELF_ASSIGN_ROLES, ['warga', 'donatur', 'relawan']);
    });

    it('extractRoles returns [\'admin\'] for legacy { admin: true } claim without roles array', () => {
      const decoded = { uid: 'user_1', admin: true };
      const roles = extractRoles(decoded);
      assert.deepEqual(roles, ['admin']);
    });

    it('extractRoles deduplicates and strips invalid roles', () => {
      const decoded = {
        uid: 'user_2',
        roles: ['warga', 'hacker', 'warga', 'pengelola', 'superadmin', 'donatur']
      };
      const roles = extractRoles(decoded);
      assert.deepEqual(roles, ['warga', 'pengelola', 'donatur']);
    });

    it('extractRoles merges legacy admin: true with roles array without duplicating admin', () => {
      const decoded = {
        uid: 'user_3',
        admin: true,
        roles: ['admin', 'warga', 'invalid_role']
      };
      const roles = extractRoles(decoded);
      assert.deepEqual(roles, ['admin', 'warga']);
    });

    it('extractRoles returns empty array for null/empty/non-object input or user without roles', () => {
      assert.deepEqual(extractRoles(null), []);
      assert.deepEqual(extractRoles(undefined), []);
      assert.deepEqual(extractRoles({ uid: 'user_4' }), []);
      assert.deepEqual(extractRoles({ uid: 'user_5', admin: false }), []);
    });
  });

  describe('requireRole middleware', () => {
    const mockAuth = createMockAuth({
      warga_user: {
        uid: 'warga_user',
        email: 'warga@example.com',
        customClaims: { roles: ['warga'] }
      },
      pengelola_user: {
        uid: 'pengelola_user',
        email: 'pengelola@example.com',
        customClaims: { roles: ['pengelola'] }
      },
      legacy_admin: {
        uid: 'legacy_admin',
        email: 'admin@example.com',
        customClaims: { admin: true }
      }
    });

    const deps = {
      verifyIdToken: (token) => mockAuth.verifyIdToken(token)
    };

    it('requireRole returns 401 when Authorization header missing', async () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();
      const result = await requireRole(req, res, ['warga'], deps);
      assert.equal(result.success, false);
      assert.equal(result.status, 401);
      assert.match(result.error, /Authorization/i);
    });

    it('requireRole returns 401 when Authorization token is invalid or expired', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer invalid_token' }
      });
      const res = createMockRes();
      const result = await requireRole(req, res, ['warga'], deps);
      assert.equal(result.success, false);
      assert.equal(result.status, 401);
    });

    it('requireRole returns 403 when user lacks allowed role and 200-equivalent success when role matches', async () => {
      // Forbidden case: warga trying to access pengelola/admin route
      const reqForbidden = createMockReq({
        headers: { authorization: 'Bearer warga_user' }
      });
      const resForbidden = createMockRes();
      const resultForbidden = await requireRole(reqForbidden, resForbidden, ['pengelola', 'admin'], deps);
      assert.equal(resultForbidden.success, false);
      assert.equal(resultForbidden.status, 403);

      // Success case 1: warga accessing warga route
      const reqAllowed = createMockReq({
        headers: { authorization: 'Bearer warga_user' }
      });
      const resAllowed = createMockRes();
      const resultAllowed = await requireRole(reqAllowed, resAllowed, ['warga', 'relawan'], deps);
      assert.equal(resultAllowed.success, true);
      assert.equal(resultAllowed.user.uid, 'warga_user');
      assert.deepEqual(resultAllowed.roles, ['warga']);

      // Success case 2: legacy admin with admin: true accessing admin route
      const reqAdmin = createMockReq({
        headers: { authorization: 'Bearer legacy_admin' }
      });
      const resAdmin = createMockRes();
      const resultAdmin = await requireRole(reqAdmin, resAdmin, ['admin'], deps);
      assert.equal(resultAdmin.success, true);
      assert.equal(resultAdmin.user.uid, 'legacy_admin');
      assert.ok(resultAdmin.roles.includes('admin'));
    });
  });

  describe('hasSpringAccess', () => {
    it('hasSpringAccess grants admin any spring and restricts pengelola to managedSpringIds', () => {
      // Admin gets any spring, even when managedSpringIds is empty
      assert.equal(hasSpringAccess(['admin'], [], 'SPR-001'), true);
      assert.equal(hasSpringAccess(['admin', 'warga'], ['SPR-002'], 'SPR-999'), true);

      // Pengelola is restricted to managedSpringIds
      assert.equal(hasSpringAccess(['pengelola'], ['SPR-001', 'SPR-002'], 'SPR-001'), true);
      assert.equal(hasSpringAccess(['pengelola'], ['SPR-001', 'SPR-002'], 'SPR-002'), true);
      assert.equal(hasSpringAccess(['pengelola'], ['SPR-001', 'SPR-002'], 'SPR-003'), false);
      assert.equal(hasSpringAccess(['pengelola'], null, 'SPR-001'), false);

      // Other roles (warga, relawan, donatur) do not have spring management access
      assert.equal(hasSpringAccess(['warga'], ['SPR-001'], 'SPR-001'), false);
      assert.equal(hasSpringAccess(['relawan'], ['SPR-001'], 'SPR-001'), false);
      assert.equal(hasSpringAccess(['donatur'], ['SPR-001'], 'SPR-001'), false);
      assert.equal(hasSpringAccess([], [], 'SPR-001'), false);
      assert.equal(hasSpringAccess(null, null, 'SPR-001'), false);
    });
  });

  describe('lib/v1/http.js helpers', () => {
    it('setCors sets CORS headers correctly', () => {
      const res = createMockRes();
      setCors(res, 'GET, POST, OPTIONS');
      assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*');
      assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
      assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'Content-Type, Authorization');
    });

    it('parseJsonBody handles objects, string JSON, and invalid input', () => {
      assert.deepEqual(parseJsonBody({ body: { a: 1 } }), { a: 1 });
      assert.deepEqual(parseJsonBody({ body: '{"a":1}' }), { a: 1 });
      assert.equal(parseJsonBody({ body: 'invalid json' }), null);
      assert.equal(parseJsonBody({ body: null }), null);
      assert.equal(parseJsonBody({ body: undefined }), null);
      assert.equal(parseJsonBody({}), null);
    });

    it('formatIso handles dates, timestamp mocks, and invalid values', () => {
      const now = new Date('2026-11-18T12:00:00.000Z');
      assert.equal(formatIso(now), '2026-11-18T12:00:00.000Z');
      assert.equal(formatIso({ toDate: () => now }), '2026-11-18T12:00:00.000Z');
      assert.equal(formatIso('2026-11-18T12:00:00.000Z'), '2026-11-18T12:00:00.000Z');
      assert.equal(formatIso(null), null);
      assert.equal(formatIso(undefined), null);
      assert.equal(formatIso('not-a-date'), null);
    });

    it('isValidPeriod validates YYYY-MM with month 01-12', () => {
      assert.equal(isValidPeriod('2026-01'), true);
      assert.equal(isValidPeriod('2026-12'), true);
      assert.equal(isValidPeriod('2026-00'), false);
      assert.equal(isValidPeriod('2026-13'), false);
      assert.equal(isValidPeriod('2026-1'), false);
      assert.equal(isValidPeriod('2026/01'), false);
      assert.equal(isValidPeriod(''), false);
      assert.equal(isValidPeriod(null), false);
    });

    it('snapCoord snaps coordinates to 0.045 grid (~5 km)', () => {
      assert.equal(snapCoord(-7.12345), -7.11);
      assert.equal(snapCoord(110.4567), 110.475);
      assert.equal(snapCoord(0), 0);
      assert.equal(snapCoord(null), null);
    });
  });

  describe('GET /api/me handler', () => {
    it('GET /api/me returns backwards-compatible role/points plus roles[], managedSpringIds[], springId, residentId, residentLinkStatus, donorType, phone', async () => {
      const mockUsers = {
        user_multirole: {
          uid: 'user_multirole',
          email: 'multi@example.com',
          displayName: 'Pak Budi',
          emailVerified: true,
          phoneNumber: '+6281234567890',
          customClaims: {
            roles: ['warga', 'relawan']
          },
          metadata: {
            creationTime: '2026-01-01T00:00:00.000Z',
            lastSignInTime: '2026-02-01T00:00:00.000Z'
          }
        }
      };

      const mockDb = createMockDb({
        users: {
          user_multirole: {
            id: 'user_multirole',
            name: 'Pak Budi Profile',
            points: 150,
            springId: 'SPR-001',
            residentId: 'RES-101',
            residentLinkStatus: 'linked',
            donorType: 'individual',
            phone: '081234567890',
            organizationName: 'Kelompok Tani Tirta',
            managedSpringIds: ['SPR-001']
          }
        }
      });

      const mockAuth = createMockAuth(mockUsers);
      const handler = createMeHandler({
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const req = createMockReq({
        method: 'GET',
        headers: {
          authorization: 'Bearer user_multirole'
        }
      });
      const res = createMockRes();

      await handler(req, res);

      assert.equal(res.statusCode, 200);
      const body = res.body;

      // Backwards-compatible fields
      assert.equal(body.uid, 'user_multirole');
      assert.equal(body.email, 'multi@example.com');
      assert.equal(body.name, 'Pak Budi');
      assert.equal(body.emailVerified, true);
      assert.equal(body.createdAt, '2026-01-01T00:00:00.000Z');
      assert.equal(body.lastLoginAt, '2026-02-01T00:00:00.000Z');
      assert.equal(body.role, 'user'); // Not admin, so 'user'
      assert.equal(body.points, 150);

      // Extended fields
      assert.deepEqual(body.roles, ['warga', 'relawan']);
      assert.deepEqual(body.managedSpringIds, ['SPR-001']);
      assert.equal(body.springId, 'SPR-001');
      assert.equal(body.residentId, 'RES-101');
      assert.equal(body.residentLinkStatus, 'linked');
      assert.equal(body.donorType, 'individual');
      assert.equal(body.phone, '081234567890');
      assert.equal(body.organizationName, 'Kelompok Tani Tirta');
    });

    it('GET /api/me returns role: "admin" for admin users with admin custom claim', async () => {
      const mockUsers = {
        admin_user: {
          uid: 'admin_user',
          email: 'admin@belikhub.org',
          displayName: 'Admin BelikHub',
          customClaims: {
            admin: true,
            roles: ['admin']
          }
        }
      };

      const mockDb = createMockDb({
        users: {
          admin_user: {
            id: 'admin_user',
            points: 500
          }
        }
      });

      const mockAuth = createMockAuth(mockUsers);
      const handler = createMeHandler({
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const req = createMockReq({
        method: 'GET',
        headers: {
          authorization: 'Bearer admin_user'
        }
      });
      const res = createMockRes();

      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.role, 'admin');
      assert.deepEqual(res.body.roles, ['admin']);
      assert.deepEqual(res.body.managedSpringIds, []);
      assert.equal(res.body.springId, null);
      assert.equal(res.body.residentId, null);
      assert.equal(res.body.residentLinkStatus, null);
      assert.equal(res.body.donorType, null);
      assert.equal(res.body.phone, null);
      assert.equal(res.body.organizationName, null);
    });

    it('GET /api/me returns 401 when Authorization header is missing', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth();
      const handler = createMeHandler({
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const req = createMockReq({ method: 'GET', headers: {} });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 401);
      assert.ok(res.body.error);
    });

    it('GET /api/me handles OPTIONS request with CORS headers', async () => {
      const handler = createMeHandler();
      const req = createMockReq({ method: 'OPTIONS' });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*');
      assert.ok(res.ended);
    });

    it('GET /api/me rejects unsupported HTTP method with 405', async () => {
      const handler = createMeHandler();
      const req = createMockReq({ method: 'POST' });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 405);
      assert.equal(res.body.error, 'Method not allowed');
    });
  });
});
