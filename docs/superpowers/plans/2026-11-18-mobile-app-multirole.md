# BelikHub Mobile Apps (Multirole — Fase 1 MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 (MVP) of the BelikHub multirole mobile platform (`warga`, `pengelola`, `relawan`, `donatur`, `admin`) using Expo (React Native + TypeScript) in `mobile/` backed by consolidated Vercel Serverless API extensions under `api/v1/[...route].js` and Firebase Auth/Firestore/Storage.

**Architecture:** All new backend endpoints route through a single Vercel catch-all function `api/v1/[...route].js` (keeping the repo at 11 serverless functions, under Vercel Hobby's 12-function cap), delegating to pure domain modules in `lib/v1/*.js` with dependency-injectable Firebase Admin access for fast `node:test` unit tests. The Expo Router mobile app lives isolated in `mobile/` (excluded from Vercel static output via `.vercelignore`), supports Android, iOS (Expo Go / EAS preview APK), and Web Preview, and includes an isolated Demo Mode (`EXPO_PUBLIC_ENABLE_DEMO_MODE=true`) for immediate 5-role evaluation without touching production Firestore.

**Tech Stack:** Node.js >=20 (ESM), Vercel Serverless Functions, Firebase Admin SDK (`firebase-admin`), `node:test`, ESLint; Expo SDK (React Native + Expo Router + TypeScript), Firebase JS Auth SDK, `expo-image-picker`, `expo-image-manipulator`, `expo-location`, `expo-secure-store`, Playwright (Web Preview smoke check).

**Spec:** [docs/superpowers/specs/2026-11-18-mobile-app-multirole-design.md](../specs/2026-11-18-mobile-app-multirole-design.md)

## Global Constraints

- Zero direct client Firestore/Storage access: `firestore.rules` and `storage.rules` MUST stay `allow read, write: if false;`; every read/write goes through Vercel API using Admin SDK.
- Vercel Hobby function cap: total files under `api/**/*.js` MUST NOT exceed 12 (currently 10; adding only `api/v1/[...route].js` brings total to 11).
- Vercel deployment isolation: `.vercelignore` MUST ignore `mobile/` and `docs/` so `vercel --prod` static web output is unaffected.
- Backwards compatibility: existing web endpoints (`GET /api/me`, `GET/POST /api/reports`, `PATCH /api/admin/reports/:id/status`, `GET /api/springs`) and `admin: true` Firebase Custom Claim MUST continue working without breaking `index.html`.
- Public coordinate privacy: `public`, `warga`, and `donatur` MUST only receive ~5 km grid-snapped coordinates (`SNAP_PUBLIC_COORDS` / `fuzz()`), never exact coordinates.
- Upload limits: server-proxied `POST /api/v1/uploads` accepts ONLY `image/jpeg`, `image/png`, `image/webp` up to `2 * 1024 * 1024` bytes (2 MB) and requires `FIREBASE_STORAGE_BUCKET` env var explicitly.
- Brand tokens: Light (`#f7f9fa` bg, `#ecf0f2` surface, `#1f3038` ink, `#5d6b72` muted, `#0d7480` accent), Dark (`#0c131a` bg, `#141f28` surface, `#f1f6f8` ink, `#94a7b0` muted, `#2dd4bf` accent), Epilogue + JetBrains Mono, Bahasa Indonesia UI copy.

## Review Focus

- **Double-crediting `collectedAmount` on concurrent donation approvals:** Approving a donation whose status is no longer `pending_verification` MUST fail with `409` inside a Firestore transaction without incrementing `collectedAmount` twice (pinned in Task 5).
- **Cross-spring privilege escalation by `pengelola`:** A `pengelola` assigned only to `SPR-001` attempting to read/write residents, generate bills, record cash, or post revitalization updates for `SPR-002` MUST receive `403` (pinned in Tasks 4 & 5).
- **Self-assigning privileged roles or hijacking villager records during onboarding:** `POST /api/v1/onboarding` requesting `pengelola` or `admin` MUST return `403`; redeeming an already-used or expired `linkCode` MUST return `409`/`400` without overwriting `resident.userId` (pinned in Task 3).
- **Oversized, non-image, or unconfigured-bucket uploads:** `POST /api/v1/uploads` with >2 MB data, `image/svg+xml` / `application/pdf`, or missing `FIREBASE_STORAGE_BUCKET` MUST return `413` / `400` / `503` without writing to Storage (pinned in Task 2).
- **Public coordinate or PII leak:** Unauthenticated or `donatur`/`warga` calls to `/api/v1/campaigns` or `/api/reports` MUST return grid-snapped coordinates and MUST NOT expose `authorEmail` or private fields like `permit_quota_lps` (pinned in Tasks 2 & 5).

---

## File Structure

### Backend (`api/`, `lib/`, `tests/backend/`)
- Modify: `.vercelignore` — ignore `mobile/`, `docs/`, `tests/`.
- Modify: `firestore.indexes.json` — add composite indexes for `residents`, `retribution_bills`, `revitalization_campaigns`, `revitalization_updates`, `donations`.
- Modify: `package.json` — add `"test:backend": "node --test tests/backend/*.test.js"` script.
- Modify: `lib/auth.js` — export `VALID_ROLES`, `PUBLIC_SELF_ASSIGN_ROLES`, `extractRoles`, `requireRole`, `hasSpringAccess`.
- Modify: `api/me.js` — return extended multirole profile fields while preserving `role` and `points`.
- Modify: `api/reports.js` — implement `GET ?mine=1`, optional `photoPath` on `POST`, signed read URL resolution on `GET`.
- Create: `lib/v1/http.js` — shared CORS, JSON body/query helpers, error responses, validation helpers.
- Create: `lib/v1/uploads.js` — `handleUpload`, `resolveSignedReadUrl`, MIME/size/bucket validation.
- Create: `lib/v1/onboarding.js` — `handleOnboarding`, `handleUpdateProfile`.
- Create: `lib/v1/springs-admin.js` — `handleCreateSpring`, `handleUpdateSpring`, `handleGetSpringSettings`, `handlePutSpringSettings`.
- Create: `lib/v1/residents.js` — `handleListResidents`, `handleCreateResident`, `handleUpdateResident`, `handleGenerateLinkCode`, `handleApproveLink`.
- Create: `lib/v1/retributions.js` — `handleListRetributions`, `handleGenerateBills`, `handleUpdateRetribution`.
- Create: `lib/v1/campaigns.js` — `handleListCampaigns`, `handleGetCampaign`, `handleCreateCampaign`, `handleUpdateCampaign`, `handleCreateCampaignUpdate`.
- Create: `lib/v1/donations.js` — `handleListDonations`, `handleCreateDonation`, `handleVerifyDonation`.
- Create: `lib/v1/admin-users.js` — `handleListUsers`, `handleSetUserRoles`.
- Create: `lib/v1/summary.js` — `handleGetSummary`.
- Create: `api/v1/[...route].js` — single Vercel catch-all router dispatching `/api/v1/*` to `lib/v1/*`.
- Create: `tests/backend/helpers/mock-firebase.js` — in-memory Firestore (with transactions & composite queries), Auth, Storage, and HTTP req/res test harness.
- Create: `tests/backend/auth-and-me.test.js`, `uploads-and-reports.test.js`, `onboarding-and-springs.test.js`, `residents-and-retributions.test.js`, `campaigns-donations-router.test.js`.

### Mobile (`mobile/`)
- Create: `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/eas.json`, `mobile/.env.example`, `mobile/babel.config.js`
- Create: `mobile/src/theme/tokens.ts` — BelikHub light/dark palette, typography, spacing, radius.
- Create: `mobile/src/api/types.ts` — TypeScript interfaces mirroring backend API contracts.
- Create: `mobile/src/api/client.ts` — authenticated REST client, image compression & upload helper.
- Create: `mobile/src/auth/firebase.ts` — Firebase JS Auth init with web/native persistence.
- Create: `mobile/src/demo/demoStore.ts` — stateful in-memory Demo Mode store for all 5 roles.
- Create: `mobile/src/auth/AuthProvider.tsx` — session, active role switcher, real vs Demo Mode switch.
- Create: `mobile/src/components/ui/` — `Screen.tsx`, `Card.tsx`, `Badge.tsx`, `Button.tsx`, `Input.tsx`, `ProgressBar.tsx`, `EmptyState.tsx`, `DemoBanner.tsx`, `RoleSwitcher.tsx`, `ImageUploadField.tsx`.
- Create: `mobile/src/navigation/roleTabs.ts` — declarative tab definitions per role.
- Create: `mobile/app/_layout.tsx`, `mobile/app/login.tsx`, `mobile/app/onboarding.tsx`, `mobile/app/(tabs)/_layout.tsx`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/secondary.tsx`, `mobile/app/(tabs)/tertiary.tsx`, `mobile/app/(tabs)/profile.tsx`.
- Create: `mobile/src/features/warga/` — `WargaHomeScreen.tsx`, `WargaRetributionScreen.tsx`, `WargaSpringScreen.tsx`.
- Create: `mobile/src/features/relawan/` — `RelawanHomeScreen.tsx`, `RelawanReportScreen.tsx`, `RelawanHistoryScreen.tsx`.
- Create: `mobile/src/features/pengelola/` — `PengelolaHomeScreen.tsx`, `PengelolaRetributionScreen.tsx`, `PengelolaRevitalizationScreen.tsx`.
- Create: `mobile/src/features/donatur/` — `DonaturExploreScreen.tsx`, `DonaturCampaignDetailScreen.tsx`, `DonaturHistoryScreen.tsx`.
- Create: `mobile/src/features/admin/` — `AdminHomeScreen.tsx`, `AdminVerificationScreen.tsx`, `AdminManageScreen.tsx`.
- Create: `mobile/src/features/shared/ProfileScreen.tsx`.
- Create: `mobile/tests/demoStore.test.ts`, `mobile/tests/warga-relawan-logic.test.ts`, `tests/mobile-web-smoke.spec.mjs`.

---

### Task 1: Deployment Isolation, Multirole Auth (`lib/auth.js`), & Extended `GET /api/me`

**Files:**
- Modify: `.vercelignore`
- Modify: `firestore.indexes.json`
- Modify: `package.json`
- Modify: `lib/auth.js:1-65`
- Modify: `api/me.js:1-52`
- Create: `lib/v1/http.js`
- Create: `tests/backend/helpers/mock-firebase.js`
- Test: `tests/backend/auth-and-me.test.js`

**Interfaces:**
- Produces in `lib/auth.js`:
  - `VALID_ROLES`: `['warga', 'pengelola', 'relawan', 'donatur', 'admin']`
  - `PUBLIC_SELF_ASSIGN_ROLES`: `['warga', 'donatur', 'relawan']`
  - `extractRoles(decodedToken: object): string[]` (maps legacy `{ admin: true }` to include `'admin'`, deduplicates & filters against `VALID_ROLES`)
  - `requireRole(request, response, allowedRoles: string[], deps?)`: `{ success: true, user, roles } | { success: false, status: 401 | 403, error: string }`
  - `hasSpringAccess(roles: string[], managedSpringIds: string[], springId: string): boolean`
- Produces in `lib/v1/http.js`:
  - `setCors(response, methods?: string): void`
  - `parseJsonBody(request): object | null`
  - `formatIso(value): string | null`
  - `isValidPeriod(period: string): boolean` (`YYYY-MM`, month `01`–`12`)
  - `snapCoord(v: number): number` (grid `0.045`, ~5 km, matching `api/springs.js`)
- Produces in `tests/backend/helpers/mock-firebase.js`:
  - `createMockDb(seedCollections?)`, `createMockAuth(users?)`, `createMockStorage()`, `createMockReq(opts)`, `createMockRes()`

- [ ] **Step 1: Update `.vercelignore`, `firestore.indexes.json`, and `package.json`**

Add `mobile/`, `docs/`, and `tests/` to `.vercelignore`. Add composite indexes to `firestore.indexes.json` for: `residents` (`springId` ASC + `active` ASC), `retribution_bills` (`springId` ASC + `period` DESC, `userId` ASC + `period` DESC), `revitalization_updates` (`campaignId` ASC + `createdAt` DESC), `donations` (`donorUid` ASC + `createdAt` DESC, `status` ASC + `createdAt` DESC). Add `"test:backend": "node --test tests/backend/*.test.js"` to `package.json` scripts.

- [ ] **Step 2: Create `tests/backend/helpers/mock-firebase.js` and failing test `tests/backend/auth-and-me.test.js`**

Write an in-memory Firebase Admin test double supporting `collection().doc().get/set/update`, `collection().add`, `where('==')`/`orderBy`/`limit`, `runTransaction`, `auth.verifyIdToken`/`getUser`/`setCustomUserClaims`/`listUsers`, and `storage.bucket().file().save`/`getSignedUrl`.

Write tests in `tests/backend/auth-and-me.test.js`:
- `extractRoles returns ['admin'] for legacy { admin: true } claim without roles array`
- `extractRoles deduplicates and strips invalid roles`
- `requireRole returns 401 when Authorization header missing`
- `requireRole returns 403 when user lacks allowed role and 200-equivalent success when role matches`
- `hasSpringAccess grants admin any spring and restricts pengelola to managedSpringIds`
- `GET /api/me returns backwards-compatible role/points plus roles[], managedSpringIds[], springId, residentId, residentLinkStatus, donorType, phone`

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:backend`
Expected: FAIL (`extractRoles` / `requireRole` not exported from `lib/auth.js`).

- [ ] **Step 4: Implement `lib/auth.js`, `lib/v1/http.js`, and extend `api/me.js`**

Update `lib/auth.js` preserving `requireAuth`, `requireAdmin`, `optionalAuth`, `json`, and adding `VALID_ROLES`, `PUBLIC_SELF_ASSIGN_ROLES`, `extractRoles`, `requireRole` (accepting optional `deps = { verifyIdToken }` for testability), and `hasSpringAccess`. Create `lib/v1/http.js` with shared CORS/parsing/validation helpers. Export `createMeHandler(deps)` in `api/me.js` (with default export using real Admin SDK) returning the extended fields while preserving `role: isAdmin ? 'admin' : 'user'`, `points`, `uid`, `email`, `name`, `emailVerified`, `createdAt`, `lastLoginAt`.

- [ ] **Step 5: Run tests and lint to verify pass**

Run: `npm run test:backend && npm run lint`
Expected: All tests in `auth-and-me.test.js` PASS, ESLint exits 0.

- [ ] **Step 6: Commit**

```bash
git add .vercelignore firestore.indexes.json package.json lib/auth.js lib/v1/http.js api/me.js tests/backend/helpers/mock-firebase.js tests/backend/auth-and-me.test.js
git commit -m "feat(api): add multirole auth helpers, extended /api/me, and Vercel isolation"
```

---

### Task 2: Server-Proxied Image Uploads (`lib/v1/uploads.js`) & `api/reports.js` Extensions

**Files:**
- Create: `lib/v1/uploads.js`
- Modify: `api/reports.js:1-204`
- Test: `tests/backend/uploads-and-reports.test.js`

**Interfaces:**
- Consumes: `lib/auth.js` (`requireAuth`, `extractRoles`), `lib/v1/http.js`, `lib/firebase-admin.js` (`getAdminStorage`, `getAdminDb`).
- Produces in `lib/v1/uploads.js`:
  - `VALID_UPLOAD_PURPOSES`: `['retribution_proof', 'donation_proof', 'revitalization_photo', 'report_photo', 'qris_image']`
  - `ALLOWED_IMAGE_MIMES`: `['image/jpeg', 'image/png', 'image/webp']`
  - `MAX_UPLOAD_BYTES`: `2 * 1024 * 1024`
  - `handleUpload(request, response, deps?)`: accepts JSON `{ purpose, contentType, dataBase64 }`, validates auth + role (`qris_image` requires `admin`; `revitalization_photo` requires `pengelola`|`admin`), validates MIME, size `<= 2 MB`, and explicit `FIREBASE_STORAGE_BUCKET` env var; saves to `uploads/{purpose}/{uid}/{timestamp}-{uuid}.{ext}`; returns `201 { objectPath, readUrl }`.
  - `resolveSignedReadUrl(objectPath: string | null | undefined, deps?): Promise<string | null>` (1-hour signed read URL; returns `null` if empty or invalid).

- [ ] **Step 1: Write failing tests in `tests/backend/uploads-and-reports.test.js`**

Test cases (including Review Focus items #4 & #5):
- `POST /api/v1/uploads rejects missing FIREBASE_STORAGE_BUCKET with 503`
- `POST /api/v1/uploads rejects non-image MIME (image/svg+xml, application/pdf) with 400`
- `POST /api/v1/uploads rejects payload exceeding 2 MB with 413`
- `POST /api/v1/uploads restricts qris_image to admin (403 for warga) and saves valid JPEG returning { objectPath, readUrl }`
- `GET /api/reports?mine=1 returns 401 when unauthenticated and returns caller's pending+approved+rejected reports with exact coords when authenticated`
- `GET /api/reports (public/warga/donatur) returns only approved reports with grid-fuzzed coords and no authorEmail`
- `POST /api/reports remains open to any authenticated user without roles claim and accepts valid photoPath (uploads/report_photo/...) resolving photoUrl on GET`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:backend`
Expected: FAIL (`lib/v1/uploads.js` not found, `GET /api/reports?mine=1` not implemented).

- [ ] **Step 3: Implement `lib/v1/uploads.js` and extend `api/reports.js`**

Implement `handleUpload` and `resolveSignedReadUrl` in `lib/v1/uploads.js` with `deps = { getAdminStorage, requireAuth, env: process.env }`. Strip optional `data:<mime>;base64,` prefix before decoding base64 and verify decoded byte length `> 0 && <= MAX_UPLOAD_BYTES`.
Refactor `api/reports.js` to export `createReportsHandler(deps)` (default export uses real Admin SDK):
- On `GET`, support `?mine=1` (calls `requireAuth`; queries `where('userId', '==', auth.user.uid).orderBy('createdAt', 'desc')`, includes `status`, `points`, exact `lat`/`lng`, sets `Cache-Control: private, no-store`).
- On `POST`, accept optional `photoPath` matching `/^uploads\/report_photo\/[A-Za-z0-9._/-]+$/` (max 300 chars) alongside existing `photoUrl` validation.
- On `GET` row mapping, if `r.photoPath` exists, resolve `photoUrl` via `resolveSignedReadUrl(r.photoPath)`.

- [ ] **Step 4: Run tests and lint to verify pass**

Run: `npm run test:backend && npm run lint`
Expected: All tests PASS, ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/v1/uploads.js api/reports.js tests/backend/uploads-and-reports.test.js
git commit -m "feat(api): add server-proxied image uploads and ?mine=1/photoPath support in reports"
```

---

### Task 3: Onboarding, Profile, Springs CRUD & Per-Spring Settings (`lib/v1/onboarding.js`, `lib/v1/springs-admin.js`)

**Files:**
- Create: `lib/v1/onboarding.js`
- Create: `lib/v1/springs-admin.js`
- Test: `tests/backend/onboarding-and-springs.test.js`

**Interfaces:**
- Consumes: `lib/auth.js`, `lib/v1/http.js`, `lib/v1/uploads.js` (`resolveSignedReadUrl`), `lib/springs-seed.js` (`SPRINGS`).
- Produces in `lib/v1/onboarding.js`:
  - `handleOnboarding(request, response, deps?)`: `POST /api/v1/onboarding` body `{ role, name?, phone?, springId?, linkCode?, donorType?, organizationName? }`. Only permits `role` in `PUBLIC_SELF_ASSIGN_ROLES` (`'warga'`, `'donatur'`, `'relawan'`); merges into existing claims without stripping existing `admin`/`pengelola`. If `role === 'warga'` and `linkCode` supplied, atomically claims matching unused, non-expired `residents` doc (`userId == null`, `springId` matches) setting `resident.userId = uid`, `resident.linkCode = null`, `user.residentId = resident.id`, `user.residentLinkStatus = 'linked'`; if no `linkCode`, sets `user.residentLinkStatus = 'pending'`.
  - `handleUpdateProfile(request, response, deps?)`: `PATCH /api/v1/profile` updates allowed fields (`name`, `phone`, `donorType`, `organizationName`, `springId`) and optionally redeems a `linkCode`.
- Produces in `lib/v1/springs-admin.js`:
  - `handleCreateSpring(request, response, deps?)`: admin-only `POST /api/v1/springs` (supports `{ seedBaseline: true }` to idempotently copy the 4 entries from `lib/springs-seed.js` into Firestore `springs`, or creates a new spring with required `id`/`name`/`village`/`district`/`regency` and `coordinates_public`).
  - `handleUpdateSpring(request, response, springId, deps?)`: admin-only `PATCH /api/v1/springs/:id`.
  - `handleGetSpringSettings(request, response, springId, deps?)`: authenticated `GET /api/v1/springs/:id/settings` returning `{ springId, defaultMonthlyFee, paymentInstructions, qrisImagePath, qrisReadUrl, isFallback }`.
  - `handlePutSpringSettings(request, response, springId, deps?)`: admin-only `PUT /api/v1/springs/:id/settings` persisting `defaultMonthlyFee` (> 0), `paymentInstructions`, optional `qrisImagePath` (prefix `uploads/qris_image/`), `updatedByUid`, `updatedAt`.

- [ ] **Step 1: Write failing tests in `tests/backend/onboarding-and-springs.test.js`**

Test cases (including Review Focus item #3):
- `POST /api/v1/onboarding rejects role 'pengelola' and 'admin' with 403`
- `POST /api/v1/onboarding grants 'donatur' with organization donorType and preserves existing admin claim if already present`
- `POST /api/v1/onboarding with warga + valid linkCode atomically links resident.userId and clears linkCode`
- `POST /api/v1/onboarding rejects already-redeemed or expired linkCode with 409/400 without overwriting existing resident.userId`
- `POST /api/v1/onboarding with warga and no linkCode sets residentLinkStatus = 'pending'`
- `PUT /api/v1/springs/:id/settings rejects pengelola/warga with 403 and allows admin to save bank/QRIS settings; GET resolves qrisReadUrl`
- `POST /api/v1/springs with { seedBaseline: true } seeds all 4 baseline springs idempotently for admin`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:backend`
Expected: FAIL (`lib/v1/onboarding.js` and `lib/v1/springs-admin.js` missing).

- [ ] **Step 3: Implement `lib/v1/onboarding.js` and `lib/v1/springs-admin.js`**

Use a Firestore transaction in `redeemLinkCode` so two accounts cannot claim the same `linkCode` concurrently. Return clean Indonesian validation messages matching existing API style.

- [ ] **Step 4: Run tests and lint to verify pass**

Run: `npm run test:backend && npm run lint`
Expected: All tests PASS, ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/v1/onboarding.js lib/v1/springs-admin.js tests/backend/onboarding-and-springs.test.js
git commit -m "feat(api): add multirole onboarding, secure linkCode redemption, and spring settings"
```

---

### Task 4: Residents Management & Retribution Billing Engine (`lib/v1/residents.js`, `lib/v1/retributions.js`)

**Files:**
- Create: `lib/v1/residents.js`
- Create: `lib/v1/retributions.js`
- Test: `tests/backend/residents-and-retributions.test.js`

**Interfaces:**
- Consumes: `lib/auth.js` (`requireRole`, `hasSpringAccess`), `lib/v1/http.js`, `lib/v1/uploads.js` (`resolveSignedReadUrl`).
- Produces in `lib/v1/residents.js`:
  - `handleListResidents(request, response, deps?)`: `pengelola` (filtered to `managedSpringIds`, plus pending Warga link requests for those springs) or `admin`.
  - `handleCreateResident(request, response, deps?)`: creates `residents` doc (`userId: null`, `active: true`, validates `springId`, `name`, `phone`, `monthlyFee > 0`).
  - `handleUpdateResident(request, response, residentId, deps?)`: edits resident fields or toggles `active`.
  - `handleGenerateLinkCode(request, response, residentId, deps?)`: generates 6-char uppercase alphanumeric code (alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 7-day expiry) on unlinked resident.
  - `handleApproveLink(request, response, deps?)`: `{ userUid, residentId? , createResident?: { name, phone, monthlyFee } }` links pending Warga user to existing or newly created resident inside a transaction.
- Produces in `lib/v1/retributions.js`:
  - `handleListRetributions(request, response, deps?)`: `warga` sees only own bills; `pengelola` sees bills for `managedSpringIds`; `admin` sees all; returns `{ bills, summary: { totalBilled, totalPaid, totalCash, totalNonCash, unpaidCount, pendingCount, paidCount } }` with `proofUrl` resolved.
  - `handleGenerateBills(request, response, deps?)`: `POST /api/v1/retributions/generate` `{ springId, period }` (`YYYY-MM`). Idempotently creates `retribution_bills/${springId}_${residentId}_${period}` for each `active: true` resident on `springId` (skips existing docs, returns `{ createdCount, skippedCount }`).
  - `handleUpdateRetribution(request, response, billId, deps?)`:
    - `action: 'submit_proof'` (`warga` owner only; requires current status `unpaid`|`rejected`, `paymentMethod` in `['transfer','qris']`, `proofPath` prefix `uploads/retribution_proof/` -> sets `pending_verification`).
    - `action: 'record_cash'` (`pengelola` with spring access or `admin`; sets `status: 'paid'`, `paymentMethod: 'cash'`, `recordedByUid`, `paidAt`).
    - `action: 'approve'` (`pengelola` with spring access or `admin`; requires `pending_verification` -> sets `status: 'paid'`, `verifiedByUid`, `paidAt`).
    - `action: 'reject'` (`pengelola` with spring access or `admin`; requires `pending_verification` and non-empty `rejectionReason` -> sets `status: 'rejected'`).

- [ ] **Step 1: Write failing tests in `tests/backend/residents-and-retributions.test.js`**

Test cases (including Review Focus item #2):
- `pengelola assigned to SPR-001 gets 403 when listing residents, creating residents, generating bills, or recording cash for SPR-002`
- `pengelola can register a non-app villager (userId: null), generate 6-char linkCode, and approve a pending warga link request`
- `POST /api/v1/retributions/generate is idempotent: second call for same springId+period creates 0 duplicates`
- `warga can submit_proof on own unpaid bill (status -> pending_verification) and gets 403 on another warga's bill`
- `pengelola can record_cash on unpaid bill (status -> paid, paymentMethod: 'cash', recordedByUid set)`
- `pengelola can reject pending_verification bill (requires rejectionReason) and approve resubmitted proof`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:backend`
Expected: FAIL (`lib/v1/residents.js` and `lib/v1/retributions.js` missing).

- [ ] **Step 3: Implement `lib/v1/residents.js` and `lib/v1/retributions.js`**

Enforce `managedSpringIds` lookup from `users/{uid}` (or token claim) for `pengelola` on every read/write operation. Use `crypto.randomInt` for generating `linkCode`.

- [ ] **Step 4: Run tests and lint to verify pass**

Run: `npm run test:backend && npm run lint`
Expected: All tests PASS, ESLint exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/v1/residents.js lib/v1/retributions.js tests/backend/residents-and-retributions.test.js
git commit -m "feat(api): add resident management, link codes, and retribution billing handlers"
```

---

### Task 5: Campaigns, Donations, Admin Users, Summary & Catch-All Router (`api/v1/[...route].js`)

**Files:**
- Create: `lib/v1/campaigns.js`
- Create: `lib/v1/donations.js`
- Create: `lib/v1/admin-users.js`
- Create: `lib/v1/summary.js`
- Create: `api/v1/[...route].js`
- Test: `tests/backend/campaigns-donations-router.test.js`

**Interfaces:**
- Consumes: all `lib/v1/*` modules from Tasks 1–4, `lib/auth.js`, `lib/springs-seed.js`.
- Produces in `lib/v1/campaigns.js`:
  - `handleListCampaigns`, `handleGetCampaign` (grid-snapped public spring coords only; never exposes `permit_quota_lps` or exact coords; resolves `qrisReadUrl` and update `photoUrl`), `handleCreateCampaign` (admin), `handleUpdateCampaign` (admin), `handleCreateCampaignUpdate` (`pengelola` scoped to `managedSpringIds` or `admin`; transaction writes `revitalization_updates` + updates `campaign.progressPercent` `0..100`).
- Produces in `lib/v1/donations.js`:
  - `handleListDonations` (donor sees own; admin sees all; resolves `proofUrl`), `handleCreateDonation` (authenticated; validates `campaignId` active, `amount >= 1000`, `donorType` in `['individual', 'organization']`, `proofPath` prefix `uploads/donation_proof/`), `handleVerifyDonation` (admin-only `approve`/`reject`; Firestore transaction asserts `status === 'pending_verification'` else returns `409`, updates status and increments `campaign.collectedAmount` atomically on `approve`).
- Produces in `lib/v1/admin-users.js`:
  - `handleListUsers` (admin), `handleSetUserRoles` (admin; updates Firebase Auth custom claims `{ roles, admin: roles.includes('admin') }` and mirrors `roles` + `managedSpringIds` in `users/{uid}`).
- Produces in `lib/v1/summary.js`:
  - `handleGetSummary` (role-specific aggregate metrics including village retribution transparency summary for `warga`).
- Produces in `api/v1/[...route].js`:
  - Default Vercel handler + exported `createV1Router(deps)` routing every path in Section 7.2 of the spec.

- [ ] **Step 1: Write failing tests in `tests/backend/campaigns-donations-router.test.js`**

Test cases (including Review Focus items #1, #2, & #5):
- `GET /api/v1/campaigns returns grid-snapped coordinates (~5 km) and never returns permit_quota_lps`
- `POST /api/v1/campaigns/:id/updates rejects pengelola for unmanaged spring with 403 and atomically updates campaign.progressPercent for managed spring`
- `POST /api/v1/donations creates pending_verification donation for individual and organization (CSR) donors`
- `PATCH /api/v1/donations/:id (approve) atomically increments campaign.collectedAmount once; a second approve on the same donation returns 409 without double-crediting`
- `PATCH /api/v1/admin/users/:uid/roles sets Firebase custom claims (roles + admin boolean) and managedSpringIds`
- `api/v1/[...route].js dispatches routes cleanly, returns 404 for unknown paths, and total api/**/*.js count stays <= 12`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:backend`
Expected: FAIL (missing `lib/v1/campaigns.js`, `donations.js`, `admin-users.js`, `summary.js`, `api/v1/[...route].js`).

- [ ] **Step 3: Implement `campaigns.js`, `donations.js`, `admin-users.js`, `summary.js`, and `api/v1/[...route].js`**

Parse route segments from `request.query.route` (Vercel catch-all) with fallback to `new URL(request.url, 'http://localhost').pathname` so routing works identically in Vercel production, `vercel dev`, and `node:test`.

- [ ] **Step 4: Run full backend test suite, function count check, and ESLint**

Run: `npm run test:backend && npm run lint && node -e "const fs=require('fs'),path=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.js')?[path.join(d,e.name)]:[]);const f=walk('api');console.log('Vercel API functions:',f.length);if(f.length>12)process.exit(1);"`
Expected: All backend tests PASS, ESLint exits 0, `Vercel API functions: 11`.

- [ ] **Step 5: Commit**

```bash
git add lib/v1/campaigns.js lib/v1/donations.js lib/v1/admin-users.js lib/v1/summary.js "api/v1/[...route].js" tests/backend/campaigns-donations-router.test.js
git commit -m "feat(api): add campaigns, donations, admin users, summary, and /api/v1 router"
```

---

### Task 6: Expo TypeScript Scaffold, BelikHub Design System, API Client & Demo Mode Store (`mobile/`)

**Files:**
- Create: `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/eas.json`, `mobile/.env.example`, `mobile/babel.config.js`
- Create: `mobile/src/theme/tokens.ts`
- Create: `mobile/src/api/types.ts`
- Create: `mobile/src/api/client.ts`
- Create: `mobile/src/auth/firebase.ts`
- Create: `mobile/src/demo/demoStore.ts`
- Create: `mobile/src/auth/AuthProvider.tsx`
- Create: `mobile/src/components/ui/index.ts` (and primitives `Screen.tsx`, `Card.tsx`, `Badge.tsx`, `Button.tsx`, `Input.tsx`, `ProgressBar.tsx`, `EmptyState.tsx`, `DemoBanner.tsx`, `RoleSwitcher.tsx`, `ImageUploadField.tsx`)
- Create: `mobile/src/navigation/roleTabs.ts`
- Test: `mobile/tests/demoStore.test.ts`

**Interfaces:**
- Produces in `mobile/src/api/types.ts`:
  - `Role = 'warga' | 'pengelola' | 'relawan' | 'donatur' | 'admin'`
  - `UserProfile`, `SpringPublic`, `SpringSettings`, `Resident`, `RetributionBill`, `RevitalizationCampaign`, `RevitalizationUpdate`, `Donation`, `FieldReport`, `RoleSummary`
- Produces in `mobile/src/auth/AuthProvider.tsx`:
  - `useAuth(): { user, roles, activeRole, setActiveRole, isDemoMode, enterDemoMode, exitDemoMode, signIn, signUp, signOut, refreshProfile, completeOnboarding, loading }`
- Produces in `mobile/src/api/client.ts`:
  - `BelikHubClient` interface implemented by both `createApiClient(getToken, baseUrl)` (live Vercel API) and `createDemoApiClient(store)` (isolated local Demo Mode) so every screen calls one identical `useApi()` hook regardless of mode!
- Produces in `mobile/src/navigation/roleTabs.ts`:
  - `getTabsForRole(role: Role): TabConfig[]` (3 role-specific tabs + shared `Profil` tab = 4 clean tabs per role).

- [ ] **Step 1: Scaffold `mobile/` Expo Router + TypeScript project and install dependencies**

Create `mobile/package.json` with `expo`, `expo-router`, `react`, `react-native`, `react-native-web`, `react-dom`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar`, `@expo/vector-icons`, `expo-image-picker`, `expo-image-manipulator`, `expo-location`, `expo-secure-store`, `firebase`, and devDependencies `typescript`, `@types/react`, `tsx`. Create `mobile/app.json` (scheme `belikhub`, web bundler `metro`, BelikHub teal theme color `#0d7480`), `mobile/tsconfig.json`, `mobile/eas.json` (`preview` profile builds Android `.apk`), and `mobile/.env.example`. Install dependencies inside `mobile/` with `npm install`.

- [ ] **Step 2: Write failing unit tests in `mobile/tests/demoStore.test.ts`**

Test pure logic (runnable via `npx tsx --test tests/demoStore.test.ts`):
- `demoStore seeds all 5 roles, 4 baseline springs, residents, retribution bills, active campaigns, donations, and field reports`
- `demoStore.generateBills is idempotent for same springId+period`
- `demoStore.recordCash marks bill paid with cash method and updates village summary`
- `demoStore.verifyDonation increments campaign.collectedAmount once and throws 409 on repeat approval`
- `demoStore.createCampaignUpdate appends timeline item and updates campaign.progressPercent`
- `getTabsForRole returns 4 tabs for every valid Role`

- [ ] **Step 3: Run test to verify it fails**

Run: `cd mobile && npx tsx --test tests/demoStore.test.ts`
Expected: FAIL (modules not created yet).

- [ ] **Step 4: Implement theme tokens, types, API client, Firebase auth, Demo Store, AuthProvider, UI primitives, and `roleTabs.ts`**

Ensure `ImageUploadField.tsx` compresses picked images with `expo-image-manipulator` (max width 1280px, JPEG quality 0.75, base64 output) and gracefully works on Web Preview, Android, and iOS. Ensure `DemoBanner.tsx` clearly marks Demo Mode whenever active.

- [ ] **Step 5: Run TypeScript check and Demo Store unit tests**

Run: `cd mobile && npx tsc --noEmit && npx tsx --test tests/demoStore.test.ts`
Expected: 0 TypeScript errors, all `demoStore.test.ts` tests PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): scaffold Expo TypeScript app, BelikHub UI kit, API client, and Demo Mode"
```

---

### Task 7: Auth/Onboarding Flow, Multirole Tab Shell, & Warga + Relawan Screens

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/login.tsx`
- Create: `mobile/app/onboarding.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/app/(tabs)/secondary.tsx`
- Create: `mobile/app/(tabs)/tertiary.tsx`
- Create: `mobile/app/(tabs)/profile.tsx`
- Create: `mobile/src/features/shared/ProfileScreen.tsx`
- Create: `mobile/src/features/warga/WargaHomeScreen.tsx`
- Create: `mobile/src/features/warga/WargaRetributionScreen.tsx`
- Create: `mobile/src/features/warga/WargaSpringScreen.tsx`
- Create: `mobile/src/features/relawan/RelawanHomeScreen.tsx`
- Create: `mobile/src/features/relawan/RelawanReportScreen.tsx`
- Create: `mobile/src/features/relawan/RelawanHistoryScreen.tsx`
- Test: `mobile/tests/warga-relawan-logic.test.ts`

**Interfaces:**
- Consumes: `useAuth()`, `useApi()`, `getTabsForRole()`, `mobile/src/components/ui/*`.
- Produces: complete working navigation shell routing `(tabs)/index`, `secondary`, `tertiary` by `activeRole`, plus complete Warga and Relawan user journeys (with temporary placeholder panels for Pengelola/Donatur/Admin replaced in Task 8).

- [ ] **Step 1: Write failing logic tests in `mobile/tests/warga-relawan-logic.test.ts`**

Test pure helper functions extracted in `mobile/src/features/warga/wargaUtils.ts` and `mobile/src/features/relawan/relawanUtils.ts`:
- `formatRupiah(25000)` -> `'Rp 25.000'`
- `getRetributionStatusMeta('pending_verification')` returns label `'Menunggu Verifikasi'` and badge tone
- `validateFieldReportInput` enforces all 4 official BelikHub types (`Survei Mata Air`, `Restorasi Mata Air`, `Penanaman Pohon`, `Pembangunan Rorak`), location `<= 200` chars, notes `<= 2000` chars, and Indonesia lat/lng bounds (`-11.5..6.5`, `94..141.5`)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx tsx --test tests/warga-relawan-logic.test.ts`
Expected: FAIL (`wargaUtils` / `relawanUtils` not found).

- [ ] **Step 3: Implement Auth/Onboarding screens, Adaptive Tab Shell, ProfileScreen, Warga screens, and Relawan screens**

- `login.tsx`: Email/password login & register toggle + prominent **"Coba Mode Demo (5 Role)"** button when `EXPO_PUBLIC_ENABLE_DEMO_MODE=true`.
- `onboarding.tsx`: Choose public role (`Warga`, `Donatur`, `Relawan`), spring selector (for Warga), optional 6-char `linkCode`, or `Individu`/`Organisasi (CSR)` (for Donatur).
- `WargaRetributionScreen.tsx`: Shows `"Menunggu Tautan Pengelola"` banner with `linkCode` redemption input if `residentLinkStatus !== 'linked'`; otherwise displays monthly bills, digital receipt detail modal, and `"Bayar Sekarang"` sheet showing spring bank/QRIS instructions + `ImageUploadField`.
- `RelawanReportScreen.tsx`: 4 report type chips, `"Ambil GPS Otomatis"` (`expo-location` with graceful manual fallback), `ImageUploadField` (`report_photo`), submits to `POST /api/reports`.

- [ ] **Step 4: Run TypeScript check and tests**

Run: `cd mobile && npx tsc --noEmit && npx tsx --test tests/*.test.ts`
Expected: 0 TypeScript errors, all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): add auth/onboarding, multirole tab shell, Warga and Relawan flows"
```

---

### Task 8: Pengelola, Donatur, & Admin BelikHub Screens + Full Verification & Web Preview Smoke Test

**Files:**
- Create: `mobile/src/features/pengelola/PengelolaHomeScreen.tsx`
- Create: `mobile/src/features/pengelola/PengelolaRetributionScreen.tsx`
- Create: `mobile/src/features/pengelola/PengelolaRevitalizationScreen.tsx`
- Create: `mobile/src/features/donatur/DonaturExploreScreen.tsx`
- Create: `mobile/src/features/donatur/DonaturCampaignDetailScreen.tsx`
- Create: `mobile/src/features/donatur/DonaturHistoryScreen.tsx`
- Create: `mobile/src/features/admin/AdminHomeScreen.tsx`
- Create: `mobile/src/features/admin/AdminVerificationScreen.tsx`
- Create: `mobile/src/features/admin/AdminManageScreen.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`, `secondary.tsx`, `tertiary.tsx` (wire Pengelola, Donatur, Admin screens)
- Create: `tests/mobile-web-smoke.spec.mjs`

**Interfaces:**
- Consumes: `useAuth()`, `useApi()`, `mobile/src/components/ui/*`.
- Produces: complete 5-role mobile app ready for Expo Web Preview, Expo Go, and EAS preview `.apk` build.

- [ ] **Step 1: Implement Pengelola screens**

- `PengelolaHomeScreen.tsx`: spring selector (when managing >1 spring), monthly collection breakdown (Tunai vs Non-Tunai), unpaid count, pending proof count.
- `PengelolaRetributionScreen.tsx`: sub-tabs for **Tagihan Bulan Ini** (1-click `"Terbitkan Tagihan Bulan Ini"`, 1-tap `"Catat Tunai"`, approve/reject proof with rejection reason), **Data Warga** (add/edit non-app residents, generate 6-char `linkCode`, approve pending Warga link requests), and **Info Rekening/QRIS** (read-only view of Admin-configured spring payment instructions).
- `PengelolaRevitalizationScreen.tsx`: list managed spring campaigns + form to post progress update (title, 0–100% progress, notes, photo upload, optional spent amount).

- [ ] **Step 2: Implement Donatur screens**

- `DonaturExploreScreen.tsx`: filterable (`Aktif`/`Selesai`) campaign cards showing funding progress, revitalization %, KK beneficiaries, and ~5 km region label.
- `DonaturCampaignDetailScreen.tsx`: campaign overview, revitalization photo timeline, and `"Donasi Sekarang"` modal (preset/custom amount, `Individu` vs `Organisasi/CSR` + organization name, anonymous toggle, payment instructions + QRIS, proof upload).
- `DonaturHistoryScreen.tsx`: personal donation list with status badges and latest updates from funded springs.

- [ ] **Step 3: Implement Admin BelikHub screens & wire into `(tabs)`**

- `AdminHomeScreen.tsx`: cross-spring KPIs (total springs, verified donations, monthly retribution summary, verification queue counts).
- `AdminVerificationScreen.tsx`: sub-tabs for **Verifikasi Donasi** (inspect proof, approve/reject with reason) and **Verifikasi Laporan Lapangan** (approve/reject via `PATCH /api/admin/reports/:id/status`).
- `AdminManageScreen.tsx`: sub-tabs for **Mata Air & Retribusi** (seed 4 baseline springs button, add/edit spring, edit per-spring bank/QRIS `spring_settings`), **Program Revitalisasi** (create/edit campaigns), and **Pengguna & Role** (assign multirole claims + `managedSpringIds`).
- Wire all 3 roles into `mobile/app/(tabs)/index.tsx`, `secondary.tsx`, `tertiary.tsx`.

- [ ] **Step 4: Write Playwright Web Preview smoke test `tests/mobile-web-smoke.spec.mjs`**

Verify against exported static Expo Web build (`mobile/dist` served locally on a temp port):
- Login screen renders with `"Coba Mode Demo"` button and 0 console/page errors.
- Entering Demo Mode shows Demo Banner and allows switching across all 5 roles (`Warga`, `Pengelola`, `Relawan`, `Donatur`, `Admin`) via `RoleSwitcher`.
- In `Pengelola`, recording a cash retribution payment updates status to `Lunas`.
- In `Donatur`, submitting a donation adds a `Menunggu Verifikasi` entry, and switching to `Admin` and approving it increments the campaign's `collectedAmount`.

- [ ] **Step 5: Run full verification suite**

Run:
1. `npm run test:backend` (all backend unit/integration tests PASS)
2. `npm run lint` (ESLint exits 0)
3. `cd mobile && npx tsc --noEmit && npx tsx --test tests/*.test.ts && npx expo export --platform web` (TypeScript clean, mobile unit tests PASS, Web bundle exports cleanly to `mobile/dist`)
4. `node tests/mobile-web-smoke.spec.mjs` (Playwright 5-role smoke test PASS with 0 console errors)

- [ ] **Step 6: Commit**

```bash
git add mobile/ tests/mobile-web-smoke.spec.mjs
git commit -m "feat(mobile): complete Pengelola, Donatur, Admin flows and Web Preview smoke tests"
```
