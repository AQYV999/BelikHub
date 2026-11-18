// lib/v1/summary.js
// Role-specific aggregate metrics and village retribution transparency summary

import { getAdminDb as defaultGetAdminDb } from '../firebase-admin.js';
import { requireAuth as defaultRequireAuth, extractRoles, json } from '../auth.js';
import { resolveManagedSpringIds } from './residents.js';
import { setCors } from './http.js';

/**
 * Determine the effective role for dashboard metrics
 * @param {string[]} userRoles
 * @param {string | null} requestedRole
 * @returns {string}
 */
function resolveActiveRole(userRoles, requestedRole) {
  if (requestedRole && userRoles.includes(requestedRole)) {
    return requestedRole;
  }
  if (userRoles.includes('admin')) return 'admin';
  if (userRoles.includes('pengelola')) return 'pengelola';
  if (userRoles.includes('warga')) return 'warga';
  if (userRoles.includes('donatur')) return 'donatur';
  if (userRoles.includes('relawan')) return 'relawan';
  return 'warga';
}

/**
 * GET /api/v1/summary
 * Returns role-specific aggregate metrics.
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleGetSummary(request, response, deps = {}) {
  setCors(response, 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Autentikasi diperlukan' });
  }

  try {
    const getAdminDb = deps.getAdminDb || defaultGetAdminDb;
    const db = getAdminDb();

    const userRoles = extractRoles(auth.user);
    const requestedRole = request.query?.role ? String(request.query.role).trim() : null;
    const activeRole = resolveActiveRole(userRoles, requestedRole);

    const nowIso = new Date().toISOString();
    const currentPeriod = nowIso.slice(0, 7);

    // Fetch user profile from Firestore users/{uid}
    let userDoc = {};
    try {
      const uSnap = await db.collection('users').doc(auth.user.uid).get();
      if (uSnap.exists) {
        userDoc = uSnap.data();
      }
    } catch {
      userDoc = {};
    }

    let summary = {
      role: activeRole,
      period: currentPeriod,
      timestamp: nowIso
    };

    if (activeRole === 'warga') {
      const springId = userDoc.springId || null;
      let totalCollected = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let pendingCount = 0;
      let myBill = null;

      if (springId) {
        // Query bills for this spring in the current period
        const billsSnap = await db.collection('retribution_bills')
          .where('springId', '==', springId)
          .where('period', '==', currentPeriod)
          .get();

        billsSnap.forEach((doc) => {
          const b = doc.data();
          const amt = Number(b.amount) || 0;
          if (b.status === 'paid') {
            totalCollected += amt;
            paidCount += 1;
          } else if (b.status === 'unpaid') {
            unpaidCount += 1;
          } else if (b.status === 'pending_verification') {
            pendingCount += 1;
          }

          if (
            (b.userId && b.userId === auth.user.uid) ||
            (userDoc.residentId && b.residentId === userDoc.residentId)
          ) {
            myBill = {
              id: doc.id,
              period: b.period,
              amount: amt,
              status: b.status,
              paymentMethod: b.paymentMethod || null
            };
          }
        });
      }

      // Latest active campaign for this spring
      let latestCampaign = null;
      try {
        let campQuery = db.collection('revitalization_campaigns').where('status', '==', 'active');
        if (springId) {
          campQuery = campQuery.where('springId', '==', springId);
        }
        const campSnap = await campQuery.limit(1).get();
        if (!campSnap.empty) {
          const c = campSnap.docs[0].data();
          latestCampaign = {
            id: campSnap.docs[0].id,
            title: c.title,
            progressPercent: Number(c.progressPercent) || 0,
            collectedAmount: Number(c.collectedAmount) || 0,
            targetAmount: Number(c.targetAmount) || 0
          };
        }
      } catch {
        latestCampaign = null;
      }

      summary = {
        ...summary,
        villageRetribution: {
          springId,
          period: currentPeriod,
          totalCollected,
          paidCount,
          unpaidCount,
          pendingCount
        },
        myBill,
        latestCampaign
      };
    } else if (activeRole === 'pengelola') {
      const managedSpringIds = await resolveManagedSpringIds(db, auth.user.uid, auth.user);

      let totalBilled = 0;
      let totalPaid = 0;
      let totalCash = 0;
      let totalNonCash = 0;
      let unpaidCount = 0;
      let pendingCount = 0;
      let paidCount = 0;

      // Retribution bills across managed springs
      for (const sId of managedSpringIds) {
        const snap = await db.collection('retribution_bills')
          .where('springId', '==', sId)
          .where('period', '==', currentPeriod)
          .get();

        snap.forEach((doc) => {
          const b = doc.data();
          const amt = Number(b.amount) || 0;
          totalBilled += amt;
          if (b.status === 'paid') {
            totalPaid += amt;
            paidCount += 1;
            if (b.paymentMethod === 'cash') {
              totalCash += amt;
            } else {
              totalNonCash += amt;
            }
          } else if (b.status === 'unpaid') {
            unpaidCount += 1;
          } else if (b.status === 'pending_verification') {
            pendingCount += 1;
          }
        });
      }

      // Residents count
      let totalResidents = 0;
      let unlinkedResidents = 0;
      let linkedResidents = 0;

      for (const sId of managedSpringIds) {
        const rSnap = await db.collection('residents')
          .where('springId', '==', sId)
          .get();

        rSnap.forEach((doc) => {
          const r = doc.data();
          if (r.active !== false) {
            totalResidents += 1;
            if (r.userId == null) {
              unlinkedResidents += 1;
            } else {
              linkedResidents += 1;
            }
          }
        });
      }

      summary = {
        ...summary,
        managedSpringIds,
        retribution: {
          totalBilled,
          totalPaid,
          totalCash,
          totalNonCash,
          unpaidCount,
          pendingCount,
          paidCount
        },
        residents: {
          totalResidents,
          unlinkedResidents,
          linkedResidents
        },
        pendingVerificationCount: pendingCount
      };
    } else if (activeRole === 'donatur') {
      let myDonationsCount = 0;
      let totalDonated = 0;
      let pendingDonationsCount = 0;
      let verifiedDonationsCount = 0;

      const donSnap = await db.collection('donations')
        .where('donorUid', '==', auth.user.uid)
        .get();

      donSnap.forEach((doc) => {
        const d = doc.data();
        myDonationsCount += 1;
        const amt = Number(d.amount) || 0;
        if (d.status === 'verified') {
          totalDonated += amt;
          verifiedDonationsCount += 1;
        } else if (d.status === 'pending_verification') {
          pendingDonationsCount += 1;
        }
      });

      let activeCampaignsCount = 0;
      try {
        const campSnap = await db.collection('revitalization_campaigns')
          .where('status', '==', 'active')
          .get();
        activeCampaignsCount = campSnap.size;
      } catch {
        activeCampaignsCount = 0;
      }

      summary = {
        ...summary,
        donations: {
          myDonationsCount,
          totalDonated,
          pendingDonationsCount,
          verifiedDonationsCount
        },
        activeCampaignsCount
      };
    } else if (activeRole === 'relawan') {
      let myReportsCount = 0;
      let approvedReportsCount = 0;
      let pendingReportsCount = 0;

      try {
        const repSnap = await db.collection('reports')
          .where('authorUid', '==', auth.user.uid)
          .get();

        repSnap.forEach((doc) => {
          const r = doc.data();
          myReportsCount += 1;
          if (r.status === 'approved') approvedReportsCount += 1;
          else if (r.status === 'pending') pendingReportsCount += 1;
        });
      } catch {
        // fallback
      }

      summary = {
        ...summary,
        reports: {
          myReportsCount,
          approvedReportsCount,
          pendingReportsCount
        },
        points: Number(userDoc.points) || 0
      };
    } else if (activeRole === 'admin') {
      // Cross-spring admin KPIs
      let totalSprings = 0;
      try {
        const sSnap = await db.collection('springs').get();
        totalSprings = sSnap.size;
      } catch {
        totalSprings = 0;
      }

      let totalCampaigns = 0;
      let totalTargetAmount = 0;
      let totalCollectedAmount = 0;
      try {
        const cSnap = await db.collection('revitalization_campaigns').get();
        totalCampaigns = cSnap.size;
        cSnap.forEach((doc) => {
          const c = doc.data();
          totalTargetAmount += Number(c.targetAmount) || 0;
          totalCollectedAmount += Number(c.collectedAmount) || 0;
        });
      } catch {
        // continue
      }

      let totalCollectedDonations = 0;
      let pendingDonations = 0;
      try {
        const donSnap = await db.collection('donations').get();
        donSnap.forEach((doc) => {
          const d = doc.data();
          if (d.status === 'verified') {
            totalCollectedDonations += Number(d.amount) || 0;
          } else if (d.status === 'pending_verification') {
            pendingDonations += 1;
          }
        });
      } catch {
        // continue
      }

      let pendingRetributions = 0;
      try {
        const retSnap = await db.collection('retribution_bills')
          .where('status', '==', 'pending_verification')
          .get();
        pendingRetributions = retSnap.size;
      } catch {
        pendingRetributions = 0;
      }

      let pendingReports = 0;
      try {
        const repSnap = await db.collection('reports')
          .where('status', '==', 'pending')
          .get();
        pendingReports = repSnap.size;
      } catch {
        pendingReports = 0;
      }

      let unlinkedResidents = 0;
      try {
        const resSnap = await db.collection('residents')
          .where('userId', '==', null)
          .get();
        unlinkedResidents = resSnap.size;
      } catch {
        unlinkedResidents = 0;
      }

      summary = {
        ...summary,
        stats: {
          totalSprings,
          totalCampaigns,
          totalTargetAmount,
          totalCollectedAmount,
          totalCollectedDonations
        },
        pendingQueues: {
          pendingDonations,
          pendingRetributions,
          pendingReports,
          unlinkedResidents
        }
      };
    }

    return json(response, 200, {
      success: true,
      summary
    });
  } catch (error) {
    console.error('handleGetSummary error:', error);
    return json(response, 500, { error: 'Gagal mengambil ringkasan dashboard' });
  }
}
