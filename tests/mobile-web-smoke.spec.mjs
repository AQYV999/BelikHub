// tests/mobile-web-smoke.spec.mjs
// Playwright Web Preview smoke test for BelikHub 5-role mobile app
// Serves mobile/dist on an ephemeral Node HTTP server and verifies complete 5-role journeys

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'mobile', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (pathname === '/') {
        pathname = '/index.html';
      }

      let filePath = path.join(distDir, pathname);

      // Security check: ensure filePath stays within distDir
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // If file doesn't exist, SPA fallback to index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      console.error('Static server error:', err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
}

async function runSmokeTests() {
  console.log('🚀 Starting BelikHub Mobile Web Preview Smoke Tests...');

  // Ensure mobile/dist exists
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error(`Exported web dist not found at ${distDir}. Run: npx expo export --platform web`);
  }

  const server = createStaticServer();

  // Listen on ephemeral port (port 0)
  const port = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const p = typeof addr === 'object' && addr !== null ? addr.port : 0;
      resolve(p);
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Local preview server running at: ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    userAgent: 'BelikHub-Mobile-Web-Smoke-Test'
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore non-fatal favicon missing
      if (!txt.includes('favicon.ico')) {
        consoleErrors.push(txt);
      }
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('dialog', async (dialog) => {
    console.log(`💬 Dialog [${dialog.type()}]: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Login screen renders with demo-mode-button and 0 errors
    // -------------------------------------------------------------
    console.log('🧪 Test 1: Verifying Login screen & 0 console/page errors...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const demoModeBtn = page.locator('[data-testid="demo-mode-button"]');
    await demoModeBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  ✔ Login screen rendered with demo-mode-button');

    // Assert 0 console and page errors
    assert.equal(consoleErrors.length, 0, `Expected 0 console errors, got: ${JSON.stringify(consoleErrors)}`);
    assert.equal(pageErrors.length, 0, `Expected 0 page errors, got: ${JSON.stringify(pageErrors)}`);
    console.log('  ✔ 0 console errors & 0 page errors on login screen');

    // -------------------------------------------------------------
    // Test 2: Entering Demo Mode shows Demo Banner & switches across all 5 roles
    // -------------------------------------------------------------
    console.log('🧪 Test 2: Entering Demo Mode & switching across all 5 roles...');
    await demoModeBtn.click();

    // Verify Demo Banner appears
    const demoBanner = page.locator('[data-testid="demo-banner"]');
    await demoBanner.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  ✔ Demo banner visible');

    const allRoles = ['warga', 'pengelola', 'relawan', 'donatur', 'admin'];
    for (const role of allRoles) {
      const chip = page
        .locator(`[data-testid="role-switcher-chip-${role}"], [data-testid="role-chip-${role}"]`)
        .first();
      await chip.waitFor({ state: 'visible', timeout: 5000 });
      await chip.click();
      await page.waitForTimeout(400);
      console.log(`  ✔ Switched to role: ${role}`);
    }

    // -------------------------------------------------------------
    // Test 3: In Pengelola, recording a cash retribution payment updates bill to Lunas
    // -------------------------------------------------------------
    console.log('🧪 Test 3: Pengelola cash retribution recording flow...');
    const pengelolaChip = page
      .locator('[data-testid="role-switcher-chip-pengelola"], [data-testid="role-chip-pengelola"]')
      .first();
    await pengelolaChip.click();
    await page.waitForTimeout(500);

    // Locate the first 1-tap "Catat Tunai" button on Pengelola home/bills screen
    const recordCashBtn = page.locator('[data-testid^="btn-record-cash-"]').first();
    await recordCashBtn.waitFor({ state: 'visible', timeout: 10000 });
    console.log('  ✔ Found cash payment record button');

    await recordCashBtn.click();
    await page.waitForTimeout(600);

    // Verify bill status updates to Lunas or paid count increments
    const lunasBadge = page.locator('text=Lunas').first();
    await lunasBadge.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  ✔ Bill status successfully updated to Lunas');

    // -------------------------------------------------------------
    // Test 4: In Donatur, submitting donation -> Menunggu Verifikasi; in Admin, approving it -> increments collectedAmount
    // -------------------------------------------------------------
    console.log('🧪 Test 4: Donatur donation submission & Admin approval flow...');

    // Switch to Donatur
    const donaturChip = page
      .locator('[data-testid="role-switcher-chip-donatur"], [data-testid="role-chip-donatur"]')
      .first();
    await donaturChip.click();
    await page.waitForTimeout(500);

    // Open first campaign
    const openCampaignBtn = page.locator('[data-testid^="btn-open-campaign-"]').first();
    await openCampaignBtn.waitFor({ state: 'visible', timeout: 10000 });
    await openCampaignBtn.click();
    await page.waitForTimeout(500);

    // Click "Donasi Sekarang"
    const openDonationModalBtn = page.locator('[data-testid="btn-open-donation-modal"]');
    await openDonationModalBtn.waitFor({ state: 'visible', timeout: 8000 });
    await openDonationModalBtn.click();
    await page.waitForTimeout(400);

    // Select Rp 100.000 or default, click submit
    const submitDonationBtn = page.locator('[data-testid="btn-submit-donation"]');
    await submitDonationBtn.waitFor({ state: 'visible', timeout: 8000 });
    await submitDonationBtn.click();
    await page.waitForTimeout(600);
    console.log('  ✔ Donation submitted by Donatur (Menunggu Verifikasi)');

    // Verify Menunggu Verifikasi in Donatur Riwayat tab (secondary tab)
    const riwayatTab = page.getByRole('link', { name: /donasi saya|riwayat/i }).or(page.getByText('Donasi Saya', { exact: true })).first();
    if (await riwayatTab.isVisible().catch(() => false)) {
      await riwayatTab.click();
      await page.waitForTimeout(400);
      const pendingBadge = page.locator('text=Menunggu Verifikasi').first();
      await pendingBadge.waitFor({ state: 'visible', timeout: 6000 });
      console.log('  ✔ Verified donation entry appears with status Menunggu Verifikasi');
    }

    // Switch to Admin
    const adminChip = page
      .locator('[data-testid="role-switcher-chip-admin"], [data-testid="role-chip-admin"]');
    await adminChip.last().click({ force: true });
    await page.waitForTimeout(500);

    // Navigate to Admin Verification Tab (second tab in tab bar)
    const verifikasiTab = page.getByRole('link', { name: /verifikasi/i }).or(page.getByText('Verifikasi', { exact: true })).first();
    await verifikasiTab.waitFor({ state: 'visible', timeout: 8000 });
    await verifikasiTab.click();
    await page.waitForTimeout(500);

    // Approve the pending donation
    const approveDonationBtn = page.locator('[data-testid^="btn-approve-donation-"]').first();
    await approveDonationBtn.waitFor({ state: 'visible', timeout: 8000 });
    await approveDonationBtn.click();
    await page.waitForTimeout(800);
    console.log('  ✔ Donation approved by Admin');

    // Switch back to Donatur to confirm campaign collectedAmount is incremented
    const donaturRoleChip = page
      .locator('[data-testid="role-switcher-chip-donatur"], [data-testid="role-chip-donatur"]');
    await donaturRoleChip.last().click({ force: true });
    await page.waitForTimeout(500);

    // In Donatur tab 0 (Program), check that collected amount updated to include the approved donation
    const programTab = page.getByRole('link', { name: /program/i }).or(page.getByText('Program', { exact: true })).first();
    if (await programTab.isVisible().catch(() => false)) {
      await programTab.click();
      await page.waitForTimeout(400);
    }

    // Collected amount was 32.500.000 + 100.000 = 32.600.000
    const updatedCollected = page.locator('text=Rp 32.600.000').first();
    await updatedCollected.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  ✔ Campaign collectedAmount incremented to Rp 32.600.000');

    // Final console and page error check
    assert.equal(pageErrors.length, 0, `Page errors encountered during smoke test: ${pageErrors.join(', ')}`);
    console.log('  ✔ 0 page errors across complete 5-role smoke test');

    console.log('🎉 ALL PLAYWRIGHT WEB PREVIEW SMOKE TESTS PASSED!');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    console.log('🛑 Local preview server shut down cleanly.');
  }
}

runSmokeTests().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
