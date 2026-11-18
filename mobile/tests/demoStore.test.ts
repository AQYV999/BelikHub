// mobile/tests/demoStore.test.ts
// Unit tests for pure logic Demo Mode store and declarative role tabs

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoStore, DemoStore } from '../src/demo/demoStore';
import { getTabsForRole } from '../src/navigation/roleTabs';
import { Role } from '../src/api/types';

describe('Demo Mode Store & Role Navigation', () => {
  beforeEach(() => {
    demoStore.reset();
  });

  test('demoStore seeds all 5 roles, 4 baseline springs, residents, retribution bills, active campaigns, donations, and field reports', async () => {
    // 1. All 5 demo user profiles exist
    const roles: Role[] = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];
    for (const r of roles) {
      const user = demoStore.getDemoUser(r);
      assert.ok(user, `Demo user for role ${r} must exist`);
      assert.ok(user.roles.includes(r), `Demo user for role ${r} must contain role in user.roles`);
      assert.ok(user.name, `Demo user for role ${r} must have a name`);
    }

    // 2. 4 baseline springs exist
    const { springs } = await demoStore.listSprings();
    assert.ok(springs.length >= 4, 'Must seed at least 4 baseline springs');
    const springIds = springs.map((s) => s.id);
    assert.ok(springIds.includes('SPR-001'), 'Must include Tuk Bismo (SPR-001)');
    assert.ok(springIds.includes('SPR-002'), 'Must include Mata Air Wonomerto (SPR-002)');
    assert.ok(springIds.includes('SPR-003'), 'Must include Tuk Watulumbung (SPR-003)');
    assert.ok(springIds.includes('SPR-004'), 'Must include Tuk Semampir (SPR-004)');

    // 3. Residents exist
    const { residents } = await demoStore.listResidents();
    assert.ok(residents.length >= 2, 'Must seed baseline residents');

    // 4. Retribution bills exist
    const { bills } = await demoStore.listRetributions();
    assert.ok(bills.length >= 2, 'Must seed baseline retribution bills');

    // 5. Active campaigns exist
    const { campaigns } = await demoStore.listCampaigns();
    assert.ok(campaigns.length >= 1, 'Must seed active revitalization campaigns');
    assert.ok(campaigns.some((c) => c.status === 'active'), 'At least one campaign must be active');

    // 6. Donations exist
    const { donations } = await demoStore.listDonations();
    assert.ok(donations.length >= 1, 'Must seed baseline donations');

    // 7. Field reports exist
    const { reports } = await demoStore.listAllReports();
    assert.ok(reports.length >= 1, 'Must seed baseline field reports');
  });

  test('demoStore.generateBills is idempotent for same springId+period', async () => {
    const period = '2026-12';
    const springId = 'SPR-001';

    // First generation
    const firstResult = await demoStore.generateBills({ springId, period });
    assert.equal(firstResult.success, true);
    assert.ok(firstResult.createdCount >= 1, 'First generation must create bills for residents');

    // Count bills for that period
    const { bills: billsAfterFirst } = await demoStore.listRetributions({ springId, period });
    const countAfterFirst = billsAfterFirst.length;
    assert.equal(countAfterFirst, firstResult.createdCount);

    // Second generation with identical parameters (must be idempotent)
    const secondResult = await demoStore.generateBills({ springId, period });
    assert.equal(secondResult.success, true);
    assert.equal(secondResult.createdCount, 0, 'Second generation must create 0 bills');
    assert.equal(secondResult.skippedCount, countAfterFirst, 'Second generation must skip existing bills');

    // Verify bill count did not change
    const { bills: billsAfterSecond } = await demoStore.listRetributions({ springId, period });
    assert.equal(billsAfterSecond.length, countAfterFirst, 'Bill count must stay unchanged');
  });

  test('demoStore.recordCash marks bill paid with cash method and updates village summary', async () => {
    const { bills } = await demoStore.listRetributions({ springId: 'SPR-001' });
    const unpaidBill = bills.find((b) => b.status === 'unpaid');
    assert.ok(unpaidBill, 'Must have at least one unpaid bill for testing');

    // Snapshot summary before recording cash
    const { summary: beforeSummary } = await demoStore.getSummary('pengelola');
    const beforeCash = beforeSummary.stats?.totalCashCollected || 0;
    const beforePaidCount = beforeSummary.stats?.paidCount || 0;

    // Record cash
    const result = await demoStore.recordCash(unpaidBill.id);
    assert.equal(result.success, true);
    assert.equal(result.bill.status, 'paid');
    assert.equal(result.bill.paymentMethod, 'cash');
    assert.ok(result.bill.paidAt, 'paidAt must be set');

    // Verify bill is updated in store
    const { bills: updatedBills } = await demoStore.listRetributions({ springId: 'SPR-001' });
    const targetBill = updatedBills.find((b) => b.id === unpaidBill.id);
    assert.equal(targetBill?.status, 'paid');
    assert.equal(targetBill?.paymentMethod, 'cash');

    // Verify summary reflects cash payment
    const { summary: afterSummary } = await demoStore.getSummary('pengelola');
    assert.equal(
      afterSummary.stats?.totalCashCollected,
      beforeCash + unpaidBill.amount,
      'Total cash collected must increment by bill amount'
    );
    assert.equal(
      afterSummary.stats?.paidCount,
      beforePaidCount + 1,
      'Paid bill count must increment by 1'
    );
  });

  test('demoStore.verifyDonation increments campaign.collectedAmount once and throws 409 on repeat approval', async () => {
    // Create a pending donation
    const { campaigns } = await demoStore.listCampaigns();
    const targetCampaign = campaigns.find((c) => c.status === 'active');
    assert.ok(targetCampaign, 'Must have an active campaign');

    const amount = 250000;
    const donationRes = await demoStore.createDonation({
      campaignId: targetCampaign.id,
      amount,
      donorType: 'individual',
      isAnonymous: false,
      paymentMethod: 'qris'
    });
    assert.equal(donationRes.success, true);
    const donationId = donationRes.donation.id;

    const initialCampaign = (await demoStore.getCampaign(targetCampaign.id)).campaign;
    const initialCollected = initialCampaign.collectedAmount;

    // 1. First approval: succeeds and increments campaign.collectedAmount
    const verifyRes = await demoStore.verifyDonation(donationId, 'approve');
    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.donation.status, 'verified');

    const updatedCampaign = (await demoStore.getCampaign(targetCampaign.id)).campaign;
    assert.equal(
      updatedCampaign.collectedAmount,
      initialCollected + amount,
      'Campaign collectedAmount must increment exactly by donation amount'
    );

    // 2. Repeat approval: must fail with 409 conflict
    await assert.rejects(
      async () => {
        await demoStore.verifyDonation(donationId, 'approve');
      },
      (err: any) => {
        assert.ok(
          err.status === 409 || err.message?.includes('409') || err.message?.includes('sudah diproses'),
          `Error must indicate 409 already processed, received: ${err.message}`
        );
        return true;
      }
    );

    // 3. Confirm campaign collectedAmount did NOT increment a second time
    const finalCampaign = (await demoStore.getCampaign(targetCampaign.id)).campaign;
    assert.equal(
      finalCampaign.collectedAmount,
      initialCollected + amount,
      'Campaign collectedAmount must NOT double-credit on repeat approval'
    );
  });

  test('demoStore.createCampaignUpdate appends timeline item and updates campaign.progressPercent', async () => {
    const { campaigns } = await demoStore.listCampaigns();
    const activeCampaign = campaigns.find((c) => c.status === 'active');
    assert.ok(activeCampaign, 'Must have an active campaign');

    const newProgress = 72;
    const updateTitle = 'Pemasangan Bak Penampung & Broncaptering';
    const updateNotes = '5 bak penampung telah selesai dicor dan disambungkan ke pipa transmisi 4 inch.';

    const updateRes = await demoStore.createCampaignUpdate(activeCampaign.id, {
      title: updateTitle,
      notes: updateNotes,
      progressPercent: newProgress,
      spentAmount: 18500000
    });

    assert.equal(updateRes.success, true);
    assert.equal(updateRes.update.title, updateTitle);
    assert.equal(updateRes.update.progressPercent, newProgress);

    // Verify parent campaign was updated
    const { campaign: fetchedCampaign } = await demoStore.getCampaign(activeCampaign.id);
    assert.equal(
      fetchedCampaign.progressPercent,
      newProgress,
      'Campaign progressPercent must reflect the update'
    );

    // Verify update is present in timeline
    assert.ok(
      fetchedCampaign.updates?.some((u) => u.title === updateTitle),
      'Update must be listed in campaign timeline updates'
    );
  });

  test('getTabsForRole returns 4 tabs for every valid Role', () => {
    const roles: Role[] = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];

    for (const r of roles) {
      const tabs = getTabsForRole(r);
      assert.equal(tabs.length, 4, `Role ${r} must have exactly 4 tabs`);

      // Shared Profil tab is always the last tab
      const lastTab = tabs[3];
      assert.equal(lastTab.title, 'Profil', `Role ${r} last tab must be 'Profil'`);

      // Each tab has required properties
      for (const tab of tabs) {
        assert.ok(tab.name, `Tab name must be defined for role ${r}`);
        assert.ok(tab.title, `Tab title must be defined for role ${r}`);
        assert.ok(tab.icon, `Tab icon must be defined for role ${r}`);
      }

      // Check unique tab names within role
      const names = tabs.map((t) => t.name);
      const uniqueNames = new Set(names);
      assert.equal(uniqueNames.size, 4, `Tab names must be unique for role ${r}`);
    }
  });
});
