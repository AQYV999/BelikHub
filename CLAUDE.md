# BelikHub Project Guidance

BelikHub is an integrated hydrological telemetry, spring conservation, and community water retribution platform for Belik, Pemalang.

## Monorepo Architecture

1. **Web Portal & Cockpit (Root)**
   - Entry point: `index.html` (DataV sci-fi 3D hydrological telemetry dashboard, Leaflet map, impact stats).
   - Static assets in `css/`, `js/`, `assets/`, `icons/`.
   - Deployed at `https://belikhubweb.vercel.app`.

2. **Backend Serverless API (`api/` and `lib/`)**
   - Vercel Serverless Functions in `api/` with shared business logic in `lib/`.
   - Main endpoints:
     - `/api/springs` - Real-time spring sensor & water discharge telemetry.
     - `/api/reports` - Citizen field reports & validation pipeline.
     - `/api/v1/*` - Multi-role auth, onboarding, retribution billing, and revitalization campaigns.
   - Verification: `npm run lint` and `npm run test:backend` (87 unit tests).

3. **Mobile Application (`mobile/`)**
   - Built with React Native & Expo SDK 52 with Expo Router.
   - Multi-role support: `warga`, `relawan`, `pengelola`, `donatur`, `admin`.
   - Built-in offline Demo Mode (`EXPO_PUBLIC_ENABLE_DEMO_MODE="true"`).
   - Dedicated Web Deployment: `https://belikhub-app.vercel.app`.
   - Verification: `cd mobile && npm test` (31 tests).

---

## UI/UX & Polish Standards (Kualitas "Halus")

Mas Denny requires the mobile application and interfaces to feel smooth, refined, and tactile:

1. **Tactile Feedback & Haptics**
   - Interactive elements (`Button`, cards, switches) must provide immediate feedback.
   - Use `activeOpacity: 0.7` or slight spring scale animations on press.
   - Integrate `expo-haptics` (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`) on successful actions and key tab switches.

2. **Spring Transitions & Curves**
   - Avoid abrupt component pops or linear interpolations.
   - Use natural spring physics (mass: 1, damping: 15, stiffness: 120) for modals, bottom sheets, and tab indicators.

3. **Diffused Elevation & Soft Shadows**
   - Never use harsh, dark pitch-black drop shadows (`opacity > 0.15`).
   - Use soft multi-layered diffused shadows: `shadowColor: '#0f172a'`, `shadowOffset: { width: 0, height: 6 }`, `shadowOpacity: 0.08`, `shadowRadius: 16`, `elevation: 4`.
   - Consistent modern border radius: `16px` for cards, `12px` for buttons, `9999px` for pill badges.

4. **Feedback & Loading States**
   - Replace bare "Loading..." text with graceful skeleton shimmers.
   - Provide non-blocking floating toast notifications instead of jarring system alert modals.

---

## Key Development Commands

```bash
# Root checks
npm run lint                  # Run ESLint across api/ and lib/
npm run test:backend          # Run 87 backend test suites

# Mobile app commands
cd mobile
npm test                      # Run 31 mobile unit tests
npx expo-doctor               # Verify Expo SDK 52 dependencies
npx expo export --platform web # Export static web build to dist/
```
