// tests/backend/campaigns-donations-router.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  handleListCampaigns,
  handleGetCampaign,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleCreateCampaignUpdate
} from '../../lib/v1/campaigns.js';
import {
  handleListDonations,
  handleCreateDonation,
  handleVerifyDonation
} from '../../lib/v1/donations.js';
import {
  handleListUsers,
  handleSetUserRoles
} from '../../lib/v1/admin-users.js';
import {
  handleGetSummary
} from '../../lib/v1/summary.js';
import {
  createV1Router
} from '../../api/v1/[...route].js';
import {
  createMockDb,
  createMockAuth,
  createMockStorage,
  createMockReq,
  createMockRes
} from './helpers/mock-firebase.js';

describe('Task 5: Campaigns, Donations, Admin Users, Summary & Catch-All Router', () => {
  const defaultEnv = {
    FIREBASE_STORAGE_BUCKET: 'test-belikhub-bucket'
  };

  function setupTestDeps(seeds = {}, users = {}) {
    const mockDb = createMockDb(seeds);
    const mockAuth = createMockAuth(users);
    const mockStorage = createMockStorage();

    const deps = {
      getAdminDb: () => mockDb,
      getAdminAuth: () => mockAuth,
      getAdminStorage: () => mockStorage,
      verifyIdToken: (t) => mockAuth.verifyIdToken(t),
      env: defaultEnv
    };

    return { mockDb, mockAuth, mockStorage, deps };
  }

  describe('Campaigns & Revitalization Updates (lib/v1/campaigns.js)', () => {
    it('GET /api/v1/campaigns returns grid-snapped coordinates (~5 km) and never returns permit_quota_lps', async () => {
      const { deps } = setupTestDeps({
        springs: {
          'SPR-001': {
            id: 'SPR-001',
            name: 'Mata Air Belik Waru',
            village: 'Waru',
            district: 'Baki',
            regency: 'Sukoharjo',
            permit_quota_lps: 45.5,
            coordinates_public: { lat: -7.581234, lng: 110.825678 }
          }
        },
        revitalization_campaigns: {
          'CAMP-001': {
            id: 'CAMP-001',
            springId: 'SPR-001',
            springName: 'Mata Air Belik Waru',
            title: 'Revitalisasi Bak Penampungan Waru',
            description: 'Pembersihan sedimentasi dan pemasangan pipa filter',
            targetAmount: 15000000,
            collectedAmount: 5000000,
            progressPercent: 30,
            paymentInstructions: 'Transfer ke BCA 1234567890 an Yayasan BelikHub',
            qrisImagePath: 'uploads/qris_image/camp-001-qris.png',
            status: 'active',
            permit_quota_lps: 45.5,
            coordinates_public: { lat: -7.581234, lng: 110.825678 },
            createdAt: '2026-11-01T08:00:00.000Z'
          }
        }
      });

      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();
      await handleListCampaigns(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.campaigns));
      assert.equal(res.body.campaigns.length, 1);

      const campaign = res.body.campaigns[0];
      assert.equal(campaign.id, 'CAMP-001');
      assert.equal(campaign.permit_quota_lps, undefined, 'permit_quota_lps MUST never be exposed in public campaigns');
      assert.ok(campaign.qrisReadUrl, 'qrisReadUrl should be resolved');

      // Grid-snapped coordinate check (grid step = 0.045)
      // -7.581234 / 0.045 = -168.4718 -> round = -168 * 0.045 = -7.5600
      if (campaign.coordinates_public) {
        assert.notEqual(campaign.coordinates_public.lat, -7.581234, 'Exact latitude must not be returned');
        assert.notEqual(campaign.coordinates_public.lng, 110.825678, 'Exact longitude must not be returned');
        assert.equal(typeof campaign.coordinates_public.lat, 'number');
        assert.equal(typeof campaign.coordinates_public.lng, 'number');
      }
    });

    it('GET /api/v1/campaigns/:id returns campaign details with updates timeline and resolved photoUrls', async () => {
      const { deps } = setupTestDeps({
        springs: {
          'SPR-001': {
            id: 'SPR-001',
            name: 'Mata Air Belik Waru',
            permit_quota_lps: 45.5,
            coordinates_public: { lat: -7.581234, lng: 110.825678 }
          }
        },
        revitalization_campaigns: {
          'CAMP-001': {
            id: 'CAMP-001',
            springId: 'SPR-001',
            title: 'Revitalisasi Waru',
            targetAmount: 10000000,
            collectedAmount: 2000000,
            progressPercent: 20,
            status: 'active'
          }
        },
        revitalization_updates: {
          'UPD-001': {
            id: 'UPD-001',
            campaignId: 'CAMP-001',
            springId: 'SPR-001',
            authorUid: 'pengelola_1',
            title: 'Pembersihan Sedimen Tahap 1',
            notes: 'Sedimen telah dikeruk 50 cm',
            progressPercent: 20,
            photoPath: 'uploads/revitalization_photo/update-1.jpg',
            createdAt: '2026-11-10T09:00:00.000Z'
          }
        }
      });

      const req = createMockReq({ method: 'GET', query: { id: 'CAMP-001' } });
      const res = createMockRes();
      await handleGetCampaign(req, res, 'CAMP-001', deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.campaign.id, 'CAMP-001');
      assert.equal(res.body.campaign.permit_quota_lps, undefined);
      assert.ok(Array.isArray(res.body.campaign.updates));
      assert.equal(res.body.campaign.updates.length, 1);
      assert.ok(res.body.campaign.updates[0].photoUrl, 'photoUrl must be resolved');
    });

    it('POST /api/v1/campaigns allows admin to create campaign with valid targetAmount and instructions', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          springs: {
            'SPR-001': {
              id: 'SPR-001',
              name: 'Mata Air Waru',
              village: 'Waru'
            }
          }
        },
        {
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: {
          springId: 'SPR-001',
          title: 'Perbaikan Pipa Distribusi',
          description: 'Mengganti pipa 2 inch yang bocor',
          targetAmount: 8500000,
          paymentInstructions: 'Transfer Bank Mandiri 1380001234 an BelikHub'
        }
      });
      const res = createMockRes();
      await handleCreateCampaign(req, res, deps);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.campaign.springId, 'SPR-001');
      assert.equal(res.body.campaign.targetAmount, 8500000);
      assert.equal(res.body.campaign.collectedAmount, 0);
      assert.equal(res.body.campaign.progressPercent, 0);
      assert.equal(res.body.campaign.status, 'active');

      const savedSnap = await mockDb.collection('revitalization_campaigns').doc(res.body.campaign.id).get();
      assert.ok(savedSnap.exists);
    });

    it('POST /api/v1/campaigns/:id/updates rejects pengelola for unmanaged spring with 403 and atomically updates campaign.progressPercent for managed spring', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          revitalization_campaigns: {
            'CAMP-SPR-001': {
              id: 'CAMP-SPR-001',
              springId: 'SPR-001',
              title: 'Revitalisasi SPR 1',
              progressPercent: 10,
              status: 'active'
            },
            'CAMP-SPR-002': {
              id: 'CAMP-SPR-002',
              springId: 'SPR-002',
              title: 'Revitalisasi SPR 2',
              progressPercent: 0,
              status: 'active'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          }
        }
      );

      // 1. Pengelola attempts to post update for unmanaged spring CAMP-SPR-002 -> 403
      const reqForbidden = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          title: 'Update Ilegal',
          notes: 'Mencoba update mata air lain',
          progressPercent: 50
        }
      });
      const resForbidden = createMockRes();
      await handleCreateCampaignUpdate(reqForbidden, resForbidden, 'CAMP-SPR-002', deps);
      assert.equal(resForbidden.statusCode, 403);
      assert.match(resForbidden.body.error, /akses|mata air|forbidden/i);

      // 2. Validation check: invalid progressPercent (-5 or 120) or invalid photoPath with path traversal
      const reqInvalid = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          title: 'Update Invalid',
          progressPercent: 150
        }
      });
      const resInvalid = createMockRes();
      await handleCreateCampaignUpdate(reqInvalid, resInvalid, 'CAMP-SPR-001', deps);
      assert.equal(resInvalid.statusCode, 400);

      const reqTraversal = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          title: 'Update Traversal',
          progressPercent: 40,
          photoPath: 'uploads/revitalization_photo/../../etc/passwd'
        }
      });
      const resTraversal = createMockRes();
      await handleCreateCampaignUpdate(reqTraversal, resTraversal, 'CAMP-SPR-001', deps);
      assert.equal(resTraversal.statusCode, 400);

      // 3. Pengelola posts valid update for managed spring CAMP-SPR-001 -> 201 + atomic progressPercent update
      const reqValid = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          title: 'Pemasangan Pipa Selesai',
          notes: 'Pipa baru telah terhubung ke bak tampung warga',
          progressPercent: 65,
          photoPath: 'uploads/revitalization_photo/camp-1-pipa.jpg',
          spentAmount: 3500000
        }
      });
      const resValid = createMockRes();
      await handleCreateCampaignUpdate(reqValid, resValid, 'CAMP-SPR-001', deps);
      assert.equal(resValid.statusCode, 201);
      assert.equal(resValid.body.success, true);
      assert.equal(resValid.body.update.progressPercent, 65);

      // Check parent campaign progressPercent updated in db
      const campaignSnap = await mockDb.collection('revitalization_campaigns').doc('CAMP-SPR-001').get();
      assert.equal(campaignSnap.data().progressPercent, 65);
    });
  });

  describe('Donations Engine & Verification Concurrency (lib/v1/donations.js)', () => {
    it('POST /api/v1/donations creates pending_verification donation for individual and organization (CSR) donors', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          revitalization_campaigns: {
            'CAMP-001': {
              id: 'CAMP-001',
              springId: 'SPR-001',
              springName: 'Mata Air Belik Waru',
              title: 'Revitalisasi Waru',
              targetAmount: 10000000,
              collectedAmount: 1000000,
              status: 'active'
            }
          }
        },
        {
          donatur_ind: {
            uid: 'donatur_ind',
            displayName: 'Ahmad Donatur',
            customClaims: { roles: ['donatur'] }
          },
          donatur_csr: {
            uid: 'donatur_csr',
            displayName: 'PT Sumber Berkah',
            customClaims: { roles: ['donatur'] }
          }
        }
      );

      // 1. Individual donation
      const reqInd = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer donatur_ind' },
        body: {
          campaignId: 'CAMP-001',
          amount: 50000,
          paymentMethod: 'qris',
          donorType: 'individual',
          isAnonymous: true,
          proofPath: 'uploads/donation_proof/don-ind-01.jpg'
        }
      });
      const resInd = createMockRes();
      await handleCreateDonation(reqInd, resInd, deps);

      assert.equal(resInd.statusCode, 201);
      assert.equal(resInd.body.success, true);
      assert.equal(resInd.body.donation.amount, 50000);
      assert.equal(resInd.body.donation.status, 'pending_verification');
      assert.equal(resInd.body.donation.isAnonymous, true);
      assert.equal(resInd.body.donation.donorType, 'individual');

      // 2. Organization / CSR donation
      const reqCsr = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer donatur_csr' },
        body: {
          campaignId: 'CAMP-001',
          amount: 5000000,
          paymentMethod: 'transfer',
          donorType: 'organization',
          organizationName: 'PT Sumber Berkah CSR',
          proofPath: 'uploads/donation_proof/don-csr-01.jpg'
        }
      });
      const resCsr = createMockRes();
      await handleCreateDonation(reqCsr, resCsr, deps);

      assert.equal(resCsr.statusCode, 201);
      assert.equal(resCsr.body.donation.amount, 5000000);
      assert.equal(resCsr.body.donation.donorType, 'organization');
      assert.equal(resCsr.body.donation.organizationName, 'PT Sumber Berkah CSR');

      // 3. Validation: amount < 1000 or invalid proofPath prefix
      const reqMinAmount = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer donatur_ind' },
        body: { campaignId: 'CAMP-001', amount: 500 }
      });
      const resMinAmount = createMockRes();
      await handleCreateDonation(reqMinAmount, resMinAmount, deps);
      assert.equal(resMinAmount.statusCode, 400);

      const reqBadProof = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer donatur_ind' },
        body: {
          campaignId: 'CAMP-001',
          amount: 25000,
          proofPath: 'uploads/invalid_folder/proof.jpg'
        }
      });
      const resBadProof = createMockRes();
      await handleCreateDonation(reqBadProof, resBadProof, deps);
      assert.equal(resBadProof.statusCode, 400);
    });

    it('PATCH /api/v1/donations/:id (approve) atomically increments campaign.collectedAmount once; a second approve on the same donation returns 409 without double-crediting', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          revitalization_campaigns: {
            'CAMP-CONCUR': {
              id: 'CAMP-CONCUR',
              springId: 'SPR-001',
              title: 'Revitalisasi Waru',
              targetAmount: 10000000,
              collectedAmount: 1000000,
              status: 'active'
            }
          },
          donations: {
            'DON-001': {
              id: 'DON-001',
              campaignId: 'CAMP-CONCUR',
              springId: 'SPR-001',
              donorUid: 'donatur_1',
              amount: 500000,
              status: 'pending_verification',
              proofPath: 'uploads/donation_proof/don-001.jpg'
            }
          }
        },
        {
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );

      // 1. First approval: MUST succeed and increment campaign.collectedAmount from 1,000,000 to 1,500,000
      const reqApprove1 = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { action: 'approve' }
      });
      const resApprove1 = createMockRes();
      await handleVerifyDonation(reqApprove1, resApprove1, 'DON-001', deps);

      assert.equal(resApprove1.statusCode, 200);
      assert.equal(resApprove1.body.status, 'verified');

      const campSnapAfter1 = await mockDb.collection('revitalization_campaigns').doc('CAMP-CONCUR').get();
      assert.equal(campSnapAfter1.data().collectedAmount, 1500000, 'collectedAmount incremented by 500,000');

      // 2. Second approval on the same donation: MUST return 409 Conflict without double-crediting
      const reqApprove2 = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { action: 'approve' }
      });
      const resApprove2 = createMockRes();
      await handleVerifyDonation(reqApprove2, resApprove2, 'DON-001', deps);

      assert.equal(resApprove2.statusCode, 409, 'Subsequent approval on already verified donation MUST fail with 409');
      assert.match(resApprove2.body.error, /pending_verification|sudah diproses|conflict/i);

      // Verify collectedAmount is STILL 1,500,000 (NEVER double-credited!)
      const campSnapAfter2 = await mockDb.collection('revitalization_campaigns').doc('CAMP-CONCUR').get();
      assert.equal(campSnapAfter2.data().collectedAmount, 1500000, 'collectedAmount must NEVER be double-credited');
    });

    it('handleListDonations resolves signed proofUrls and scopes to donor vs admin', async () => {
      const { deps } = setupTestDeps(
        {
          donations: {
            'DON-D1': {
              id: 'DON-D1',
              campaignId: 'CAMP-001',
              donorUid: 'donor_alice',
              amount: 100000,
              status: 'verified',
              proofPath: 'uploads/donation_proof/alice.jpg',
              createdAt: '2026-11-02T10:00:00.000Z'
            },
            'DON-D2': {
              id: 'DON-D2',
              campaignId: 'CAMP-001',
              donorUid: 'donor_bob',
              amount: 250000,
              status: 'pending_verification',
              proofPath: 'uploads/donation_proof/bob.jpg',
              createdAt: '2026-11-03T10:00:00.000Z'
            }
          }
        },
        {
          donor_alice: {
            uid: 'donor_alice',
            customClaims: { roles: ['donatur'] }
          },
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );

      // Donor Alice sees only own donation
      const reqAlice = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer donor_alice' }
      });
      const resAlice = createMockRes();
      await handleListDonations(reqAlice, resAlice, deps);

      assert.equal(resAlice.statusCode, 200);
      assert.equal(resAlice.body.donations.length, 1);
      assert.equal(resAlice.body.donations[0].id, 'DON-D1');
      assert.ok(resAlice.body.donations[0].proofUrl, 'proofUrl must be resolved');

      // Admin sees all donations
      const reqAdmin = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resAdmin = createMockRes();
      await handleListDonations(reqAdmin, resAdmin, deps);

      assert.equal(resAdmin.statusCode, 200);
      assert.equal(resAdmin.body.donations.length, 2);
    });
  });

  describe('Admin Users Management (lib/v1/admin-users.js)', () => {
    it('PATCH /api/v1/admin/users/:uid/roles sets Firebase custom claims (roles + admin boolean) and managedSpringIds', async () => {
      const { mockDb, mockAuth, deps } = setupTestDeps(
        {
          users: {
            user_target: {
              email: 'target@example.com',
              name: 'Pak Budi',
              roles: ['warga'],
              springId: 'SPR-001'
            }
          }
        },
        {
          admin_caller: {
            uid: 'admin_caller',
            customClaims: { roles: ['admin'], admin: true }
          },
          warga_caller: {
            uid: 'warga_caller',
            customClaims: { roles: ['warga'], admin: false }
          },
          user_target: {
            uid: 'user_target',
            email: 'target@example.com',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      // 1. Admin assigns pengelola role + managedSpringIds
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_caller' },
        body: {
          roles: ['pengelola', 'warga'],
          managedSpringIds: ['SPR-001', 'SPR-002']
        }
      });
      const res = createMockRes();
      await handleSetUserRoles(req, res, 'user_target', deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.deepEqual(res.body.user.roles.sort(), ['pengelola', 'warga'].sort());
      assert.deepEqual(res.body.user.managedSpringIds, ['SPR-001', 'SPR-002']);

      // Verify custom claims in mockAuth
      const authUser = await mockAuth.getUser('user_target');
      assert.deepEqual(authUser.customClaims.roles.sort(), ['pengelola', 'warga'].sort());
      assert.equal(authUser.customClaims.admin, false);

      // Verify Firestore users/{uid}
      const fsUser = await mockDb.collection('users').doc('user_target').get();
      assert.deepEqual(fsUser.data().roles.sort(), ['pengelola', 'warga'].sort());
      assert.deepEqual(fsUser.data().managedSpringIds, ['SPR-001', 'SPR-002']);

      // 2. Admin assigns admin role -> sets custom claim admin: true
      const reqAdmin = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_caller' },
        body: {
          roles: ['admin', 'relawan']
        }
      });
      const resAdmin = createMockRes();
      await handleSetUserRoles(reqAdmin, resAdmin, 'user_target', deps);
      assert.equal(resAdmin.statusCode, 200);

      const authUserAdmin = await mockAuth.getUser('user_target');
      assert.equal(authUserAdmin.customClaims.admin, true);

      // 3. Validation: invalid role rejects with 400
      const reqInvalidRole = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_caller' },
        body: { roles: ['super_user_fake'] }
      });
      const resInvalidRole = createMockRes();
      await handleSetUserRoles(reqInvalidRole, resInvalidRole, 'user_target', deps);
      assert.equal(resInvalidRole.statusCode, 400);

      // 4. Non-admin caller receives 403
      const reqNonAdmin = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_caller' },
        body: { roles: ['admin'] }
      });
      const resNonAdmin = createMockRes();
      await handleSetUserRoles(reqNonAdmin, resNonAdmin, 'user_target', deps);
      assert.equal(resNonAdmin.statusCode, 403);
    });

    it('GET /api/v1/admin/users lists users for admin and rejects non-admin with 403', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            user_1: {
              name: 'Warga 1',
              roles: ['warga'],
              springId: 'SPR-001'
            }
          }
        },
        {
          admin_user: {
            uid: 'admin_user',
            email: 'admin@belikhub.id',
            customClaims: { roles: ['admin'], admin: true }
          },
          user_1: {
            uid: 'user_1',
            email: 'warga1@gmail.com',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      const req = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer admin_user' }
      });
      const res = createMockRes();
      await handleListUsers(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.users));
      assert.ok(res.body.users.length >= 1);

      // Non-admin check
      const reqForbidden = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer user_1' }
      });
      const resForbidden = createMockRes();
      await handleListUsers(reqForbidden, resForbidden, deps);
      assert.equal(resForbidden.statusCode, 403);
    });
  });

  describe('Role Summary Engine (lib/v1/summary.js)', () => {
    it('GET /api/v1/summary returns role-specific transparency for warga, pengelola, and admin', async () => {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const { deps } = setupTestDeps(
        {
          users: {
            warga_user: {
              roles: ['warga'],
              springId: 'SPR-001',
              residentId: 'RES-001'
            },
            pengelola_user: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          springs: {
            'SPR-001': { id: 'SPR-001', name: 'Mata Air Belik Waru' }
          },
          retribution_bills: {
            [`SPR-001_RES-001_${currentPeriod}`]: {
              id: `SPR-001_RES-001_${currentPeriod}`,
              springId: 'SPR-001',
              residentId: 'RES-001',
              period: currentPeriod,
              amount: 15000,
              status: 'unpaid'
            },
            [`SPR-001_RES-002_${currentPeriod}`]: {
              id: `SPR-001_RES-002_${currentPeriod}`,
              springId: 'SPR-001',
              residentId: 'RES-002',
              period: currentPeriod,
              amount: 15000,
              status: 'paid',
              paymentMethod: 'cash'
            }
          },
          revitalization_campaigns: {
            'CAMP-001': {
              id: 'CAMP-001',
              springId: 'SPR-001',
              title: 'Revitalisasi Waru',
              progressPercent: 40,
              collectedAmount: 4000000,
              targetAmount: 10000000,
              status: 'active'
            }
          },
          donations: {
            'DON-PENDING': {
              id: 'DON-PENDING',
              amount: 500000,
              status: 'pending_verification'
            }
          }
        },
        {
          warga_user: {
            uid: 'warga_user',
            customClaims: { roles: ['warga'] }
          },
          pengelola_user: {
            uid: 'pengelola_user',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );

      // 1. Warga summary includes village retribution transparency
      const reqWarga = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer warga_user' }
      });
      const resWarga = createMockRes();
      await handleGetSummary(reqWarga, resWarga, deps);

      assert.equal(resWarga.statusCode, 200);
      assert.equal(resWarga.body.success, true);
      assert.equal(resWarga.body.summary.role, 'warga');
      assert.ok(resWarga.body.summary.villageRetribution);
      assert.equal(resWarga.body.summary.villageRetribution.springId, 'SPR-001');
      assert.equal(resWarga.body.summary.villageRetribution.totalCollected, 15000);
      assert.equal(resWarga.body.summary.villageRetribution.paidCount, 1);
      assert.equal(resWarga.body.summary.villageRetribution.unpaidCount, 1);

      // 2. Pengelola summary includes managed springs metrics
      const reqPengelola = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_user' }
      });
      const resPengelola = createMockRes();
      await handleGetSummary(reqPengelola, resPengelola, deps);

      assert.equal(resPengelola.statusCode, 200);
      assert.equal(resPengelola.body.summary.role, 'pengelola');
      assert.deepEqual(resPengelola.body.summary.managedSpringIds, ['SPR-001']);
      assert.ok(resPengelola.body.summary.retribution);

      // 3. Admin summary includes cross-spring KPIs and pending queue counts
      const reqAdmin = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resAdmin = createMockRes();
      await handleGetSummary(reqAdmin, resAdmin, deps);

      assert.equal(resAdmin.statusCode, 200);
      assert.equal(resAdmin.body.summary.role, 'admin');
      assert.ok(resAdmin.body.summary.pendingQueues);
      assert.equal(resAdmin.body.summary.pendingQueues.pendingDonations, 1);
    });
  });

  describe('Catch-All Router (api/v1/[...route].js)', () => {
    it('api/v1/[...route].js dispatches routes cleanly, returns 404 for unknown paths, and total api/**/*.js count stays <= 12', async () => {
      const { deps } = setupTestDeps(
        {
          revitalization_campaigns: {
            'CAMP-ROUTE-1': {
              id: 'CAMP-ROUTE-1',
              springId: 'SPR-001',
              title: 'Revitalisasi Router Test',
              status: 'active'
            }
          }
        },
        {
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );

      const router = createV1Router(deps);

      // Test route dispatch via Vercel query.route array
      const reqVercel = createMockReq({
        method: 'GET',
        url: '/api/v1/campaigns',
        query: { route: ['campaigns'] }
      });
      const resVercel = createMockRes();
      await router(reqVercel, resVercel);
      assert.equal(resVercel.statusCode, 200);
      assert.equal(resVercel.body.success, true);

      // Test route dispatch via URL fallback when query.route is undefined
      const reqUrlFallback = createMockReq({
        method: 'GET',
        url: '/api/v1/campaigns',
        query: {}
      });
      const resUrlFallback = createMockRes();
      await router(reqUrlFallback, resUrlFallback);
      assert.equal(resUrlFallback.statusCode, 200);
      assert.equal(resUrlFallback.body.success, true);

      // Test nested param route /api/v1/campaigns/:id
      const reqParam = createMockReq({
        method: 'GET',
        url: '/api/v1/campaigns/CAMP-ROUTE-1',
        query: { route: ['campaigns', 'CAMP-ROUTE-1'] }
      });
      const resParam = createMockRes();
      await router(reqParam, resParam);
      assert.equal(resParam.statusCode, 200);
      assert.equal(resParam.body.campaign.id, 'CAMP-ROUTE-1');

      // Test unknown route returns 404
      const reqUnknown = createMockReq({
        method: 'GET',
        url: '/api/v1/nonexistent/endpoint',
        query: { route: ['nonexistent', 'endpoint'] }
      });
      const resUnknown = createMockRes();
      await router(reqUnknown, resUnknown);
      assert.equal(resUnknown.statusCode, 404);
      assert.match(resUnknown.body.error, /not found/i);

      // Enforce total Vercel API functions cap <= 12
      function walkDir(dir) {
        return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            return walkDir(fullPath);
          }
          return entry.name.endsWith('.js') ? [fullPath] : [];
        });
      }
      const apiFunctions = walkDir('api');
      assert.ok(apiFunctions.length <= 12, `Total api functions (${apiFunctions.length}) must be <= 12`);
      assert.equal(apiFunctions.length, 11, `Expected exactly 11 api functions, found ${apiFunctions.length}`);
    });

    it('api/v1/[...route].js handles OPTIONS and dispatches all section 7.2 endpoints', async () => {
      const { deps } = setupTestDeps(
        {
          springs: {
            'SPR-001': { id: 'SPR-001', name: 'Spring Waru' }
          }
        },
        {
          admin_user: {
            uid: 'admin_user',
            customClaims: { roles: ['admin'], admin: true }
          }
        }
      );
      const router = createV1Router(deps);

      // OPTIONS preflight
      const reqOpt = createMockReq({ method: 'OPTIONS' });
      const resOpt = createMockRes();
      await router(reqOpt, resOpt);
      assert.equal(resOpt.statusCode, 200);

      // String format route
      const reqStrRoute = createMockReq({
        method: 'GET',
        query: { route: 'springs/SPR-001/settings' },
        headers: { authorization: 'Bearer admin_user' }
      });
      const resStrRoute = createMockRes();
      await router(reqStrRoute, resStrRoute);
      assert.equal(resStrRoute.statusCode, 200);

      // Summary dispatch
      const reqSummary = createMockReq({
        method: 'GET',
        url: '/api/v1/summary',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resSummary = createMockRes();
      await router(reqSummary, resSummary);
      assert.equal(resSummary.statusCode, 200);
      assert.equal(resSummary.body.summary.role, 'admin');

      // Admin users dispatch
      const reqUsers = createMockReq({
        method: 'GET',
        url: '/api/v1/admin/users',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resUsers = createMockRes();
      await router(reqUsers, resUsers);
      assert.equal(resUsers.statusCode, 200);
      assert.ok(Array.isArray(resUsers.body.users));

      // Donations dispatch
      const reqDon = createMockReq({
        method: 'GET',
        url: '/api/v1/donations',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resDon = createMockRes();
      await router(reqDon, resDon);
      assert.equal(resDon.statusCode, 200);

      // Residents dispatch
      const reqRes = createMockReq({
        method: 'GET',
        url: '/api/v1/residents',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resRes = createMockRes();
      await router(reqRes, resRes);
      assert.equal(resRes.statusCode, 200);

      // Retributions dispatch
      const reqRet = createMockReq({
        method: 'GET',
        url: '/api/v1/retributions',
        headers: { authorization: 'Bearer admin_user' }
      });
      const resRet = createMockRes();
      await router(reqRet, resRet);
      assert.equal(resRet.statusCode, 200);
    });
  });
});
