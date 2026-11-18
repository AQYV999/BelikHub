// tests/backend/onboarding-and-springs.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleOnboarding,
  handleUpdateProfile
} from '../../lib/v1/onboarding.js';
import {
  handleCreateSpring,
  handleUpdateSpring,
  handleGetSpringSettings,
  handlePutSpringSettings
} from '../../lib/v1/springs-admin.js';
import {
  createMockDb,
  createMockAuth,
  createMockStorage,
  createMockReq,
  createMockRes
} from './helpers/mock-firebase.js';

describe('Task 3: Onboarding, Profile, Springs CRUD & Per-Spring Settings', () => {
  const defaultEnv = {
    FIREBASE_STORAGE_BUCKET: 'test-belikhub-bucket'
  };

  describe('POST /api/v1/onboarding', () => {
    it('POST /api/v1/onboarding rejects role \'pengelola\' and \'admin\' with 403', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        regular_user: { uid: 'regular_user', customClaims: {} }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      // Test 'pengelola'
      const reqPengelola = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer regular_user' },
        body: { role: 'pengelola', name: 'Calon Pengelola' }
      });
      const resPengelola = createMockRes();
      await handleOnboarding(reqPengelola, resPengelola, deps);

      assert.equal(resPengelola.statusCode, 403);
      assert.match(resPengelola.body.error, /tidak diizinkan|mandiri/i);

      // Test 'admin'
      const reqAdmin = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer regular_user' },
        body: { role: 'admin', name: 'Calon Admin' }
      });
      const resAdmin = createMockRes();
      await handleOnboarding(reqAdmin, resAdmin, deps);

      assert.equal(resAdmin.statusCode, 403);
      assert.match(resAdmin.body.error, /tidak diizinkan|mandiri/i);

      // Verify no claims were granted
      const userRecord = await mockAuth.getUser('regular_user');
      assert.deepEqual(userRecord.customClaims?.roles || [], []);
    });

    it('POST /api/v1/onboarding grants \'donatur\' with organization donorType and preserves existing admin claim if already present', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        admin_donor: {
          uid: 'admin_donor',
          email: 'admin.csr@example.com',
          customClaims: { admin: true, roles: ['admin'] }
        }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_donor' },
        body: {
          role: 'donatur',
          donorType: 'organization',
          organizationName: 'PT Sumber Berkah Lestari',
          name: 'Budi Santoso',
          phone: '08123456789'
        }
      });
      const res = createMockRes();
      await handleOnboarding(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // Verify custom claims preserve admin and include donatur
      const userRecord = await mockAuth.getUser('admin_donor');
      assert.equal(userRecord.customClaims.admin, true);
      assert.ok(userRecord.customClaims.roles.includes('admin'));
      assert.ok(userRecord.customClaims.roles.includes('donatur'));

      // Verify firestore users collection
      const userDoc = await mockDb.collection('users').doc('admin_donor').get();
      assert.equal(userDoc.exists, true);
      const data = userDoc.data();
      assert.equal(data.donorType, 'organization');
      assert.equal(data.organizationName, 'PT Sumber Berkah Lestari');
      assert.equal(data.name, 'Budi Santoso');
      assert.equal(data.phone, '08123456789');
      assert.ok(data.roles.includes('admin'));
      assert.ok(data.roles.includes('donatur'));
    });

    it('POST /api/v1/onboarding with warga + valid linkCode atomically links resident.userId and clears linkCode', async () => {
      const mockDb = createMockDb({
        residents: [
          {
            id: 'res_101',
            springId: 'SPR-001',
            name: 'Pak Slamet',
            phone: '0811112222',
            monthlyFee: 15000,
            userId: null,
            linkCode: 'KOD101',
            linkCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ]
      });
      const mockAuth = createMockAuth({
        warga_user: { uid: 'warga_user', email: 'slamet@example.com' }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer warga_user' },
        body: {
          role: 'warga',
          springId: 'SPR-001',
          linkCode: 'KOD101',
          name: 'Pak Slamet',
          phone: '0811112222'
        }
      });
      const res = createMockRes();
      await handleOnboarding(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.residentId, 'res_101');
      assert.equal(res.body.user.residentLinkStatus, 'linked');

      // Verify resident doc updated atomically
      const resDoc = await mockDb.collection('residents').doc('res_101').get();
      const resData = resDoc.data();
      assert.equal(resData.userId, 'warga_user');
      assert.equal(resData.linkCode, null);

      // Verify user doc in Firestore
      const userDoc = await mockDb.collection('users').doc('warga_user').get();
      const userData = userDoc.data();
      assert.equal(userData.residentId, 'res_101');
      assert.equal(userData.residentLinkStatus, 'linked');
      assert.equal(userData.springId, 'SPR-001');
      assert.ok(userData.roles.includes('warga'));
    });

    it('POST /api/v1/onboarding rejects already-redeemed or expired linkCode with 409/400 without overwriting existing resident.userId', async () => {
      const mockDb = createMockDb({
        residents: [
          {
            id: 'res_claimed',
            springId: 'SPR-001',
            name: 'Warga Sudah Tertaut',
            userId: 'first_user_uid',
            linkCode: 'CLAIM1',
            linkCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
            active: true
          },
          {
            id: 'res_expired',
            springId: 'SPR-001',
            name: 'Warga Kadaluarsa',
            userId: null,
            linkCode: 'EXPIR1',
            linkCodeExpiresAt: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
            active: true
          }
        ]
      });
      const mockAuth = createMockAuth({
        attacker_user: { uid: 'attacker_user', email: 'attacker@example.com' },
        second_user: { uid: 'second_user', email: 'second@example.com' }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      // 1. Attempting to claim already-linked resident must return 409
      const reqClaimed = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer attacker_user' },
        body: {
          role: 'warga',
          springId: 'SPR-001',
          linkCode: 'CLAIM1'
        }
      });
      const resClaimed = createMockRes();
      await handleOnboarding(reqClaimed, resClaimed, deps);

      assert.equal(resClaimed.statusCode, 409);
      assert.match(resClaimed.body.error, /sudah digunakan|tertaut/i);

      // Ensure existing resident.userId was NOT overwritten
      const checkClaimedDoc = await mockDb.collection('residents').doc('res_claimed').get();
      assert.equal(checkClaimedDoc.data().userId, 'first_user_uid');

      // 2. Attempting to claim expired linkCode must return 400
      const reqExpired = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer second_user' },
        body: {
          role: 'warga',
          springId: 'SPR-001',
          linkCode: 'EXPIR1'
        }
      });
      const resExpired = createMockRes();
      await handleOnboarding(reqExpired, resExpired, deps);

      assert.equal(resExpired.statusCode, 400);
      assert.match(resExpired.body.error, /kedaluwarsa|kadaluarsa/i);

      // Ensure expired resident.userId remains null
      const checkExpiredDoc = await mockDb.collection('residents').doc('res_expired').get();
      assert.equal(checkExpiredDoc.data().userId, null);
    });

    it('POST /api/v1/onboarding with warga and no linkCode sets residentLinkStatus = \'pending\'', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        unlinked_warga: { uid: 'unlinked_warga', email: 'unlinked@example.com' }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer unlinked_warga' },
        body: {
          role: 'warga',
          springId: 'SPR-002',
          name: 'Warga Baru',
          phone: '0899887766'
        }
      });
      const res = createMockRes();
      await handleOnboarding(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.residentLinkStatus, 'pending');
      assert.equal(res.body.user.residentId, null);
      assert.equal(res.body.user.springId, 'SPR-002');

      const userDoc = await mockDb.collection('users').doc('unlinked_warga').get();
      assert.equal(userDoc.data().residentLinkStatus, 'pending');
      assert.equal(userDoc.data().residentId, null);
      assert.equal(userDoc.data().springId, 'SPR-002');
      assert.ok(userDoc.data().roles.includes('warga'));
    });

    it('POST /api/v1/onboarding rejects unauthenticated request with 401', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth();
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'POST',
        headers: {},
        body: { role: 'relawan' }
      });
      const res = createMockRes();
      await handleOnboarding(req, res, deps);

      assert.equal(res.statusCode, 401);
    });

    it('POST /api/v1/onboarding allows relawan role assignment', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        relawan_user: { uid: 'relawan_user', email: 'relawan@example.com' }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer relawan_user' },
        body: {
          role: 'relawan',
          name: 'Relawan Hijau',
          phone: '0855443322'
        }
      });
      const res = createMockRes();
      await handleOnboarding(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.user.roles.includes('relawan'));

      const userRecord = await mockAuth.getUser('relawan_user');
      assert.ok(userRecord.customClaims.roles.includes('relawan'));
    });
  });

  describe('PATCH /api/v1/profile', () => {
    it('PATCH /api/v1/profile updates allowed fields and redeems linkCode inside transaction', async () => {
      const mockDb = createMockDb({
        users: [
          {
            id: 'warga_patch',
            roles: ['warga'],
            residentLinkStatus: 'pending',
            springId: 'SPR-003'
          }
        ],
        residents: [
          {
            id: 'res_patch_1',
            springId: 'SPR-003',
            name: 'Warga Patch',
            userId: null,
            linkCode: 'PTCH01',
            linkCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
            active: true
          }
        ]
      });
      const mockAuth = createMockAuth({
        warga_patch: { uid: 'warga_patch', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_patch' },
        body: {
          name: 'Nama Diperbarui',
          phone: '0877665544',
          linkCode: 'PTCH01'
        }
      });
      const res = createMockRes();
      await handleUpdateProfile(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.name, 'Nama Diperbarui');
      assert.equal(res.body.user.residentId, 'res_patch_1');
      assert.equal(res.body.user.residentLinkStatus, 'linked');

      // Verify resident doc was claimed
      const resDoc = await mockDb.collection('residents').doc('res_patch_1').get();
      assert.equal(resDoc.data().userId, 'warga_patch');
      assert.equal(resDoc.data().linkCode, null);
    });

    it('PATCH /api/v1/profile rejects invalid donorType with 400', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        donor_user: { uid: 'donor_user', customClaims: { roles: ['donatur'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminAuth: () => mockAuth,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer donor_user' },
        body: { donorType: 'invalid_type' }
      });
      const res = createMockRes();
      await handleUpdateProfile(req, res, deps);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /donorType/i);
    });
  });

  describe('Springs CRUD & Settings (lib/v1/springs-admin.js)', () => {
    it('POST /api/v1/springs with { seedBaseline: true } seeds all 4 baseline springs idempotently for admin', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } },
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      // 1. Non-admin must be rejected with 403
      const reqWarga = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer warga_user' },
        body: { seedBaseline: true }
      });
      const resWarga = createMockRes();
      await handleCreateSpring(reqWarga, resWarga, deps);
      assert.equal(resWarga.statusCode, 403);

      // 2. Admin seeds 4 baseline springs
      const reqAdmin = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { seedBaseline: true }
      });
      const resAdmin = createMockRes();
      await handleCreateSpring(reqAdmin, resAdmin, deps);

      assert.equal(resAdmin.statusCode, 200);
      assert.equal(resAdmin.body.success, true);
      assert.equal(resAdmin.body.seededCount, 4);

      // Verify all 4 SPR-001..SPR-004 exist in Firestore
      for (const id of ['SPR-001', 'SPR-002', 'SPR-003', 'SPR-004']) {
        const springDoc = await mockDb.collection('springs').doc(id).get();
        assert.equal(springDoc.exists, true);
        assert.equal(springDoc.data().id, id);
      }

      // 3. Second run must be idempotent
      const reqAdmin2 = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { seedBaseline: true }
      });
      const resAdmin2 = createMockRes();
      await handleCreateSpring(reqAdmin2, resAdmin2, deps);
      assert.equal(resAdmin2.statusCode, 200);
      assert.equal(resAdmin2.body.seededCount, 4);
    });

    it('POST /api/v1/springs creates custom spring and validates required fields', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      // Missing required field
      const reqInvalid = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { id: 'SPR-005', name: 'Mata Air Baru' } // missing village, district, regency, coords
      });
      const resInvalid = createMockRes();
      await handleCreateSpring(reqInvalid, resInvalid, deps);
      assert.equal(resInvalid.statusCode, 400);

      // Valid spring
      const reqValid = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          id: 'SPR-005',
          name: 'Belik Kalianget',
          village: 'Kalianget',
          district: 'Wonosobo',
          regency: 'Wonosobo',
          coordinates_public: { lat: -7.36, lng: 109.91 }
        }
      });
      const resValid = createMockRes();
      await handleCreateSpring(reqValid, resValid, deps);
      assert.equal(resValid.statusCode, 201);
      assert.equal(resValid.body.success, true);
      assert.equal(resValid.body.spring.id, 'SPR-005');

      const doc = await mockDb.collection('springs').doc('SPR-005').get();
      assert.equal(doc.exists, true);
      assert.equal(doc.data().name, 'Belik Kalianget');
    });

    it('PATCH /api/v1/springs/:id updates spring details for admin', async () => {
      const mockDb = createMockDb({
        springs: [
          {
            id: 'SPR-001',
            name: 'Belik Tuk Silen',
            status: 'degraded'
          }
        ]
      });
      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } },
        pengelola_user: { uid: 'pengelola_user', customClaims: { roles: ['pengelola'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      // Pengelola rejected with 403
      const reqPengelola = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_user' },
        body: { status: 'recovering' }
      });
      const resPengelola = createMockRes();
      await handleUpdateSpring(reqPengelola, resPengelola, 'SPR-001', deps);
      assert.equal(resPengelola.statusCode, 403);

      // Admin updates spring
      const reqAdmin = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { status: 'recovering', beneficiaries_kk: 180 }
      });
      const resAdmin = createMockRes();
      await handleUpdateSpring(reqAdmin, resAdmin, 'SPR-001', deps);

      assert.equal(resAdmin.statusCode, 200);
      assert.equal(resAdmin.body.success, true);

      const doc = await mockDb.collection('springs').doc('SPR-001').get();
      assert.equal(doc.data().status, 'recovering');
      assert.equal(doc.data().beneficiaries_kk, 180);
    });

    it('PUT /api/v1/springs/:id/settings rejects pengelola/warga with 403 and allows admin to save bank/QRIS settings; GET resolves qrisReadUrl', async () => {
      const mockDb = createMockDb();
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } },
        pengelola_user: { uid: 'pengelola_user', customClaims: { roles: ['pengelola'] } },
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: defaultEnv
      };

      // 1. Pengelola attempt to PUT must return 403
      const reqPengelola = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer pengelola_user' },
        body: {
          defaultMonthlyFee: 20000,
          paymentInstructions: 'Rekening Pengelola BRI 12345'
        }
      });
      const resPengelola = createMockRes();
      await handlePutSpringSettings(reqPengelola, resPengelola, 'SPR-001', deps);
      assert.equal(resPengelola.statusCode, 403);

      // 2. Warga attempt to PUT must return 403
      const reqWarga = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer warga_user' },
        body: {
          defaultMonthlyFee: 20000,
          paymentInstructions: 'Rekening Pengelola'
        }
      });
      const resWarga = createMockRes();
      await handlePutSpringSettings(reqWarga, resWarga, 'SPR-001', deps);
      assert.equal(resWarga.statusCode, 403);

      // 3. Admin successfully saves settings
      const reqAdmin = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          defaultMonthlyFee: 15000,
          paymentInstructions: 'Transfer ke BPD Jateng 3-021-99887-1 a.n. Kas Paguyuban Belik Tuk Silen',
          qrisImagePath: 'uploads/qris_image/admin_user/1700000000-qris.jpg'
        }
      });
      const resAdmin = createMockRes();
      await handlePutSpringSettings(reqAdmin, resAdmin, 'SPR-001', deps);

      assert.equal(resAdmin.statusCode, 200);
      assert.equal(resAdmin.body.success, true);
      assert.equal(resAdmin.body.settings.defaultMonthlyFee, 15000);
      assert.ok(resAdmin.body.settings.qrisReadUrl.includes('mock-signed=true'));

      // 4. Authenticated GET (by warga or pengelola) returns the settings and resolves qrisReadUrl
      const reqGetWarga = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer warga_user' }
      });
      const resGetWarga = createMockRes();
      await handleGetSpringSettings(reqGetWarga, resGetWarga, 'SPR-001', deps);

      assert.equal(resGetWarga.statusCode, 200);
      assert.equal(resGetWarga.body.springId, 'SPR-001');
      assert.equal(resGetWarga.body.defaultMonthlyFee, 15000);
      assert.equal(resGetWarga.body.isFallback, false);
      assert.equal(resGetWarga.body.qrisImagePath, 'uploads/qris_image/admin_user/1700000000-qris.jpg');
      assert.ok(resGetWarga.body.qrisReadUrl.includes('mock-signed=true'));
    });

    it('PUT /api/v1/springs/:id/settings rejects invalid defaultMonthlyFee and invalid qrisImagePath with 400', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: defaultEnv
      };

      // 1. Fee <= 0
      const reqFeeZero = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          defaultMonthlyFee: 0,
          paymentInstructions: 'Transfer rekening'
        }
      });
      const resFeeZero = createMockRes();
      await handlePutSpringSettings(reqFeeZero, resFeeZero, 'SPR-001', deps);
      assert.equal(resFeeZero.statusCode, 400);

      // 2. Traversal in qrisImagePath
      const reqTraversal = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          defaultMonthlyFee: 15000,
          paymentInstructions: 'Transfer rekening',
          qrisImagePath: 'uploads/qris_image/../../../secret.jpg'
        }
      });
      const resTraversal = createMockRes();
      await handlePutSpringSettings(reqTraversal, resTraversal, 'SPR-001', deps);
      assert.equal(resTraversal.statusCode, 400);
      assert.match(resTraversal.body.error, /traversal|tidak valid/i);

      // 3. Wrong prefix in qrisImagePath
      const reqWrongPrefix = createMockReq({
        method: 'PUT',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          defaultMonthlyFee: 15000,
          paymentInstructions: 'Transfer rekening',
          qrisImagePath: 'uploads/other_folder/pic.jpg'
        }
      });
      const resWrongPrefix = createMockRes();
      await handlePutSpringSettings(reqWrongPrefix, resWrongPrefix, 'SPR-001', deps);
      assert.equal(resWrongPrefix.statusCode, 400);
      assert.match(resWrongPrefix.body.error, /uploads\/qris_image/i);
    });

    it('GET /api/v1/springs/:id/settings returns fallback settings when spring_settings does not exist yet', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      };

      const req = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer warga_user' }
      });
      const res = createMockRes();
      await handleGetSpringSettings(req, res, 'SPR-999', deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.springId, 'SPR-999');
      assert.equal(res.body.isFallback, true);
      assert.equal(res.body.qrisImagePath, null);
      assert.equal(res.body.qrisReadUrl, null);
      assert.ok(typeof res.body.paymentInstructions === 'string');
    });
  });
});
