# BelikHub Platform

Platform komunitas untuk memantau dan memulihkan mata air Indonesia.
Arsitektur: Frontend statis (`index.html`) -> Vercel Serverless Functions (`/api/*`) -> Firebase Auth + Firestore.

## Struktur

    api/
      health.js
      firebase-config.js
      me.js
      reports.js
      partnerships.js
      admin/reports/[id]/status.js
    lib/
      auth.js
      firebase-admin.js
    index.html
    firestore.rules
    firestore.indexes.json
    firebase.json
    vercel.json

## Halaman situs

Situs menggunakan satu kerangka HTML bersama di `index.html`; rute menentukan bagian utama yang ditampilkan. Vercel mengarahkan rute halaman ke kerangka tersebut, sedangkan aset dan endpoint API tetap dilayani terpisah.

- Beranda menampilkan visi, ringkasan dampak, dan galeri cerita lapangan; menu utama disederhanakan agar pengunjung bisa mulai dari cerita, dampak, atau peta.
- `/` — Beranda
- `/peta` — Peta mata air
- `/dampak` — Statistik dan laporan dampak
- `/komunitas` — Kontribusi komunitas dan agenda
- `/aksi` — Program aksi rorak
- `/belajar` — Kursus dan bacaan
- `/media` — Video dan publikasi
- `/kemitraan` — Informasi dan formulir kemitraan

Foto `images/galeri-*.jpg` dan sebagian angka dampak saat ini adalah materi pratinjau. Ganti foto dengan dokumentasi BelikHub dan verifikasi angka lapangan sebelum publikasi.

## Pengembangan lokal

    npm install
    vercel login
    vercel env pull .env.local
    npx vercel dev --listen 127.0.0.1:3000

Gunakan Vercel CLI untuk mencoba semua rute dan endpoint API lokal; server statis sederhana seperti `python -m http.server` tidak menerapkan rewrite URL halaman. CLI perlu login ke akun Vercel.

## Environment variable (set di Vercel, jangan di-commit)

Server: GEO_SALT (rahasia acak untuk menyamarkan koordinat publik), FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (pakai \n untuk baris baru), FIREBASE_STORAGE_BUCKET
Client (dikirim lewat /api/firebase-config): VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID

## Firestore

Semua akses data lewat API (Admin SDK). Rules menolak semua akses langsung dari client.

    firebase deploy --only firestore:rules,firestore:indexes

## Endpoint

- GET /api/health
- GET /api/firebase-config
- GET /api/me (login)
- GET /api/stats (publik: hitungan laporan terverifikasi)
- GET /api/reports (publik: hanya approved, field terbatas; ?mine=1 untuk milik sendiri; admin melihat semua)
- POST /api/reports (login; tipe laporan di-whitelist, poin dihitung server)
- POST /api/partnerships
- GET /api/partnerships (admin)
- PATCH /api/admin/reports/:id/status (admin; poin dikreditkan saat approved)

## Admin

Beri custom claim admin lewat Admin SDK:

    await admin.auth().setCustomUserClaims(uid, { admin: true });

## Keamanan

- Jangan commit .env.local atau service account.
- Aktifkan Firebase App Check.
- Batasi CORS ke domain produksi sebelum rilis publik.

## Skrip

- npx vercel dev --listen 127.0.0.1:3000: server pengembangan lokal dengan rewrite dan API
- npm run deploy: vercel --prod
- npm run lint: ESLint untuk api/ dan lib/