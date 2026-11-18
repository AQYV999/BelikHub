// tests/backend/uploads-and-reports.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_UPLOAD_PURPOSES,
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
  handleUpload,
  resolveSignedReadUrl
} from '../../lib/v1/uploads.js';
import { createReportsHandler } from '../../api/reports.js';
import {
  createMockDb,
  createMockAuth,
  createMockStorage,
  createMockReq,
  createMockRes
} from './helpers/mock-firebase.js';

describe('Task 2: Server-Proxied Image Uploads & Reports Extensions', () => {
  const sampleJpegBase64 = Buffer.from('fake-jpeg-data').toString('base64');
  const samplePngBase64 = Buffer.from('fake-png-data').toString('base64');

  describe('lib/v1/uploads.js constants', () => {
    it('exports VALID_UPLOAD_PURPOSES correctly', () => {
      assert.deepEqual(VALID_UPLOAD_PURPOSES, [
        'retribution_proof',
        'donation_proof',
        'revitalization_photo',
        'report_photo',
        'qris_image'
      ]);
    });

    it('exports ALLOWED_IMAGE_MIMES correctly', () => {
      assert.deepEqual(ALLOWED_IMAGE_MIMES, ['image/jpeg', 'image/png', 'image/webp']);
    });

    it('exports MAX_UPLOAD_BYTES as 2 MB', () => {
      assert.equal(MAX_UPLOAD_BYTES, 2 * 1024 * 1024);
    });
  });

  describe('POST /api/v1/uploads', () => {
    it('POST /api/v1/uploads rejects missing FIREBASE_STORAGE_BUCKET with 503', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        user_1: { uid: 'user_1', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: '' }
      };

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer user_1' },
        body: {
          purpose: 'report_photo',
          contentType: 'image/jpeg',
          dataBase64: sampleJpegBase64
        }
      });
      const res = createMockRes();

      await handleUpload(req, res, deps);

      assert.equal(res.statusCode, 503);
      assert.match(res.body.error, /FIREBASE_STORAGE_BUCKET/i);
    });

    it('POST /api/v1/uploads rejects non-image MIME (image/svg+xml, application/pdf) with 400', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        user_1: { uid: 'user_1', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'belikhub-test.appspot.com' }
      };

      // Test image/svg+xml
      const reqSvg = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer user_1' },
        body: {
          purpose: 'report_photo',
          contentType: 'image/svg+xml',
          dataBase64: sampleJpegBase64
        }
      });
      const resSvg = createMockRes();
      await handleUpload(reqSvg, resSvg, deps);
      assert.equal(resSvg.statusCode, 400);
      assert.match(resSvg.body.error, /contentType/i);

      // Test application/pdf
      const reqPdf = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer user_1' },
        body: {
          purpose: 'retribution_proof',
          contentType: 'application/pdf',
          dataBase64: sampleJpegBase64
        }
      });
      const resPdf = createMockRes();
      await handleUpload(reqPdf, resPdf, deps);
      assert.equal(resPdf.statusCode, 400);
      assert.match(resPdf.body.error, /contentType/i);
    });

    it('POST /api/v1/uploads rejects payload exceeding 2 MB with 413', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        user_1: { uid: 'user_1', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'belikhub-test.appspot.com' }
      };

      // Create > 2 MB payload
      const hugeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1024, 0x41);
      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer user_1' },
        body: {
          purpose: 'report_photo',
          contentType: 'image/jpeg',
          dataBase64: hugeBuffer.toString('base64')
        }
      });
      const res = createMockRes();

      await handleUpload(req, res, deps);

      assert.equal(res.statusCode, 413);
      assert.match(res.body.error, /limit|exceed|2 MB/i);
    });

    it('POST /api/v1/uploads restricts qris_image to admin (403 for warga) and saves valid JPEG returning { objectPath, readUrl }', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } },
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'belikhub-test.appspot.com' }
      };

      // Warga attempting qris_image -> 403
      const reqWarga = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer warga_user' },
        body: {
          purpose: 'qris_image',
          contentType: 'image/jpeg',
          dataBase64: sampleJpegBase64
        }
      });
      const resWarga = createMockRes();
      await handleUpload(reqWarga, resWarga, deps);
      assert.equal(resWarga.statusCode, 403);
      assert.match(resWarga.body.error, /admin/i);

      // Admin saving valid JPEG -> 201 { objectPath, readUrl }
      const reqAdmin = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          purpose: 'qris_image',
          contentType: 'image/jpeg',
          dataBase64: sampleJpegBase64
        }
      });
      const resAdmin = createMockRes();
      await handleUpload(reqAdmin, resAdmin, deps);

      assert.equal(resAdmin.statusCode, 201);
      assert.ok(resAdmin.body.objectPath);
      assert.match(resAdmin.body.objectPath, /^uploads\/qris_image\/admin_user\/\d+-[a-zA-Z0-9-]+\.jpg$/);
      assert.ok(resAdmin.body.readUrl);
      assert.match(resAdmin.body.readUrl, /^https:\/\/storage\.googleapis\.com/);
    });

    it('POST /api/v1/uploads restricts revitalization_photo to pengelola|admin (403 for warga)', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } },
        pengelola_user: { uid: 'pengelola_user', customClaims: { roles: ['pengelola'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'belikhub-test.appspot.com' }
      };

      // Warga -> 403
      const reqWarga = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer warga_user' },
        body: {
          purpose: 'revitalization_photo',
          contentType: 'image/png',
          dataBase64: samplePngBase64
        }
      });
      const resWarga = createMockRes();
      await handleUpload(reqWarga, resWarga, deps);
      assert.equal(resWarga.statusCode, 403);

      // Pengelola -> 201
      const reqPengelola = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_user' },
        body: {
          purpose: 'revitalization_photo',
          contentType: 'image/png',
          dataBase64: samplePngBase64
        }
      });
      const resPengelola = createMockRes();
      await handleUpload(reqPengelola, resPengelola, deps);
      assert.equal(resPengelola.statusCode, 201);
      assert.match(resPengelola.body.objectPath, /^uploads\/revitalization_photo\/pengelola_user\/\d+-[a-zA-Z0-9-]+\.png$/);
    });

    it('POST /api/v1/uploads strips data:<mime>;base64, prefix and accepts retribution_proof for warga', async () => {
      const mockStorage = createMockStorage();
      const mockAuth = createMockAuth({
        warga_user: { uid: 'warga_user', customClaims: { roles: ['warga'] } }
      });
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'belikhub-test.appspot.com' }
      };

      const prefixedData = `data:image/webp;base64,${Buffer.from('fake-webp-data').toString('base64')}`;
      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer warga_user' },
        body: {
          purpose: 'retribution_proof',
          contentType: 'image/webp',
          dataBase64: prefixedData
        }
      });
      const res = createMockRes();

      await handleUpload(req, res, deps);

      assert.equal(res.statusCode, 201);
      assert.match(res.body.objectPath, /^uploads\/retribution_proof\/warga_user\/\d+-[a-zA-Z0-9-]+\.webp$/);
      assert.ok(res.body.readUrl);
    });

    it('POST /api/v1/uploads rejects unauthenticated request with 401', async () => {
      const req = createMockReq({
        method: 'POST',
        headers: {},
        body: {
          purpose: 'report_photo',
          contentType: 'image/jpeg',
          dataBase64: sampleJpegBase64
        }
      });
      const res = createMockRes();
      const mockStorage = createMockStorage();
      await handleUpload(req, res, {
        getAdminStorage: () => mockStorage,
        env: { FIREBASE_STORAGE_BUCKET: 'bucket' }
      });
      assert.equal(res.statusCode, 401);
    });

    it('POST /api/v1/uploads rejects invalid purpose with 400', async () => {
      const mockAuth = createMockAuth({
        user_1: { uid: 'user_1', customClaims: { roles: ['admin'] } }
      });
      const mockStorage = createMockStorage();
      const deps = {
        getAdminStorage: () => mockStorage,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        env: { FIREBASE_STORAGE_BUCKET: 'bucket' }
      };
      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer user_1' },
        body: {
          purpose: 'unknown_purpose',
          contentType: 'image/jpeg',
          dataBase64: sampleJpegBase64
        }
      });
      const res = createMockRes();
      await handleUpload(req, res, deps);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /purpose/i);
    });

    it('resolveSignedReadUrl returns null for empty or invalid paths', async () => {
      assert.equal(await resolveSignedReadUrl(null), null);
      assert.equal(await resolveSignedReadUrl(''), null);
      assert.equal(await resolveSignedReadUrl(undefined), null);
      assert.equal(await resolveSignedReadUrl('   '), null);
    });
  });

  describe('GET and POST /api/reports extensions', () => {
    it('GET /api/reports?mine=1 returns 401 when unauthenticated and returns caller\'s pending+approved+rejected reports with exact coords when authenticated', async () => {
      const mockDb = createMockDb({
        reports: {
          rep_1: {
            id: 'rep_1',
            userId: 'user_warga',
            reportType: 'Survei Mata Air',
            location: 'Sumber Gede',
            notes: 'Kondisi debit stabil',
            status: 'pending',
            lat: -7.12345,
            lng: 110.45678,
            points: 100,
            createdAt: new Date('2026-11-10T10:00:00Z')
          },
          rep_2: {
            id: 'rep_2',
            userId: 'user_warga',
            reportType: 'Restorasi Mata Air',
            location: 'Tuk Sirah',
            notes: 'Pembersihan sedimentasi',
            status: 'approved',
            lat: -7.23456,
            lng: 110.56789,
            points: 1000,
            createdAt: new Date('2026-11-11T10:00:00Z')
          },
          rep_3: {
            id: 'rep_3',
            userId: 'user_warga',
            reportType: 'Penanaman Pohon',
            location: 'Lereng Bukit',
            notes: 'Bibit rusak kekeringan',
            status: 'rejected',
            lat: -7.34567,
            lng: 110.67890,
            points: 100,
            createdAt: new Date('2026-11-12T10:00:00Z')
          },
          rep_other: {
            id: 'rep_other',
            userId: 'user_other',
            reportType: 'Survei Mata Air',
            location: 'Mata Air Belik',
            notes: 'Debit lancar',
            status: 'approved',
            lat: -7.45678,
            lng: 110.78901,
            points: 100,
            createdAt: new Date('2026-11-13T10:00:00Z')
          }
        }
      });

      const mockAuth = createMockAuth({
        user_warga: { uid: 'user_warga', customClaims: { roles: ['warga'] } }
      });

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      // 1. Unauthenticated -> 401
      const reqUnauth = createMockReq({
        method: 'GET',
        query: { mine: '1' }
      });
      const resUnauth = createMockRes();
      await handler(reqUnauth, resUnauth);
      assert.equal(resUnauth.statusCode, 401);

      // 2. Authenticated -> caller's pending+approved+rejected reports with exact coords
      const reqAuth = createMockReq({
        method: 'GET',
        query: { mine: '1' },
        headers: { authorization: 'Bearer user_warga' }
      });
      const resAuth = createMockRes();
      await handler(reqAuth, resAuth);

      assert.equal(resAuth.statusCode, 200);
      assert.equal(resAuth.getHeader('Cache-Control'), 'private, no-store');
      assert.equal(resAuth.body.total, 3);
      assert.equal(resAuth.body.reports.length, 3);

      const statuses = resAuth.body.reports.map((r) => r.status);
      assert.ok(statuses.includes('pending'));
      assert.ok(statuses.includes('approved'));
      assert.ok(statuses.includes('rejected'));

      // Verify exact coords (not fuzzed)
      const rep1 = resAuth.body.reports.find((r) => r.id === 'rep_1');
      assert.equal(rep1.lat, -7.12345);
      assert.equal(rep1.lng, 110.45678);
      assert.equal(rep1.points, 100);

      // Ensure other user's report is not returned
      assert.equal(resAuth.body.reports.some((r) => r.id === 'rep_other'), false);
    });

    it('GET /api/reports (public/warga/donatur) returns only approved reports with grid-fuzzed coords and no authorEmail', async () => {
      const mockDb = createMockDb({
        reports: {
          rep_approved: {
            id: 'rep_approved',
            userId: 'user_1',
            authorName: 'Siti Rahma',
            authorEmail: 'siti@example.com',
            reportType: 'Restorasi Mata Air',
            location: 'Mata Air Belik',
            notes: 'Pembersihan area sumber',
            status: 'approved',
            lat: -7.12345,
            lng: 110.45678,
            points: 1000,
            createdAt: new Date('2026-11-10T10:00:00Z')
          },
          rep_pending: {
            id: 'rep_pending',
            userId: 'user_2',
            authorName: 'Budi Santoso',
            authorEmail: 'budi@example.com',
            reportType: 'Survei Mata Air',
            location: 'Sumber Anyar',
            notes: 'Pengecekan pipa',
            status: 'pending',
            lat: -7.22345,
            lng: 110.55678,
            points: 100,
            createdAt: new Date('2026-11-11T10:00:00Z')
          }
        }
      });

      const mockAuth = createMockAuth({
        user_warga: { uid: 'user_warga', customClaims: { roles: ['warga'] } }
      });

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      // Public call without token
      const reqPublic = createMockReq({ method: 'GET' });
      const resPublic = createMockRes();
      await handler(reqPublic, resPublic);

      assert.equal(resPublic.statusCode, 200);
      assert.equal(resPublic.body.reports.length, 1);
      const publicRep = resPublic.body.reports[0];
      assert.equal(publicRep.id, 'rep_approved');
      assert.equal(publicRep.status, 'approved');
      // No authorEmail in public response
      assert.equal(publicRep.authorEmail, undefined);
      // Grid-fuzzed coords (not exact -7.12345)
      assert.notEqual(publicRep.lat, -7.12345);
      assert.equal(publicRep.lat, -7.1); // round(-7.12345 / 0.05) * 0.05 = -7.1000
      assert.equal(publicRep.lng, 110.45);
      assert.equal(resPublic.getHeader('Cache-Control'), 'public, s-maxage=60');

      // Warga authenticated call without scope=all
      const reqWarga = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer user_warga' }
      });
      const resWarga = createMockRes();
      await handler(reqWarga, resWarga);

      assert.equal(resWarga.statusCode, 200);
      assert.equal(resWarga.body.reports.length, 1);
      assert.equal(resWarga.body.reports[0].authorEmail, undefined);
      assert.notEqual(resWarga.body.reports[0].lat, -7.12345);
    });

    it('POST /api/reports remains open to any authenticated user without roles claim and accepts valid photoPath (uploads/report_photo/...) resolving photoUrl on GET', async () => {
      const mockDb = createMockDb();
      const mockStorage = createMockStorage();
      // plain user with no roles array or admin claim
      const mockAuth = createMockAuth({
        plain_user: {
          uid: 'plain_user',
          email: 'plain@example.com',
          displayName: 'Plain User'
        }
      });

      const validPhotoPath = 'uploads/report_photo/plain_user/1731930000000-abcd-1234.jpg';

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t),
        resolveSignedReadUrl: async (path) => `https://storage.googleapis.com/mock-bucket/${path}?signed=1`
      });

      // 1. POST valid report with photoPath
      const reqPost = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer plain_user' },
        body: {
          reportType: 'Survei Mata Air',
          location: 'Sumber Sendang Mulyo',
          notes: 'Debit air meningkat pasca hujan lebat',
          lat: -7.15,
          lng: 110.45,
          photoPath: validPhotoPath
        }
      });
      const resPost = createMockRes();

      await handler(reqPost, resPost);

      assert.equal(resPost.statusCode, 201);
      const createdId = resPost.body.id;
      assert.ok(createdId);
      assert.equal(resPost.body.status, 'pending');
      assert.equal(resPost.body.points, 100);

      // Verify stored document in DB
      const doc = await mockDb.collection('reports').doc(createdId).get();
      assert.equal(doc.exists, true);
      assert.equal(doc.data().userId, 'plain_user');
      assert.equal(doc.data().photoPath, validPhotoPath);

      // 2. GET ?mine=1 resolves photoUrl from photoPath
      const reqGet = createMockReq({
        method: 'GET',
        query: { mine: '1' },
        headers: { authorization: 'Bearer plain_user' }
      });
      const resGet = createMockRes();

      await handler(reqGet, resGet);

      assert.equal(resGet.statusCode, 200);
      assert.equal(resGet.body.reports.length, 1);
      const myReport = resGet.body.reports[0];
      assert.equal(myReport.id, createdId);
      assert.equal(myReport.photoPath, validPhotoPath);
      assert.equal(
        myReport.photoUrl,
        `https://storage.googleapis.com/mock-bucket/${validPhotoPath}?signed=1`
      );
    });

    it('POST /api/reports rejects invalid photoPath format with 400', async () => {
      const mockDb = createMockDb();
      const mockAuth = createMockAuth({
        plain_user: { uid: 'plain_user' }
      });

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const reqPost = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer plain_user' },
        body: {
          reportType: 'Survei Mata Air',
          location: 'Sumber Sendang Mulyo',
          notes: 'Debit air normal',
          photoPath: 'malicious/path/../../etc/passwd'
        }
      });
      const resPost = createMockRes();

      await handler(reqPost, resPost);

      assert.equal(resPost.statusCode, 400);
      assert.match(resPost.body.error, /validation failed/i);
      assert.ok(resPost.body.details?.photoPath);
    });

    it('GET /api/reports?scope=all with admin custom claims returns all reports with exact coords and author email', async () => {
      const mockDb = createMockDb({
        reports: {
          rep_app: {
            id: 'rep_app',
            userId: 'user_1',
            authorName: 'Siti',
            authorEmail: 'siti@example.com',
            reportType: 'Restorasi Mata Air',
            location: 'Sumber Gede',
            notes: 'Notes 1',
            status: 'approved',
            lat: -7.12345,
            lng: 110.45678,
            points: 1000,
            createdAt: new Date('2026-11-10T10:00:00Z')
          },
          rep_pen: {
            id: 'rep_pen',
            userId: 'user_2',
            authorName: 'Budi',
            authorEmail: 'budi@example.com',
            reportType: 'Survei Mata Air',
            location: 'Sumber Cilik',
            notes: 'Notes 2',
            status: 'pending',
            lat: -7.23456,
            lng: 110.56789,
            points: 100,
            createdAt: new Date('2026-11-11T10:00:00Z')
          }
        }
      });

      const mockAuth = createMockAuth({
        admin_user: { uid: 'admin_user', customClaims: { roles: ['admin'] } }
      });

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const req = createMockReq({
        method: 'GET',
        query: { scope: 'all' },
        headers: { authorization: 'Bearer admin_user' }
      });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.reports.length, 2);
      assert.equal(res.getHeader('Cache-Control'), 'private, no-store');

      const repApp = res.body.reports.find((r) => r.id === 'rep_app');
      assert.equal(repApp.authorEmail, 'siti@example.com');
      assert.equal(repApp.lat, -7.12345);
      assert.equal(repApp.lng, 110.45678);

      const repPen = res.body.reports.find((r) => r.id === 'rep_pen');
      assert.equal(repPen.status, 'pending');
      assert.equal(repPen.authorEmail, 'budi@example.com');
    });

    it('OPTIONS request and unsupported HTTP methods are handled correctly', async () => {
      const handler = createReportsHandler();

      // OPTIONS
      const reqOpt = createMockReq({ method: 'OPTIONS' });
      const resOpt = createMockRes();
      await handler(reqOpt, resOpt);
      assert.equal(resOpt.statusCode, 200);

      // DELETE -> 405
      const reqDel = createMockReq({ method: 'DELETE' });
      const resDel = createMockRes();
      await handler(reqDel, resDel);
      assert.equal(resDel.statusCode, 405);

      // Uploads handler OPTIONS & PUT
      const reqUploadOpt = createMockReq({ method: 'OPTIONS' });
      const resUploadOpt = createMockRes();
      await handleUpload(reqUploadOpt, resUploadOpt);
      assert.equal(resUploadOpt.statusCode, 200);

      const reqUploadPut = createMockReq({ method: 'PUT' });
      const resUploadPut = createMockRes();
      await handleUpload(reqUploadPut, resUploadPut);
      assert.equal(resUploadPut.statusCode, 405);
    });

    it('POST /api/reports enforces daily rate limit of 10 reports per 24 hours', async () => {
      const existingReports = {};
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        existingReports[`rep_old_${i}`] = {
          id: `rep_old_${i}`,
          userId: 'busy_user',
          reportType: 'Survei Mata Air',
          location: `Lokasi ${i}`,
          notes: 'Catatan survei',
          status: 'pending',
          createdAt: new Date(now - i * 60000)
        };
      }

      const mockDb = createMockDb({ reports: existingReports });
      const mockAuth = createMockAuth({
        busy_user: { uid: 'busy_user' }
      });

      const handler = createReportsHandler({
        getAdminDb: () => mockDb,
        verifyIdToken: (t) => mockAuth.verifyIdToken(t)
      });

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer busy_user' },
        body: {
          reportType: 'Survei Mata Air',
          location: 'Lokasi Ke-11',
          notes: 'Harus ditolak karena limit'
        }
      });
      const res = createMockRes();

      await handler(req, res);

      assert.equal(res.statusCode, 429);
      assert.match(res.body.error, /Batas 10 laporan per 24 jam tercapai/i);
    });
  });
});
