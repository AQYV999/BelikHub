# Desain Platform Mobile Apps BelikHub (Multirole — Fase 1 MVP)

- **Tanggal:** 18 November 2026
- **Status:** Draft untuk review & persetujuan sebelum penyusunan rencana implementasi
- **Konteks Proyek:** Perluasan platform [BelikHub](../../README.md) (saat ini web statis `index.html` + Vercel Serverless Functions `/api/*` + Firebase Auth/Firestore/Storage) ke aplikasi mobile multirole.

---

## 1. Tujuan & Latar Belakang (Intent & The Why)

Website BelikHub saat ini berfungsi sebagai kanal informasi publik, peta mata air (dengan privasi grid ~5 km), pelaporan lapangan berkoordinat GPS, dan pendaftaran aksi rorak. Untuk menghidupkan operasional pemulihan mata air secara berkelanjutan di lapangan, BelikHub membutuhkan **aplikasi mobile multirole** yang menghubungkan seluruh pemangku kepentingan dalam satu ekosistem:

1. **Warga** penerima manfaat mata air yang membayar retribusi pemeliharaan secara berkala.
2. **Pengelola** lokal di titik mata air yang mengelola retribusi warga dan menjalankan revitalisasi.
3. **Relawan / Pelaksana Lapangan** (termasuk tukang rorak) yang mengerjakan aksi fisik dan survei lapangan.
4. **Donatur** (individu maupun organisasi/CSR) yang mendanai revitalisasi dan memantau dampaknya.
5. **Admin BelikHub** yang mengawasi lintas lokasi, memverifikasi transaksi/laporan, dan menjaga tata kelola platform.

**Prinsip kerja yang disepakati:** *"Yang penting ada dulu, koreksi sambil jalan."* Karena itu, desain Fase 1 berfokus menghadirkan fondasi aplikasi mobile yang solid dan seluruh alur inti multirole secara *end-to-end* agar tim (Mas Denny dan rekan) dapat segera mencoba, menguji di lapangan, dan mengoreksi detail bisnis secara iteratif tanpa perlu merombak arsitektur dasar.

---

## 2. Skala Pekerjaan & Strategi Pencicilan

Ini adalah **proyek penuh** yang dirancang agar dapat dicicil dalam beberapa fase:

- **Fase 1 (MVP — Ruang Lingkup Dokumen Ini):**
  - Aplikasi mobile Expo (React Native + TypeScript) di folder `mobile/` yang berjalan di Android, iOS (via Expo Go / EAS Build), dan **Web Preview** untuk peninjauan cepat.
  - Perluasan backend Vercel API + Firebase Auth/Firestore untuk dukungan multirole, manajemen warga & retribusi (tunai + bukti transfer/QRIS), program & transaksi donasi (bukti transfer/QRIS), serta pembaruan progress revitalisasi.
  - Terintegrasi dengan data mata air (`springs`) dan pelaporan lapangan (`reports`) yang sudah ada di BelikHub.
  - Mode *Role Switcher* (untuk akun multirole dan akun demo pengujian) agar evaluasi seluruh peran cepat dilakukan.
- **Fase 2 (Pasca-MVP — Di luar ruang lingkup saat ini):**
  - Integrasi *payment gateway* otomatis (Midtrans/Xendit) + webhook status lunas otomatis.
  - *Push notification* (pengingat jatuh tempo retribusi, notifikasi verifikasi donasi, update progres).
  - Sinkronisasi *offline-first* penuh (antrean lokal SQLite untuk daerah tanpa sinyal seluler).
  - Rilis resmi ke Google Play Store & Apple App Store.

---

## 3. Goals, Non-Goals, dan Anti-Goals

### Goals (Target Keberhasilan Fase 1)
- Satu aplikasi mobile tunggal yang beradaptasi terhadap **5 role**: `warga`, `pengelola`, `relawan`, `donatur`, dan `admin`.
- Tiga aktivitas inti dari Mas Denny berjalan *end-to-end* terhadap backend sungguhan:
  1. **Pembayaran & pencatatan retribusi warga** (mendukung bayar mandiri via upload bukti transfer/QRIS maupun catat tunai oleh Pengelola).
  2. **Pengumpulan & pelacakan donasi revitalisasi** (individu & organisasi/CSR).
  3. **Pembaruan & pemantauan progress revitalisasi** (foto, persentase, catatan lapangan, linimasa transparan).
- Satu sumber data (*single source of truth*) dengan platform web BelikHub — laporan lapangan dari mobile langsung kompatibel dengan `/api/reports`, dan daftar mata air bersumber dari data `springs` yang sama.
- Identitas visual konsisten dengan web BelikHub (aksen teal `#0d7480` / mode gelap `#2dd4bf`, permukaan `#f7f9fa` / `#0c131a`, tipografi Epilogue & JetBrains Mono).

### Non-Goals (Tidak Dikerjakan di Fase 1)
- Integrasi *payment gateway* live atau *split disbursement* antar rekening bank secara otomatis.
- Pencatatan meteran air berbasis sensor/IoT.
- Mesin sinkronisasi *offline-first* penuh (di Fase 1 cukup penanganan error jaringan yang ramah dan mempertahankan input form sementara di memori/storage lokal).
- Merombak tampilan atau fitur website statis `index.html` yang sudah live.

### Anti-Goals (Kegagalan Desain Meski Secara Teknis Berjalan)
- **Akses langsung dari klien mobile ke Firestore atau Firebase Storage.** Repo ini menerapkan prinsip `allow read, write: if false` pada `firestore.rules` dan `storage.rules`; semua akses wajib melalui API server (Admin SDK).
- **Kebocoran koordinat presisi mata air ke publik, warga umum, atau donatur.** Aturan penyamaran grid ~5 km (`SNAP_PUBLIC_COORDS` di `api/springs.js` dan `fuzz()` di `api/reports.js`) tetap wajib dijaga.
- **Mewajibkan seluruh warga desa memiliki aplikasi dan membayar secara digital.** Di lapangan, banyak warga tetap membayar tunai; jika Pengelola tidak bisa mendaftarkan warga non-aplikasi dan mencatat setoran tunainya, fitur retribusi akan gagal dipakai.
- **Memecah atau merusak deployment web Vercel saat ini.** Penambahan folder `mobile/` dan endpoint baru tidak boleh merusak `vercel --prod` atau melampaui batas jumlah Serverless Functions Vercel Hobby (12 fungsi).

---

## 4. Pendekatan yang Dipertimbangkan (Approaches)

### Opsi 1 — Expo (React Native + TypeScript) di folder `mobile/` *(Dipilih)*
- **Gambaran:** Membangun aplikasi mobile native lintas-platform di subfolder `mobile/` menggunakan Expo Router + TypeScript, terhubung ke REST API Vercel yang sudah ada.
- **Alasan Dipilih:**
  - Tetap dalam satu ekosistem JavaScript/TypeScript dengan repo BelikHub (Node.js sudah terpasang di lingkungan kerja).
  - Sekaligus mendukung **Web Preview** (untuk koreksi cepat di browser), **Expo Go** (uji langsung di HP via scan QR), dan build `.apk`/`.ipa` lewat EAS Build tanpa instalasi Android Studio lokal.
  - Memberikan fondasi native yang benar untuk fitur lapangan jangka panjang (kamera, GPS akurat, notifikasi, dan dukungan offline Fase 2).
- **Trade-off:** Untuk mencoba versi native di HP (di luar Web Preview), penguji awal perlu menginstal Expo Go atau file `.apk`.

### Opsi 2 — Mobile-First PWA (React + Vite) di rute `/app` *(Tidak Dipilih)*
- **Gambaran:** Aplikasi web berdesain mobile yang di-host bersama situs utama di Vercel dan dapat dipasang melalui *"Add to Home Screen"*, lalu dibungkus Capacitor bila kelak butuh APK.
- **Trade-off:** Paling cepat didistribusikan lewat tautan WhatsApp tanpa instalasi, namun terbatas untuk kapabilitas native (push notification iOS/Android, kamera/GPS latar belakang, dan penyimpanan offline di pedalaman).

### Opsi yang Dieliminasi — Flutter
- Dieliminasi karena SDK Flutter tidak tersedia di lingkungan pengembangan saat ini dan akan memecah tumpukan teknologi JavaScript/TypeScript yang telah digunakan oleh BelikHub.

---

## 5. Arsitektur Sistem & Batasan Teknis (Constraints)

### 5.1 Struktur Monorepo & Isolasi Deployment Vercel
- Aplikasi mobile ditempatkan di `mobile/` (memiliki `package.json`, `app.json`, dan `tsconfig.json` sendiri, terpisah dari root `package.json`).
- **Wajib:** Karena `vercel.json` menggunakan `"outputDirectory": "."`, file `.vercelignore` wajib diperbarui untuk mengabaikan `mobile/` dan `docs/` agar dependensi Expo tidak ikut terunggah ke deployment web Vercel.

### 5.2 Batas Jumlah Vercel Serverless Functions *(Keputusan Arsitek)*
Saat ini sudah terdapat **10 file endpoint** di dalam folder `api/`. Vercel Hobby Plan membatasi maksimal **12 Serverless Functions** per deployment. Agar aman dari batas tersebut sekaligus tetap modular:
- Seluruh endpoint baru untuk kebutuhan mobile & multirole dikonsolidasikan melalui **1 catch-all router**: `api/v1/[...route].js` (total menjadi 11 fungsi di Vercel).
- Logika bisnis tiap domain dipisahkan rapi ke dalam modul di `lib/v1/` (`retributions.js`, `residents.js`, `campaigns.js`, `donations.js`, `uploads.js`, `admin-users.js`), sehingga kode tetap terstruktur tanpa menambah jumlah fungsi serverless.

### 5.3 Autentikasi, Multirole, & Kompatibilitas Mundur *(Keputusan Arsitek)*
- **Autentikasi:** Menggunakan Firebase Auth (Email & Password pada Fase 1; disiapkan agar bisa ditambah login Nomor HP/OTP di masa depan). Klien mobile mengambil konfigurasi Firebase publik dari `GET /api/firebase-config` atau environment `EXPO_PUBLIC_*`, login ke Firebase Auth, lalu mengirim `Authorization: Bearer <idToken>` ke setiap request API.
- **Model Multirole:**
  - Role resmi disimpan di **Firebase Auth Custom Claims** dalam bentuk `roles: string[]` (nilai yang valid: `'warga'`, `'pengelola'`, `'relawan'`, `'donatur'`, `'admin'`) dan **tetap mempertahankan** claim boolean `admin: true` agar seluruh kode web & `requireAdmin()` yang ada tetap bekerja tanpa perubahan merusak.
  - Satu pengguna boleh memiliki lebih dari satu role (contoh: seorang Pengelola yang juga menjadi Warga, atau Admin yang ingin meninjau perspektif role lain).
  - Salinan *read-only* dari `roles`, `managedSpringIds`, `springId`, dan `donorType` juga disimpan di dokumen Firestore `users/{uid}` hanya untuk keperluan pencarian/daftar pengguna di panel Admin; **otorisasi API selalu mengacu pada token custom claims (atau verifikasi Admin SDK)**, tidak pernah percaya input role dari body request.
- **Aturan Registrasi & Penetapan Role:**
  - Saat mendaftar mandiri di aplikasi mobile (atau saat pengguna web lama login pertama kali di mobile), pengguna dapat memilih peran awal publik: **`warga`**, **`donatur`** (dengan pilihan tipe `individual` / `organization`), atau **`relawan`**. Keputusan mengizinkan `relawan` di *self-onboarding* menjaga keselarasan dengan website BelikHub saat ini di mana setiap akun login boleh mengirim laporan lapangan (semua laporan tetap dimoderasi oleh Admin sebelum disetujui/mendapat poin). Endpoint `POST /api/v1/onboarding` hanya mengizinkan tiga role publik ini dan tidak pernah mengizinkan *self-assign* `pengelola` atau `admin`.
  - Role **`pengelola`** (beserta daftar `managedSpringIds`) dan **`admin`** hanya dapat ditetapkan oleh **Admin BelikHub** melalui panel kelola pengguna (`PATCH /api/v1/admin/users/:uid/roles`).
  - **Kompatibilitas Web Lama (`api/reports.js`):** `POST /api/reports` tetap menggunakan `requireAuth` (semua user terautentikasi boleh melapor, sehingga pengguna web tidak terganggu). `api/reports.js` juga diperluas secara kompatibel-mundur untuk: (1) mengimplementasikan filter `GET /api/reports?mine=1` bagi pelapor yang sedang login, dan (2) menerima `photoPath` (objek di Firebase Storage) selain `photoUrl`, lalu menyertakan *signed read URL* berumur pendek saat `GET`.
  - **Penautan Akun Warga ke Data `residents` (Tanpa Phone OTP):** Karena Fase 1 belum memakai Phone OTP, sistem **tidak boleh** menautkan otomatis hanya berdasarkan kecocokan nomor HP (mencegah pembajakan riwayat tagihan warga lain). Sebagai gantinya digunakan mekanisme aman dua jalur:
    1. Pengelola dapat membuat **kode tautan sekali pakai 6 karakter (`linkCode`)** pada data warga di `residents`; warga memasukkan kode tersebut saat onboarding/di tab Retribusi untuk menautkan akunnya secara instan (`resident.userId = uid`, `linkCode` hangus).
    2. Jika mendaftar tanpa kode, warga memilih mata air (`springId`) dan masuk ke status **"Menunggu Tautan Pengelola"** (tetap dapat melihat info mata air & progres revitalisasi). Pengelola melihat antrean permintaan tautan ini dan dapat memetakan akun ke data `residents` yang tepat (atau membuatkan data `residents` baru) dalam satu ketukan.
- **Pratinjau Cepat & Isolasi Data Produksi:**
  - Fase 1 dijalankan dan diuji secara lokal melalui **Expo Web Preview** (`npx expo start --web`) & **Expo Go** di HP, serta disiapkan konfigurasi EAS Build bila ingin membangun file `.apk` pratinjau.
  - Untuk evaluasi cepat *"ada dulu, koreksi sambil jalan"* tanpa mengotori Firestore produksi, disediakan **Mode Demo / Role Switcher** (`EXPO_PUBLIC_ENABLE_DEMO_MODE=true` pada build dev/preview) yang memakai data *mock* lokal terisolasi dengan banner "Mode Demo" yang jelas. Pengujian *end-to-end* terhadap Firebase sungguhan diarahkan ke lingkungan staging/pengembangan (bukan menulis data uji coba ke Firestore produksi tanpa izin eksplisit).

### 5.4 Unggah Gambar (Foto Lapangan, Bukti Pembayaran, & QRIS) *(Keputusan Arsitek)*
- Karena `storage.rules` menolak akses langsung dari klien (`allow read, write: if false`) dan unggahan langsung browser ke GCS *signed PUT URL* dari Web Preview akan terblokir CORS kecuali bucket dikonfigurasi khusus, Fase 1 menggunakan **Server-Proxied Upload via Admin SDK**:
  1. Klien mobile mengompresi foto di perangkat (lebar maks ~1280px, format JPEG/PNG/WebP, ukuran file <= 2 MB — jauh di bawah batas payload Vercel ~4,5 MB).
  2. Klien mengirim unggahan ke `POST /api/v1/uploads` (menyertakan `purpose`: `retribution_proof` | `donation_proof` | `revitalization_photo` | `report_photo` | `qris_image`, `contentType`, dan payload file).
  3. Server memverifikasi token & role, memvalidasi MIME & ukuran <= 2 MB, lalu menulis objek ke bucket yang ditentukan secara eksplisit lewat env `FIREBASE_STORAGE_BUCKET` (server wajib menolak dengan pesan jelas jika env belum diset, agar tidak salah menebak `.appspot.com` vs `.firebasestorage.app`) dan mengembalikan `{ objectPath, readUrl }`.
  4. Semua dokumen di Firestore menyimpan `objectPath` permanen (bukan URL sementara). Saat `GET` dipanggil oleh role yang berhak, server menerbitkan *signed read URL* berumur terbatas (misal 1 jam) yang dapat langsung ditampilkan di komponen `<Image>` di Android, iOS, maupun Web Preview tanpa masalah CORS.

### 5.5 Privasi Koordinat Mata Air
- Endpoint publik (`GET /api/springs`, `GET /api/v1/campaigns`) hanya mengembalikan koordinat grid ~5 km (`coordinates_public`).
- Koordinat presisi hanya dikirim atau disimpan dalam lingkup laporan lapangan/pengelolaan internal yang hanya dapat diakses oleh `admin`, `pengelola` pada mata airnya, atau `relawan` untuk laporannya sendiri.

---

## 6. Rincian Fitur & Pengalaman per Role (Fase 1 MVP)

Aplikasi menggunakan **Bottom Tab Navigation** yang menyesuaikan *active role* pengguna. Pengguna dengan lebih dari satu role dapat berpindah peran dari pemilih peran di bagian atas Beranda atau tab Profil.

### 6.1 Role: Warga (`warga`)
- **Beranda Warga:**
  - Kartu status retribusi bulan berjalan (`Belum Bayar` / `Menunggu Verifikasi` / `Lunas`) dengan nominal & periode.
  - Ringkasan transparansi kas mata air tempat tinggalnya (total retribusi terkumpul bulan ini & jumlah warga yang sudah membayar).
  - Ringkasan progres revitalisasi terbaru untuk mata air desanya.
- **Tab Retribusi:**
  - Daftar tagihan retribusi per bulan (riwayat lunas & tagihan aktif).
  - Detail tagihan + kuitansi digital (nomor referensi, tanggal lunas, metode `Tunai` / `Transfer` / `QRIS`, nama pencatat/verifikator).
  - Aksi **"Bayar Sekarang"** untuk tagihan `unpaid`/`rejected`: menampilkan instruksi transfer/QRIS milik pengelola mata air + unggah foto bukti bayar -> status menjadi `pending_verification`.
- **Tab Mata Air:**
  - Informasi mata air di desanya, linimasa foto & persentase progres revitalisasi.

### 6.2 Role: Pengelola (`pengelola`)
- **Beranda Pengelola:**
  - Pemilih mata air (jika mengelola lebih dari 1 titik).
  - Ringkasan retribusi bulan berjalan: total tagihan, total masuk (dipisah Tunai vs Non-tunai), jumlah warga belum bayar, dan jumlah bukti bayar yang menunggu verifikasi.
- **Tab Retribusi & Warga:**
  - **Daftar Warga/KK & Tautan Akun:** Tambah/edit warga binaan (`nama`, `no HP/WA`, `nominal retribusi bulanan`, status aktif). Warga dapat didaftarkan meskipun belum punya akun aplikasi. Pengelola dapat membuat **kode tautan sekali pakai 6 karakter (`linkCode`)** untuk diberikan ke warga, atau menyetujui antrean **"Permintaan Tautan Akun"** dari warga yang sudah mendaftar mandiri di aplikasi.
  - **Buat Tagihan Bulanan:** Aksi satu klik untuk menerbitkan tagihan periode `YYYY-MM` bagi seluruh warga aktif di mata airnya (idempoten — tidak membuat tagihan ganda untuk warga & periode yang sama).
  - **Catat Setoran Tunai:** Pengelola memilih warga yang belum bayar -> ketuk *"Catat Lunas (Tunai)"* -> tagihan langsung berstatus `paid`, metode `cash`, mencatat `recordedByUid` & timestamp.
  - **Verifikasi Bukti Transfer/QRIS:** Meninjau foto bukti yang diunggah warga -> `Setujui` (`paid`) atau `Tolak` (`rejected` dengan alasan agar warga dapat mengunggah ulang).
  - **Info Rekening/QRIS Mata Air:** Melihat pengaturan instruksi pembayaran & gambar QRIS yang ditetapkan Admin untuk mata airnya.
- **Tab Revitalisasi:**
  - Daftar program revitalisasi untuk mata air yang dikelolanya.
  - Tambah **Update Progress Revitalisasi**: judul tahap, persentase progres (0–100%), catatan kegiatan/kendala, foto dokumentasi lapangan, dan opsional nominal realisasi biaya.

### 6.3 Role: Relawan / Pelaksana Lapangan (`relawan`)
- **Beranda Relawan:**
  - Total poin kontribusi & ringkasan status laporan (`pending`, `approved`, `rejected`).
  - Pintasan cepat buat laporan lapangan.
- **Tab Lapor Lapangan:**
  - Terhubung langsung ke `POST /api/reports` yang sudah ada di backend BelikHub.
  - Mendukung 4 tipe resmi: `Survei Mata Air`, `Restorasi Mata Air`, `Penanaman Pohon`, dan `Pembangunan Rorak`.
  - Pengambilan lokasi GPS otomatis dari perangkat (dengan fallback input manual jika sinyal lemah) + ambil/pilih foto lapangan.
- **Tab Riwayat & Poin:**
  - Daftar laporan milik sendiri (`GET /api/reports?mine=1`) beserta status persetujuan dan poin yang didapat.

### 6.4 Role: Donatur (`donatur` — Individu & Organisasi/CSR)
- **Beranda / Eksplorasi Program:**
  - Daftar program revitalisasi mata air aktif (`revitalization_campaigns`): nama mata air & wilayah, target dana vs dana terkumpul, progress bar revitalisasi, jumlah KK penerima manfaat.
  - Filter berdasarkan status program (`Aktif`, `Selesai`).
- **Detail Program & Alur Donasi:**
  - Menampilkan detail mata air, linimasa update foto revitalisasi dari Pengelola, dan transparansi pendanaan.
  - Form **"Donasi Sekarang"**: pilih/isi nominal, pilih identitas donatur (`Individu` atau `Organisasi/CSR` + nama instansi, serta opsi tampil anonim di daftar publik), lihat instruksi rekening/QRIS BelikHub, lalu unggah bukti transfer -> status `pending_verification`.
- **Tab Donasi Saya:**
  - Riwayat seluruh donasi, status verifikasi (`Menunggu Verifikasi` / `Terverifikasi` / `Ditolak`), dan pembaruan terbaru dari mata air yang pernah didanai.

### 6.5 Role: Admin BelikHub (`admin`)
- **Beranda Admin:**
  - Ringkasan lintas lokasi: total mata air, total donasi terverifikasi, ringkasan retribusi bulan berjalan, dan jumlah item pada antrean verifikasi.
- **Tab Verifikasi:**
  - **Antrean Donasi:** Tinjau bukti transfer donatur -> `Verifikasi` (secara transaksional menambahkan nominal ke `collectedAmount` program) atau `Tolak` (dengan alasan).
  - **Antrean Laporan Lapangan:** Tinjau laporan dari Relawan -> `Approve` / `Reject` via endpoint yang sudah ada (`PATCH /api/admin/reports/:id/status`), sekaligus mengkreditkan poin.
- **Tab Program, Mata Air, & Pengguna:**
  - **Kelola Mata Air & Pengaturan Retribusi:** Tambah/edit mata air di luar 4 data *seed* awal (termasuk opsi impor 4 data baseline `springs-seed.js` ke Firestore), serta atur instruksi pembayaran & gambar QRIS retribusi per mata air (`spring_settings`) sebagai kontrol keamanan agar rekening tujuan tidak diubah sembarangan.
  - **Kelola Program Revitalisasi:** Buat/edit program revitalisasi pada suatu mata air (judul, target dana, instruksi pembayaran, status `draft`/`active`/`completed`).
  - **Kelola Pengguna & Role:** Cari pengguna, tetapkan/cabut role (`warga`, `pengelola`, `relawan`, `donatur`, `admin`), dan kaitkan `managedSpringIds` bagi Pengelola.

---

## 7. Model Data & Kontrak API

### 7.1 Koleksi Firestore
Mempertahankan koleksi yang ada (`springs`, `reports`, `users`, `community_actions`, `partnerships`) dan menambahkan koleksi baru berikut:

| Koleksi | Field Utama | Catatan |
|---|---|---|
| `users` *(diperluas)* | `name`, `email`, `phone`, `roles[]`, `donorType` (`individual`\|`organization`), `organizationName?`, `springId?`, `residentId?`, `residentLinkStatus` (`unlinked`\|`pending`\|`linked`), `managedSpringIds[]`, `points`, `updatedAt` | `roles` adalah cermin dari Firebase Custom Claims untuk tampilan admin. |
| `spring_settings` | `springId` (ID dokumen), `defaultMonthlyFee`, `paymentInstructions`, `qrisImagePath?`, `updatedByUid`, `updatedAt` | Pengaturan rekening/QRIS retribusi per mata air; dikelola oleh Admin (mendukung skema kas lokal per mata air maupun rekening terpusat BelikHub). |
| `residents` | `springId`, `name`, `phone`, `kkLabel?`, `monthlyFee`, `userId?`, `linkCode?`, `linkCodeExpiresAt?`, `active`, `createdByUid`, `createdAt`, `updatedAt` | Mendukung warga yang belum memiliki akun aplikasi (`userId: null`); `linkCode` sekali pakai (6 karakter) untuk penautan akun secara aman. |
| `retribution_bills` | `springId`, `residentId`, `residentName`, `userId?`, `period` (`YYYY-MM`), `amount`, `status` (`unpaid`\|`pending_verification`\|`paid`\|`rejected`), `paymentMethod` (`cash`\|`transfer`\|`qris`\|null), `proofPath?`, `rejectionReason?`, `recordedByUid?`, `verifiedByUid?`, `paidAt?`, `createdAt`, `updatedAt` | ID dokumen deterministik `${springId}_${residentId}_${period}` agar penerbitan tagihan bulanan idempoten. |
| `revitalization_campaigns` | `springId`, `springName`, `title`, `description`, `targetAmount`, `collectedAmount`, `progressPercent`, `paymentInstructions`, `qrisImagePath?`, `status` (`draft`\|`active`\|`completed`), `createdByUid`, `createdAt`, `updatedAt` | `collectedAmount` hanya diperbarui lewat transaksi server saat donasi diverifikasi. |
| `revitalization_updates` | `campaignId`, `springId`, `authorUid`, `authorName`, `authorRole`, `title`, `notes`, `progressPercent`, `photoPath?`, `spentAmount?`, `createdAt` | Memperbarui `progressPercent` pada dokumen `revitalization_campaigns` induk secara atomik. |
| `donations` | `campaignId`, `springId`, `donorUid`, `donorName`, `donorType`, `organizationName?`, `isAnonymous`, `amount`, `paymentMethod`, `proofPath?`, `status` (`pending_verification`\|`verified`\|`rejected`), `rejectionReason?`, `verifiedByUid?`, `verifiedAt?`, `createdAt` | Dirancang agar kolom `gatewayProvider` & `externalRef` mudah ditambahkan di Fase 2. |

### 7.2 Daftar Endpoint API Baru (via `api/v1/[...route].js`)
- `POST /api/v1/onboarding` — Penetapan profil awal & role publik (`warga`, `donatur`, atau `relawan`). Jika memilih `warga`, menerima `springId` dan opsional `linkCode` (jika cocok -> langsung tertaut; jika kosong -> status `pending` menunggu persetujuan Pengelola).
- `PATCH /api/v1/profile` — Perbarui nama, nomor HP, tipe donatur, atau ajukan penautan `linkCode` warga.
- `POST /api/v1/uploads` — Unggah gambar terkompresi (<= 2 MB) lewat server Admin SDK ke Firebase Storage (`FIREBASE_STORAGE_BUCKET`), mengembalikan `{ objectPath, readUrl }`.
- `GET /api/v1/springs/:id/settings` & `PUT /api/v1/springs/:id/settings` — Baca pengaturan retribusi & QRIS mata air (`warga`/`pengelola`/`admin`) dan ubah pengaturan tersebut (`admin`).
- `POST /api/v1/springs` & `PATCH /api/v1/springs/:id` — Tambah/edit mata air di Firestore (termasuk *seed* 4 mata air awal dari `lib/springs-seed.js`) oleh `admin`.
- `GET/POST /api/v1/residents`, `PATCH /api/v1/residents/:id`, `POST /api/v1/residents/:id/link-code`, & `POST /api/v1/residents/approve-link` — Manajemen warga, penerbitan kode tautan sekali pakai, dan persetujuan tautan akun warga oleh `pengelola` (khusus `managedSpringIds`) dan `admin`.
- `GET /api/v1/retributions` — Daftar tagihan (Warga melihat miliknya; Pengelola melihat mata airnya; Admin melihat semua + ringkasan agregat; semua `proofPath` di-resolve menjadi *signed read URL* singkat).
- `POST /api/v1/retributions/generate` — Terbitkan tagihan periode `YYYY-MM` untuk seluruh warga aktif pada `springId` (idempoten).
- `PATCH /api/v1/retributions/:id` — Aksi berbasis peran:
  - `warga`: kirim `action: 'submit_proof'` (`paymentMethod`, `proofPath`).
  - `pengelola` / `admin`: kirim `action: 'record_cash'` (langsung `paid`), `action: 'approve'`, atau `action: 'reject'` (`rejectionReason`).
- `GET /api/v1/campaigns` & `GET /api/v1/campaigns/:id` — Daftar & detail program revitalisasi beserta linimasa `updates` (koordinat disamarkan grid 5 km, foto di-resolve ke *signed read URL*).
- `POST /api/v1/campaigns` & `PATCH /api/v1/campaigns/:id` — Buat/edit program revitalisasi (`admin`).
- `POST /api/v1/campaigns/:id/updates` — Unggah update progres revitalisasi (`pengelola` pada mata airnya, atau `admin`).
- `GET /api/v1/donations` & `POST /api/v1/donations` — Riwayat donasi & kirim donasi baru (`donatur` atau pengguna login; `admin` dapat melihat semua).
- `PATCH /api/v1/donations/:id` — Verifikasi (`approve` / `reject`) oleh `admin` dengan transaksi Firestore untuk memperbarui `collectedAmount`.
- `GET /api/v1/admin/users` & `PATCH /api/v1/admin/users/:uid/roles` — Daftar pengguna & penetapan custom claims role + `managedSpringIds` (`admin`).
- `GET /api/v1/summary` — Ringkasan metrik dashboard sesuai role yang sedang login (termasuk ringkasan kas transparan desa untuk Warga).
- **Perluasan endpoint lama (kompatibel mundur):**
  - `GET /api/me` diperluas agar turut mengembalikan `roles[]`, `managedSpringIds[]`, `springId`, `residentId`, `residentLinkStatus`, `donorType`, dan `phone` sembari tetap mengembalikan field lama (`role: 'admin' | 'user'`, `points`, dll.).
  - `GET /api/reports` diperluas untuk benar-benar mengimplementasikan `?mine=1` (hanya laporan milik user yang sedang login) dan mengembalikan *signed read URL* bila laporan memakai `photoPath`; `POST /api/reports` tetap terbuka untuk semua akun terautentikasi (`requireAuth`) dan menerima opsional `photoPath` selain `photoUrl`.

---

## 8. Pembagian Keputusan: Disepakati vs Keputusan Arsitek vs Diserahkan ke Builder

### Diputuskan oleh Pengguna & Mas Denny
- Aplikasi mobile berbentuk **satu aplikasi multirole** yang mencakup minimal Warga (retribusi), Donatur, Pengelola, dan Admin BelikHub.
- Fokus tiga aktivitas utama: pembayaran retribusi, pengumpulan donasi, dan pemantauan progress revitalisasi.
- Mengadopsi pendekatan **Opsi 1: Expo (React Native + TypeScript)** di folder `mobile/`.
- Strategi iterasi: *"ada dulu, koreksi sambil jalan"* (siap diuji cepat dan disempurnakan bertahap).

### Keputusan Arsitek untuk Fase 1 *(Terbuka untuk Koreksi Sambil Jalan)*
1. **Peran tambahan & pengelompokan:** Menambahkan role ke-5 (**Relawan / Pelaksana Lapangan**) yang terhubung ke `/api/reports` yang sudah ada, sedangkan **Mitra/CSR** digabung sebagai tipe akun `organization` di bawah role **Donatur**.
2. **Aturan registrasi mandiri:** Pengguna baru dapat memilih `warga`, `donatur`, atau `relawan` saat pendaftaran (selaras dengan web di mana semua akun boleh melapor dan Admin memoderasi); hanya `pengelola` dan `admin` yang ditetapkan oleh Admin BelikHub.
3. **Pembayaran tunai + non-tunai & rekening tujuan retribusi:** Mendukung pencatatan tunai oleh Pengelola (termasuk warga tanpa aplikasi) dan unggah bukti transfer/QRIS. Instruksi rekening/QRIS retribusi disimpan per mata air di `spring_settings` dan dikelola oleh **Admin** (mendukung baik rekening lokal pengelola maupun rekening terpusat BelikHub, sekaligus menjaga keamanan dari perubahan rekening sepihak).
4. **Penautan akun Warga yang aman tanpa OTP:** Menggunakan kode tautan 6 karakter sekali pakai dari Pengelola atau persetujuan manual Pengelola (tidak auto-link dari nomor HP mentah demi keamanan data warga).
5. **Konsolidasi API & unggah gambar ramah Web Preview:** Seluruh endpoint baru masuk ke 1 catch-all router `api/v1/[...route].js` (aman dari limit 12 fungsi Vercel Hobby), dan unggah gambar (maks 2 MB terkompresi) melalui server proxy `POST /api/v1/uploads` agar bekerja mulus di Android, iOS, dan Web Preview tanpa masalah CORS GCS sambil tetap mematuhi `storage.rules` (`allow read, write: if false`).
6. **Mode Demo & pengelolaan mata air tambahan:** Menyediakan Mode Demo (`EXPO_PUBLIC_ENABLE_DEMO_MODE=true`) untuk pratinjau cepat semua 5 role tanpa mengotori data produksi, serta CRUD mata air sederhana untuk Admin agar uji coba lapangan tidak terkunci hanya pada 4 mata air awal.

### Diserahkan ke Builder
- Pemilihan library klien pendukung di dalam `mobile/` (misal TanStack Query / Zustand / Expo Image Picker / Expo Location / Expo SecureStore).
- Struktur folder komponen UI, *design tokens* React Native, serta animasi transisi yang mengikuti palet warna & tipografi BelikHub.
- Penulisan copywriting antarmuka Bahasa Indonesia yang ramah untuk warga desa dan donatur.
- Detail implementasi indeks Firestore (`firestore.indexes.json`), validasi payload rinci, *rate limiting* dasar, dan cakupan pengujian (unit test handler `lib/v1/*` + smoke test alur UI mobile di Web Preview).
