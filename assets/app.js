// assets/app.js - BelikHub Platform V4 Interactive Client Logic with Complete i18n
import { SPRINGS } from './springs-seed.js';

// DOM Utilities
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[ch]));

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
};

// Virtual route scroll mapping so legacy links (/peta, /dampak, /aksi, /belajar, /media, /komunitas, /kemitraan) work smoothly on the unified page
const routeTargetMap = {
  '/peta': { section: '#map' },
  '/dampak': { section: '#dashboard' },
  '/komunitas': { section: '#community' },
  '/aksi': { section: '#pulangkan-air' },
  '/belajar': { section: '#learn', tab: 'tab-courses' },
  '/media': { section: '#learn', tab: 'tab-media' },
  '/kemitraan': { section: '#kemitraan' }
};
const currentPath = location.pathname.replace(/\/+$/, '') || '/';
if (routeTargetMap[currentPath]) {
  requestAnimationFrame(() => {
    const cfg = routeTargetMap[currentPath];
    if (cfg.tab) document.getElementById(cfg.tab)?.click();
    document.querySelector(cfg.section)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

// Highlight current visible section in header nav
const sectionNavLinks = $$('.nav__links a[href^="#"]');
if (sectionNavLinks.length && 'IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((e) => e.isIntersecting);
      if (!visible) return;
      const hash = `#${visible.target.id}`;
      sectionNavLinks.forEach((a) => {
        if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );
  sectionNavLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) navObserver.observe(target);
  });
}

// =========================================================================
// Complete Internationalization (i18n) Engine (ID / EN)
// =========================================================================
export const translations = {
  id: {
    'doc.title': 'BelikHub: Platform Peta Mata Air & Pemulihan Daerah Tangkapan Air',
    'doc.desc': 'Platform peta mata air komunitas di Jawa Tengah dan DIY: pemantauan debit, grid privasi 5 km, parit resapan rorak, dan aksi relawan hulu ke hilir.',

    // Nav
    'skip.main': 'Langsung ke isi',
    'nav.logo_aria': 'BelikHub Beranda',
    'nav.main_aria': 'Navigasi utama',
    'nav.lang_aria': 'Ganti bahasa',
    'nav.toggle_aria': 'Buka menu navigasi',
    'nav.theme_aria': 'Ganti mode terang atau gelap',
    'nav.platform': 'Platform',
    'nav.story': 'Visi kami',
    'nav.impact': 'Dampak',
    'nav.map': 'Peta',
    'nav.rorak': 'Rorak',
    'nav.order_rorak': 'Pesan rorak mata air',
    'nav.learn': 'Belajar',
    'nav.media': 'Video lapangan',
    'nav.community': 'Komunitas',
    'nav.partnership': 'Kemitraan',
    'nav.login': 'Masuk',
    'nav.logout': 'Keluar',
    'nav.join': 'Bergabung',
    'nav.join_action': 'Gabung Aksi',

    // Hero
    'hero.tag': 'Platform Peta Mata Air · Jawa Tengah & DIY',
    'hero.title': 'Platform peta mata air untuk desa.',
    'hero.intro': 'Dokumentasi debit mata air, pemetaan grid 5 km, dan parit resapan rorak bersama warga hulu.',
    'hero.btn_map': 'Jelajahi peta',
    'hero.btn_impact': 'Lihat capaian BelikHub',
    'hero.btn_action': 'Aksi pulangkan air',
    'hero.float_springs_aria': 'Ringkasan jaringan mata air',
    'hero.float_grid': 'Grid Publik 5 km',
    'hero.float_springs': '88 mata air terdata',
    'hero.float_discharge': '1.350 L/s total debit',
    'hero.float_rorak_aria': 'Kapasitas serapan rorak',
    'hero.float_rorak_label': 'Rorak Standar',
    'hero.float_rorak_val': '2.000 L / musim',

    // Visi
    'visi.section': 'Visi hulu ke hilir',
    'visi.title': 'Platform mata air hulu ke hilir.',
    'visi.p1': 'Saat debit gunung menyusut,',
    'visi.strong': 'air bersih desa terancam.',
    'visi.p2': 'BelikHub memetakan mata air kritis, merawat pohon hulu, dan menggali rorak resapan bersama warga.',
    'visi.desc': 'Belik adalah sumber hidup desa Nusantara. Saat debit berkurang, petani kehilangan irigasi dan warga kekurangan air minum. BelikHub mengembalikan debit air lewat pemetaan dan restorasi terukur.',
    'visi.btn_volunteer': 'Gabung menjadi relawan',
    'visi.btn_roadmap': 'Peta jalan 2030',
    'visi.stat1_dt': 'Target Mata Air',
    'visi.stat1_dd': '88 belik',
    'visi.stat2_dt': 'Potensi Debit',
    'visi.stat3_dt': 'Penerima Manfaat',
    'visi.stat3_dd': '2.500+ KK',
    'visi.stat4_dt': 'Mandiri Komunitas',
    'visi.step1_label': '01 · Pemetaan grid publik',
    'visi.step1_val': 'Radius 5 km',
    'visi.step2_label': '02 · Parit resapan rorak',
    'visi.step2_val': '2.000 L / unit',
    'visi.step3_label': '03 · Audit debit tahunan',
    'visi.step3_val': 'Jawa Tengah & DIY',

    // Home Impact
    'impact.tag': 'Dampak terukur',
    'impact.title': 'Setiap aksi kecil punya arti nyata.',
    'impact.lead': 'Data langsung dari laporan terverifikasi di lapangan oleh komunitas dan pengelola mata air.',
    'impact.verified': 'Laporan Terverifikasi',
    'impact.verified_desc': 'Validasi survei, restorasi, tanam, dan rorak.',
    'impact.restoration': 'Titik Restorasi',
    'impact.restoration_desc': 'Pembersihan sedimen & perbaikan springbox.',
    'impact.trees': 'Pohon Ditanam',
    'impact.trees_desc': 'Bibit endemik pengikat air di area springshed.',
    'impact.rorak': 'Rorak Digali',
    'impact.rorak_desc': 'Menahan limpasan hujan masuk ke akuifer tanah.',
    'impact.unit_reports': 'laporan',
    'impact.unit_springs': 'belik',
    'impact.unit_trees': 'pohon',
    'impact.unit_units': 'unit',
    'impact.status_loading': 'Memuat data capaian…',
    'impact.status_ready': 'Data diverifikasi dari laporan lapangan & satgas hidrologi komunitas.',

    // Home Stories
    'stories.tag': '§ Cerita lapangan — Saksi pemulihan',
    'stories.title': 'Pemulihan terlihat dari dekat.',
    'stories.lead': 'Dari Tuk Bismo di lereng Dieng hingga Wonomerto di Batang, dengarkan kisah warga yang kembali merasakan gemericik air melimpah.',
    'stories.btn_all': 'Jelajahi semua cerita & publikasi',
    'stories.btn_read': 'Baca Kisah Lengkap',
    'stories.btn_guide': 'Baca panduan BelikHub',

    // Home Links
    'links.transparency': 'Transparansi',
    'links.report_title': 'Laporan Dampak',
    'links.report_desc': 'Lihat metrik agregat, audit lapangan, dan dampak SDG.',
    'links.geospatial': 'Geospasial',
    'links.map_title': 'Peta Interaktif',
    'links.map_desc': 'Pantau kondisi debit, status pemulihan, dan laporan warga.',
    'links.participation': 'Partisipasi',
    'links.community_title': 'Komunitas & Poin',
    'links.community_desc': 'Kirim survei, catat penanaman, kumpulkan poin relawan.',

    // Map
    'map.section': '§ 01 — Peta mata air terpadu',
    'map.title': 'Pantau peta kondisi mata air.',
    'map.lead': 'Jelajahi mata air baseline resmi (RISPAM & Pemda) serta titik laporan aksi komunitas. Koordinat publik disamarkan (~5 km) untuk melindungi sumber air dari eksploitasi berlebihan.',
    'map.canvas_aria': 'Peta interaktif sebaran mata air BelikHub',
    'map.search_label': 'Cari mata air, desa, atau kegiatan',
    'map.search_placeholder': 'Contoh: Tuk Bismo, Wonomerto, Batang, Dieng…',
    'map.filter_label': 'Filter kategori',
    'map.filter_all': 'Semua Titik (Mata Air & Laporan)',
    'map.filter_springs_all': 'Semua Mata Air Baseline',
    'map.filter_springs_active': 'Mata Air: Aktif',
    'map.filter_springs_rehab': 'Mata Air: Rehabilitasi',
    'map.filter_survey': 'Laporan: Survei Lapangan',
    'map.filter_restoration': 'Laporan: Restorasi',
    'map.filter_planting': 'Laporan: Tanam Pohon',
    'map.filter_rorak': 'Laporan: Pembuatan Rorak',
    'map.btn_locate': 'Lokasi saya',
    'map.btn_refresh': 'Perbarui Data Peta',
    'map.legend_active': 'Mata Air Aktif',
    'map.legend_rehab': 'Rehabilitasi',
    'map.legend_restoration': 'Restorasi',
    'map.legend_planting': 'Penanaman',
    'map.legend_rorak': 'Rorak',
    'map.grid_status': 'Sistem Grid Snapping 5km Aktif',

    // Dashboard
    'dash.section': 'Dampak nyata — Transparansi capaian',
    'dash.title': 'Dampak nyata pemulihan mata air.',
    'dash.lead': 'Ringkasan capaian restorasi, metrik baseline, dan kontribusi relawan di seluruh wilayah dampingan.',
    'dash.target_springs': 'Target Mata Air',
    'dash.target_springs_desc': 'Kawasan kritis Jawa Tengah & DIY',
    'dash.potential_discharge': 'Potensi Debit Terdata',
    'dash.potential_discharge_desc': 'Kapasitas baseline mata air',
    'dash.beneficiaries': 'Penerima Manfaat',
    'dash.beneficiaries_desc': 'Keluarga dengan akses air bersih stabil',
    'dash.uptime': 'Target Uptime',
    'dash.uptime_desc': 'Keandalan aliran di musim kemarau',
    'dash.audit_summary': 'Standar audit & keselarasan target SDG',
    'dash.flow_tag': 'Alur Data Hidrologi',
    'dash.flow_title': 'Alur validasi data peta mata air BelikHub',
    'dash.sdg_title': 'Protokol pemantauan mata air SDG 6',
    'dash.row1_label': 'Akurasi GPS & Grid Publik',
    'dash.row1_val': '15 meter · 5 km',
    'dash.row2_label': 'Target Uptime Kemarau',
    'dash.row2_val': '95% stabil',

    // Community
    'community.section': '§ 03 — Aktivitas komunitas',
    'community.title': 'Kontribusi kecil untuk mata air.',
    'community.lead': 'Kirim laporan dari lapangan, kumpulkan poin relawan, dan bantu tim memantau kondisi belik secara berkelanjutan.',
    'community.points_title': 'Sistem Poin BelikHub',
    'community.points_desc': 'Poin dikreditkan ke akun Anda setelah laporan diverifikasi oleh tim kurasi. Capai 20.000 poin untuk mengajukan proyek konservasi mandiri.',
    'community.btn_points': 'Rincian poin BelikHub',
    'community.card1_title': 'Survei Mata Air',
    'community.card1_desc': 'Cek kondisi fisik, debit, dan vegetasi sekitar',
    'community.card2_title': 'Restorasi Mata Air',
    'community.card2_desc': 'Pembersihan saluran, bak resapan, atau sedimen',
    'community.card3_title': 'Tanam Pohon Endemik',
    'community.card3_desc': 'Catat spesies bibit dan titik tanam di hulu',
    'community.card4_title': 'Pembangunan Rorak',
    'community.card4_desc': 'Pembuatan parit jebakan air hujan searah kontur',

    // Pulangkan Air
    'rorak.section': '§ 04 — Aksi nyata',
    'rorak.title': 'Pulangkan air hujan lewat rorak.',
    'rorak.lead': 'Rorak adalah parit resapan yang memotong aliran limpasan permukaan (surface runoff), menjebak air hujan agar meresap mengisi kembali akuifer pembentuk mata air. Warga menggali, pemilik lahan memesan, BelikHub mengaudit.',
    'rorak.subtitle': 'Buat rorak di lahan Anda atau jadi tenaga penggali',
    'rorak.desc': 'Setiap 1 unit rorak standar (2m x 0.5m x 0.5m) berpotensi meresapkan hingga 2.000 liter air hujan per musim ke dalam tanah, mencegah erosi tanah pucuk dan banjir bandang hilir.',
    'rorak.btn_order': 'Pesan Rorak (Rp20.000/unit)',
    'rorak.btn_maker': 'Daftar Jadi Pembuat Rorak',
    'rorak.spec_title': 'Spesifikasi Standar Rorak BelikHub',
    'rorak.spec1_label': 'Dimensi lubang',
    'rorak.spec2_label': 'Kapasitas serapan',
    'rorak.spec2_val': '2.000 L / musim',
    'rorak.spec3_label': 'Biaya galian lokal',
    'rorak.spec3_val': 'Rp20.000 / unit',
    'rorak.spec4_label': 'Tanggul hilir',
    'rorak.spec4_val': '15 cm padat',
    'rorak.project_label': 'Proyek Komunitas Berjalan',
    'rorak.project_status': 'Terbuka',
    'rorak.project_title': '100 Rorak untuk Konservasi Belik Soka',
    'rorak.project_desc': 'Membangun benteng resapan air hujan di area bukit kapur untuk menghidupkan kembali mata air Belik Soka.',
    'rorak.btn_support': 'Dukung Proyek Ini',

    // Agenda
    'agenda.section': '§ 05 — Jadwal lapangan',
    'agenda.title': 'Turun ke lapangan bersama warga.',
    'agenda.lead': 'Ikuti aksi akhir pekan bersama relawan lokal. Dari penanaman pohon endemik hingga pembersihan springbox mata air.',
    'agenda.btn_rsvp': 'Daftar Ikut',

    // Kemitraan
    'partner.section': '§ 06 — Kolaborasi institusi',
    'partner.title': 'Bermitra memulihkan mata air.',
    'partner.lead': 'Bekerja sama dengan pemerintah daerah, BUMDes, PDAM, perguruan tinggi, dan korporasi untuk program CSR berdampak jangka panjang.',
    'partner.subtitle': 'Bentuk Kolaborasi BelikHub',
    'partner.form_title': 'Formulir Minat Kemitraan BelikHub',
    'partner.form_desc': 'Sampaikan rencana konservasi air institusi Anda.',
    'partner.label_name': 'Nama Penanggung Jawab',
    'partner.placeholder_name': 'Nama lengkap PIC',
    'partner.label_inst': 'Instansi / Perusahaan',
    'partner.placeholder_inst': 'BUMDes Bismo / PDAM',
    'partner.label_email': 'Email Resmi',
    'partner.placeholder_email': 'nama@instansi.go.id',
    'partner.label_need': 'Kategori Kebutuhan',
    'partner.opt_csr': 'Restorasi Mata Air & Rorak',
    'partner.opt_research': 'Kajian Riset & KKN',
    'partner.opt_pdam': 'Integrasi Data PDAM / Pemda',
    'partner.label_notes': 'Catatan wilayah sasaran',
    'partner.placeholder_notes': 'Sebutkan kabupaten/kecamatan atau target unit rorak',
    'partner.btn_submit': 'Kirim kemitraan BelikHub',

    // Learn
    'learn.section': '05 · Pusat belajar praktis',
    'learn.title': 'Panduan lapangan penjaga mata air.',
    'learn.lead': 'Panduan teknis praktis bersama praktisi hidrologi dan masyarakat adat penjaga sumber air.',
    'learn.tab_courses': 'Kursus',
    'learn.tab_readings': 'Bacaan',
    'learn.tab_agenda': 'Agenda',
    'learn.tab_media': 'Video',
    'learn.c1_title': 'Ekosistem Mata Air & Springshed',
    'learn.c1_desc': 'Uji debit volumetrik, kejernihan air, dan tata cara adat survei di hulu.',
    'learn.c2_title': 'Tanam Pohon Endemik Hulu',
    'learn.c2_desc': 'Pemilihan spesies akar dalam beringin, aren, dan bambu di zona imbuhan.',
    'learn.c3_title': 'Teknik Rorak Resapan Kontur',
    'learn.c3_desc': 'Garis kontur A-frame, penggalian lubang baku, dan perawatan pra-hujan.',
    'learn.r1_title': 'Ekspedisi Tuk Bismo: 200 Sumur & Rorak',
    'learn.r1_desc': 'Bagaimana 200 sumur resapan dan 2.000 pohon menaikkan debit mata air +9,57% di lereng Dieng.',
    'learn.r2_title': 'Wonomerto: Dari Kekeringan ke 4,5 L/s',
    'learn.r2_desc': 'Kilas balik kekeringan 12 bulan di Desa Wonomerto hingga aliran kembali melayani 65 keluarga.',
    'learn.r3_title': 'Memulangkan Air Hujan ke Akuifer',
    'learn.r3_desc': 'Rincian teknis mengapa rorak kontur Rp20.000/unit efektif menekan limpasan erosi di lereng.',
    'learn.r4_title': 'Mengapa Debit Mata Air Menurun?',
    'learn.r4_desc': 'Analisis koefisien infiltrasi tanah di lahan terbuka serta langkah perbaikannya.',
    'learn.a1_title': 'Galian 30 Rorak Lereng Bismo',
    'learn.a1_desc': 'Titik kumpul Balai Desa Bismo, Kec. Blado, Batang · pukul 07.30 WIB.',
    'learn.a2_title': 'Pembersihan Springbox Wonomerto',
    'learn.a2_desc': 'Titik kumpul Mata Air Wonomerto, Kec. Bandar · pukul 08.00 WIB.',
    'learn.a3_title': 'Tanam 250 Bibit Hulu Watulumbung',
    'learn.a3_desc': 'Titik kumpul Desa Tambakboyo, Kec. Reban · pukul 07.00 WIB.',
    'learn.btn_open': 'Buka modul mata air',
    'learn.btn_read_article': 'Baca artikel mata air',
    'learn.btn_read_story': 'Baca kisah mata air',

    // Media
    'media.section': '§ 08 — Dokumentasi audio visual',
    'media.title': 'Kabar & cerita dari lapangan.',
    'media.youtube': 'Kunjungi Kanal YouTube BelikHub',
    'media.video_tag': 'Dokumenter 2026',
    'media.video_title': 'Menghidupkan Kembali Belik Desa yang Sempat Padam',
    'media.video_desc': 'Saksikan bagaimana sinergi warga desa, pemuda, dan tetua adat bahu membahu merestorasi mata air dengan teknik konservasi sederhana berbiaya rendah.',
    'media.video_note': 'Ringkasan naskah dokumenter tersedia melalui tombol bacaan di samping.',
    'media.read_summary': 'Baca Ringkasan Kajian',
    'media.read_interview': 'Baca Wawancara',

    // FAQ
    'faq.label': 'Pertanyaan umum',
    'faq.heading': 'Tanya jawab platform BelikHub',
    'faq.lead': 'Pelindungan koordinat 5 km, poin relawan, dan pengajuan restorasi desa.',
    'faq.q1': 'Mengapa koordinat publik mata air BelikHub disamarkan ke grid 5 km?',
    'faq.a1': 'Koordinat GPS asli dienkripsi agar mata air desa terlindung dari eksploitasi berlebih.',
    'faq.q2': 'Bagaimana sistem poin relawan di platform BelikHub bekerja?',
    'faq.a2': 'Survei 100 poin, tanam 100 poin, rorak 500 poin, restorasi 1.000 poin. Raih 20.000 poin untuk pengajuan restorasi desa.',
    'faq.q3': 'Apakah biaya pembuatan rorak BelikHub disalurkan langsung ke warga?',
    'faq.a3': 'Ya. Kontribusi Rp20.000 per unit disalurkan kepada kelompok penggali lokal bersama pemilik lahan.',
    'faq.q4': 'Bagaimana PDAM atau BUMDes mengakses data mata air BelikHub?',
    'faq.a4': 'Instansi mengajukan kolaborasi data historis lewat formulir kemitraan BelikHub di bawah.',

    // Footer & Actionbar
    'footer.about': 'Perangkat pemetaan komunitas untuk memantau debit, memulihkan belik, dan mencatat aksi warga.',
    'footer.closing_title': 'Jaga mata air desa tetap mengalir.',
    'footer.closing_desc': 'Peta terpadu, parit resapan rorak, dan aksi warga untuk kedaulatan air bersih Nusantara.',
    'footer.closing_cta': 'Jelajahi peta',
    'footer.photo_credit': 'Foto lapangan oleh tim relawan BelikHub, Jawa Tengah dan DIY.',
    'footer.newsletter_title': 'Berlangganan Kabar Pemulihan',
    'footer.newsletter_placeholder': 'Masukkan email Anda',
    'footer.newsletter_btn': 'Daftar kabar BelikHub',
    'footer.explore': 'Jelajahi',
    'footer.community_actions': 'Aksi Komunitas',
    'footer.order_rorak': 'Pemesanan Rorak Tanah',
    'footer.join_maker': 'Pendaftaran Tukang Rorak',
    'footer.csr': 'Program Kemitraan CSR',
    'footer.transparency': 'Transparansi & Info',
    'footer.faq': 'Tanya Jawab (FAQ)',
    'footer.mission': 'Misi & Peta Jalan 2030',
    'footer.privacy': 'Kebijakan Privasi & Data',
    'footer.copyright': '© 2026 BelikHub Indonesia.',
    'actionbar.aria': 'Aksi cepat',
    'actionbar.order': 'Pesan rorak'
  },

  en: {
    'doc.title': 'BelikHub: Community Spring Mapping & Watershed Restoration Platform',
    'doc.desc': 'Community spring mapping platform across Central Java and Yogyakarta: discharge monitoring, 5 km privacy grid, rorak infiltration trenches, and volunteer conservation.',

    // Nav
    'skip.main': 'Skip to content',
    'nav.logo_aria': 'BelikHub Home',
    'nav.main_aria': 'Main navigation',
    'nav.lang_aria': 'Change language',
    'nav.toggle_aria': 'Open navigation menu',
    'nav.theme_aria': 'Toggle light or dark mode',
    'nav.platform': 'Platform',
    'nav.story': 'Vision',
    'nav.impact': 'Impact',
    'nav.map': 'Map',
    'nav.rorak': 'Roraks',
    'nav.order_rorak': 'Order spring rorak',
    'nav.learn': 'Learn',
    'nav.media': 'Field video',
    'nav.community': 'Community',
    'nav.partnership': 'Partners',
    'nav.login': 'Sign In',
    'nav.logout': 'Sign Out',
    'nav.join': 'Join Us',
    'nav.join_action': 'Join Action',

    // Hero
    'hero.tag': 'Central Java & DIY Spring Recovery',
    'hero.title': 'Village spring map tool.',
    'hero.intro': 'Spring flow tracking, 5 km public grid mapping, and contour rorak trenches with upstream villagers.',
    'hero.btn_map': 'Explore map',
    'hero.btn_impact': 'View Verified Impact',
    'hero.btn_action': 'Return Water Action',
    'hero.float_springs_aria': 'Spring network summary',
    'hero.float_grid': '5 km Public Grid',
    'hero.float_springs': '88 springs mapped',
    'hero.float_discharge': '1,350 L/s total flow',
    'hero.float_rorak_aria': 'Rorak infiltration capacity',
    'hero.float_rorak_label': 'Standard Rorak',
    'hero.float_rorak_val': '2,000 L / season',

    // Visi
    'visi.section': 'Source to stream vision',
    'visi.title': 'Source to stream spring platform.',
    'visi.p1': 'When mountain spring flow shrinks,',
    'visi.strong': 'village drinking water runs dry.',
    'visi.p2': 'BelikHub maps critical springs, plants upstream cover, and digs rorak trenches alongside locals.',
    'visi.desc': 'Village belik springs feed farms and households across Indonesia. When discharge declines, farmers lose irrigation and families lack clean water. BelikHub restores flow through tracked field actions.',
    'visi.btn_volunteer': 'Join as a Volunteer',
    'visi.btn_roadmap': 'Explore 2030 Roadmap',
    'visi.stat1_dt': 'Target Springs',
    'visi.stat1_dd': '88 springs',
    'visi.stat2_dt': 'Potential Flow',
    'visi.stat3_dt': 'Beneficiaries',
    'visi.stat3_dd': '2,500+ families',
    'visi.stat4_dt': 'Community Led',
    'visi.step1_label': '01 · Public grid mapping',
    'visi.step1_val': '5 km radius',
    'visi.step2_label': '02 · Rorak infiltration trench',
    'visi.step2_val': '2,000 L / unit',
    'visi.step3_label': '03 · Annual discharge audit',
    'visi.step3_val': 'Central Java & DIY',

    // Home Impact
    'impact.tag': 'Measurable Impact',
    'impact.title': 'Every small action creates lasting change.',
    'impact.lead': 'Live data verified by field teams, local communities, and water managers.',
    'impact.verified': 'Verified Reports',
    'impact.verified_desc': 'Validation of surveys, restorations, planting, and roraks.',
    'impact.restoration': 'Restoration Sites',
    'impact.restoration_desc': 'Sediment dredging & springbox rehabilitation.',
    'impact.trees': 'Trees Planted',
    'impact.trees_desc': 'Deep-rooted native saplings across springsheds.',
    'impact.rorak': 'Roraks Dug',
    'impact.rorak_desc': 'Trapping surface runoff to recharge underground aquifers.',
    'impact.unit_reports': 'reports',
    'impact.unit_springs': 'springs',
    'impact.unit_trees': 'trees',
    'impact.unit_units': 'units',
    'impact.status_loading': 'Loading impact metrics…',
    'impact.status_ready': 'Data verified from field reports & community hydrology tasks.',

    // Home Stories
    'stories.tag': '§ Field Stories — Witnesses of Restoration',
    'stories.title': 'Restoration seen up close.',
    'stories.lead': 'From Tuk Bismo on Mount Dieng to Wonomerto in Batang, hear from villagers whose springs have begun flowing abundantly once again.',
    'stories.btn_all': 'Explore all stories & publications',
    'stories.btn_read': 'Read Full Story',
    'stories.btn_guide': 'Read Practical Guide',

    // Home Links
    'links.transparency': 'Transparency',
    'links.report_title': 'Impact Reports',
    'links.report_desc': 'Explore aggregate metrics, field audits, and SDG alignment.',
    'links.geospatial': 'Geospatial',
    'links.map_title': 'Interactive Map',
    'links.map_desc': 'Track spring flow, rehabilitation status, and field reports.',
    'links.participation': 'Participation',
    'links.community_title': 'Community & Points',
    'links.community_desc': 'Submit field surveys, log planting, earn volunteer points.',

    // Map
    'map.section': '§ 01 — Unified Spring Map',
    'map.title': 'Monitor springs on the live map.',
    'map.lead': 'Explore baseline spring data (RISPAM & Regional Government) alongside verified grassroots reports. Public coordinates are snapped to ~5 km grids to protect springs from illegal over-extraction.',
    'map.canvas_aria': 'BelikHub interactive spring distribution map',
    'map.search_label': 'Search springs, villages, or activities',
    'map.search_placeholder': 'e.g. Tuk Bismo, Wonomerto, Batang, Dieng…',
    'map.filter_label': 'Filter Category',
    'map.filter_all': 'All Points (Springs & Reports)',
    'map.filter_springs_all': 'All Baseline Springs',
    'map.filter_springs_active': 'Spring: Active',
    'map.filter_springs_rehab': 'Spring: Rehabilitation',
    'map.filter_survey': 'Report: Field Survey',
    'map.filter_restoration': 'Report: Spring Restoration',
    'map.filter_planting': 'Report: Tree Planting',
    'map.filter_rorak': 'Report: Rorak Construction',
    'map.btn_locate': 'My Location',
    'map.btn_refresh': 'Refresh Map Data',
    'map.legend_active': 'Active Spring',
    'map.legend_rehab': 'Rehabilitation',
    'map.legend_restoration': 'Restoration',
    'map.legend_planting': 'Planting',
    'map.legend_rorak': 'Rorak Trench',
    'map.grid_status': '5km Grid Snapping Protocol Active',

    // Dashboard
    'dash.section': 'Real Impact — Transparent Milestones',
    'dash.title': 'Measurable spring recovery impact.',
    'dash.lead': 'Summary of ecological restoration, baseline metrics, and volunteer contributions across all assisted regions.',
    'dash.target_springs': 'Target Springs',
    'dash.target_springs_desc': 'Critical zones across Central Java & DIY',
    'dash.potential_discharge': 'Recorded Potential Flow',
    'dash.potential_discharge_desc': 'Baseline spring capacity',
    'dash.beneficiaries': 'Beneficiary Families',
    'dash.beneficiaries_desc': 'Households with secure, reliable clean water',
    'dash.uptime': 'Target Uptime',
    'dash.uptime_desc': 'Flow reliability during peak dry seasons',
    'dash.audit_summary': 'Audit standards & SDG target alignment',
    'dash.flow_tag': 'Hydrological Data Flow',
    'dash.flow_title': 'BelikHub spring map validation workflow',
    'dash.sdg_title': 'SDG 6 spring monitoring protocol',
    'dash.row1_label': 'GPS Accuracy & Public Grid',
    'dash.row1_val': '15 meters · 5 km',
    'dash.row2_label': 'Dry-Season Uptime Target',
    'dash.row2_val': '95% stable',

    // Community
    'community.section': '§ 03 — Community Activities',
    'community.title': 'Small actions for village springs.',
    'community.lead': 'Submit field data, accumulate volunteer points, and help our team monitor rural springs sustainably.',
    'community.points_title': 'BelikHub Points System',
    'community.points_desc': 'Points are credited once your report is approved by field curators. Reach 20,000 points to sponsor your own village spring project.',
    'community.btn_points': 'View Points Breakdown',
    'community.card1_title': 'Spring Survey',
    'community.card1_desc': 'Check physical clarity, water flow, and surrounding vegetation',
    'community.card2_title': 'Spring Restoration',
    'community.card2_desc': 'Clean silt buildup, catchment channels, or springboxes',
    'community.card3_title': 'Plant Native Trees',
    'community.card3_desc': 'Log deep-root sapling species and GPS coordinates in recharge zones',
    'community.card4_title': 'Build Rorak Trench',
    'community.card4_desc': 'Dig contour infiltration trenches to recharge groundwater',

    // Pulangkan Air
    'rorak.section': '§ 04 — Real Action',
    'rorak.title': 'Return rainwater via rorak trenches.',
    'rorak.lead': 'Roraks are contour infiltration trenches that intercept surface runoff, trapping rainwater so it seeps down to feed spring aquifers. Villagers dig, landowners order, BelikHub verifies.',
    'rorak.subtitle': 'Build trenches on your land or join as a paid digger',
    'rorak.desc': 'A standard 1-unit rorak (2m x 0.5m x 0.5m) infiltrates up to 2,000 liters of rainwater per season into the soil, halting topsoil erosion and downstream flash floods.',
    'rorak.btn_order': 'Order Roraks (Rp20,000/unit)',
    'rorak.btn_maker': 'Register as a Rorak Digger',
    'rorak.spec_title': 'BelikHub Standard Rorak Specifications',
    'rorak.spec1_label': 'Trench dimensions',
    'rorak.spec2_label': 'Infiltration capacity',
    'rorak.spec2_val': '2,000 L / season',
    'rorak.spec3_label': 'Local digging fee',
    'rorak.spec3_val': 'Rp20,000 / unit',
    'rorak.spec4_label': 'Downslope berm',
    'rorak.spec4_val': '15 cm compacted',
    'rorak.project_label': 'Ongoing Community Project',
    'rorak.project_status': 'Open',
    'rorak.project_title': '100 Roraks for Belik Soka Conservation',
    'rorak.project_desc': 'Building groundwater retention trenches in limestone hills to revive the dried Belik Soka spring.',
    'rorak.btn_support': 'Support This Project',

    // Agenda
    'agenda.section': '§ 05 — Field Schedules',
    'agenda.title': 'Join villagers on the ground.',
    'agenda.lead': 'Take part in weekend volunteer actions. From planting native saplings to deep cleaning stone springboxes.',
    'agenda.btn_rsvp': 'Sign Up to Join',

    // Kemitraan
    'partner.section': '§ 06 — Institutional Collaboration',
    'partner.title': 'Partner to restore village springs.',
    'partner.lead': 'Collaborating with local governments, village enterprises (BUMDes), municipal water utilities (PDAM), universities, and CSR programs for long-term impact.',
    'partner.subtitle': 'BelikHub Collaboration Pillars',
    'partner.form_title': 'Partnership Inquiry Form',
    'partner.form_desc': 'Share your institution’s water conservation goals or plans.',
    'partner.label_name': 'Contact Person Name',
    'partner.placeholder_name': 'PIC full name',
    'partner.label_inst': 'Organization / Company',
    'partner.placeholder_inst': 'BUMDes Bismo / PDAM',
    'partner.label_email': 'Official Work Email',
    'partner.placeholder_email': 'name@institution.go.id',
    'partner.label_need': 'Partnership Category',
    'partner.opt_csr': 'Spring & Rorak Restoration',
    'partner.opt_research': 'Research & University Service',
    'partner.opt_pdam': 'PDAM / Municipal Data Integration',
    'partner.label_notes': 'Target area notes',
    'partner.placeholder_notes': 'List regency/district or target rorak units',
    'partner.btn_submit': 'Submit Partnership Inquiry',

    // Learn
    'learn.section': '05 · Practical Learning Hub',
    'learn.title': 'Field guides for spring guardians.',
    'learn.lead': 'Practical field guides prepared alongside hydrogeologists and indigenous water guardians.',
    'learn.tab_courses': 'Courses',
    'learn.tab_readings': 'Readings',
    'learn.tab_agenda': 'Agenda',
    'learn.tab_media': 'Video',
    'learn.c1_title': 'Spring Ecosystems & Springsheds',
    'learn.c1_desc': 'Volumetric flow testing, water clarity checks, and customary upstream survey etiquette.',
    'learn.c2_title': 'Planting Native Upstream Trees',
    'learn.c2_desc': 'Selecting deep-root banyan, sugar palm, and bamboo species across recharge zones.',
    'learn.c3_title': 'Contour Infiltration Rorak Technique',
    'learn.c3_desc': 'A-frame contour staking, standard pit excavation, and pre-monsoon silt maintenance.',
    'learn.r1_title': 'Tuk Bismo Expedition: 200 Wells & Roraks',
    'learn.r1_desc': 'How 200 infiltration wells and 2,000 trees raised spring flow +9.57% on Dieng slopes.',
    'learn.r2_title': 'Wonomerto: From Drought to 4.5 L/s',
    'learn.r2_desc': 'A 12-month drought turnaround in Wonomerto Village restoring water for 65 families.',
    'learn.r3_title': 'Returning Rainwater to Aquifers',
    'learn.r3_desc': 'Technical breakdown of why Rp20,000 contour roraks effectively cut slope erosion runoff.',
    'learn.r4_title': 'Why Are Spring Flows Declining?',
    'learn.r4_desc': 'Soil infiltration loss analysis on cleared slopes and practical community fixes.',
    'learn.a1_title': 'Digging 30 Roraks on Bismo Slope',
    'learn.a1_desc': 'Meeting point: Bismo Village Hall, Blado, Batang · 07:30 WIB.',
    'learn.a2_title': 'Wonomerto Springbox Cleanup',
    'learn.a2_desc': 'Meeting point: Wonomerto Spring, Bandar · 08:00 WIB.',
    'learn.a3_title': 'Planting 250 Seedlings at Watulumbung',
    'learn.a3_desc': 'Meeting point: Tambakboyo Village, Reban · 07:00 WIB.',
    'learn.btn_open': 'Open spring module',
    'learn.btn_read_article': 'Read Full Article',
    'learn.btn_read_story': 'Read Full Story',

    // Media
    'media.section': '§ 08 — Audiovisual Documentation',
    'media.title': 'Stories & news from the field.',
    'media.youtube': 'Visit BelikHub YouTube Channel',
    'media.video_tag': '2026 Documentary',
    'media.video_title': 'Reviving Extinguished Village Springs',
    'media.video_desc': 'Witness how villagers, youth volunteers, and village elders join forces to restore springs using low-cost, high-impact conservation methods.',
    'media.video_note': 'Documentary transcript summaries are available via the reading buttons alongside.',
    'media.read_summary': 'Read Research Summary',
    'media.read_interview': 'Read Elder Interview',

    // FAQ
    'faq.label': 'Frequently asked',
    'faq.heading': 'Questions on the BelikHub platform.',
    'faq.lead': '5 km coordinate protection, volunteer points, and village restoration proposals.',
    'faq.q1': 'Why are public BelikHub spring coordinates fuzzed to a 5 km grid?',
    'faq.a1': 'Exact GPS coordinates stay encrypted so village springs remain protected from over-extraction.',
    'faq.q2': 'How does the volunteer points system work on BelikHub?',
    'faq.a2': 'Survey 100 pts, tree planting 100 pts, rorak 500 pts, restoration 1,000 pts. Reach 20,000 pts to propose a village restoration.',
    'faq.q3': 'Do rorak construction fees go directly to local villagers?',
    'faq.a3': 'Yes. The Rp20,000/unit fee goes directly to local village digger groups and participating landowners.',
    'faq.q4': 'How can PDAMs or BUMDes access BelikHub spring records?',
    'faq.a4': 'Institutions can request historical discharge collaborations via the BelikHub partnership form below.',

    // Footer & Actionbar
    'footer.about': 'Community mapping software for flow tracking, belik conservation, and villager field actions.',
    'footer.closing_title': 'Keep rural water springs flowing.',
    'footer.closing_desc': 'Unified mapping, rorak infiltration trenches, and community action for rural clean-water sovereignty.',
    'footer.closing_cta': 'Explore map',
    'footer.photo_credit': 'Field photography by BelikHub volunteers, Central Java and DIY.',
    'footer.newsletter_title': 'Subscribe to Field Updates',
    'footer.newsletter_placeholder': 'Enter your email address',
    'footer.newsletter_btn': 'Subscribe',
    'footer.explore': 'Explore',
    'footer.community_actions': 'Community Actions',
    'footer.order_rorak': 'Soil Rorak Trench Orders',
    'footer.join_maker': 'Digger Taskforce Registration',
    'footer.csr': 'Institutional CSR Programs',
    'footer.transparency': 'Transparency & Info',
    'footer.faq': 'Frequently Asked Questions (FAQ)',
    'footer.mission': 'Mission & 2030 Roadmap',
    'footer.privacy': 'Privacy & Data Protection',
    'footer.copyright': '© 2026 BelikHub Indonesia.',
    'actionbar.aria': 'Quick actions',
    'actionbar.order': 'Order roraks'
  }
};

let currentLanguage = 'id';

const setLanguage = (lang, showToast = false) => {
  currentLanguage = lang === 'en' ? 'en' : 'id';
  const dict = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;

  if (showToast || currentLanguage !== 'id') {
    if (dict['doc.title']) document.title = dict['doc.title'];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict['doc.desc']) metaDesc.setAttribute('content', dict['doc.desc']);

    const wh = $('#visi .mo-wh__text');
    if (wh && dict['visi.p1']) {
      wh.innerHTML = `<span data-i18n="visi.p1">${escapeHtml(dict['visi.p1'])}</span> <strong data-i18n="visi.strong">${escapeHtml(dict['visi.strong'])}</strong> <span data-i18n="visi.p2">${escapeHtml(dict['visi.p2'])}</span>`;
      wh.closest('.mo-wh')?.classList.add('is-done');
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) el.placeholder = dict[key];
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.dataset.i18nAriaLabel;
      if (dict[key]) el.setAttribute('aria-label', dict[key]);
    });

    document.querySelectorAll('.dg-pause').forEach((btn) => {
      const paused = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-label', currentLanguage === 'en'
        ? (paused ? 'Play animation' : 'Pause animation')
        : (paused ? 'Putar animasi' : 'Jeda animasi'));
    });

    window.__belikhubRenderMap?.();
  }

  // Update Language toggle labels & dropdown checkmarks
  const label = currentLanguage.toUpperCase();
  $$('.lang-text').forEach((el) => { el.textContent = label; });

  $$('.lang-check-id').forEach((el) => {
    el.hidden = currentLanguage !== 'id';
    el.classList.toggle('hidden', currentLanguage !== 'id');
  });
  $$('.lang-check-en').forEach((el) => {
    el.hidden = currentLanguage !== 'en';
    el.classList.toggle('hidden', currentLanguage !== 'en');
  });

  // Close Dropdown & reset expanded state
  $('#language-menu-desktop')?.classList.remove('open');
  $('#lang-toggle')?.setAttribute('aria-expanded', 'false');

  localStorage.setItem('belikhub-language', currentLanguage);

  if (showToast) {
    toast(currentLanguage === 'en' ? 'Language switched to English.' : 'Bahasa diubah ke Bahasa Indonesia.');
  }
};

// Dropdown Toggle Handler
const langToggle = $('#lang-toggle');
const langMenu = $('#language-menu-desktop');
langToggle?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const isOpen = langMenu?.classList.toggle('open');
  langToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// Click outside closes dropdown
document.addEventListener('click', (e) => {
  if (!e.target.closest('#lang-toggle') && !e.target.closest('#language-menu-desktop')) {
    langMenu?.classList.remove('open');
    langToggle?.setAttribute('aria-expanded', 'false');
  }
});

// Language Options Selection
$$('[data-language]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLanguage(btn.dataset.language, true);
  });
});

// Initialize Language on Load
setLanguage(localStorage.getItem('belikhub-language') || 'id', false);

// Dark / Night Mode Theme Engine
// =========================================================================
const themeMeta = $('meta[name="theme-color"]');
const getStoredTheme = () => {
  const stored = localStorage.getItem('belikhub-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme, showToast = false) => {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.dataset.tone = isDark ? 'dark' : 'light';

  if (themeMeta) {
    themeMeta.setAttribute('content', isDark ? '#0c131a' : '#f7f9fa');
  }

  $$('.theme-toggle-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    const isEn = currentLanguage === 'en';
    btn.setAttribute('aria-label', isDark
      ? (isEn ? 'Switch to light mode' : 'Beralih ke mode terang')
      : (isEn ? 'Switch to dark mode' : 'Beralih ke mode gelap'));
    btn.setAttribute('title', isDark
      ? (isEn ? 'Switch to light mode' : 'Beralih ke mode terang')
      : (isEn ? 'Switch to dark mode' : 'Beralih ke mode gelap'));
  });

  const heroBg = $('#hero .bh-hero-layer');
  if (heroBg) {
    heroBg.setAttribute('src', isDark ? 'images/bg-hero-night.jpg' : 'images/bg-hero-mist.jpg');
  }

  const topoImg = $('#kemitraan .bh-photo-frame--topo img');
  if (topoImg) {
    topoImg.setAttribute('src', isDark ? 'images/topo-dark.webp' : 'images/topo-light.webp');
  }

  localStorage.setItem('belikhub-theme', isDark ? 'dark' : 'light');

  if (showToast) {
    const isEn = currentLanguage === 'en';
    toast(isDark
      ? (isEn ? 'Dark mode enabled.' : 'Mode gelap diaktifkan.')
      : (isEn ? 'Light mode enabled.' : 'Mode terang diaktifkan.'));
  }
};

$$('.theme-toggle-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  });
});

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('belikhub-theme')) {
      applyTheme(e.matches ? 'dark' : 'light', false);
    }
  });
}

applyTheme(getStoredTheme(), false);

// Video fallback handling
const mediaVideo = $('#media video');
if (mediaVideo) {
  const hideMediaFallback = () => mediaVideo.classList.add('media-video-ready');
  mediaVideo.addEventListener('loadeddata', hideMediaFallback, { once: true });
  if (mediaVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) hideMediaFallback();
}

// Accessible Modal System with Focus Management & Trap
const modal = $('#modal');
const modalContent = $('#modal-content');
let lastModalTrigger = null;

const getModalFocusable = () => {
  if (!modal) return [];
  return [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
};

const closeModal = () => {
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (modalContent) modalContent.innerHTML = '';
  if (lastModalTrigger && typeof lastModalTrigger.focus === 'function' && document.contains(lastModalTrigger)) {
    lastModalTrigger.focus();
  }
  lastModalTrigger = null;
};

const openModal = (title, bodyHtml, isLarge = false) => {
  if (!modal || !modalContent) return;
  if (!modal.classList.contains('open')) {
    lastModalTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  const card = modal.querySelector('.modal-card') || modalContent;
  card.classList.toggle('modal-card-lg', isLarge);
  modalContent.innerHTML = `
    <div class="bh-modal-head">
      <div>
        <p class="label c-accent">${currentLanguage === 'en' ? 'BelikHub · Field Platform' : 'BelikHub · Platform Lapangan'}</p>
        <h2 id="modal-title" class="bh-modal-title">${escapeHtml(title)}</h2>
      </div>
      <button type="button" data-close-modal class="nav-btn bh-close-btn" aria-label="${currentLanguage === 'en' ? 'Close' : 'Tutup'}">&times;</button>
    </div>
    <div class="bh-modal-body">${bodyHtml}</div>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelectorAll('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeModal));
  const focusTarget = modal.querySelector('input, select, textarea, [data-close-modal], button');
  requestAnimationFrame(() => focusTarget?.focus());
};

modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (!modal?.classList.contains('open')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key === 'Tab') {
    const focusable = getModalFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Auth & Lazy Firebase Setup
let auth = null;
let fbAuthApi = null;
let fbInitPromise = null;
let currentUser = null;
let userProfileData = { points: 0, role: 'user' };

const loginBtns = $$('#login-btn, #login-btn-mobile');
const logoutBtns = $$('#logout-btn, #logout-btn-mobile');
const userBadges = $$('#user-badge, #user-badge-mobile');
const userDisplayNames = $$('#user-display-name, #user-display-name-mobile');
const userPointsBadges = $$('#user-points-badge, #user-points-badge-mobile');

const updateAuthUI = async (user) => {
  currentUser = user;
  if (user) {
    loginBtns.forEach((b) => b.classList.add('hidden'));
    userBadges.forEach((b) => b.classList.remove('hidden'));
    const name = user.displayName || user.email?.split('@')[0] || (currentLanguage === 'en' ? 'Volunteer' : 'Relawan');
    userDisplayNames.forEach((el) => { el.textContent = name; });

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        userProfileData = data;
        userPointsBadges.forEach((el) => {
          el.textContent = `${Number(data.points || 0).toLocaleString('id-ID')} pts`;
        });
      }
    } catch {
      userPointsBadges.forEach((el) => { el.textContent = '100 pts'; });
    }
  } else {
    loginBtns.forEach((b) => b.classList.remove('hidden'));
    userBadges.forEach((b) => b.classList.add('hidden'));
  }
};

const ensureFirebase = () => {
  if (auth && fbAuthApi) return Promise.resolve({ auth, ...fbAuthApi });
  if (fbInitPromise) return fbInitPromise;
  fbInitPromise = (async () => {
    try {
      const res = await fetch('/api/firebase-config');
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`HTTP ${res.status}`);
      }
      const cfg = await res.json();
      const [appMod, authMod] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js')
      ]);
      const app = appMod.initializeApp(cfg);
      auth = authMod.getAuth(app);
      fbAuthApi = authMod;
      authMod.onAuthStateChanged(auth, (user) => updateAuthUI(user));
      return { auth, ...authMod };
    } catch (err) {
      console.warn('Firebase init warning:', err);
      fbInitPromise = null;
      return null;
    }
  })();
  return fbInitPromise;
};

// Restore active Firebase session automatically if already signed in before
try {
  if (Object.keys(localStorage).some((k) => k.startsWith('firebase:authUser'))) {
    ensureFirebase();
  }
} catch { /* ignore storage errors */ }

// API Helper
const apiRequest = async (path, payload, options = {}) => {
  const needsAuth = options.auth !== false;
  const headers = { 'Content-Type': 'application/json' };
  if (needsAuth) {
    const user = currentUser || auth?.currentUser;
    if (!user) throw new Error(currentLanguage === 'en' ? 'Please sign in first.' : 'Silakan masuk (login) terlebih dahulu.');
    headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
  }
  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : {};
  if (!isJson && !response.ok) {
    throw new Error(currentLanguage === 'en'
      ? 'Backend API unavailable in static preview.'
      : 'Layanan backend belum tersedia pada pratinjau lokal ini.');
  }
  if (!response.ok) {
    throw new Error(data.error || (currentLanguage === 'en' ? 'Request failed' : 'Permintaan gagal diproses'));
  }
  if (!isJson) {
    throw new Error(currentLanguage === 'en'
      ? 'Unexpected server response format.'
      : 'Format respons server tidak sesuai.');
  }
  return data;
};

// Login / Register Modal
const openLoginModal = () => {
  ensureFirebase();

  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'Volunteer Account Sign In' : 'Masuk ke Akun Relawan',
    `
    <form id="auth-form" class="bh-modal-stack">
      <p class="bh-modal-note">${isEn ? 'Sign in to submit field reports, order roraks, and track your volunteer contribution points.' : 'Masuk untuk mencatat laporan lapangan, memesan rorak, dan memantau poin kontribusi Anda.'}</p>
      <div class="field">
        <label for="auth-email">Email</label>
        <input id="auth-email" required type="email" name="email" autocomplete="email" placeholder="nama@email.com" />
      </div>
      <div class="field">
        <label for="auth-password">Password</label>
        <input id="auth-password" name="password" required minlength="6" type="password" autocomplete="current-password" placeholder="••••••••" />
      </div>
      <div class="bh-modal-stack">
        <button id="auth-submit-btn" class="btn btn-teal" type="submit">${isEn ? 'Sign In' : 'Masuk'}</button>
        <button id="auth-register-btn" class="btn btn-line" type="button">${isEn ? 'Register New Volunteer Account' : 'Daftar Akun Relawan Baru'}</button>
      </div>
    </form>
    `
  );

  const form = $('#auth-form');
  if (!form) return;

  const runAuth = async (methodKey, label, btn) => {
    const data = new FormData(form);
    if (!form.reportValidity()) return;
    btn.disabled = true;
    btn.textContent = isEn ? 'Processing…' : 'Memproses…';
    try {
      const fb = await ensureFirebase();
      if (!fb || !fb[methodKey]) {
        throw new Error(isEn ? 'Authentication service unavailable in local static preview.' : 'Layanan autentikasi belum aktif di pratinjau lokal.');
      }
      const cred = await fb[methodKey](fb.auth, data.get('email'), data.get('password'));
      closeModal();
      toast(isEn ? `Welcome back, ${cred.user.displayName || cred.user.email.split('@')[0]}!` : `Selamat datang kembali, ${cred.user.displayName || cred.user.email.split('@')[0]}!`);
    } catch (error) {
      btn.disabled = false;
      btn.textContent = label;
      const msg =
        error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found'
          ? (isEn ? 'Incorrect email or password, or account not yet registered.' : 'Email atau password salah, atau akun belum terdaftar.')
          : error.code === 'auth/email-already-in-use'
          ? (isEn ? 'This email is already registered. Please choose Sign In.' : 'Email ini sudah terdaftar. Silakan pilih "Masuk".')
          : error.message;
      toast(msg);
    }
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    runAuth('signInWithEmailAndPassword', isEn ? 'Sign In' : 'Masuk', $('#auth-submit-btn'));
  });
  $('#auth-register-btn')?.addEventListener('click', (ev) => {
    runAuth('createUserWithEmailAndPassword', isEn ? 'Register' : 'Daftar', ev.currentTarget);
  });
};

loginBtns.forEach((btn) => btn.addEventListener('click', (e) => {
  e.preventDefault();
  openLoginModal();
}));
logoutBtns.forEach((btn) =>
  btn.addEventListener('click', async () => {
    try {
      const fb = await ensureFirebase();
      if (fb?.auth) await fb.signOut(fb.auth);
      updateAuthUI(null);
      toast(currentLanguage === 'en' ? 'You have signed out.' : 'Anda telah keluar.');
    } catch (e) {
      toast(e.message);
    }
  })
);

// User Profile Modal
const openUserProfileModal = () => {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const isEn = currentLanguage === 'en';
  const email = currentUser.email || '—';
  const name = currentUser.displayName || email.split('@')[0];
  const pts = Number(userProfileData.points || 0);
  const role = userProfileData.role || 'user';

  openModal(
    isEn ? 'Water Volunteer Profile' : 'Profil Relawan Mata Air',
    `
    <div class="bh-modal-stack">
      <div class="bh-modal-box bh-modal-box--tint bh-modal-profile">
        <div class="bh-modal-avatar">${escapeHtml(name.charAt(0).toUpperCase())}</div>
        <div>
          <h3 class="bh-modal-subtitle">${escapeHtml(name)}</h3>
          <p class="bh-modal-note">${escapeHtml(email)}</p>
          <span class="bh-status-pill">${role === 'admin' ? (isEn ? 'Admin' : 'Pengurus Admin') : (isEn ? 'Registered Volunteer' : 'Relawan Terdaftar')}</span>
        </div>
      </div>

      <div class="bh-modal-grid">
        <div class="bh-modal-box bh-modal-center">
          <p class="label c-accent">${isEn ? 'Accumulated Points' : 'Poin Terkumpul'}</p>
          <p class="bh-modal-stat">${pts.toLocaleString('id-ID')}</p>
          <p class="bh-modal-note">${isEn ? 'Verified points' : 'Poin diverifikasi'}</p>
        </div>
        <div class="bh-modal-box bh-modal-center">
          <p class="label c-accent">${isEn ? 'Community Target' : 'Target Mandiri'}</p>
          <p class="bh-modal-stat">20.000</p>
          <p class="bh-modal-note">${isEn ? 'To sponsor a spring' : 'Untuk buka proyek'}</p>
        </div>
      </div>

      <div class="bh-modal-box">
        <p class="label c-accent">${isEn ? 'Activity Guide' : 'Panduan Aktivitas'}</p>
        <p class="bh-modal-note">${isEn ? 'Every field survey earns +100 points, building roraks earns +500 points, and restoring springs earns +1,000 points. Please ensure GPS coordinates are attached during surveys.' : 'Setiap survei lapangan bernilai +100 poin, pembangunan rorak +500 poin, dan restorasi mata air +1.000 poin. Pastikan melampirkan koordinat GPS saat survei.'}</p>
      </div>

      <button id="profile-logout-btn" class="btn btn-line" type="button">${isEn ? 'Sign Out of Account' : 'Keluar dari Akun'}</button>
    </div>
    `
  );

  $('#profile-logout-btn')?.addEventListener('click', async () => {
    closeModal();
    const fb = await ensureFirebase();
    if (fb?.auth) await fb.signOut(fb.auth);
    updateAuthUI(null);
    toast(currentLanguage === 'en' ? 'You have signed out.' : 'Anda telah keluar.');
  });
};
$$('#user-profile-btn, #user-profile-btn-mobile').forEach((btn) =>
  btn.addEventListener('click', openUserProfileModal)
);

// Impact Stats Loader
const impactStats = $$('[data-impact-stat]');
const impactStatus = $$('#home-impact-status, #dashboard-impact-status');
const applyImpactValues = (values) => {
  impactStats.forEach((el) => {
    const key = el.dataset.impactStat;
    if (values[key] !== undefined) {
      el.textContent = values[key].toLocaleString('id-ID');
    }
  });
};
const loadImpactStats = async () => {
  const isEn = currentLanguage === 'en';
  const fallback = { totalApproved: 48, restoration: 16, planting: 1800, rorak: 142 };
  applyImpactValues(fallback);
  try {
    const res = await fetch('/api/stats');
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Status ${res.status}`);
    }
    const stats = await res.json();
    const byType = stats.byType || {};

    applyImpactValues({
      totalApproved: stats.totalApproved ?? 48,
      restoration: byType['Restorasi Mata Air'] ?? 16,
      planting: byType['Penanaman Pohon'] ?? 1800,
      rorak: byType['Pembangunan Rorak'] ?? 142
    });
    impactStatus.forEach((s) => {
      s.textContent = isEn ? 'Data verified from field reports & community hydrology tasks.' : 'Data diverifikasi dari laporan lapangan & satgas hidrologi komunitas.';
    });
  } catch {
    impactStatus.forEach((s) => {
      s.textContent = isEn ? 'Displaying verified community baseline metrics.' : 'Menampilkan metrik baseline terverifikasi komunitas.';
    });
  }
};
loadImpactStats();

document.addEventListener('keydown', (e) => {
  const trigger = e.target.closest('a[role="button"]');
  if (trigger && (e.key === ' ' || e.key === 'Spacebar')) {
    e.preventDefault();
    trigger.click();
  }
});

// Interactive Map System
let belikhubMap = null;
let springPoints = [...SPRINGS];
let reportPoints = [];
let mapMarkers = [];
let mapRings = [];

const initMap = async () => {
  if (!window.L) return;
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;

  belikhubMap = L.map('map-canvas', {
    preferCanvas: false,
    scrollWheelZoom: true,
    zoomAnimation: !prefersReducedMotion(),
    fadeAnimation: !prefersReducedMotion(),
    attributionControl: false
  }).setView([-7.09, 109.76], 11);
  window.belikhubMap = belikhubMap;

  let tileErrorCount = 0;
  const osmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin: false
  }).addTo(belikhubMap);

  osmTiles.on('tileload', () => {
    tileErrorCount = 0;
  });
  osmTiles.on('tileerror', () => {
    tileErrorCount += 1;
    if (tileErrorCount >= 4) {
      const statusEl = $('#map-status');
      const isEn = currentLanguage === 'en';
      if (statusEl) {
        statusEl.textContent = isEn
          ? `Displaying ${mapMarkers.length} mapped points (offline topographic grid active).`
          : `Menampilkan ${mapMarkers.length} titik terpetakan (mode grid topografi offline).`;
      }
    }
  });

  const attrControl = L.control({ position: 'bottomright' });
  attrControl.onAdd = () => {
    const div = L.DomUtil.create('div', 'leaflet-control-attribution');
    div.textContent = 'Peta: Leaflet · © OpenStreetMap';
    return div;
  };
  attrControl.addTo(belikhubMap);

  setTimeout(() => belikhubMap.invalidateSize(), 250);
  window.addEventListener('resize', () => belikhubMap.invalidateSize());
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => belikhubMap.invalidateSize()).observe(canvas);
  }

  const renderAllMarkers = () => {
    mapMarkers.forEach((m) => m.remove());
    mapRings.forEach((c) => c.remove());
    mapMarkers = [];
    mapRings = [];

    const isEn = currentLanguage === 'en';
    const filter = $('#map-filter')?.value || 'all';
    const query = ($('#map-search')?.value || '').trim().toLowerCase();

    // 1. Process Springs
    springPoints.forEach((s) => {
      const matchesFilter =
        filter === 'all' ||
        filter === 'springs_all' ||
        (filter === 'springs_active' && s.status === 'active') ||
        (filter === 'springs_rehab' && s.status === 'rehabilitation');

      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.village && s.village.toLowerCase().includes(query)) ||
        (s.district && s.district.toLowerCase().includes(query)) ||
        (s.regency && s.regency.toLowerCase().includes(query));

      if (matchesFilter && matchesQuery && s.coordinates_public) {
        const isActive = s.status === 'active';
        const pinColor = isActive ? '#0d7480' : '#b45309';
        const pinLabel = `${s.name} — ${s.village || ''}`;
        const icon = L.divIcon({
          className: 'custom-pin',
          html: `<span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px"><span style="display:block;width:14px;height:14px;background:${pinColor};border:2px solid #fff;outline:2px solid #1f3038;transform:rotate(45deg);border-radius:2px"></span></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const popup = document.createElement('div');
        popup.className = 'bh-popup';
        popup.innerHTML = `
          <div class="bh-popup__head">
            <span class="bh-status-pill ${isActive ? '' : 'bh-status-pill--warn'}">${isActive ? (isEn ? 'Active Spring' : 'Mata Air Aktif') : (isEn ? 'Under Rehabilitation' : 'Dalam Rehabilitasi')}</span>
            <h3 class="bh-popup__title">${escapeHtml(s.name)}</h3>
            <p class="bh-popup__loc">${escapeHtml([s.village, s.district, s.regency].filter(Boolean).join(', '))}</p>
          </div>
          <div class="bh-popup__stats">
            <div>
              <span class="label">${isEn ? 'Baseline Discharge' : 'Debit Baseline'}</span>
              <strong>${escapeHtml(s.baseline_discharge_lps || '—')} L/s</strong>
            </div>
            <div>
              <span class="label">${isEn ? 'Beneficiaries' : 'Penerima'}</span>
              <strong>${escapeHtml(s.beneficiaries_kk || '—')} KK</strong>
            </div>
          </div>
          <p class="bh-popup__target"><strong>${isEn ? 'Supply Target:' : 'Target Suplai:'}</strong> ${escapeHtml(s.supply_target || (isEn ? 'Villagers & Environment' : 'Warga Desa & Lingkungan'))}</p>
          <button type="button" class="btn btn--primary view-spring-detail" style="width:100%" data-spring-id="${escapeHtml(s.id)}">${isEn ? 'View Spring Profile →' : 'Buka Profil Mata Air →'}</button>
        `;

        const marker = L.marker([s.coordinates_public.lat, s.coordinates_public.lng], {
          icon,
          title: pinLabel,
          alt: pinLabel
        })
          .addTo(belikhubMap)
          .bindPopup(popup);

        const el = marker.getElement();
        if (el) {
          el.setAttribute('aria-label', pinLabel);
          el.setAttribute('role', 'button');
        }

        marker.on('popupopen', () => {
          popup.querySelector('.view-spring-detail')?.addEventListener('click', () => {
            openSpringDetailModal(s);
          });
        });

        const ring = L.circle([s.coordinates_public.lat, s.coordinates_public.lng], {
          radius: 2500,
          color: pinColor,
          weight: 1,
          opacity: 0.45,
          fillColor: pinColor,
          fillOpacity: 0.08,
          interactive: false
        }).addTo(belikhubMap);

        mapRings.push(ring);
        mapMarkers.push(marker);
      }
    });

    // 2. Process Community Reports
    const reportFilterValues = ['Survei Mata Air', 'Restorasi Mata Air', 'Penanaman Pohon', 'Pembangunan Rorak'];
    reportPoints.forEach((r) => {
      const matchesFilter =
        filter === 'all' ||
        (reportFilterValues.includes(filter) && filter === r.reportType);

      const matchesQuery =
        !query ||
        String(r.location || '').toLowerCase().includes(query) ||
        String(r.reportType || '').toLowerCase().includes(query);

      if (matchesFilter && matchesQuery && Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
        const reportColors = {
          'Survei Mata Air': '#0d7480',
          'Restorasi Mata Air': '#0f766e',
          'Penanaman Pohon': '#15803d',
          'Pembangunan Rorak': '#b45309'
        };
        const color = reportColors[r.reportType] || '#0d7480';
        const pinLabel = `${r.reportType} — ${r.location}`;
        const icon = L.divIcon({
          className: 'report-pin',
          html: `<span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px"><span style="display:block;width:12px;height:12px;background:${color};border:2px solid #fff;outline:1px solid #1f3038;transform:rotate(45deg)"></span></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const popup = document.createElement('div');
        popup.className = 'bh-popup';
        popup.innerHTML = `
          <span class="bh-status-pill">${escapeHtml(r.reportType)}</span>
          <h3 class="bh-popup__title">${escapeHtml(r.location)}</h3>
          <p class="bh-popup__notes">${escapeHtml(r.notes || (isEn ? 'Verified community report.' : 'Laporan terverifikasi komunitas.'))}</p>
          <p class="label bh-popup__meta">${isEn ? 'Verified · BelikHub' : 'Diverifikasi · BelikHub'}</p>
        `;

        const marker = L.marker([r.lat, r.lng], {
          icon,
          title: pinLabel,
          alt: pinLabel
        })
          .addTo(belikhubMap)
          .bindPopup(popup);

        const el = marker.getElement();
        if (el) {
          el.setAttribute('aria-label', pinLabel);
          el.setAttribute('role', 'button');
        }

        mapMarkers.push(marker);
      }
    });

    const statusEl = $('#map-status');
    if (statusEl) {
      statusEl.textContent = isEn
        ? `Displaying ${mapMarkers.length} mapped points (${springPoints.length} baseline springs, ${reportPoints.length} verified reports).`
        : `Menampilkan ${mapMarkers.length} titik terpetakan (${springPoints.length} mata air baseline, ${reportPoints.length} laporan diverifikasi).`;
    }
  };

  window.__belikhubRenderMap = renderAllMarkers;

  // Render baseline seed springs immediately without blocking first paint
  renderAllMarkers();
  if (mapMarkers.length > 0) {
    const initialGroup = L.featureGroup(mapMarkers);
    belikhubMap.fitBounds(initialGroup.getBounds().pad(0.22), { maxZoom: 11, animate: false });
  }

  const jumpButtons = $$('[data-spring-jump]');
  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.dataset.springJump;
      const spring = springPoints.find((sp) => sp.id === targetId);
      if (!spring?.coordinates_public) return;
      jumpButtons.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      belikhubMap.setView([spring.coordinates_public.lat, spring.coordinates_public.lng], 12, { animate: !prefersReducedMotion() });
      openSpringDetailModal(spring);
    });
  });

  const loadMapData = async (syncSprings = false) => {
    const isEn = currentLanguage === 'en';
    const statusEl = $('#map-status');
    const loadBtn = $('#load-reports-label');
    if (syncSprings && loadBtn) loadBtn.textContent = isEn ? 'Loading…' : 'Memuat…';

    try {
      if (syncSprings) {
        const springsRes = await fetch('/api/springs');
        if (springsRes.ok && springsRes.headers.get('content-type')?.includes('application/json')) {
          const data = await springsRes.json();
          if (Array.isArray(data.springs) && data.springs.length) {
            springPoints = data.springs;
          }
        }
      }

      const reportsRes = await fetch('/api/reports?limit=100');
      if (reportsRes.ok && reportsRes.headers.get('content-type')?.includes('application/json')) {
        const data = await reportsRes.json();
        reportPoints = data.reports || [];
      }

      renderAllMarkers();

      if (mapMarkers.length > 0 && syncSprings) {
        const group = L.featureGroup(mapMarkers);
        belikhubMap.fitBounds(group.getBounds().pad(0.15), { maxZoom: 11, animate: !prefersReducedMotion() });
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = isEn
          ? `Displaying ${mapMarkers.length} verified baseline springs (5 km grid).`
          : `Menampilkan ${mapMarkers.length} mata air baseline terverifikasi (grid 5 km).`;
      }
    } finally {
      if (loadBtn) loadBtn.textContent = isEn ? 'Refresh Map Data' : 'Perbarui Data Peta';
    }
  };

  loadMapData(false);
  $('#map-filter')?.addEventListener('change', renderAllMarkers);
  $('#map-search')?.addEventListener('input', renderAllMarkers);
  $('#load-reports')?.addEventListener('click', () => {
    loadMapData(true);
    loadImpactStats();
  });

  // Geolocation
  $('#locate-btn')?.addEventListener('click', () => {
    const isEn = currentLanguage === 'en';
    if (!navigator.geolocation) {
      toast(isEn ? 'Geolocation is not supported by your browser.' : 'Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }
    toast(isEn ? 'Requesting GPS position…' : 'Meminta izin lokasi…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        belikhubMap.setView([latitude, longitude], 12);
        L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#FFD166',
          color: '#0B2A33',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(belikhubMap).bindPopup(isEn ? '<b>Your Current Position</b>' : '<b>Lokasi Anda Saat Ini</b>').openPopup();
        toast(isEn ? 'Map centered on your location.' : 'Peta dipusatkan ke posisi Anda.');
      },
      () => toast(isEn ? 'Could not access location or permission denied.' : 'Gagal mendeteksi lokasi atau izin ditolak.')
    );
  });
};
initMap();

// Spring Details Modal
const openSpringDetailModal = (s) => {
  const isEn = currentLanguage === 'en';
  const treatments = (s.treatment_needed || ['Sumur Resapan', 'Rorak Kontur', 'Bibit Endemik'])
    .map((t) => `<span class="bh-status-pill">${escapeHtml(t)}</span>`)
    .join('');

  openModal(
    `${isEn ? 'Spring Details' : 'Detail Mata Air'}: ${s.name || ''}`,
    `
    <div class="bh-modal-stack">
      <div class="bh-modal-split">
        <div>
          <span class="bh-status-pill ${s.status === 'active' ? '' : 'bh-status-pill--warn'}">${s.status === 'active' ? (isEn ? 'Active Flow' : 'Aktif Mengalir') : (isEn ? 'Needs Rehabilitation' : 'Perlu Pemulihan')}</span>
          <p class="bh-modal-note">${escapeHtml([s.village, s.district, s.regency].filter(Boolean).join(', '))}</p>
        </div>
        <div>
          <p class="label c-accent">${isEn ? 'Flow Reliability' : 'Keandalan Aliran'}</p>
          <p class="bh-modal-stat">${escapeHtml(s.uptime_percentage || '95')}%</p>
        </div>
      </div>

      <div class="bh-modal-grid">
        <div class="bh-modal-box">
          <p class="label c-accent">${isEn ? 'Baseline Discharge' : 'Debit Baseline'} (L/s)</p>
          <p class="bh-modal-stat">${escapeHtml(s.baseline_discharge_lps || '—')}</p>
          <p class="bh-modal-note">${isEn ? 'Historical' : 'Historis'}: ${escapeHtml(s.historical_discharge_lps || s.baseline_discharge_lps || '—')} L/s</p>
        </div>
        <div class="bh-modal-box">
          <p class="label c-accent">${isEn ? 'Beneficiaries' : 'Penerima Manfaat'}</p>
          <p class="bh-modal-stat">${escapeHtml(s.beneficiaries_kk || '—')} KK</p>
          <p class="bh-modal-note">${escapeHtml(s.supply_target || (isEn ? 'Villagers & Agriculture' : 'Warga Desa & Pertanian'))}</p>
        </div>
      </div>

      <div class="bh-modal-box">
        <p class="label c-accent">${isEn ? 'Required Conservation Treatments' : 'Tindakan Konservasi yang Dibutuhkan'}</p>
        <div class="bh-modal-badges">${treatments}</div>
      </div>

      ${
        s.historical_impact
          ? `<div class="bh-modal-box bh-modal-box--tint"><p class="label c-accent">${isEn ? 'Historical Conservation Impact' : 'Dampak Historis Konservasi'}</p><p class="bh-modal-note">${escapeHtml(s.historical_impact)}</p></div>`
          : ''
      }

      ${
        s.crisis_history
          ? `<div class="bh-modal-box bh-modal-box--warn"><p class="label">${isEn ? 'Crisis History & Vulnerability' : 'Catatan Krisis & Kerentanan'}</p><p class="bh-modal-note">${escapeHtml(s.crisis_history)}</p></div>`
          : ''
      }

      <button type="button" class="btn btn-teal report-this-spring-btn">${isEn ? 'Submit Field Report for This Spring' : 'Kirim Laporan untuk Mata Air Ini'}</button>
    </div>
    `,
    true
  );

  modal.querySelector('.report-this-spring-btn')?.addEventListener('click', () => {
    closeModal();
    openReportModal('Survei Mata Air', 100, s.name || '');
  });
};

// Community Report Submission Modal
const openReportModal = (reportType, points = 100, prefillLocation = '') => {
  const isEn = currentLanguage === 'en';
  if (!currentUser) {
    toast(isEn ? 'Please sign in first to submit a report.' : 'Silakan masuk terlebih dahulu untuk mengirim laporan.');
    openLoginModal();
    return;
  }

  openModal(
    `${isEn ? 'Report' : 'Laporan'}: ${reportType}`,
    `
    <form id="community-report-form" class="bh-modal-stack">
      <div class="bh-modal-box bh-modal-box--tint">
        <p class="bh-modal-note">
          ${isEn ? 'Submit your field observations to be reviewed by our curation team. You will earn' : 'Kirimkan hasil pemantauan Anda untuk diverifikasi tim kurasi. Anda akan memperoleh'}
          <strong class="c-accent">+<span id="pts-reward">${Number(points)}</span> ${isEn ? 'points' : 'poin'}</strong> ${isEn ? 'once approved.' : 'setelah disetujui.'}
        </p>
      </div>

      <div class="field">
        <label for="report-location">${isEn ? 'Location Name / Spring / Village' : 'Nama Lokasi / Mata Air / Desa'}</label>
        <input id="report-location" required name="location" value="${escapeHtml(prefillLocation)}" placeholder="${isEn ? 'e.g. Tuk Bismo, Bismo Village' : 'Contoh: Tuk Bismo, Desa Bismo'}" />
      </div>

      <div class="bh-modal-stack">
        <div class="bh-modal-split">
          <span class="label">${isEn ? 'GPS Field Coordinates' : 'Koordinat GPS Lapangan'}</span>
          <button type="button" id="detect-gps-btn" class="bh-link-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2"/></svg>
            <span>${isEn ? 'Capture My GPS' : 'Ambil GPS Saya'}</span>
          </button>
        </div>
        <div class="bh-modal-grid">
          <div class="field">
            <label for="report-lat">Latitude</label>
            <input id="report-lat" name="lat" type="number" step="any" placeholder="-7.xxx" />
          </div>
          <div class="field">
            <label for="report-lng">Longitude</label>
            <input id="report-lng" name="lng" type="number" step="any" placeholder="109.xxx" />
          </div>
        </div>
        <p class="bh-modal-note">${isEn ? 'Coordinates will be automatically fuzzed to ~5 km grids on the public map.' : 'Koordinat akan disamarkan otomatis ke grid ~5 km untuk publik.'}</p>
      </div>

      <div class="field">
        <label for="report-notes">${isEn ? 'Field Notes' : 'Catatan Lapangan'}</label>
        <textarea id="report-notes" required name="notes" rows="3" placeholder="${isEn ? 'Describe water flow, clarity, surrounding flora, or actions performed...' : 'Jelaskan kondisi debit air, vegetasi sekitar, atau pekerjaan yang telah dilakukan...'}"></textarea>
      </div>

      <button id="submit-report-btn" class="btn btn-teal" type="submit">
        ${isEn ? 'Submit Field Report →' : 'Kirim Laporan Lapangan →'}
      </button>
    </form>
    `
  );

  const form = $('#community-report-form');
  if (!form) return;

  $('#detect-gps-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast(isEn ? 'GPS not supported on this browser.' : 'GPS tidak didukung di browser ini.');
      return;
    }
    toast(isEn ? 'Reading GPS position…' : 'Membaca posisi GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latInput = form.querySelector('[name=lat]');
        const lngInput = form.querySelector('[name=lng]');
        if (latInput) latInput.value = pos.coords.latitude.toFixed(5);
        if (lngInput) lngInput.value = pos.coords.longitude.toFixed(5);
        toast(isEn ? 'Coordinates recorded!' : 'Koordinat berhasil diisi!');
      },
      () => toast(isEn ? 'Could not retrieve GPS coordinates.' : 'Gagal mengambil koordinat GPS.')
    );
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-report-btn');
    btn.disabled = true;
    btn.textContent = isEn ? 'Saving report…' : 'Menyimpan laporan…';

    const latVal = form.querySelector('[name=lat]').value;
    const lngVal = form.querySelector('[name=lng]').value;

    const payload = {
      reportType,
      location: form.querySelector('[name=location]').value,
      notes: form.querySelector('[name=notes]').value,
      lat: latVal ? Number(latVal) : undefined,
      lng: lngVal ? Number(lngVal) : undefined
    };

    try {
      const data = await apiRequest('/api/reports', payload, { auth: true });
      closeModal();
      toast(isEn ? `Report saved! +${data.points || points} pts awaiting verification.` : `Laporan tersimpan! +${data.points || points} poin menunggu verifikasi.`);
      loadImpactStats();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = isEn ? 'Submit Field Report →' : 'Kirim Laporan Lapangan →';
      toast(err.message);
    }
  });
};

$$('.report-card').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const reportType = btn.dataset.report || 'Survei Mata Air';
    const ptsMatch = btn.textContent.match(/\+[\d.]+/);
    const pts = ptsMatch ? parseInt(ptsMatch[0].replace(/[^\d]/g, ''), 10) : 100;
    openReportModal(reportType, pts);
  });
});

$('#points-btn')?.addEventListener('click', () => {
  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'BelikHub Volunteer Points System' : 'Sistem Poin Relawan BelikHub',
    `
    <div class="bh-modal-stack">
      <p class="bh-modal-note">${isEn ? 'Every contribution is awarded measurable points upon verification by field coordinators:' : 'Setiap kontribusi Anda diapresiasi dengan poin terukur setelah diverifikasi tim lapangan:'}</p>
      <div>
        <div class="log-line"><span>${isEn ? 'Initial Spring Survey' : 'Survei Mata Air Awal'}</span><b class="label c-accent">+100 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Spring Cleaning / Restoration' : 'Pembersihan / Restorasi Mata Air'}</span><b class="label c-accent">+1.000 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Rorak Infiltration Trench Digging' : 'Pembangunan Rorak Resapan Air'}</span><b class="label c-accent">+500 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Native Tree Planting' : 'Penanaman Bibit Pohon Endemik'}</span><b class="label c-accent">+100 pts</b></div>
      </div>
      <div class="bh-modal-box bh-modal-box--tint">
        <p class="label c-accent">${isEn ? 'Points Benefit' : 'Manfaat Poin Relawan'}</p>
        <p class="bh-modal-note">
          ${isEn ? 'Volunteers accumulating ≥ 20,000 points may sponsor and propose an independent village spring recovery project directly funded via BelikHub community partnerships.' : 'Relawan dengan akumulasi ≥ 20.000 poin dapat mengajukan inisiatif pemulihan belik desa secara mandiri untuk didanai melalui program kemitraan komunitas BelikHub.'}
        </p>
      </div>
    </div>
    `
  );
});

// Rorak Order & Maker Modals
const openOrderRorakModal = () => {
  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'Order Roraks for Your Land' : 'Pemesanan Rorak untuk Lahan Anda',
    `
    <form id="rorak-order-form" class="bh-modal-stack">
      <p class="bh-modal-note">
        ${isEn ? 'Order contour infiltration trenches (roraks) for your sloped orchard or farmland. Trained local villagers will dig trenches according to contour lines.' : 'Pesan pembuatan parit rorak resapan di lahan perkebunan atau pekarangan miring Anda. Tenaga kerja lokal yang terlatih akan menggali rorak sesuai garis kontur.'}
      </p>

      <div class="bh-modal-grid">
        <div class="field">
          <label for="order-name">${isEn ? 'Landowner Name' : 'Nama Pemilik Lahan'}</label>
          <input id="order-name" required name="name" placeholder="${isEn ? 'Full name' : 'Nama lengkap'}" />
        </div>
        <div class="field">
          <label for="order-phone">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}</label>
          <input id="order-phone" required name="phone" type="tel" placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      <div class="field">
        <label for="order-location">${isEn ? 'Land Location (Village & District)' : 'Lokasi Lahan (Desa & Kecamatan)'}</label>
        <input id="order-location" required name="location" placeholder="${isEn ? 'e.g. Bismo Village, Blado, Batang' : 'Contoh: Desa Bismo, Kec. Blado, Kab. Batang'}" />
      </div>

      <div class="field">
        <label for="rorak-qty">${isEn ? 'Number of Rorak Units Ordered' : 'Jumlah Rorak yang Dipesan'}</label>
        <div class="bh-qty-row">
          <input id="rorak-qty" name="quantity" type="number" min="1" max="100" value="5" />
          <span class="bh-modal-note">${isEn ? 'Units (standard 200 × 50 × 50 cm)' : 'Unit rorak (dimensi baku 200 × 50 × 50 cm)'}</span>
        </div>
      </div>

      <div class="bh-modal-box bh-modal-box--tint">
        <div class="bh-modal-split">
          <span class="label c-accent">${isEn ? 'Estimated Digging Cost:' : 'Estimasi Biaya Penggalian:'}</span>
          <b id="rorak-cost" class="bh-modal-stat">Rp100.000</b>
        </div>
        <p class="bh-modal-note">${isEn ? 'Cost Rp20,000/unit (Rp16,000 paid to village diggers + Rp4,000 field audit).' : 'Biaya Rp20.000/unit (Rp16.000 untuk upah warga penggali + Rp4.000 audit operasional).'}</p>
        <p class="bh-modal-note">
          <strong>${isEn ? 'Infiltration Capacity:' : 'Kapasitas Resapan:'}</strong> <span id="rorak-absorption">~10.000 Liter air hujan/musim</span>
        </p>
      </div>

      <div class="field">
        <label for="order-notes">${isEn ? 'Land Condition Notes (Optional)' : 'Catatan Kondisi Lahan (Opsional)'}</label>
        <textarea id="order-notes" name="notes" rows="2" placeholder="${isEn ? 'Slope steepness, crops, or access paths...' : 'Kemiringan lahan, jenis tanaman, atau akses jalan...'}"></textarea>
      </div>

      <button id="submit-rorak-order-btn" class="btn btn-teal" type="submit">
        ${isEn ? 'Confirm Rorak Order →' : 'Konfirmasi Pesanan Rorak →'}
      </button>
    </form>
    `
  );

  const form = $('#rorak-order-form');
  const qtyInput = $('#rorak-qty');
  const costEl = $('#rorak-cost');
  const absorptionEl = $('#rorak-absorption');

  const updateCalculations = () => {
    const qty = Math.max(1, Math.min(100, parseInt(qtyInput?.value || '1', 10) || 1));
    const cost = qty * 20000;
    const absorption = qty * 2000;
    if (costEl) costEl.textContent = `Rp${cost.toLocaleString('id-ID')}`;
    if (absorptionEl) absorptionEl.textContent = `~${absorption.toLocaleString('id-ID')} ${isEn ? 'Liters/season' : 'Liter air hujan/musim'}`;
  };

  qtyInput?.addEventListener('input', updateCalculations);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-rorak-order-btn');
    btn.disabled = true;
    btn.textContent = isEn ? 'Submitting order…' : 'Mendaftarkan pesanan…';

    const formData = new FormData(form);
    const qty = Math.max(1, Math.min(100, parseInt(qtyInput?.value || '1', 10) || 1));

    try {
      const data = await apiRequest(
        '/api/orders',
        {
          type: 'rorak_order',
          name: formData.get('name'),
          phone: formData.get('phone'),
          details: {
            location: formData.get('location'),
            quantity: qty,
            estimatedCost: qty * 20000,
            notes: formData.get('notes')
          }
        },
        { auth: false }
      );

      closeModal();
      openModal(
        isEn ? 'Rorak Order Recorded!' : 'Pesanan Rorak Berhasil Dicatat!',
        `
        <div class="bh-modal-stack bh-modal-center">
          <div class="bh-modal-check">
            <svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.5 3.2 3.2 6.8-7"/></svg>
          </div>
          <h3 class="bh-modal-subtitle">${isEn ? 'Thank You for Taking Action!' : 'Terima Kasih atas Aksi Nyata Anda!'}</h3>
          <p class="bh-modal-note">
            ${isEn ? `Your order for <strong>${qty} rorak units</strong> has been received with reference code <strong>#${escapeHtml(data.id || 'RO-2026')}</strong>. Our field coordinator will contact your WhatsApp within 24 hours for slope verification.` : `Pesanan pembuatan <strong>${qty} unit rorak</strong> telah diterima dengan kode referensi <strong>#${escapeHtml(data.id || 'RO-2026')}</strong>. Koordinator lapangan BelikHub akan menghubungi WhatsApp Anda dalam 1×24 jam untuk survei kontur lahan.`}
          </p>
          <button type="button" data-close-modal class="btn btn-teal">${isEn ? 'Close & Return' : 'Tutup & Kembali'}</button>
        </div>
        `
      );
    } catch (err) {
      btn.disabled = false;
      btn.textContent = isEn ? 'Confirm Rorak Order →' : 'Konfirmasi Pesanan Rorak →';
      toast(err.message);
    }
  });
};

$$('#order-rorak-btn, #order-rorak-support-btn, #footer-order-rorak').forEach((btn) =>
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openOrderRorakModal();
  })
);

const openJoinMakerModal = () => {
  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'Register as a Rorak Digger' : 'Pendaftaran Tenaga Pembuat Rorak',
    `
    <form id="join-maker-form" class="bh-modal-stack">
      <p class="bh-modal-note">
        ${isEn ? 'Join our trained village taskforce. Earn Rp16,000 for every verified rorak completed on contour.' : 'Bergabung menjadi tenaga penggali rorak terlatih di desa Anda. Dapatkan insentif Rp16.000 per unit rorak yang selesai digali dan terverifikasi.'}
      </p>

      <div class="bh-modal-grid">
        <div class="field">
          <label for="maker-name">${isEn ? 'Full Name' : 'Nama Lengkap'}</label>
          <input id="maker-name" required name="name" placeholder="${isEn ? 'Your name' : 'Nama Anda'}" />
        </div>
        <div class="field">
          <label for="maker-phone">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}</label>
          <input id="maker-phone" required name="phone" type="tel" placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      <div class="field">
        <label for="maker-domicile">${isEn ? 'Village / District Domicile' : 'Desa / Kecamatan Domisili'}</label>
        <input id="maker-domicile" required name="domicile" placeholder="${isEn ? 'e.g. Bismo Village, Blado' : 'Contoh: Desa Bismo, Kec. Blado'}" />
      </div>

      <div class="field">
        <label for="maker-experience">${isEn ? 'Field / Farming Experience' : 'Pengalaman Pekerjaan Fisik / Tani'}</label>
        <select id="maker-experience" name="experience">
          <option value="Petani / Buruh Tani">${isEn ? 'Active Farmer / Farmworker' : 'Petani / Buruh Tani Aktif'}</option>
          <option value="Tukang Bangunan / Galian">${isEn ? 'Construction / Excavation Worker' : 'Tukang Bangunan / Galian Tanah'}</option>
          <option value="Warga Komunitas">${isEn ? 'Community Member / Youth' : 'Warga Komunitas / Pemuda Desa'}</option>
        </select>
      </div>

      <fieldset class="bh-fieldset">
        <legend>${isEn ? 'Available Tools' : 'Ketersediaan Alat Kerja'}</legend>
        <label class="bh-checkbox-row"><input type="checkbox" name="tool_cangkul" checked /> <span>${isEn ? 'Own a hoe (cangkul)' : 'Memiliki cangkul sendiri'}</span></label>
        <label class="bh-checkbox-row"><input type="checkbox" name="tool_linggis" checked /> <span>${isEn ? 'Own a crowbar (linggis)' : 'Memiliki linggis / gancu'}</span></label>
      </fieldset>

      <button id="submit-join-maker-btn" class="btn btn-teal" type="submit">
        ${isEn ? 'Register as a Digger →' : 'Daftar Sebagai Pembuat Rorak →'}
      </button>
    </form>
    `
  );

  const form = $('#join-maker-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-join-maker-btn');
    btn.disabled = true;
    btn.textContent = isEn ? 'Submitting…' : 'Mendaftarkan…';

    const formData = new FormData(form);
    try {
      await apiRequest(
        '/api/orders',
        {
          type: 'rorak_maker',
          name: formData.get('name'),
          phone: formData.get('phone'),
          details: {
            domicile: formData.get('domicile'),
            experience: formData.get('experience'),
            tools: [
              formData.get('tool_cangkul') ? 'cangkul' : null,
              formData.get('tool_linggis') ? 'linggis' : null
            ].filter(Boolean)
          }
        },
        { auth: false }
      );

      closeModal();
      openModal(
        isEn ? 'Digger Registration Received' : 'Pendaftaran Pembuat Rorak Diterima',
        `
        <div class="bh-modal-stack bh-modal-center">
          <div class="bh-modal-check">
            <svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.5 3.2 3.2 6.8-7"/></svg>
          </div>
          <h3 class="bh-modal-subtitle">${isEn ? 'Welcome Aboard!' : 'Selamat Bergabung!'}</h3>
          <p class="bh-modal-note">
            ${isEn ? 'Your information has been logged into the BelikHub taskforce. We will send technical contour guidelines via WhatsApp.' : 'Data Anda telah tercatat dalam satgas penggalian BelikHub. Kami akan mengirimkan jadwal pengarahan teknis garis kontur via WhatsApp.'}
          </p>
          <button type="button" data-close-modal class="btn btn-teal">${isEn ? 'Finish' : 'Selesai'}</button>
        </div>
        `
      );
    } catch (err) {
      btn.disabled = false;
      btn.textContent = isEn ? 'Register as a Digger →' : 'Daftar Sebagai Pembuat Rorak →';
      toast(err.message);
    }
  });
};

$$('#join-maker-btn, #footer-join-maker').forEach((btn) =>
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openJoinMakerModal();
  })
);

// Agenda Field RSVP Modal
$$('.rsvp-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const isEn = currentLanguage === 'en';
    const eventTitle = btn.dataset.event || 'Aksi Lapangan BelikHub';
    const date = btn.dataset.date || 'November 2026';
    const location = btn.dataset.location || 'Lokasi Titik Kumpul';

    openModal(
      `${isEn ? 'Sign Up to Join' : 'Daftar Ikut'}: ${eventTitle}`,
      `
      <form id="rsvp-form" class="bh-modal-stack">
        <div class="bh-modal-box bh-modal-box--tint">
          <p class="label c-accent">${isEn ? 'Event Information' : 'Informasi Kegiatan'}</p>
          <p class="bh-modal-subtitle">${escapeHtml(eventTitle)}</p>
          <p class="bh-modal-note">&bull; ${isEn ? 'Date' : 'Tanggal'}: <strong>${escapeHtml(date)}</strong> &bull; ${isEn ? 'Meeting Point' : 'Titik'}: <strong>${escapeHtml(location)}</strong></p>
        </div>

        <div class="bh-modal-grid">
          <div class="field">
            <label for="rsvp-name">${isEn ? 'Volunteer Name' : 'Nama Lengkap Relawan'}</label>
            <input id="rsvp-name" required name="name" placeholder="${isEn ? 'Your full name' : 'Nama Anda'}" />
          </div>
          <div class="field">
            <label for="rsvp-phone">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}</label>
            <input id="rsvp-phone" required name="phone" type="tel" placeholder="08xxxxxxxxxx" />
          </div>
        </div>

        <div class="field">
          <label for="rsvp-community">${isEn ? 'Institution / Community (Optional)' : 'Instansi / Komunitas / Kampus (Opsional)'}</label>
          <input id="rsvp-community" name="community" placeholder="Contoh: Mapala / Pribadi / BUMDes" />
        </div>

        <div class="bh-modal-box">
          <p class="label c-accent">${isEn ? 'Required Field Gear:' : 'Perlengkapan Wajib yang Perlu Dibawa:'}</p>
          <ul class="bh-modal-list">
            <li>${isEn ? 'Trekking boots or non-slip footwear.' : 'Sepatu boots atau sepatu trekking anti-selip.'}</li>
            <li>${isEn ? 'Personal water tumbler.' : 'Botol minum pribadi (tumbler).'}</li>
            <li>${isEn ? 'Work gloves for soil work.' : 'Sarung tangan kain untuk pekerjaan tanah.'}</li>
          </ul>
        </div>

        <button id="submit-rsvp-btn" class="btn btn-teal" type="submit">
          ${isEn ? 'Confirm Field Participation →' : 'Konfirmasi Keikutsertaan Aksi →'}
        </button>
      </form>
      `
    );

    const form = $('#rsvp-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('#submit-rsvp-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = isEn ? 'Registering…' : 'Mendaftarkan…';

      const formData = new FormData(form);
      try {
        await apiRequest(
          '/api/orders',
          {
            type: 'agenda_rsvp',
            name: formData.get('name'),
            phone: formData.get('phone'),
            details: {
              eventTitle,
              date,
              location,
              community: formData.get('community')
            }
          },
          { auth: false }
        );

        closeModal();
        openModal(
          isEn ? 'Field Registration Confirmed!' : 'Pendaftaran Kegiatan Terkonfirmasi!',
          `
          <div class="bh-modal-stack bh-modal-center">
            <div class="bh-modal-check">
              <svg width="26" height="26" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="12" height="8" rx="1.5"/><path d="M6 8h4M8 6.5v3"/></svg>
            </div>
            <h3 class="bh-modal-subtitle">${isEn ? 'Field Volunteer Pass' : 'Tiket Relawan Lapangan'}</h3>
            <div class="bh-modal-box bh-modal-box--tint" style="text-align:left">
              <p class="bh-modal-note"><strong>${isEn ? 'Event:' : 'Kegiatan:'}</strong> ${escapeHtml(eventTitle)}</p>
              <p class="bh-modal-note"><strong>${isEn ? 'Volunteer:' : 'Peserta:'}</strong> ${escapeHtml(formData.get('name'))}</p>
              <p class="bh-modal-note"><strong>${isEn ? 'Date:' : 'Jadwal:'}</strong> ${escapeHtml(date)}</p>
              <p class="bh-modal-note"><strong>${isEn ? 'Location:' : 'Lokasi:'}</strong> ${escapeHtml(location)}</p>
            </div>
            <p class="bh-modal-note">${isEn ? 'Your registration has been confirmed. See you on the ground!' : 'Pemberitahuan panduan keselamatan lapangan telah dicatat. Sampai jumpa di lokasi aksi!'}</p>
            <button type="button" data-close-modal class="btn btn-teal">${isEn ? 'Close' : 'Tutup'}</button>
          </div>
          `
        );
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = isEn ? 'Confirm Field Participation →' : 'Konfirmasi Keikutsertaan Aksi →';
        toast(err.message);
      }
    });
  });
});

// Interactive Learning Courses
const courseData = {
  spring: {
    title: {
      id: 'Pengenalan Ekosistem Mata Air & Springshed',
      en: 'Introduction to Spring Ecosystems & Springsheds'
    },
    modules: [
      {
        title: { id: '1. Anatomi dan Tipe Akuifer', en: '1. Anatomy & Aquifer Types' },
        desc: {
          id: 'Mata air terbentuk ketika muka air tanah (water table) berpotongan dengan permukaan topografi bumi. Terdapat dua jenis utama: mata air rekahan (pada batuan vulkanik) dan mata air rembesan (pada lapisan aluvium). Menjaga mata air berarti menjaga zona imbuhan (recharge zone) di perbukitan hulu.',
          en: 'Springs form where the water table intersects the ground topography. Two main types exist: fracture springs (in volcanic bedrock) and seepage springs (in alluvial layers). Protecting springs requires guarding the recharge zone in upstream hills.'
        }
      },
      {
        title: { id: '2. Metode Uji Debit Volumetrik Lapangan', en: '2. Field Volumetric Discharge Measurement' },
        desc: {
          id: 'Siapkan wadah bervolume tetap (misal ember 10 atau 20 liter) dan stopwatch. Alirkan seluruh debit air mata air ke dalam wadah sambil mengukur waktu pengisian (t dalam detik). Gunakan rumus Q = V / t. Lakukan 3 kali pengulangan untuk mendapatkan rata-rata debit LPS (liter per detik) yang akurat.',
          en: 'Use a container of fixed volume (e.g. 10 or 20 liter bucket) and a stopwatch. Divert the spring outlet into the bucket while measuring fill time (t in seconds). Use Q = V / t. Repeat 3 times to calculate an accurate average discharge in liters per second (L/s).'
        }
      },
      {
        title: { id: '3. Parameter Kualitas & Kejernihan Air', en: '3. Water Quality & Clarity Indicators' },
        desc: {
          id: 'Catat suhu air (mata air yang sehat memiliki suhu konstan ~21-24°C), bau (tidak berbau lumpur atau sulfur), dan kejernihan visual. Periksa apakah terdapat sedimentasi pekat pasca hujan, yang menandakan rusaknya vegetasi di hulu springshed.',
          en: 'Record temperature (healthy springs maintain a steady ~21-24°C), smell, and visual turbidity. Heavy sediment after rainfall signals degraded vegetative cover in the upstream springshed.'
        }
      },
      {
        title: { id: '4. Etika Adat & Keselamatan Tim', en: '4. Indigenous Protocols & Field Safety' },
        desc: {
          id: 'Banyak mata air di Indonesia berstatus sakral atau dikeramatkan oleh tetua desa. Selalu sowan izin ke kepala desa atau juru kunci setempat sebelum mengambil sampel atau melakukan dokumentasi fisik.',
          en: 'Many springs in Indonesia hold cultural or sacred value. Always request consent from village elders or caretakers before taking physical samples or conducting documentation.'
        }
      }
    ]
  },
  trees: {
    title: {
      id: 'Menanam Pohon Endemik Penyimpan Air',
      en: 'Planting Deep-Root Native Water Trees'
    },
    modules: [
      {
        title: { id: '1. Mengapa Pohon Tertentu Menjaga Air?', en: '1. Why Specific Trees Retain Water' },
        desc: {
          id: 'Pohon dengan perakaran tunggang dalam dan kanopi rapat seperti Beringin (Ficus benjamina), Aren (Arenga pinnata), dan Bambu Petung mampu membuka pori-pori tanah tanpa memompa habis air tanah secara boros seperti halnya pohon monokultur.',
          en: 'Trees with deep taproots and dense canopies like Fig (Ficus), Sugar Palm (Arenga pinnata), and Giant Bamboo open soil macropores without depleting underground aquifers like monoculture crops.'
        }
      },
      {
        title: { id: '2. Zonasi Delineasi Tanam', en: '2. Planting Delineation Zones' },
        desc: {
          id: 'Zona 1 (Radius 0-50m): Area tangkapan langsung. Tanami rumput vetiver dan tanaman penahan erosi tebing, jangan lakukan penggalian berat. Zona 2 (Radius 50-200m): Area tanam pohon penyimpan air kanopi tinggi. Zona 3: Pertanian agroforestri terpadu.',
          en: 'Zone 1 (0-50m radius): Immediate catchment. Plant vetiver grass and slope-stabilizing flora; avoid heavy excavations. Zone 2 (50-200m): High-canopy water-storing tree belt. Zone 3: Sustainable agroforestry.'
        }
      },
      {
        title: { id: '3. Teknik Penanaman di Lereng Curam', en: '3. Steep-Slope Planting Methods' },
        desc: {
          id: 'Gali lubang tanam 50x50x50 cm, campurkan tanah galian dengan pupuk kompos kandang 1:1. Buat parit tapak kuda kecil di bagian atas bibit untuk menangkap limpasan air hujan pertama.',
          en: 'Dig 50x50x50 cm planting holes, mixing excavated topsoil with compost 1:1. Create small crescent trenches above the sapling to capture initial rainfall runoff.'
        }
      },
      {
        title: { id: '4. Perawatan 100 Hari Pertama', en: '4. First 100 Days Care' },
        desc: {
          id: 'Periode paling kritis bagi bibit adalah 3 bulan pertama. Lakukan penyiangan gulma pengganggu setiap 2 minggu sekali dan pastikan mulsa organik (daun kering) menutupi pangkal batang.',
          en: 'The initial 3 months are crucial. Weed every 2 weeks and maintain dry leaf mulch around the stem base to conserve soil moisture.'
        }
      }
    ]
  },
  rorak: {
    title: {
      id: 'Teknik Membangun Rorak Resapan Kontur',
      en: 'Building Contour Infiltration Trenches (Roraks)'
    },
    modules: [
      {
        title: { id: '1. Prinsip Menahan Air Hujan', en: '1. Principles of Water Retention' },
        desc: {
          id: 'Rorak berfungsi memutus kecepatan limpasan air hujan permukaan (runoff) di lereng bukit. Alih-alih mengalir deras ke sungai dan menyebabkan erosi tanah pucuk (topsoil), air tertahan di lubang rorak dan meresap perlahan ke akuifer dangkal.',
          en: 'Roraks break the velocity of surface runoff on slopes. Instead of rushing to streams and eroding topsoil, rainwater is detained in trenches to steadily percolate into shallow aquifers.'
        }
      },
      {
        title: { id: '2. Menentukan Garis Kontur Sederhana', en: '2. Establishing Contour Lines' },
        desc: {
          id: 'Gunakan alat bantu gawang segitiga berbandul (A-frame) atau selang air transparan berisi air. Tarik garis horizontal yang memiliki ketinggian sama di sepanjang kontur lereng. Rorak wajib digali mengikuti garis ini agar tidak menjadi pemicu longsor.',
          en: 'Use an A-frame level or water hose level to mark horizontal lines of equal elevation along the slope. Trenches must strictly follow contour lines to prevent slope slippage.'
        }
      },
      {
        title: { id: '3. Dimensi Baku & Tanggul Tanah', en: '3. Standard Dimensions & Berms' },
        desc: {
          id: 'Panjang baku: 200 cm, Lebar: 50 cm, Dalam: 50 cm. Tanah hasil galian ditumpuk di sisi hilir (bawah) membentuk tanggul pematang setinggi 15 cm untuk mencegah luapan air saat hujan badai lebat.',
          en: 'Standard size: 200 cm long, 50 cm wide, 50 cm deep. Mound excavated soil on the downhill side to form a 15 cm bund preventing overflow during intense storms.'
        }
      },
      {
        title: { id: '4. Perawatan Rutin Pra-Musim Hujan', en: '4. Pre-Monsoon Maintenance' },
        desc: {
          id: 'Sebelum musim hujan tiba, kuras lumpur sedimen dan sampah dedaunan yang menumpuk di dasar rorak. Lumpur ini sangat subur dan dapat dimanfaatkan sebagai pupuk alami untuk tanaman perkebunan di sekitarnya.',
          en: 'Dredge accumulated sediment and organic debris before the rains. This silt is nutrient-rich and serves as excellent natural fertilizer for adjacent crops.'
        }
      }
    ]
  }
};

$$('[data-course]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const isEn = currentLanguage === 'en';
    const langKey = isEn ? 'en' : 'id';
    const courseKey = btn.dataset.course;
    const course = courseData[courseKey];
    if (!course) return;

    const modulesHtml = course.modules
      .map(
        (m) => `
        <div class="bh-modal-box">
          <h3 class="bh-modal-subtitle">${escapeHtml(m.title[langKey])}</h3>
          <p class="bh-modal-note">${escapeHtml(m.desc[langKey])}</p>
        </div>
      `
      )
      .join('');

    openModal(
      course.title[langKey],
      `
      <div class="bh-modal-stack">
        <p class="bh-modal-note">${isEn ? 'Field handbook for BelikHub volunteers and coordinators:' : 'Modul praktis pegangan relawan dan petugas lapangan BelikHub:'}</p>
        <div class="bh-modal-stack">
          ${modulesHtml}
        </div>
        <button type="button" data-close-modal class="btn btn-teal">
          ${isEn ? 'Complete Reading' : 'Selesai Membaca Modul'}
        </button>
      </div>
      `,
      true
    );
  });
});

// Learn Tab Visual Sync & Lazy Video Loader (pairs with system.js tabs() aria-selected + [hidden])
const syncLearnTabs = () => {
  const mediaPanel = document.getElementById('media');
  $$('.learn-tab').forEach((t) => {
    const isSelected = t.getAttribute('aria-selected') === 'true';
    t.classList.toggle('tab-active', isSelected);
    t.classList.toggle('tab-idle', !isSelected);
  });
  if (mediaPanel && !mediaPanel.hidden) {
    const vid = document.getElementById('learn-media-video');
    if (vid && !vid.getAttribute('src') && vid.dataset.src) {
      vid.src = vid.dataset.src;
    }
  }
};

const learnTabList = $('#learn [role="tablist"]');
if (learnTabList && typeof MutationObserver === 'function') {
  new MutationObserver(syncLearnTabs).observe(learnTabList, {
    attributes: true,
    attributeFilter: ['aria-selected'],
    subtree: true
  });
}
$$('.learn-tab').forEach((tab) => {
  tab.addEventListener('click', () => requestAnimationFrame(syncLearnTabs));
});
syncLearnTabs();

// Full Story Reader
const storiesData = {
  bismo: {
    title: {
      id: 'Ekspedisi Tuk Bismo: Restorasi 200 Sumur & Rorak',
      en: 'Tuk Bismo Expedition: Restoring 200 Recharge Wells & Roraks'
    },
    body: {
      id: '<p class="mb-3">Tuk Bismo yang terletak di Desa Bismo, Kecamatan Blado, Kabupaten Batang merupakan salah satu sumber air baku paling vital di lereng utara Gunung Prau/Dieng. Sumber ini menyuplai lebih dari 90% kebutuhan air bersih PDAM Batang dan ribuan kepala keluarga desa sekitar dengan baseline debit 260 liter/detik.</p><p class="mb-3">Pada tahun 2016-2017, program perintisan 200 sumur resapan dan penanaman 2.000 pohon endemik berhasil mencatat rekor kenaikan debit sebesar +9.57% di tengah tren penurunan debit regional.</p><p class="mb-3">Namun tantangan alam kembali terjadi pada Januari 2025 ketika banjir bandang dan longsor lereng menimbun 5 bak penampung. Melalui mobilisasi gotong royong komunitas dan perbaikan springbox, debit kini telah pulih stabil di angka 98.2% keandalan operasional.</p>',
      en: '<p class="mb-3">Tuk Bismo in Bismo Village, Blado District, Batang Regency is one of the most vital raw water sources on the northern slopes of Mount Dieng. It supplies over 90% of municipal water and thousands of rural families with a baseline discharge of 260 liters/second.</p><p class="mb-3">Between 2016 and 2017, constructing 200 recharge wells and planting 2,000 native trees produced a historic +9.57% flow increase contrary to regional drying trends.</p><p class="mb-3">When January 2025 flash floods damaged catchment tanks, grassroots mobilization and springbox repairs restored operational uptime to 98.2%.</p>'
    }
  },
  wonomerto: {
    title: {
      id: 'Wonomerto: Dari 12 Bulan Kekeringan Menjadi Mengalir Abadi',
      en: 'Wonomerto: From 12 Months of Drought to Everlasting Flow'
    },
    body: {
      id: '<p class="mb-3">Mata Air Wonomerto di Kecamatan Bandar, Batang sempat mengalami masa kelam pada September 2023. Kekeringan ekstrem berlangsung lebih dari 12 bulan hingga titik aliran benar-benar nol (zero baseline).</p><p class="mb-3">Sebanyak 65 KK (262 jiwa) terpaksa bergantung pada kiriman tangki air bersih darurat. Inisiatif warga dimulai dengan pemetaan kembali springshed dan pembuatan parit rorak di lahan lereng atas.</p><p class="mb-3">Air hujan yang berhasil dipulangkan ke dalam akuifer tanah akhirnya membuahkan hasil. Mata air kembali memancarkan debit 4.5 liter/detik, mengakhiri krisis air bersih warga.</p>',
      en: '<p class="mb-3">Wonomerto Spring in Bandar District, Batang suffered severe drying in September 2023. Extreme drought lasted over 12 months with zero discharge.</p><p class="mb-3">65 families (262 residents) relied on emergency tanker deliveries. Community action mapped the springshed and dug roraks across upper slopes.</p><p class="mb-3">Recharging rainwater into the aquifer successfully revived the spring at 4.5 L/s, permanently resolving the water crisis.</p>'
    }
  },
  rorak: {
    title: {
      id: 'Panduan Memulangkan Air Hujan Lewat Rorak Kontur',
      en: 'Guide: Returning Rainwater to Aquifers via Contour Roraks'
    },
    body: {
      id: '<p class="mb-3">Air hujan bukanlah limbah yang harus segera dibuang ke selokan dan dialirkan ke sungai. Dalam siklus hidrologi seimbang, sebagian besar air hujan seharusnya meresap ke dalam bumi untuk mengisi cadangan air bawah tanah (groundwater).</p><p class="mb-3">Pembangunan rorak seluas 200x50x50 cm dengan biaya Rp20.000 per unit terbukti menjadi investasi konservasi air paling hemat biaya dan berdampak langsung bagi masyarakat agraris pegunungan.</p>',
      en: '<p class="mb-3">Rainwater is a resource, not wastewater to be channeled away. In a balanced hydrological cycle, rain must infiltrate deep into the earth to recharge groundwater stores.</p><p class="mb-3">Standard 200x50x50 cm contour trenches costing Rp20,000/unit represent the most cost-effective water conservation investment for agrarian mountain communities.</p>'
    }
  },
  'artikel-debit': {
    title: {
      id: 'Mengapa Debit Mata Air di Lereng Jawa Mengalami Penurunan?',
      en: 'Why Are Java Slope Water Springs Experiencing Declining Flow?'
    },
    body: {
      id: '<p class="mb-3">Kajian hidrologi terbaru menunjukkan bahwa faktor dominan penurunan debit bukanlah semata penurunan curah hujan tahunan, melainkan hilangnya koefisien infiltrasi tanah akibat pemadatan lahan dan konversi hutan ke tanaman sayur semusim tanpa terasering memadai.</p><p class="mb-3">Ketika air hujan jatuh di lahan terbuka, lebih dari 70% air langsung menjadi limpasan permukaan (surface runoff) yang memicu erosi, bukan menjadi air tanah. Solusinya adalah rekayasa lubang rorak dan penghijauan pohon berakar tunjang.</p>',
      en: '<p class="mb-3">Recent hydrological assessments show that the primary driver of drying springs is not total annual rainfall drop, but degraded soil infiltration capacity caused by land compaction and forest conversion to seasonal vegetable crops without proper terracing.</p><p class="mb-3">On bare slopes, over 70% of rain turns into erosive runoff rather than groundwater. Rorak engineering and deep-root reforestation provide the definitive antidote.</p>'
    }
  },
  'catatan-ekspedisi': {
    title: {
      id: '30+ Mata Air, Satu Gerakan: Ekspedisi Komunitas Batang & Dieng',
      en: '30+ Springs, One Movement: Batang & Dieng Community Expedition'
    },
    body: {
      id: '<p class="mb-3">Perjalanan tim relawan BelikHub mendokumentasikan 30 mata air purba di kawasan pegunungan Batang dan Dieng. Di setiap desa, ditemukan cerita bagaimana kakek-nenek leluhur menjaga kelestarian mata air dengan aturan adat tanpa tertulis.</p><p class="mb-3">Gerakan BelikHub mendigitalisasi data kearifan tersebut ke dalam sistem pemantauan modern berbasis koordinat publik yang terlindungi.</p>',
      en: '<p class="mb-3">BelikHub volunteer expeditions documented 30 ancient springs in Batang and Mount Dieng. In every village, elders shared unwritten customary rules that kept springs flowing for generations.</p><p class="mb-3">BelikHub digitizes this traditional heritage into modern, privacy-protected geospatial systems.</p>'
    }
  },
  'kajian-rorak': {
    title: {
      id: 'Kajian Partisipatif: Dampak Rorak Terhadap Kenaikan Air Tanah',
      en: 'Participatory Assessment: Impact of Roraks on Groundwater Rise'
    },
    body: {
      id: '<p class="mb-3">Hasil pemantauan 142 rorak di Gunungkidul dan Batang membuktikan peningkatan tinggi muka air sumur dangkal warga sedalam 0.8 hingga 1.4 meter pasca musim hujan 2025/2026.</p>',
      en: '<p class="mb-3">Monitoring 142 rorak trenches in Gunungkidul and Batang verified an average water table elevation of 0.8 to 1.4 meters in local shallow wells after the 2025/2026 monsoon.</p>'
    }
  },
  'wawancara-marno': {
    title: {
      id: 'Kisah Pak Marno: 35 Tahun Menjaga Belik Rowo Santen',
      en: 'The Story of Pak Marno: 35 Years Guarding Belik Rowo Santen'
    },
    body: {
      id: '<p class="mb-3">"Air itu punya nyawa. Kalau kita rawat hulunya, dia akan menghidupi anak cucu kita sampai ratusan tahun ke depan," ungkap Pak Marno (68), sesepuh desa penjaga Rowo Santen.</p>',
      en: '<p class="mb-3">"Water is alive. If we respect and protect its upstream source, it will sustain our grandchildren for hundreds of years to come," shares Pak Marno (68), village water caretaker.</p>'
    }
  }
};

$$('.story-read-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const isEn = currentLanguage === 'en';
    const langKey = isEn ? 'en' : 'id';
    const key = btn.dataset.story;
    const story = storiesData[key] || {
      title: { id: 'Dokumentasi Lapangan BelikHub', en: 'BelikHub Field Documentation' },
      body: { id: '<p class="muted">Dokumentasi lengkap program konservasi air masyarakat.</p>', en: '<p class="muted">Complete documentation of community water conservation.</p>' }
    };

    openModal(
      story.title[langKey],
      `
      <div class="bh-modal-stack">
        <div class="bh-modal-note">${story.body[langKey]}</div>
        <button type="button" data-close-modal class="btn btn-teal">${isEn ? 'Close Notes' : 'Tutup Catatan'}</button>
      </div>
      `,
      true
    );
  });
});

// Partnership Form
const partnerForm = $('#partner-form');
partnerForm?.querySelectorAll('input, select, textarea').forEach((input) => {
  input.addEventListener('input', () => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    const err = field.querySelector('.field__error');
    if (err) err.textContent = '';
  });
});

partnerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isEn = currentLanguage === 'en';
  let firstInvalid = null;
  partnerForm.querySelectorAll('input, select, textarea').forEach((input) => {
    const field = input.closest('.field');
    const err = field?.querySelector('.field__error');
    const valid = input.checkValidity();
    if (field) field.classList.toggle('is-invalid', !valid);
    if (!valid) {
      input.setAttribute('aria-invalid', 'true');
      if (err?.id) input.setAttribute('aria-describedby', err.id);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    if (err) {
      err.textContent = valid
        ? ''
        : (isEn ? 'Please complete this field accurately.' : 'Mohon lengkapi kolom ini dengan benar.');
    }
    if (!valid && !firstInvalid) firstInvalid = input;
  });
  const noteEl = $('#partner-note');
  if (firstInvalid) {
    if (noteEl) noteEl.textContent = isEn ? 'Please complete required partnership fields.' : 'Mohon lengkapi kolom wajib formulir kemitraan.';
    firstInvalid.focus();
    return;
  }
  const submitBtn = partnerForm.querySelector('button[type=submit]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = isEn ? 'Submitting Inquiry…' : 'Mengirim Permintaan…';
  }

  const formData = new FormData(partnerForm);
  const notes = String(formData.get('notes') || '').trim();
  try {
    await apiRequest(
      '/api/partnerships',
      {
        name: formData.get('name'),
        institution: formData.get('institution'),
        email: formData.get('email'),
        need: formData.get('need'),
        ...(notes ? { notes } : {})
      },
      { auth: false }
    );

    if (noteEl) noteEl.textContent = isEn ? 'Your partnership inquiry has been received by the BelikHub team.' : 'Permintaan kemitraan Anda telah diterima tim BelikHub.';
    toast(isEn ? 'Partnership inquiry sent successfully!' : 'Minat kemitraan berhasil dikirim!');
    partnerForm.reset();
  } catch (err) {
    if (noteEl) noteEl.textContent = err.message;
    toast(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = translations[currentLanguage]['partner.btn_submit'];
    }
  }
});

// Newsletter Subscription
const newsletterForm = $('#newsletter-form');
newsletterForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isEn = currentLanguage === 'en';
  const input = newsletterForm.querySelector('input[name=email]');
  const statusEl = $('#newsletter-status');
  const email = input?.value?.trim();
  if (!email || !input?.checkValidity()) {
    input?.setAttribute('aria-invalid', 'true');
    if (statusEl) statusEl.textContent = isEn ? 'Please enter a valid email address.' : 'Mohon masukkan alamat email yang valid.';
    input?.focus();
    return;
  }
  input?.removeAttribute('aria-invalid');

  const submitBtn = newsletterForm.querySelector('button[type=submit]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : {};
    if (!res.ok || !isJson) {
      throw new Error(data.error || (isEn ? 'Newsletter service is currently unavailable.' : 'Layanan langganan kabar belum aktif pada server ini.'));
    }
    if (statusEl) statusEl.textContent = data.message || (isEn ? 'Thank you for subscribing!' : 'Terima kasih telah berlangganan!');
    toast(isEn ? 'Your email has been registered!' : 'Email Anda berhasil didaftarkan!');
    newsletterForm.reset();
  } catch (err) {
    if (statusEl) statusEl.textContent = err.message;
    toast(err.message);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// Footer Informational Modals (FAQ, Mission, Privacy)
const footerModalContent = {
  faq: {
    title: { id: 'Pertanyaan yang Sering Diajukan (FAQ)', en: 'Frequently Asked Questions (FAQ)' },
    body: {
      id: `
        <div class="bh-modal-stack">
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">Apa itu BelikHub?</h3>
            <p class="bh-modal-note">BelikHub adalah platform komunitas terbuka untuk mendokumentasikan, memantau debit, dan memulihkan mata air tradisional (belik) di seluruh Nusantara melalui partisipasi warga dan kemitraan kolaboratif.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">Apa itu Rorak dan mengapa penting?</h3>
            <p class="bh-modal-note">Rorak adalah parit buntu berukuran baku 200x50x50 cm yang digali memotong kemiringan kontur tanah. Rorak menjebak limpasan air hujan agar tidak terbuang sia-sia melainkan meresap mengisi kembali akuifer air tanah.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">Bagaimana cara mendapatkan poin relawan?</h3>
            <p class="bh-modal-note">Daftar akun relawan, kunjungi mata air sekitar Anda, dan kirimkan laporan survei, penanaman pohon, atau pembuatan rorak. Poin akan otomatis diverifikasi tim kurasi.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">Apakah data lokasi mata air aman dari privatisasi komersial?</h3>
            <p class="bh-modal-note">Sangat aman. Seluruh koordinat publik di peta BelikHub disamarkan (fuzzed) dalam radius grid ~5 km untuk mencegah eksploitasi air komersial tanpa izin warga setempat.</p>
          </div>
        </div>
      `,
      en: `
        <div class="bh-modal-stack">
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">What is BelikHub?</h3>
            <p class="bh-modal-note">BelikHub is an open grassroots platform to document, monitor discharge, and restore traditional natural springs (belik) across Indonesia through community action and partnerships.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">What is a Rorak and why is it important?</h3>
            <p class="bh-modal-note">A rorak is a 200x50x50 cm dead-end trench dug along slope contours. It traps rainfall runoff, forcing it to percolate into groundwater aquifers rather than washing away as topsoil-eroding torrents.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">How do I earn volunteer points?</h3>
            <p class="bh-modal-note">Sign up for a volunteer account, observe nearby springs, and submit survey, planting, or trench reports. Points are credited once verified by curators.</p>
          </div>
          <div class="bh-modal-box">
            <h3 class="bh-modal-subtitle">Are spring locations protected from private exploitation?</h3>
            <p class="bh-modal-note">Yes. All public coordinates on BelikHub are fuzzed within ~5 km grids to protect vital community water sources from commercial exploitation.</p>
          </div>
        </div>
      `
    }
  },
  misi: {
    title: { id: 'Misi & Peta Jalan Pemulihan 2030', en: 'Mission & 2030 Restoration Roadmap' },
    body: {
      id: `
        <div class="bh-modal-stack">
          <p class="bh-modal-note">BelikHub berkomitmen mengembalikan kedaulatan air bersih masyarakat desa melalui 3 pilar aksi strategis hingga tahun 2030:</p>
          <div class="bh-modal-box">
            <p class="label c-accent">Pilar 1 &middot; 88 Mata Air Kritis</p>
            <p class="bh-modal-note">Restorasi menyeluruh pada 88 mata air kritis berdebit besar di lereng vulkanik Jawa Tengah &amp; DIY.</p>
          </div>
          <div class="bh-modal-box">
            <p class="label c-accent">Pilar 2 &middot; 10.000 Rorak Resapan</p>
            <p class="bh-modal-note">Membangun benteng serapan air hujan di kawasan perkebunan rakyat untuk meresapkan &ge; 20 juta liter air per tahun.</p>
          </div>
          <div class="bh-modal-box">
            <p class="label c-accent">Pilar 3 &middot; Perlindungan Berbasis Komunitas</p>
            <p class="bh-modal-note">Memberdayakan kelompok pengawas air desa (Satgas Belik) dengan instrumen pemantauan mandiri dan legalitas desa.</p>
          </div>
        </div>
      `,
      en: `
        <div class="bh-modal-stack">
          <p class="bh-modal-note">BelikHub is dedicated to restoring community water sovereignty through 3 strategic pillars through 2030:</p>
          <div class="bh-modal-box">
            <p class="label c-accent">Pillar 1 &middot; 88 Critical Springs</p>
            <p class="bh-modal-note">Comprehensive restoration of 88 high-volume critical springs across volcanic slopes in Central Java &amp; Yogyakarta.</p>
          </div>
          <div class="bh-modal-box">
            <p class="label c-accent">Pillar 2 &middot; 10,000 Infiltration Roraks</p>
            <p class="bh-modal-note">Constructing groundwater infiltration trenches on rural farmlands to absorb ≥ 20 million liters of rainwater annually.</p>
          </div>
          <div class="bh-modal-box">
            <p class="label c-accent">Pillar 3 &middot; Community-Led Governance</p>
            <p class="bh-modal-note">Empowering village water taskforces with self-monitoring toolkits and village council legal protections.</p>
          </div>
        </div>
      `
    }
  },
  privasi: {
    title: { id: 'Kebijakan Privasi & Perlindungan Data Sumber Air', en: 'Privacy & Water Source Data Protection' },
    body: {
      id: `
        <div class="bh-modal-stack">
          <p class="bh-modal-note">BelikHub menjunjung tinggi privasi data pengguna dan kelestarian sumber daya air publik:</p>
          <ul class="bh-modal-list">
            <li><strong>Perlindungan Koordinat:</strong> Koordinat GPS asli mata air hanya disimpan di basis data terenkripsi untuk kebutuhan audit konservasi. Peta publik menerapkan penyamaran grid radius 5 km.</li>
            <li><strong>Data Pribadi Relawan:</strong> Email, nomor telepon WhatsApp, dan identitas hanya digunakan untuk koordinasi aksi konservasi dan tidak pernah diperjualbelikan kepada pihak ketiga.</li>
            <li><strong>Transparansi Penggunaan Dana:</strong> Pemesanan rorak diaudit secara terbuka dan disalurkan langsung kepada tenaga penggali lokal dari warga desa setempat.</li>
          </ul>
        </div>
      `,
      en: `
        <div class="bh-modal-stack">
          <p class="bh-modal-note">BelikHub upholds user privacy and the ecological preservation of public water resources:</p>
          <ul class="bh-modal-list">
            <li><strong>Coordinate Protection:</strong> Exact spring coordinates are stored in encrypted databases for conservation audits only. The public map enforces a strict 5 km grid-fuzzing protocol.</li>
            <li><strong>Volunteer Data:</strong> Emails, WhatsApp numbers, and personal info are solely used for field task coordination and never monetized or shared.</li>
            <li><strong>Fund Transparency:</strong> Rorak digging fees are disbursed directly to local village diggers and audited openly.</li>
          </ul>
        </div>
      `
    }
  }
};

$$('.footer-modal-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isEn = currentLanguage === 'en';
    const langKey = isEn ? 'en' : 'id';
    const modalKey = btn.dataset.modal;
    const content = footerModalContent[modalKey];
    if (!content) return;
    openModal(
      content.title[langKey],
      `
      <div class="bh-modal-stack">
        ${content.body[langKey]}
        <button type="button" data-close-modal class="btn btn-teal">${isEn ? 'Close Information' : 'Tutup Informasi'}</button>
      </div>
      `,
      true
    );
  });
});
