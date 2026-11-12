import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const REPORT_DIR = 'playwright-report';
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 360, height: 800 }
];

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`);
}

const browser = await chromium.launch({ headless: true });

try {
  // 1. Cross-viewport layout, assets, status, and overflow checks across all 5 viewports
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const pageErrors = [];
    const unexpectedConsoleErrors = [];
    const failedStaticAssets = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        unexpectedConsoleErrors.push(msg.text());
      }
    });
    page.on('response', (res) => {
      const url = res.url();
      if (url.startsWith(BASE_URL) && res.status() >= 400) {
        failedStaticAssets.push(`${res.status()} ${url}`);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });

    // Scroll through sections once so lazy-loaded assets resolve
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(
      () => [...document.querySelectorAll('img')].every((img) => {
        const s = window.getComputedStyle(img);
        return s.display === 'none' || img.complete;
      }),
      null,
      { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(300);

    const audit = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const overflowOffenders = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.right > winWidth + 1 || r.left < -1)) {
          overflowOffenders.push({
            tag: el.tagName,
            id: el.id || null,
            cls: String(el.className || '').slice(0, 60),
            left: Math.round(r.left),
            right: Math.round(r.right)
          });
        }
      });

      const brokenImages = [...document.querySelectorAll('img')]
        .filter((img) => {
          const style = window.getComputedStyle(img);
          return style.display !== 'none' && (!img.complete || img.naturalWidth === 0);
        })
        .map((img) => img.getAttribute('src') || img.currentSrc);

      const impactStatus = document.querySelector('#dashboard-impact-status')?.textContent?.trim() || '';
      const mapStatus = document.querySelector('#map-status')?.textContent?.trim() || '';
      const heroRect = document.querySelector('#hero')?.getBoundingClientRect();
      const mapCanvasRect = document.querySelector('#map-canvas')?.getBoundingClientRect();
      const mapPaneList = document.querySelector('.app__pane--list');
      const loadedOsmTiles = [...document.querySelectorAll('#map-canvas .leaflet-tile')]
        .filter((img) => img.complete && img.naturalWidth > 0).length;
      const navLogoRect = document.querySelector('.nav__logo')?.getBoundingClientRect();
      const navActionsRect = document.querySelector('.nav__actions')?.getBoundingClientRect();
      const navToggleRect = document.querySelector('.nav__toggle')?.getBoundingClientRect();

      return {
        docWidth,
        winWidth,
        hasOverflow: docWidth > winWidth + 1,
        overflowOffenders,
        brokenImages,
        impactStatus,
        mapStatus,
        heroHeight: heroRect ? Math.round(heroRect.height) : 0,
        mapCanvasHeight: mapCanvasRect ? Math.round(mapCanvasRect.height) : 0,
        mapListScrollable: mapPaneList ? (mapPaneList.scrollHeight > mapPaneList.clientHeight + 2) : false,
        loadedOsmTiles,
        navLogoRight: navLogoRect ? Math.round(navLogoRect.right) : 0,
        navActionsLeft: navActionsRect ? Math.round(navActionsRect.left) : 0,
        navToggleSize: navToggleRect ? { w: Math.round(navToggleRect.width), h: Math.round(navToggleRect.height) } : null
      };
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}.png`), fullPage: false });

    const navOk = vp.width >= 1024
      ? audit.navActionsLeft >= audit.navLogoRight
      : Boolean(audit.navToggleSize && audit.navToggleSize.w >= 44 && audit.navToggleSize.h >= 44);

    const impactOk = audit.impactStatus.length > 0 && !audit.impactStatus.includes('Memuat');
    const mapOk = audit.mapStatus.includes('4 titik terpetakan') || audit.mapStatus.includes('4 mapped points') || audit.mapStatus.includes('4 mata air');
    const mapSizeOk = vp.width >= 1024 ? audit.mapCanvasHeight >= 560 && !audit.mapListScrollable : audit.mapCanvasHeight >= 340;
    const osmTilesOk = audit.loadedOsmTiles > 0;

    const vpPassed =
      pageErrors.length === 0 &&
      unexpectedConsoleErrors.length === 0 &&
      failedStaticAssets.length === 0 &&
      !audit.hasOverflow &&
      audit.brokenImages.length === 0 &&
      navOk &&
      impactOk &&
      mapOk &&
      mapSizeOk &&
      osmTilesOk;

    const details = [
      `overflow=${audit.docWidth}/${audit.winWidth}`,
      `brokenImgs=${audit.brokenImages.length}`,
      `pageErrors=${pageErrors.length}`,
      `consoleErrors=${unexpectedConsoleErrors.length}`,
      `failedAssets=${failedStaticAssets.length}`,
      `navOk=${navOk}`,
      `mapH=${audit.mapCanvasHeight}`,
      `listScroll=${audit.mapListScrollable}`,
      `osmTiles=${audit.loadedOsmTiles}`,
      `impact="${audit.impactStatus}"`
    ].join(', ');

    record(`viewport:${vp.name} (${vp.width}x${vp.height})`, vpPassed, details);
    if (!vpPassed) {
      console.log('  Debug:', JSON.stringify({ pageErrors, unexpectedConsoleErrors, failedStaticAssets, audit }, null, 2));
    }

    await context.close();
  }

  // 2. Functional & A11y E2E interactions on Laptop (1366x768)
  {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(700);

    // Map filtering & SPR-004 modal & focus restoration
    try {
      await page.selectOption('#map-filter', 'springs_active');
      const activeText = await page.textContent('#map-status');
      assert.match(activeText || '', /Menampilkan 3 titik terpetakan|Displaying 3 mapped points/);

      await page.selectOption('#map-filter', 'Survei Mata Air');
      const surveyText = await page.textContent('#map-status');
      assert.match(surveyText || '', /Menampilkan 0 titik terpetakan|Displaying 0 mapped points/);

      await page.selectOption('#map-filter', 'all');
      const allText = await page.textContent('#map-status');
      assert.match(allText || '', /4 titik terpetakan|4 mapped points/);
      record('e2e:map-filter-categories', true);
    } catch (err) {
      record('e2e:map-filter-categories', false, err.message);
    }

    // Map mouse scroll-wheel zoom in & zoom out
    try {
      const mapEl = page.locator('#map-canvas');
      await mapEl.scrollIntoViewIfNeeded();
      const box = await mapEl.boundingBox();
      assert.ok(box, 'Map canvas bounding box should exist');
      const zoomBefore = await page.evaluate(() => window.belikhubMap?.getZoom());
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, -240);
      await page.waitForTimeout(350);
      const zoomAfterIn = await page.evaluate(() => window.belikhubMap?.getZoom());
      assert.ok(zoomAfterIn > zoomBefore, `Expected zoom to increase on scroll up (${zoomBefore} -> ${zoomAfterIn})`);
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(350);
      const zoomAfterOut = await page.evaluate(() => window.belikhubMap?.getZoom());
      assert.ok(zoomAfterOut < zoomAfterIn, `Expected zoom to decrease on scroll down (${zoomAfterIn} -> ${zoomAfterOut})`);
      record('e2e:map-scroll-wheel-zoom', true);
    } catch (err) {
      record('e2e:map-scroll-wheel-zoom', false, err.message);
    }

    // Spring jump button + Modal ARIA + Escape focus return
    try {
      const jumpBtn = page.locator('[data-spring-jump="SPR-004"]');
      await jumpBtn.scrollIntoViewIfNeeded();
      await jumpBtn.click();
      await page.waitForSelector('#modal.open');
      const titleText = await page.textContent('#modal-title');
      const ariaHidden = await page.getAttribute('#modal', 'aria-hidden');
      const labelledBy = await page.getAttribute('#modal', 'aria-labelledby');
      assert.match(titleText || '', /Sikucing/);
      assert.equal(ariaHidden, 'false');
      assert.equal(labelledBy, 'modal-title');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-modal.png') });

      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      const stillOpen = await page.locator('#modal.open').count();
      assert.equal(stillOpen, 0);
      const restoredFocusId = await page.evaluate(() => document.activeElement?.getAttribute('data-spring-jump'));
      assert.equal(restoredFocusId, 'SPR-004');
      record('e2e:spring-modal-a11y-escape-restore', true);
    } catch (err) {
      record('e2e:spring-modal-a11y-escape-restore', false, err.message);
    }

    // Learn Tabs click & ArrowRight keyboard navigation + lazy video
    try {
      await page.click('#tab-readings');
      assert.equal(await page.getAttribute('#tab-readings', 'aria-selected'), 'true');
      assert.equal(await page.locator('#readings').isVisible(), true);
      assert.equal(await page.locator('#courses').isVisible(), false);

      await page.focus('#tab-readings');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.getAttribute('#tab-agenda', 'aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.getAttribute('#tab-media', 'aria-selected'), 'true');
      await page.waitForTimeout(150);
      const videoSrc = await page.getAttribute('#learn-media-video', 'src');
      assert.match(videoSrc || '', /videos\/media\.mp4/);
      await page.click('#tab-courses');
      record('e2e:learn-tabs-keyboard-and-video', true);
    } catch (err) {
      record('e2e:learn-tabs-keyboard-and-video', false, err.message);
    }

    // Language toggle ID -> EN -> ID
    try {
      await page.click('#lang-toggle');
      assert.equal(await page.getAttribute('#lang-toggle', 'aria-expanded'), 'true');
      await page.click('[data-language="en"]');
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
      assert.match(await page.title(), /BelikHub: Community Spring Mapping/);
      assert.match((await page.textContent('#faq h2')) || '', /Questions on the BelikHub platform/);
      assert.equal((await page.textContent('#tab-courses'))?.trim(), 'Courses');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-en.png') });

      await page.click('#lang-toggle');
      await page.click('[data-language="id"]');
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.lang), 'id');
      record('e2e:i18n-id-en-roundtrip', true);
    } catch (err) {
      record('e2e:i18n-id-en-roundtrip', false, err.message);
    }

    // Partnership validation + notes submission + honest error display
    try {
      await page.locator('#partner-form button[type="submit"]').click();
      assert.equal(await page.getAttribute('#partner-name', 'aria-invalid'), 'true');
      assert.equal(await page.getAttribute('#partner-name', 'aria-describedby'), 'partner-name-error');

      let postedPayload = null;
      await page.route('**/api/partnerships', async (route) => {
        postedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database offline in preview' })
        });
      });

      await page.fill('#partner-name', 'Rini Hartati');
      await page.fill('#partner-inst', 'BUMDes Bismo');
      await page.fill('#partner-email', 'rini@bismo.desa.id');
      await page.fill('#partner-notes', 'Kecamatan Blado target 25 rorak');
      await page.locator('#partner-form button[type="submit"]').click();
      await page.waitForTimeout(200);

      assert.equal(postedPayload?.notes, 'Kecamatan Blado target 25 rorak');
      const noteText = await page.textContent('#partner-note');
      assert.match(noteText || '', /Database offline in preview/);
      await page.unroute('**/api/partnerships');
      record('e2e:partnership-validation-and-notes', true);
    } catch (err) {
      record('e2e:partnership-validation-and-notes', false, err.message);
    }

    // Newsletter honest error on 503 (never fake success)
    try {
      await page.fill('#newsletter-email', 'warga@belikhub.id');
      await page.locator('#newsletter-form button[type="submit"]').click();
      await page.waitForTimeout(250);
      const nsText = await page.textContent('#newsletter-status');
      assert.doesNotMatch(nsText || '', /Terima kasih|Berhasil/i);
      assert.ok((nsText || '').length > 5);
      record('e2e:newsletter-honest-error', true);
    } catch (err) {
      record('e2e:newsletter-honest-error', false, err.message);
    }

    // Dark / Night Mode Theme Toggle E2E
    try {
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
      await page.click('.theme-toggle-btn');
      await page.waitForTimeout(200);
      const switchedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      assert.notEqual(switchedTheme, initialTheme);
      assert.equal(switchedTheme, initialTheme === 'dark' ? 'light' : 'dark');
      const storedTheme = await page.evaluate(() => localStorage.getItem('belikhub-theme'));
      assert.equal(storedTheme, switchedTheme);

      // Verify dark-specific elements if in dark mode
      if (switchedTheme === 'dark') {
        const heroSrc = await page.getAttribute('#hero .bh-hero-layer', 'src');
        assert.match(heroSrc || '', /bg-hero-night\.jpg/);
      }

      // Toggle back to light to preserve neutral state
      await page.click('.theme-toggle-btn');
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), initialTheme);
      record('e2e:dark-night-mode-toggle', true);
    } catch (err) {
      record('e2e:dark-night-mode-toggle', false, err.message);
    }

    await context.close();
  }

  // 3. Mobile Drawer & Language Dropdown Bounds Check (390x844)
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(600);

    try {
      await page.click('.nav__toggle');
      await page.waitForSelector('header.nav.is-open');
      assert.equal(await page.getAttribute('.nav__toggle', 'aria-expanded'), 'true');
      await page.click('#lang-toggle');
      await page.waitForSelector('#language-menu-desktop.open');
      const menuRect = await page.locator('#language-menu-desktop').boundingBox();
      assert.ok(menuRect && menuRect.y >= 0 && menuRect.y + menuRect.height <= 844 && menuRect.x >= 0 && menuRect.x + menuRect.width <= 390);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-drawer.png') });

      await page.click('#lang-toggle');
      await page.click('.nav__links a[href="#map"]');
      await page.waitForTimeout(200);
      assert.equal(await page.locator('header.nav.is-open').count(), 0);
      assert.equal(await page.getAttribute('.nav__toggle', 'aria-expanded'), 'false');
      record('e2e:mobile-drawer-and-lang-bounds', true);
    } catch (err) {
      record('e2e:mobile-drawer-and-lang-bounds', false, err.message);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

const summary = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  results
};
fs.writeFileSync(path.join(REPORT_DIR, 'audit-findings.json'), JSON.stringify(summary, null, 2));

console.log(`\nSummary: ${summary.passed}/${summary.total} checks passed.`);
if (summary.failed > 0) process.exit(1);
