// tests/backend/residents-and-retributions.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  handleListResidents,
  handleCreateResident,
  handleUpdateResident,
  handleGenerateLinkCode,
  handleApproveLink
} from '../../lib/v1/residents.js';
import {
  handleListRetributions,
  handleGenerateBills,
  handleUpdateRetribution
} from '../../lib/v1/retributions.js';
import {
  createMockDb,
  createMockAuth,
  createMockStorage,
  createMockReq,
  createMockRes
} from './helpers/mock-firebase.js';

describe('Task 4: Residents Management & Retribution Billing Engine', () => {
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

  describe('Cross-spring isolation', () => {
    it('pengelola assigned to SPR-001 gets 403 when listing residents, creating residents, generating bills, or recording cash for SPR-002', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          residents: {
            res_spr2_1: {
              id: 'res_spr2_1',
              springId: 'SPR-002',
              name: 'Warga SPR 2',
              phone: '08123456780',
              monthlyFee: 20000,
              active: true,
              userId: null
            }
          },
          retribution_bills: {
            'SPR-002_res_spr2_1_2026-11': {
              id: 'SPR-002_res_spr2_1_2026-11',
              springId: 'SPR-002',
              residentId: 'res_spr2_1',
              period: '2026-11',
              amount: 20000,
              status: 'unpaid'
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

      // 1. List residents with ?springId=SPR-002 -> 403
      const reqList = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_spr1' },
        query: { springId: 'SPR-002' }
      });
      const resList = createMockRes();
      await handleListResidents(reqList, resList, deps);
      assert.equal(resList.statusCode, 403);
      assert.match(resList.body.error, /akses|mata air|forbidden/i);

      // 2. Create resident for SPR-002 -> 403
      const reqCreate = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          springId: 'SPR-002',
          name: 'Penyusup',
          phone: '08123456789',
          monthlyFee: 15000
        }
      });
      const resCreate = createMockRes();
      await handleCreateResident(reqCreate, resCreate, deps);
      assert.equal(resCreate.statusCode, 403);
      assert.match(resCreate.body.error, /akses|mata air|forbidden/i);

      // 3. Generate bills for SPR-002 -> 403
      const reqGen = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          springId: 'SPR-002',
          period: '2026-11'
        }
      });
      const resGen = createMockRes();
      await handleGenerateBills(reqGen, resGen, deps);
      assert.equal(resGen.statusCode, 403);
      assert.match(resGen.body.error, /akses|mata air|forbidden/i);

      // 4. Record cash for SPR-002 bill -> 403
      const reqCash = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          action: 'record_cash'
        }
      });
      const resCash = createMockRes();
      await handleUpdateRetribution(reqCash, resCash, 'SPR-002_res_spr2_1_2026-11', deps);
      assert.equal(resCash.statusCode, 403);
      assert.match(resCash.body.error, /akses|mata air|forbidden/i);

      // 5. Generate link code on SPR-002 resident -> 403
      const reqLinkCode = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' }
      });
      const resLinkCode = createMockRes();
      await handleGenerateLinkCode(reqLinkCode, resLinkCode, 'res_spr2_1', deps);
      assert.equal(resLinkCode.statusCode, 403);

      // 6. List retributions with ?springId=SPR-002 -> 403
      const reqListBills = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_spr1' },
        query: { springId: 'SPR-002' }
      });
      const resListBills = createMockRes();
      await handleListRetributions(reqListBills, resListBills, deps);
      assert.equal(resListBills.statusCode, 403);
    });
  });

  describe('Resident Management & Link Codes', () => {
    it('pengelola can register a non-app villager (userId: null), generate 6-char linkCode, and approve a pending warga link request', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            },
            warga_pending: {
              roles: ['warga'],
              springId: 'SPR-001',
              residentId: null,
              residentLinkStatus: 'pending',
              name: 'Warga Digital',
              phone: '0811223344'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          warga_pending: {
            uid: 'warga_pending',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      // 1. Create non-app resident (userId: null, active: true)
      const reqCreate = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          springId: 'SPR-001',
          name: 'Pak Sugeng',
          phone: '08123456789',
          monthlyFee: 25000
        }
      });
      const resCreate = createMockRes();
      await handleCreateResident(reqCreate, resCreate, deps);

      assert.equal(resCreate.statusCode, 201);
      assert.equal(resCreate.body.success, true);
      assert.ok(resCreate.body.resident.id);
      assert.equal(resCreate.body.resident.name, 'Pak Sugeng');
      assert.equal(resCreate.body.resident.userId, null);
      assert.equal(resCreate.body.resident.active, true);
      assert.equal(resCreate.body.resident.monthlyFee, 25000);

      const residentId = resCreate.body.resident.id;

      // 2. Generate 6-char linkCode
      const reqCode = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' }
      });
      const resCode = createMockRes();
      await handleGenerateLinkCode(reqCode, resCode, residentId, deps);

      assert.equal(resCode.statusCode, 200);
      assert.equal(resCode.body.success, true);
      assert.equal(typeof resCode.body.linkCode, 'string');
      assert.equal(resCode.body.linkCode.length, 6);
      // Verify uppercase alphanumeric from allowed alphabet (no I, O, 0, 1)
      assert.match(resCode.body.linkCode, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      assert.ok(resCode.body.linkCodeExpiresAt);

      // Verify resident doc has linkCode stored
      const residentSnap = await mockDb.collection('residents').doc(residentId).get();
      assert.equal(residentSnap.data().linkCode, resCode.body.linkCode);

      // 3. List residents includes resident and pending warga
      const reqList = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_spr1' }
      });
      const resList = createMockRes();
      await handleListResidents(reqList, resList, deps);

      assert.equal(resList.statusCode, 200);
      assert.ok(resList.body.residents.some((r) => r.id === residentId));
      assert.ok(
        (resList.body.pendingUsers || resList.body.pendingLinkRequests).some(
          (u) => u.uid === 'warga_pending' || u.id === 'warga_pending'
        )
      );

      // 4. Approve pending warga link request to existing resident
      const reqApprove = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          userUid: 'warga_pending',
          residentId
        }
      });
      const resApprove = createMockRes();
      await handleApproveLink(reqApprove, resApprove, deps);

      assert.equal(resApprove.statusCode, 200);
      assert.equal(resApprove.body.success, true);

      // Verify resident and user are linked
      const updatedResident = (await mockDb.collection('residents').doc(residentId).get()).data();
      assert.equal(updatedResident.userId, 'warga_pending');
      assert.equal(updatedResident.linkCode, null);

      const updatedUser = (await mockDb.collection('users').doc('warga_pending').get()).data();
      assert.equal(updatedUser.residentId, residentId);
      assert.equal(updatedUser.residentLinkStatus, 'linked');
    });

    it('pengelola can approve link with createResident option', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            },
            warga_new: {
              roles: ['warga'],
              springId: 'SPR-001',
              residentId: null,
              residentLinkStatus: 'pending'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          warga_new: {
            uid: 'warga_new',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      const reqApprove = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          userUid: 'warga_new',
          createResident: {
            name: 'Ibu Rahayu',
            phone: '0855667788',
            monthlyFee: 30000
          }
        }
      });
      const resApprove = createMockRes();
      await handleApproveLink(reqApprove, resApprove, deps);

      assert.equal(resApprove.statusCode, 200);
      assert.equal(resApprove.body.success, true);
      assert.ok(resApprove.body.residentId);

      const userDoc = (await mockDb.collection('users').doc('warga_new').get()).data();
      assert.equal(userDoc.residentId, resApprove.body.residentId);
      assert.equal(userDoc.residentLinkStatus, 'linked');

      const residentDoc = (await mockDb.collection('residents').doc(resApprove.body.residentId).get()).data();
      assert.equal(residentDoc.name, 'Ibu Rahayu');
      assert.equal(residentDoc.userId, 'warga_new');
      assert.equal(residentDoc.monthlyFee, 30000);
    });

    it('handleUpdateResident updates resident fields and toggles active status', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          residents: {
            res_1: {
              id: 'res_1',
              springId: 'SPR-001',
              name: 'Pak Bambang',
              phone: '0812345678',
              monthlyFee: 20000,
              active: true
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

      const reqUpdate = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          name: 'Pak Bambang Sujatmiko',
          monthlyFee: 25000,
          active: false
        }
      });
      const resUpdate = createMockRes();
      await handleUpdateResident(reqUpdate, resUpdate, 'res_1', deps);

      assert.equal(resUpdate.statusCode, 200);
      assert.equal(resUpdate.body.success, true);
      assert.equal(resUpdate.body.resident.name, 'Pak Bambang Sujatmiko');
      assert.equal(resUpdate.body.resident.monthlyFee, 25000);
      assert.equal(resUpdate.body.resident.active, false);

      const updated = (await mockDb.collection('residents').doc('res_1').get()).data();
      assert.equal(updated.name, 'Pak Bambang Sujatmiko');
      assert.equal(updated.active, false);
    });
  });

  describe('Retribution Billing Engine & Idempotency', () => {
    it('POST /api/v1/retributions/generate is idempotent: second call for same springId+period creates 0 duplicates', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          residents: {
            res_active_1: {
              id: 'res_active_1',
              springId: 'SPR-001',
              name: 'Warga Aktif 1',
              monthlyFee: 25000,
              active: true,
              userId: 'user_warga_1'
            },
            res_active_2: {
              id: 'res_active_2',
              springId: 'SPR-001',
              name: 'Warga Aktif 2',
              monthlyFee: 30000,
              active: true,
              userId: null
            },
            res_inactive: {
              id: 'res_inactive',
              springId: 'SPR-001',
              name: 'Warga Non-Aktif',
              monthlyFee: 20000,
              active: false,
              userId: null
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

      // First run: should create 2 bills (skips inactive resident)
      const req1 = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: { springId: 'SPR-001', period: '2026-11' }
      });
      const res1 = createMockRes();
      await handleGenerateBills(req1, res1, deps);

      assert.equal(res1.statusCode, 200);
      assert.equal(res1.body.success, true);
      assert.equal(res1.body.createdCount, 2);
      assert.equal(res1.body.skippedCount, 0);

      // Verify deterministic doc IDs: ${springId}_${residentId}_${period}
      const bill1 = await mockDb.collection('retribution_bills').doc('SPR-001_res_active_1_2026-11').get();
      assert.equal(bill1.exists, true);
      assert.equal(bill1.data().amount, 25000);
      assert.equal(bill1.data().status, 'unpaid');
      assert.equal(bill1.data().userId, 'user_warga_1');

      const bill2 = await mockDb.collection('retribution_bills').doc('SPR-001_res_active_2_2026-11').get();
      assert.equal(bill2.exists, true);
      assert.equal(bill2.data().amount, 30000);

      // Inactive resident bill should NOT exist
      const billInactive = await mockDb.collection('retribution_bills').doc('SPR-001_res_inactive_2026-11').get();
      assert.equal(billInactive.exists, false);

      // Second run: same springId and period -> should create 0, skip 2
      const req2 = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: { springId: 'SPR-001', period: '2026-11' }
      });
      const res2 = createMockRes();
      await handleGenerateBills(req2, res2, deps);

      assert.equal(res2.statusCode, 200);
      assert.equal(res2.body.success, true);
      assert.equal(res2.body.createdCount, 0);
      assert.equal(res2.body.skippedCount, 2);
    });

    it('handleGenerateBills rejects invalid period format with 400', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            admin_user: { roles: ['admin'] }
          }
        },
        {
          admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } }
        }
      );

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { springId: 'SPR-001', period: '2026-13' } // invalid month 13
      });
      const res = createMockRes();
      await handleGenerateBills(req, res, deps);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /periode|format/i);
    });
  });

  describe('Payment Lifecycle & Proof Submission', () => {
    it('warga can submit_proof on own unpaid bill (status -> pending_verification) and gets 403 on another warga\'s bill', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            warga_user1: {
              roles: ['warga'],
              residentId: 'res_1'
            },
            warga_user2: {
              roles: ['warga'],
              residentId: 'res_2'
            }
          },
          retribution_bills: {
            bill_warga_1: {
              id: 'bill_warga_1',
              springId: 'SPR-001',
              residentId: 'res_1',
              userId: 'warga_user1',
              period: '2026-11',
              amount: 25000,
              status: 'unpaid'
            },
            bill_warga_2: {
              id: 'bill_warga_2',
              springId: 'SPR-001',
              residentId: 'res_2',
              userId: 'warga_user2',
              period: '2026-11',
              amount: 25000,
              status: 'unpaid'
            }
          }
        },
        {
          warga_user1: { uid: 'warga_user1', customClaims: { roles: ['warga'] } },
          warga_user2: { uid: 'warga_user2', customClaims: { roles: ['warga'] } }
        }
      );

      // 1. Warga 1 submits proof on own bill -> 200, status -> pending_verification
      const reqSubmit = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_user1' },
        body: {
          action: 'submit_proof',
          paymentMethod: 'qris',
          proofPath: 'uploads/retribution_proof/warga_user1/1700000000-uuid.jpg'
        }
      });
      const resSubmit = createMockRes();
      await handleUpdateRetribution(reqSubmit, resSubmit, 'bill_warga_1', deps);

      assert.equal(resSubmit.statusCode, 200);
      assert.equal(resSubmit.body.success, true);
      assert.equal(resSubmit.body.bill.status, 'pending_verification');
      assert.equal(resSubmit.body.bill.paymentMethod, 'qris');

      const billDoc = (await mockDb.collection('retribution_bills').doc('bill_warga_1').get()).data();
      assert.equal(billDoc.status, 'pending_verification');
      assert.equal(billDoc.paymentMethod, 'qris');
      assert.equal(billDoc.proofPath, 'uploads/retribution_proof/warga_user1/1700000000-uuid.jpg');

      // 2. Warga 1 attempts submit_proof on Warga 2's bill -> 403
      const reqHijack = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_user1' },
        body: {
          action: 'submit_proof',
          paymentMethod: 'transfer',
          proofPath: 'uploads/retribution_proof/warga_user1/1700000000-uuid.jpg'
        }
      });
      const resHijack = createMockRes();
      await handleUpdateRetribution(reqHijack, resHijack, 'bill_warga_2', deps);

      assert.equal(resHijack.statusCode, 403);
      assert.match(resHijack.body.error, /pemilik|bukan|forbidden/i);

      // 3. Reject proofPath with path traversal or invalid prefix
      const reqInvalidProof = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_user2' },
        body: {
          action: 'submit_proof',
          paymentMethod: 'transfer',
          proofPath: 'uploads/retribution_proof/../secrets.txt'
        }
      });
      const resInvalidProof = createMockRes();
      await handleUpdateRetribution(reqInvalidProof, resInvalidProof, 'bill_warga_2', deps);

      assert.equal(resInvalidProof.statusCode, 400);
    });

    it('pengelola can record_cash on unpaid bill (status -> paid, paymentMethod: \'cash\', recordedByUid set)', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          retribution_bills: {
            bill_cash_test: {
              id: 'bill_cash_test',
              springId: 'SPR-001',
              residentId: 'res_offline_1',
              userId: null,
              period: '2026-11',
              amount: 25000,
              status: 'unpaid'
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

      const reqCash = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          action: 'record_cash'
        }
      });
      const resCash = createMockRes();
      await handleUpdateRetribution(reqCash, resCash, 'bill_cash_test', deps);

      assert.equal(resCash.statusCode, 200);
      assert.equal(resCash.body.success, true);
      assert.equal(resCash.body.bill.status, 'paid');
      assert.equal(resCash.body.bill.paymentMethod, 'cash');

      const billDoc = (await mockDb.collection('retribution_bills').doc('bill_cash_test').get()).data();
      assert.equal(billDoc.status, 'paid');
      assert.equal(billDoc.paymentMethod, 'cash');
      assert.equal(billDoc.recordedByUid, 'pengelola_spr1');
      assert.ok(billDoc.paidAt);
    });

    it('pengelola can reject pending_verification bill (requires rejectionReason) and approve resubmitted proof', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            },
            warga_user1: {
              roles: ['warga'],
              residentId: 'res_1'
            }
          },
          retribution_bills: {
            bill_verify_test: {
              id: 'bill_verify_test',
              springId: 'SPR-001',
              residentId: 'res_1',
              userId: 'warga_user1',
              period: '2026-11',
              amount: 25000,
              status: 'pending_verification',
              proofPath: 'uploads/retribution_proof/warga_user1/buram.jpg'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          warga_user1: {
            uid: 'warga_user1',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      // 1. Reject without rejectionReason -> 400
      const reqRejectNoReason = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: { action: 'reject' }
      });
      const resRejectNoReason = createMockRes();
      await handleUpdateRetribution(reqRejectNoReason, resRejectNoReason, 'bill_verify_test', deps);
      assert.equal(resRejectNoReason.statusCode, 400);
      assert.match(resRejectNoReason.body.error, /alasan|rejectionReason/i);

      // 2. Reject with reason -> status: 'rejected'
      const reqReject = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: { action: 'reject', rejectionReason: 'Foto bukti buram dan nominal tidak terbaca' }
      });
      const resReject = createMockRes();
      await handleUpdateRetribution(reqReject, resReject, 'bill_verify_test', deps);

      assert.equal(resReject.statusCode, 200);
      assert.equal(resReject.body.bill.status, 'rejected');
      assert.equal(resReject.body.bill.rejectionReason, 'Foto bukti buram dan nominal tidak terbaca');

      // 3. Warga resubmits clearer proof -> status: 'pending_verification'
      const reqResubmit = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_user1' },
        body: {
          action: 'submit_proof',
          paymentMethod: 'transfer',
          proofPath: 'uploads/retribution_proof/warga_user1/jelas.jpg'
        }
      });
      const resResubmit = createMockRes();
      await handleUpdateRetribution(reqResubmit, resResubmit, 'bill_verify_test', deps);

      assert.equal(resResubmit.statusCode, 200);
      assert.equal(resResubmit.body.bill.status, 'pending_verification');

      // 4. Pengelola approves -> status: 'paid', verifiedByUid set
      const reqApprove = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: { action: 'approve' }
      });
      const resApprove = createMockRes();
      await handleUpdateRetribution(reqApprove, resApprove, 'bill_verify_test', deps);

      assert.equal(resApprove.statusCode, 200);
      assert.equal(resApprove.body.bill.status, 'paid');
      assert.equal(resApprove.body.bill.verifiedByUid, 'pengelola_spr1');
      assert.ok(resApprove.body.bill.paidAt);

      const finalBill = (await mockDb.collection('retribution_bills').doc('bill_verify_test').get()).data();
      assert.equal(finalBill.status, 'paid');
      assert.equal(finalBill.verifiedByUid, 'pengelola_spr1');
    });
  });

  describe('Listing & Summary Calculation', () => {
    it('handleListRetributions computes summary and resolves proofUrl for pengelola and warga', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            },
            warga_user1: {
              roles: ['warga'],
              residentId: 'res_1'
            }
          },
          retribution_bills: {
            bill_paid_cash: {
              id: 'bill_paid_cash',
              springId: 'SPR-001',
              residentId: 'res_offline',
              userId: null,
              period: '2026-11',
              amount: 20000,
              status: 'paid',
              paymentMethod: 'cash'
            },
            bill_paid_transfer: {
              id: 'bill_paid_transfer',
              springId: 'SPR-001',
              residentId: 'res_1',
              userId: 'warga_user1',
              period: '2026-11',
              amount: 25000,
              status: 'paid',
              paymentMethod: 'transfer',
              proofPath: 'uploads/retribution_proof/warga_user1/proof.jpg'
            },
            bill_pending: {
              id: 'bill_pending',
              springId: 'SPR-001',
              residentId: 'res_2',
              userId: 'warga_user2',
              period: '2026-11',
              amount: 30000,
              status: 'pending_verification',
              paymentMethod: 'qris',
              proofPath: 'uploads/retribution_proof/warga_user2/proof.jpg'
            },
            bill_unpaid: {
              id: 'bill_unpaid',
              springId: 'SPR-001',
              residentId: 'res_3',
              userId: 'warga_user3',
              period: '2026-11',
              amount: 15000,
              status: 'unpaid'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          warga_user1: {
            uid: 'warga_user1',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      // 1. Pengelola lists retributions for SPR-001
      const reqPengelola = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_spr1' },
        query: { springId: 'SPR-001' }
      });
      const resPengelola = createMockRes();
      await handleListRetributions(reqPengelola, resPengelola, deps);

      assert.equal(resPengelola.statusCode, 200);
      assert.equal(resPengelola.body.bills.length, 4);

      // Summary checks:
      // totalBilled = 20000 + 25000 + 30000 + 15000 = 90000
      // totalPaid = 20000 + 25000 = 45000
      // totalCash = 20000
      // totalNonCash = 25000
      // unpaidCount = 1
      // pendingCount = 1
      // paidCount = 2
      const summary = resPengelola.body.summary;
      assert.equal(summary.totalBilled, 90000);
      assert.equal(summary.totalPaid, 45000);
      assert.equal(summary.totalCash, 20000);
      assert.equal(summary.totalNonCash, 25000);
      assert.equal(summary.unpaidCount, 1);
      assert.equal(summary.pendingCount, 1);
      assert.equal(summary.paidCount, 2);

      // Verify signed read URL was resolved for proofPath
      const billWithProof = resPengelola.body.bills.find((b) => b.id === 'bill_paid_transfer');
      assert.ok(billWithProof.proofUrl);
      assert.match(billWithProof.proofUrl, /storage\.googleapis\.com/);

      // 2. Warga lists retributions: should only see their own bill
      const reqWarga = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer warga_user1' }
      });
      const resWarga = createMockRes();
      await handleListRetributions(reqWarga, resWarga, deps);

      assert.equal(resWarga.statusCode, 200);
      assert.equal(resWarga.body.bills.length, 1);
      assert.equal(resWarga.body.bills[0].id, 'bill_paid_transfer');
      assert.equal(resWarga.body.summary.totalBilled, 25000);
      assert.equal(resWarga.body.summary.paidCount, 1);
    });

    it('handleApproveLink backfills userId on existing retribution_bills for that resident', async () => {
      const { mockDb, deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            },
            warga_linking: {
              roles: ['warga'],
              springId: 'SPR-001',
              residentId: null,
              residentLinkStatus: 'pending'
            }
          },
          residents: {
            res_backfill: {
              id: 'res_backfill',
              springId: 'SPR-001',
              name: 'Warga Backfill',
              userId: null,
              active: true
            }
          },
          retribution_bills: {
            bill_existing_1: {
              id: 'bill_existing_1',
              springId: 'SPR-001',
              residentId: 'res_backfill',
              userId: null,
              period: '2026-10',
              amount: 20000,
              status: 'unpaid'
            },
            bill_existing_2: {
              id: 'bill_existing_2',
              springId: 'SPR-001',
              residentId: 'res_backfill',
              userId: null,
              period: '2026-11',
              amount: 20000,
              status: 'unpaid'
            }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          },
          warga_linking: {
            uid: 'warga_linking',
            customClaims: { roles: ['warga'] }
          }
        }
      );

      const reqApprove = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer pengelola_spr1' },
        body: {
          userUid: 'warga_linking',
          residentId: 'res_backfill'
        }
      });
      const resApprove = createMockRes();
      await handleApproveLink(reqApprove, resApprove, deps);

      assert.equal(resApprove.statusCode, 200);

      // Verify bills have userId backfilled
      const bill1 = (await mockDb.collection('retribution_bills').doc('bill_existing_1').get()).data();
      assert.equal(bill1.userId, 'warga_linking');

      const bill2 = (await mockDb.collection('retribution_bills').doc('bill_existing_2').get()).data();
      assert.equal(bill2.userId, 'warga_linking');
    });

    it('handleListRetributions supports filtering by period and status', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            admin_user: { roles: ['admin'] }
          },
          retribution_bills: {
            b1: { id: 'b1', springId: 'SPR-001', period: '2026-10', status: 'paid', amount: 20000 },
            b2: { id: 'b2', springId: 'SPR-001', period: '2026-11', status: 'unpaid', amount: 20000 },
            b3: { id: 'b3', springId: 'SPR-001', period: '2026-11', status: 'paid', amount: 25000 }
          }
        },
        {
          admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } }
        }
      );

      const req = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer admin_user' },
        query: { period: '2026-11', status: 'paid' }
      });
      const res = createMockRes();
      await handleListRetributions(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.bills.length, 1);
      assert.equal(res.body.bills[0].id, 'b3');
    });

    it('handleListResidents without springId strictly isolates pengelola to managedSpringIds', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            pengelola_spr1: {
              roles: ['pengelola'],
              managedSpringIds: ['SPR-001']
            }
          },
          residents: {
            res_spr1: { id: 'res_spr1', springId: 'SPR-001', name: 'Warga 1', active: true },
            res_spr2: { id: 'res_spr2', springId: 'SPR-002', name: 'Warga 2', active: true }
          }
        },
        {
          pengelola_spr1: {
            uid: 'pengelola_spr1',
            customClaims: { roles: ['pengelola'], managedSpringIds: ['SPR-001'] }
          }
        }
      );

      const req = createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer pengelola_spr1' }
      });
      const res = createMockRes();
      await handleListResidents(req, res, deps);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.residents.length, 1);
      assert.equal(res.body.residents[0].id, 'res_spr1');
    });
  });

  describe('Edge cases, validation & error handling', () => {
    it('handleCreateResident rejects missing required fields and non-positive monthlyFee', async () => {
      const { deps } = setupTestDeps(
        { users: { admin_user: { roles: ['admin'] } } },
        { admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } } }
      );

      // Missing name
      const reqNoName = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { springId: 'SPR-001', phone: '08123', monthlyFee: 20000 }
      });
      const resNoName = createMockRes();
      await handleCreateResident(reqNoName, resNoName, deps);
      assert.equal(resNoName.statusCode, 400);

      // Monthly fee 0
      const reqZeroFee = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { springId: 'SPR-001', name: 'Budi', phone: '08123', monthlyFee: 0 }
      });
      const resZeroFee = createMockRes();
      await handleCreateResident(reqZeroFee, resZeroFee, deps);
      assert.equal(resZeroFee.statusCode, 400);
    });

    it('handleGenerateLinkCode rejects already-linked resident with 400', async () => {
      const { deps } = setupTestDeps(
        {
          users: { admin_user: { roles: ['admin'] } },
          residents: {
            res_linked: { id: 'res_linked', springId: 'SPR-001', name: 'Linked', userId: 'user_123' }
          }
        },
        { admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } } }
      );

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' }
      });
      const res = createMockRes();
      await handleGenerateLinkCode(req, res, 'res_linked', deps);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /tertaut/i);
    });

    it('handleApproveLink returns 409 if resident already claimed by another user', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            admin_user: { roles: ['admin'] },
            warga_victim: { roles: ['warga'], springId: 'SPR-001', residentId: null }
          },
          residents: {
            res_claimed: { id: 'res_claimed', springId: 'SPR-001', name: 'Claimed', userId: 'user_other' }
          }
        },
        {
          admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } },
          warga_victim: { uid: 'warga_victim', customClaims: { roles: ['warga'] } }
        }
      );

      const req = createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer admin_user' },
        body: { userUid: 'warga_victim', residentId: 'res_claimed' }
      });
      const res = createMockRes();
      await handleApproveLink(req, res, deps);

      assert.equal(res.statusCode, 409);
      assert.match(res.body.error, /sudah ditautkan/i);
    });

    it('handleUpdateRetribution validates invalid action, record_cash on paid, and approve on unpaid', async () => {
      const { deps } = setupTestDeps(
        {
          users: {
            admin_user: { roles: ['admin'] },
            warga_1: { roles: ['warga'], residentId: 'r1' }
          },
          retribution_bills: {
            bill_paid: { id: 'bill_paid', springId: 'SPR-001', residentId: 'r1', userId: 'warga_1', status: 'paid', amount: 20000 },
            bill_unpaid: { id: 'bill_unpaid', springId: 'SPR-001', residentId: 'r1', userId: 'warga_1', status: 'unpaid', amount: 20000 }
          }
        },
        {
          admin_user: { uid: 'admin_user', customClaims: { admin: true, roles: ['admin'] } },
          warga_1: { uid: 'warga_1', customClaims: { roles: ['warga'] } }
        }
      );

      // Unknown action -> 400
      const reqUnknown = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { action: 'magic_wand' }
      });
      const resUnknown = createMockRes();
      await handleUpdateRetribution(reqUnknown, resUnknown, 'bill_unpaid', deps);
      assert.equal(resUnknown.statusCode, 400);

      // record_cash on already paid bill -> 400
      const reqCashPaid = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { action: 'record_cash' }
      });
      const resCashPaid = createMockRes();
      await handleUpdateRetribution(reqCashPaid, resCashPaid, 'bill_paid', deps);
      assert.equal(resCashPaid.statusCode, 400);

      // approve on unpaid bill -> 400
      const reqApproveUnpaid = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer admin_user' },
        body: { action: 'approve' }
      });
      const resApproveUnpaid = createMockRes();
      await handleUpdateRetribution(reqApproveUnpaid, resApproveUnpaid, 'bill_unpaid', deps);
      assert.equal(resApproveUnpaid.statusCode, 400);

      // submit_proof on already paid bill -> 400
      const reqSubmitPaid = createMockReq({
        method: 'PATCH',
        headers: { authorization: 'Bearer warga_1' },
        body: { action: 'submit_proof', paymentMethod: 'qris', proofPath: 'uploads/retribution_proof/warga_1/test.jpg' }
      });
      const resSubmitPaid = createMockRes();
      await handleUpdateRetribution(reqSubmitPaid, resSubmitPaid, 'bill_paid', deps);
      assert.equal(resSubmitPaid.statusCode, 400);
    });

    it('OPTIONS and unsupported HTTP methods are handled correctly', async () => {
      const { deps } = setupTestDeps();

      // OPTIONS handleListResidents
      const reqOpt = createMockReq({ method: 'OPTIONS' });
      const resOpt = createMockRes();
      await handleListResidents(reqOpt, resOpt, deps);
      assert.equal(resOpt.statusCode, 200);

      // POST on handleListResidents -> 405
      const reqPost = createMockReq({ method: 'POST' });
      const resPost = createMockRes();
      await handleListResidents(reqPost, resPost, deps);
      assert.equal(resPost.statusCode, 405);
    });
  });
});
