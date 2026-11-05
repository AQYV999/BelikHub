# BelikHub Platform

Community-driven water restoration platform - Vercel + Firebase Architecture

## Architecture Overview

Frontend (index.html)  -->  Vercel Serverless Functions  -->  Firebase Auth, Firestore, Storage

- Frontend: Static index.html served by Vercel (no build step)
- API: Vercel Serverless Functions (/api/*)
- Auth: Firebase Authentication (Email/Password, Google, etc.)
- Database: Cloud Firestore (NoSQL, real-time)
- Storage: Firebase Storage (for report photos)

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase project (create at https://console.firebase.google.com)
- Vercel account (for deployment)

### Local Development

cd belikhub-project
npm install
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
firebase emulators:start
npm run dev

### Firebase Setup

1. Create Firebase Project
   - Go to Firebase Console -> Add Project
   - Enable Authentication -> Sign-in method -> Email/Password
   - Enable Firestore Database -> Start in test mode
   - Enable Storage -> Start in test mode

2. Get Client Config (Frontend)
   - Project Settings -> General -> Your Apps -> Web App
   - Copy config values to .env.local as VITE_FIREBASE_*

3. Get Admin SDK Credentials (Backend)
   - Project Settings -> Service Accounts -> Generate New Private Key
   - Save JSON securely -> Extract values for .env.local:
     - FIREBASE_PROJECT_ID
     - FIREBASE_CLIENT_EMAIL
     - FIREBASE_PRIVATE_KEY (include \n for newlines)
     - FIREBASE_STORAGE_BUCKET

4. Configure Firestore Rules (production)
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /reports/{reportId} {
         allow read: if resource.data.status == 'approved' || request.auth != null;
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid && request.resource.data.keys().hasAll(['reportType', 'location', 'notes']);
         allow update: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.token.admin == true);
       }
       match /partnerships/{partnershipId} {
         allow create: if true;
         allow read, update: if request.auth != null && request.auth.token.admin == true;
       }
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }

5. Set Admin Role (optional)
   await admin.auth().setCustomUserClaims(uid, { admin: true });

## Project Structure

belikhub-project/
api/
  health.js
  reports.js
  partnerships.js
  me.js
  admin/
    reports/
      status.js
lib/
  firebase-admin.js
  firebase-client.js
  auth.js
index.html
package.json
vercel.json
.env.example
.gitignore
README.md

## API Endpoints

GET /api/health - Health check
POST /api/reports - Create report (auth required)
GET /api/reports - List reports (optional auth)
POST /api/partnerships - Submit partnership request
GET /api/partnerships - List partnerships
GET /api/me - Current user profile (auth required)
PATCH /api/admin/reports/:id/status - Update report status (admin required)

## Deployment to Vercel

1. Push to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard
3. Add Environment Variables in Vercel Project Settings
4. Deploy

## Environment Variables

FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET (Server)
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID (Client)

## Security

- Never commit .env.local or service account JSON
- Use Vercel Environment Variables for all secrets
- Configure Firestore Security Rules before production
- Enable App Check in Firebase
- Use HTTPS only (Vercel provides automatically)

## Migration from v1 (Express + SQLite)

Old -> New
server.js (Express) -> /api/*.js (Vercel Serverless)
better-sqlite3 -> Cloud Firestore
bcryptjs + custom JWT -> Firebase Authentication
JWT_SECRET in .env -> Firebase ID Tokens
data/belikhub.sqlite -> Cloud Firestore collections
Manual rate limiting -> Vercel built-in + Firebase App Check
Local file uploads -> Firebase Storage

## Scripts

npm run dev - Start Vercel dev server
npm run build - No-op (static frontend)
npm run deploy - Deploy to Vercel production
npm run lint - ESLint on api/ and lib/

## License

MIT - Built for community-led water restoration in Indonesia.
