// assets/app.js - BelikHub Platform V2 Interactive Client Logic with Complete i18n
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

// DOM Utilities
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
};

// Header scroll effect
const siteHeader = document.getElementById('site-header');
const isHomePage = document.documentElement.dataset.page === 'home';
const syncHeader = () => {
  if (!siteHeader) return;
  const transparent = isHomePage && window.scrollY < 40;
  siteHeader.classList.toggle('hero-nav', transparent);
  siteHeader.classList.toggle('nav-scrolled', !transparent);
};
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

// Active route highlight
const currentPath = location.pathname.replace(/\/+$/, '') || '/';
document.querySelectorAll('header .nav-links a, header .mobile-link').forEach((link) => {
  if (link.pathname === currentPath) link.setAttribute('aria-current', 'page');
});

// Mobile menu controls
const menuToggle = document.getElementById('menu-toggle');
const closeMenu = document.getElementById('close-menu');
const mobileMenu = document.getElementById('mobile-menu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
}
if (closeMenu && mobileMenu) {
  closeMenu.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    document.body.style.overflow = 'auto';
  });
}
document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu?.classList.add('hidden');
    document.body.style.overflow = 'auto';
  });
});

// Theme Toggle
const themeToggleButtons = $$('.theme-toggle');
const syncThemeIcons = (isDark) => {
  $('#icon-moon')?.classList.toggle('hidden', isDark);
  $('#icon-sun')?.classList.toggle('hidden', !isDark);
  $('#icon-moon-mobile')?.classList.toggle('hidden', isDark);
  $('#icon-sun-mobile')?.classList.toggle('hidden', !isDark);
};
themeToggleButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    syncThemeIcons(isDark);
    localStorage.setItem('belikhub-theme', isDark ? 'dark' : 'light');
    toast(isDark ? 'Tema gelap aktif' : 'Tema terang aktif');
  });
});
if (localStorage.getItem('belikhub-theme') === 'dark') {
  document.documentElement.classList.add('dark');
  syncThemeIcons(true);
} else {
  syncThemeIcons(false);
}

// =========================================================================
// Complete Internationalization (i18n) Engine (ID / EN)
// =========================================================================
export const translations = {
  id: {
    // Nav
    'nav.story': 'Cerita kami',
    'nav.impact': 'Dampak',
    'nav.map': 'Jelajahi peta',
    'nav.rorak': 'Aksi rorak',
    'nav.learn': 'Pusat belajar',
    'nav.media': 'Kabar & Media',
    'nav.community': 'Komunitas & Relawan',
    'nav.login': 'Masuk',
    'nav.logout': 'Keluar',
    'nav.join': 'Bergabung',
    'nav.join_action': 'Bergabung Aksi',

    // Hero
    'hero.tag': 'Gerakan Pemulihan Mata Air Komunitas',
    'hero.title': 'Menjaga air yang menghidupi desa.',
    'hero.intro': 'Kami mendokumentasikan, memulihkan, dan merawat mata air bersama warga lokal—menggabungkan kearifan lokal, teknologi pemantauan, dan aksi rorak resapan.',
    'hero.btn_map': 'Jelajahi Peta',
    'hero.btn_impact': 'Lihat Capaian Dampak',
    'hero.btn_action': 'Aksi Pulangkan Air',

    // Visi
    'visi.section': '§ Visi gerakan — Dari hulu ke hilir',
    'visi.title': 'Mata air terjaga, kehidupan tumbuh bersama.',
    'visi.desc': 'Lebih dari sekadar sumber air, belik adalah jantung sosial pedesaan Nusantara. Saat debit berkurang, petani kehilangan irigasi, warga kesulitan air minum, dan ekosistem terancam. BelikHub hadir mengembalikan debit air lewat restorasi terukur.',
    'visi.btn_volunteer': 'Bergabung Menjadi Relawan',
    'visi.btn_roadmap': 'Pelajari Peta Jalan 2030',

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
    'impact.status_loading': 'Memuat data capaian…',
    'impact.status_ready': 'Data diverifikasi dari laporan lapangan & satgas hidrologi komunitas.',

    // Home Stories
    'stories.tag': '§ Cerita lapangan — Saksi pemulihan',
    'stories.title': 'Pemulihan terlihat dari dekat.',
    'stories.lead': 'Dari Tuk Bismo di lereng Dieng hingga Wonomerto di Batang, dengarkan kisah warga yang kembali merasakan gemericik air melimpah.',
    'stories.btn_all': 'Jelajahi semua cerita & publikasi',
    'stories.btn_read': 'Baca Kisah Lengkap',
    'stories.btn_guide': 'Baca Panduan',

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
    'map.title': 'Pantau kondisi mata air & aksi lapangan.',
    'map.lead': 'Jelajahi mata air baseline resmi (RISPAM & Pemda) serta titik laporan aksi komunitas. Koordinat publik disamarkan (~5 km) untuk melindungi sumber air dari eksploitasi berlebihan.',
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
    'dash.title': 'Perubahan yang dirawat bersama.',
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

    // Community
    'community.section': '§ 03 — Aktivitas komunitas',
    'community.title': 'Kontribusi kecil. Jejak yang terlihat.',
    'community.lead': 'Kirim laporan dari lapangan, kumpulkan poin relawan, dan bantu tim memantau kondisi belik secara berkelanjutan.',
    'community.points_title': 'Sistem Poin BelikHub',
    'community.points_desc': 'Poin dikreditkan ke akun Anda setelah laporan diverifikasi oleh tim kurasi. Capai 20.000 poin untuk mengajukan proyek konservasi mandiri.',
    'community.btn_points': 'Lihat Rincian Poin',
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
    'rorak.title': 'Pulangkan air hujan ke rumahnya.',
    'rorak.lead': 'Rorak adalah parit resapan yang memotong aliran limpasan permukaan (surface runoff), menjebak air hujan agar meresap mengisi kembali akuifer pembentuk mata air. Warga menggali, pemilik lahan memesan, BelikHub mengaudit.',
    'rorak.subtitle': 'Buat rorak di lahan Anda atau jadi tenaga penggali',
    'rorak.desc': 'Setiap 1 unit rorak standar (2m x 0.5m x 0.5m) berpotensi meresapkan hingga 2.000 liter air hujan per musim ke dalam tanah, mencegah erosi tanah pucuk dan banjir bandang hilir.',
    'rorak.btn_order': 'Pesan Rorak (Rp20.000/unit)',
    'rorak.btn_maker': 'Daftar Jadi Pembuat Rorak',
    'rorak.spec_title': 'Spesifikasi Standar Rorak BelikHub',
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
    'partner.title': 'Bermitra untuk pemulihan skala lanskap.',
    'partner.lead': 'Bekerja sama dengan pemerintah daerah, BUMDes, PDAM, perguruan tinggi, dan korporasi untuk program CSR berdampak jangka panjang.',
    'partner.subtitle': 'Bentuk Kolaborasi BelikHub',
    'partner.form_title': 'Formulir Minat Kemitraan',
    'partner.form_desc': 'Sampaikan rencana atau kebutuhan konservasi air institusi Anda.',
    'partner.label_name': 'Nama Penanggung Jawab',
    'partner.label_inst': 'Nama Organisasi / Perusahaan / Instansi',
    'partner.label_email': 'Email Resmi',
    'partner.label_need': 'Kategori Kebutuhan',
    'partner.btn_submit': 'Kirim Minat Kemitraan',

    // Learn
    'learn.section': '§ 07 — Pusat belajar praktis',
    'learn.title': 'Belajar sebelum bergerak ke lapangan.',
    'learn.lead': 'Panduan teknis praktis yang disusun bersama praktisi hidrologi dan masyarakat adat penjaga sumber air.',
    'learn.tab_courses': 'Modul Kursus Lapangan',
    'learn.tab_readings': 'Bacaan & Kajian',
    'learn.btn_open': 'Buka Modul Kursus',
    'learn.btn_read_article': 'Baca Artikel Penuh',
    'learn.btn_read_story': 'Baca Kisah Penuh',

    // Media
    'media.section': '§ 08 — Dokumentasi audio visual',
    'media.title': 'Kabar & cerita dari lapangan.',
    'media.youtube': 'Kunjungi Kanal YouTube BelikHub',
    'media.video_tag': 'Dokumenter 2026',
    'media.video_title': 'Menghidupkan Kembali Belik Desa yang Sempat Padam',
    'media.video_desc': 'Saksikan bagaimana sinergi warga desa, pemuda, dan tetua adat bahu membahu merestorasi mata air dengan teknik konservasi sederhana berbiaya rendah.',
    'media.read_summary': 'Baca Ringkasan Kajian',
    'media.read_interview': 'Baca Wawancara',

    // Footer
    'footer.about': 'Platform komunitas untuk memantau, memulihkan, dan melindungi mata air Indonesia berbasis data lapangan dan partisipasi warga.',
    'footer.newsletter_title': 'Berlangganan Kabar Pemulihan',
    'footer.newsletter_placeholder': 'Masukkan email Anda',
    'footer.newsletter_btn': 'Daftar',
    'footer.explore': 'Jelajahi',
    'footer.community_actions': 'Aksi Komunitas',
    'footer.order_rorak': 'Pemesanan Rorak Tanah',
    'footer.join_maker': 'Pendaftaran Tukang Rorak',
    'footer.csr': 'Program Kemitraan CSR',
    'footer.transparency': 'Transparansi & Info',
    'footer.faq': 'Tanya Jawab (FAQ)',
    'footer.mission': 'Misi & Peta Jalan 2030',
    'footer.privacy': 'Kebijakan Privasi & Data',
    'footer.copyright': '© 2026 BelikHub Indonesia. Dibangun untuk kelestarian air Nusantara.'
  },

  en: {
    // Nav
    'nav.story': 'Our Story',
    'nav.impact': 'Impact',
    'nav.map': 'Explore Map',
    'nav.rorak': 'Rorak Action',
    'nav.learn': 'Learning Hub',
    'nav.media': 'News & Media',
    'nav.community': 'Community & Volunteers',
    'nav.login': 'Sign In',
    'nav.logout': 'Sign Out',
    'nav.join': 'Join Us',
    'nav.join_action': 'Join the Movement',

    // Hero
    'hero.tag': 'Community Water Spring Restoration Movement',
    'hero.title': 'Protecting the water that sustains villages.',
    'hero.intro': 'We document, restore, and protect natural water springs alongside local villagers—combining traditional wisdom, geospatial monitoring, and infiltration trench (rorak) actions.',
    'hero.btn_map': 'Explore Map',
    'hero.btn_impact': 'View Verified Impact',
    'hero.btn_action': 'Return Water Action',

    // Visi
    'visi.section': '§ Movement Vision — From Source to Stream',
    'visi.title': 'Healthy springs, thriving communities.',
    'visi.desc': 'More than just a water source, the belik is the social heart of rural Indonesia. When discharge declines, farmers lose irrigation, families face water scarcity, and ecosystems collapse. BelikHub restores water flow through measurable grassroots action.',
    'visi.btn_volunteer': 'Join as a Volunteer',
    'visi.btn_roadmap': 'Explore 2030 Roadmap',

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
    'map.title': 'Monitor spring health & community actions.',
    'map.lead': 'Explore baseline spring data (RISPAM & Regional Government) alongside verified grassroots reports. Public coordinates are snapped to ~5 km grids to protect springs from illegal over-extraction.',
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
    'dash.title': 'Change nurtured together.',
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

    // Community
    'community.section': '§ 03 — Community Activities',
    'community.title': 'Small actions. Visible footprints.',
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
    'rorak.title': 'Return rainwater to its home.',
    'rorak.lead': 'Roraks are contour infiltration trenches that intercept surface runoff, trapping rainwater so it seeps down to feed spring aquifers. Villagers dig, landowners order, BelikHub verifies.',
    'rorak.subtitle': 'Build trenches on your land or join as a paid digger',
    'rorak.desc': 'A standard 1-unit rorak (2m x 0.5m x 0.5m) infiltrates up to 2,000 liters of rainwater per season into the soil, halting topsoil erosion and downstream flash floods.',
    'rorak.btn_order': 'Order Roraks (Rp20,000/unit)',
    'rorak.btn_maker': 'Register as a Rorak Digger',
    'rorak.spec_title': 'BelikHub Standard Rorak Specifications',
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
    'partner.title': 'Partnering for landscape-scale recovery.',
    'partner.lead': 'Collaborating with local governments, village enterprises (BUMDes), municipal water utilities (PDAM), universities, and CSR programs for long-term impact.',
    'partner.subtitle': 'BelikHub Collaboration Pillars',
    'partner.form_title': 'Partnership Inquiry Form',
    'partner.form_desc': 'Share your institution’s water conservation goals or plans.',
    'partner.label_name': 'Contact Person Name',
    'partner.label_inst': 'Organization / Company / Institution Name',
    'partner.label_email': 'Official Work Email',
    'partner.label_need': 'Partnership Category',
    'partner.btn_submit': 'Submit Partnership Inquiry',

    // Learn
    'learn.section': '§ 07 — Practical Learning Hub',
    'learn.title': 'Learn before taking field action.',
    'learn.lead': 'Practical field guides prepared alongside hydrogeologists and indigenous water guardians.',
    'learn.tab_courses': 'Field Course Modules',
    'learn.tab_readings': 'Readings & Research',
    'learn.btn_open': 'Open Course Module',
    'learn.btn_read_article': 'Read Full Article',
    'learn.btn_read_story': 'Read Full Story',

    // Media
    'media.section': '§ 08 — Audiovisual Documentation',
    'media.title': 'Stories & news from the field.',
    'media.youtube': 'Visit BelikHub YouTube Channel',
    'media.video_tag': '2026 Documentary',
    'media.video_title': 'Reviving Extinguished Village Springs',
    'media.video_desc': 'Witness how villagers, youth volunteers, and village elders join forces to restore springs using low-cost, high-impact conservation methods.',
    'media.read_summary': 'Read Research Summary',
    'media.read_interview': 'Read Elder Interview',

    // Footer
    'footer.about': 'Community platform to document, restore, and protect Indonesian water springs through field data and citizen participation.',
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
    'footer.copyright': '© 2026 BelikHub Indonesia. Built for the preservation of Indonesian waters.'
  }
};

let currentLanguage = 'id';

const setLanguage = (lang, showToast = false) => {
  currentLanguage = lang === 'en' ? 'en' : 'id';
  const dict = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;

  // 1. Translate all text elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });

  // 2. Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) el.placeholder = dict[key];
  });

  // 3. Update Language toggle labels
  const label = currentLanguage.toUpperCase();
  $$('.lang-text, .lang-text-mobile').forEach((el) => { el.textContent = label; });

  // 4. Update Dropdown Checkmarks
  $$('.lang-check-id').forEach((el) => el.classList.toggle('hidden', currentLanguage !== 'id'));
  $$('.lang-check-en').forEach((el) => el.classList.toggle('hidden', currentLanguage !== 'en'));

  // 5. Close Dropdowns
  $('#language-menu-desktop')?.classList.remove('open');
  $('#language-menu-mobile')?.classList.remove('open');

  localStorage.setItem('belikhub-language', currentLanguage);

  if (showToast) {
    toast(currentLanguage === 'en' ? 'Language switched to English.' : 'Bahasa diubah ke Bahasa Indonesia.');
  }
};

// Dropdown Toggle Handlers
$('#lang-toggle')?.addEventListener('click', (e) => {
  e.stopPropagation();
  $('#language-menu-desktop')?.classList.toggle('open');
  $('#language-menu-mobile')?.classList.remove('open');
});

$('#lang-toggle-mobile')?.addEventListener('click', (e) => {
  e.stopPropagation();
  $('#language-menu-mobile')?.classList.toggle('open');
  $('#language-menu-desktop')?.classList.remove('open');
});

// Click outside closes dropdown
document.addEventListener('click', (e) => {
  if (!e.target.closest('#lang-toggle') && !e.target.closest('#language-menu-desktop')) {
    $('#language-menu-desktop')?.classList.remove('open');
  }
  if (!e.target.closest('#lang-toggle-mobile') && !e.target.closest('#language-menu-mobile')) {
    $('#language-menu-mobile')?.classList.remove('open');
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

// Video fallback handling
const mediaVideo = $('#media video');
if (mediaVideo) {
  const hideMediaFallback = () => mediaVideo.classList.add('media-video-ready');
  mediaVideo.addEventListener('loadeddata', hideMediaFallback, { once: true });
  if (mediaVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) hideMediaFallback();
}

// Modal System
const modal = $('#modal');
const modalContent = $('#modal-content');
const closeModal = () => {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (modalContent) modalContent.innerHTML = '';
};
const openModal = (title, bodyHtml, isLarge = false) => {
  if (!modal || !modalContent) return;
  const card = modal.querySelector('.modal-card');
  card?.classList.toggle('modal-card-lg', isLarge);
  modalContent.innerHTML = `
    <div class="flex items-start justify-between border-b p-5 sm:p-6" style="border-color:var(--teks)">
      <div>
        <p class="label c-accent">${currentLanguage === 'en' ? 'BelikHub · Field Platform' : 'BelikHub · Platform Lapangan'}</p>
        <h3 class="serif text-xl sm:text-2xl font-semibold mt-1 tracking-tight">${title}</h3>
      </div>
      <button type="button" data-close-modal class="nav-btn w-9 text-2xl font-light leading-none" aria-label="Tutup">&times;</button>
    </div>
    <div class="p-5 sm:p-6 text-sm leading-relaxed">${bodyHtml}</div>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
};
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Auth & Firebase Setup
let auth = null;
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
    userBadges.forEach((b) => b.classList.add('flex'));
    const name = user.displayName || user.email?.split('@')[0] || (currentLanguage === 'en' ? 'Volunteer' : 'Relawan');
    userDisplayNames.forEach((el) => { el.textContent = name; });

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
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
    userBadges.forEach((b) => b.classList.remove('flex'));
  }
};

const initFirebase = async () => {
  try {
    const cfg = await (await fetch('/api/firebase-config')).json();
    const app = initializeApp(cfg);
    auth = getAuth(app);
    onAuthStateChanged(auth, (user) => updateAuthUI(user));
  } catch (err) {
    console.warn('Firebase init warning:', err);
  }
};
initFirebase();

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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || (currentLanguage === 'en' ? 'Request failed' : 'Permintaan gagal diproses'));
  return data;
};

// Login / Register Modal
const openLoginModal = () => {
  mobileMenu?.classList.add('hidden');
  document.body.style.overflow = 'auto';

  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'Volunteer Account Sign In' : 'Masuk ke Akun Relawan',
    `
    <form id="auth-form" class="space-y-4">
      <p class="muted text-xs">${isEn ? 'Sign in to submit field reports, order roraks, and track your volunteer contribution points.' : 'Masuk untuk mencatat laporan lapangan, memesan rorak, dan memantau poin kontribusi Anda.'}</p>
      <label class="block text-xs font-semibold">Email
        <input required type="email" name="email" placeholder="nama@email.com" class="field mt-1" />
      </label>
      <label class="block text-xs font-semibold">Password
        <input name="password" required minlength="6" type="password" placeholder="••••••••" class="field mt-1" />
      </label>
      <div class="pt-2">
        <button id="auth-submit-btn" class="btn btn-teal w-full" type="submit">${isEn ? 'Sign In' : 'Masuk'}</button>
        <button id="auth-register-btn" class="btn btn-line mt-3 w-full" type="button">${isEn ? 'Register New Volunteer Account' : 'Daftar Akun Relawan Baru'}</button>
      </div>
    </form>
    `
  );

  const form = $('#auth-form');
  if (!form) return;

  const runAuth = async (fn, label, btn) => {
    if (!auth) {
      toast(isEn ? 'Connecting to auth service… Please try again in a moment.' : 'Menghubungkan ke layanan autentikasi… Coba sesaat lagi.');
      return;
    }
    const data = new FormData(form);
    if (!form.reportValidity()) return;
    btn.disabled = true;
    btn.textContent = isEn ? 'Processing…' : 'Memproses…';
    try {
      const cred = await fn(auth, data.get('email'), data.get('password'));
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
    runAuth(signInWithEmailAndPassword, isEn ? 'Sign In' : 'Masuk', $('#auth-submit-btn'));
  });
  $('#auth-register-btn')?.addEventListener('click', (ev) => {
    runAuth(createUserWithEmailAndPassword, isEn ? 'Register' : 'Daftar', ev.currentTarget);
  });
};

loginBtns.forEach((btn) => btn.addEventListener('click', openLoginModal));
logoutBtns.forEach((btn) =>
  btn.addEventListener('click', async () => {
    try {
      if (auth) await signOut(auth);
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
  const pts = userProfileData.points || 0;
  const role = userProfileData.role || 'user';

  openModal(
    isEn ? 'Water Volunteer Profile' : 'Profil Relawan Mata Air',
    `
    <div class="space-y-4">
      <div class="flex items-center gap-4 p-4 frame" style="background:var(--tint)">
        <div class="h-14 w-14 rounded-full bg-forest text-white flex items-center justify-center serif text-2xl font-bold">
          ${name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 class="font-bold text-base">${name}</h4>
          <p class="muted text-xs">${email}</p>
          <span class="stamp c-accent mt-1 inline-block">${role === 'admin' ? (isEn ? 'Admin' : 'Pengurus Admin') : (isEn ? 'Registered Volunteer' : 'Relawan Terdaftar')}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="frame p-4 text-center">
          <p class="label c-accent">${isEn ? 'Accumulated Points' : 'Poin Terkumpul'}</p>
          <p class="serif text-3xl font-bold mt-1 text-forest">${pts.toLocaleString('id-ID')}</p>
          <p class="muted text-xs mt-1">${isEn ? 'Verified points' : 'Poin diverifikasi'}</p>
        </div>
        <div class="frame p-4 text-center">
          <p class="label c-accent">${isEn ? 'Community Target' : 'Target Mandiri'}</p>
          <p class="serif text-3xl font-bold mt-1">20.000</p>
          <p class="muted text-xs mt-1">${isEn ? 'To sponsor a spring' : 'Untuk buka proyek'}</p>
        </div>
      </div>

      <div class="border-t pt-4" style="border-color:var(--line)">
        <p class="label c-accent mb-2">${isEn ? 'Activity Guide' : 'Panduan Aktivitas'}</p>
        <p class="text-xs text-muted leading-relaxed">${isEn ? 'Every field survey earns +100 points, building roraks earns +500 points, and restoring springs earns +1,000 points. Please ensure GPS coordinates are attached during surveys.' : 'Setiap survei lapangan bernilai +100 poin, pembangunan rorak +500 poin, dan restorasi mata air +1.000 poin. Pastikan melampirkan koordinat GPS saat survei.'}</p>
      </div>

      <button id="profile-logout-btn" class="btn btn-line w-full text-xs font-bold">${isEn ? 'Sign Out of Account' : 'Keluar dari Akun'}</button>
    </div>
    `
  );

  $('#profile-logout-btn')?.addEventListener('click', async () => {
    closeModal();
    if (auth) await signOut(auth);
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
const loadImpactStats = async () => {
  const isEn = currentLanguage === 'en';
  impactStatus.forEach((s) => { s.textContent = isEn ? 'Loading verified impact metrics…' : 'Memuat capaian terverifikasi…'; });
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const stats = await res.json();
    const byType = stats.byType || {};

    const values = {
      totalApproved: stats.totalApproved ?? 48,
      restoration: byType['Restorasi Mata Air'] ?? 16,
      planting: byType['Penanaman Pohon'] ?? 1800,
      rorak: byType['Pembangunan Rorak'] ?? 142
    };

    impactStats.forEach((el) => {
      const key = el.dataset.impactStat;
      if (values[key] !== undefined) {
        el.textContent = values[key].toLocaleString('id-ID');
      }
    });
    impactStatus.forEach((s) => {
      s.textContent = isEn ? 'Data verified from field reports & community hydrology tasks.' : 'Data diverifikasi dari laporan lapangan & satgas hidrologi komunitas.';
    });
  } catch (err) {
    const fallback = { totalApproved: 48, restoration: 16, planting: 1800, rorak: 142 };
    impactStats.forEach((el) => {
      const key = el.dataset.impactStat;
      if (fallback[key] !== undefined) el.textContent = fallback[key].toLocaleString('id-ID');
    });
    impactStatus.forEach((s) => {
      s.textContent = isEn ? 'Displaying baseline community estimates.' : 'Menampilkan estimasi capaian baseline komunitas.';
    });
  }
};
if (['home', 'dampak'].includes(document.documentElement.dataset.page)) {
  loadImpactStats();
}

// Interactive Map System
let belikhubMap = null;
let springPoints = [];
let reportPoints = [];
let mapMarkers = [];

const initMap = async () => {
  if (!window.L || document.documentElement.dataset.page !== 'peta') return;
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;

  belikhubMap = L.map('map-canvas', { scrollWheelZoom: true }).setView([-7.15, 109.8], 8);
  window.belikhubMap = belikhubMap;

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(belikhubMap);

  setTimeout(() => belikhubMap.invalidateSize(), 400);
  window.addEventListener('resize', () => belikhubMap.invalidateSize());

  const renderAllMarkers = () => {
    mapMarkers.forEach((m) => m.remove());
    mapMarkers = [];

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
        const pinColor = isActive ? '#2BB3C0' : '#f59e0b';
        const icon = L.divIcon({
          className: 'custom-pin',
          html: `<span style="display:block;width:16px;height:16px;background:${pinColor};border:2px solid #fff;outline:2px solid #0B2A33;transform:rotate(45deg);border-radius:2px"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const popup = document.createElement('div');
        popup.className = 'p-1';
        popup.innerHTML = `
          <div class="border-b pb-2 mb-2">
            <span class="stamp ${isActive ? 'c-accent' : 'text-amber-600'} text-[10px]">${isActive ? (isEn ? 'Active Spring' : 'Mata Air Aktif') : (isEn ? 'Under Rehabilitation' : 'Dalam Rehabilitasi')}</span>
            <h4 class="serif font-bold text-lg mt-1 text-ink">${s.name}</h4>
            <p class="text-xs text-slate-500">${s.village || ''}, ${s.district || ''}, ${s.regency || ''}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span class="label text-[10px] block opacity-70">${isEn ? 'Baseline Discharge' : 'Debit Baseline'}</span>
              <strong class="text-forest text-sm">${s.baseline_discharge_lps || '—'} L/s</strong>
            </div>
            <div>
              <span class="label text-[10px] block opacity-70">${isEn ? 'Beneficiaries' : 'Penerima'}</span>
              <strong class="text-forest text-sm">${s.beneficiaries_kk || '—'} KK</strong>
            </div>
          </div>
          <p class="text-[11px] text-slate-600 mt-2"><b>${isEn ? 'Supply Target:' : 'Target Suplai:'}</b> ${s.supply_target || 'Warga Desa & Lingkungan'}</p>
          <button type="button" class="btn btn-teal text-xs w-full py-2 mt-3 view-spring-detail" data-spring-id="${s.id}">${isEn ? 'View Spring Profile →' : 'Buka Profil Mata Air →'}</button>
        `;

        const marker = L.marker([s.coordinates_public.lat, s.coordinates_public.lng], { icon })
          .addTo(belikhubMap)
          .bindPopup(popup);

        marker.on('popupopen', () => {
          popup.querySelector('.view-spring-detail')?.addEventListener('click', () => {
            openSpringDetailModal(s);
          });
        });

        mapMarkers.push(marker);
      }
    });

    // 2. Process Community Reports
    reportPoints.forEach((r) => {
      const matchesFilter =
        filter === 'all' ||
        filter === r.reportType ||
        (filter.startsWith('springs_') ? false : true);

      const matchesQuery =
        !query ||
        r.location.toLowerCase().includes(query) ||
        r.reportType.toLowerCase().includes(query);

      if (matchesFilter && matchesQuery && Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
        const reportColors = {
          'Survei Mata Air': '#2BB3C0',
          'Restorasi Mata Air': '#0E7C86',
          'Penanaman Pohon': '#10b981',
          'Pembangunan Rorak': '#7c3aed'
        };
        const color = reportColors[r.reportType] || '#0E7C86';
        const icon = L.divIcon({
          className: 'report-pin',
          html: `<span style="display:block;width:12px;height:12px;background:${color};border:2px solid #fff;outline:1px solid #0B2A33;transform:rotate(45deg)"></span>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const popup = document.createElement('div');
        popup.className = 'p-1';
        popup.innerHTML = `
          <span class="stamp c-accent text-[10px]">${r.reportType}</span>
          <h4 class="font-bold text-base mt-1 text-ink">${r.location}</h4>
          <p class="text-xs text-slate-600 mt-1">${r.notes || (isEn ? 'Verified community report.' : 'Laporan terverifikasi komunitas.')}</p>
          <p class="label muted text-[10px] mt-2">${isEn ? 'Verified · BelikHub' : 'Diverifikasi · BelikHub'}</p>
        `;

        const marker = L.marker([r.lat, r.lng], { icon })
          .addTo(belikhubMap)
          .bindPopup(popup);

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

  const loadMapData = async () => {
    const isEn = currentLanguage === 'en';
    const statusEl = $('#map-status');
    const loadBtn = $('#load-reports-label');
    if (statusEl) statusEl.textContent = isEn ? 'Fetching spring baseline data and verified reports…' : 'Mengambil data mata air dan laporan terverifikasi…';
    if (loadBtn) loadBtn.textContent = isEn ? 'Loading…' : 'Memuat…';

    try {
      const springsRes = await fetch('/api/springs');
      if (springsRes.ok) {
        const data = await springsRes.json();
        springPoints = data.springs || [];
      }

      const reportsRes = await fetch('/api/reports?limit=100');
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        reportPoints = data.reports || [];
      }

      renderAllMarkers();

      if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        belikhubMap.fitBounds(group.getBounds().pad(0.15), { maxZoom: 10 });
      }
    } catch (err) {
      console.error('Gagal memuat peta:', err);
      if (statusEl) statusEl.textContent = isEn ? 'Failed to load map data. Please retry.' : 'Gagal memuat titik peta. Silakan coba lagi.';
    } finally {
      if (loadBtn) loadBtn.textContent = isEn ? 'Refresh Map Data' : 'Perbarui Data Peta';
    }
  };

  loadMapData();
  $('#map-filter')?.addEventListener('change', renderAllMarkers);
  $('#map-search')?.addEventListener('input', renderAllMarkers);
  $('#load-reports')?.addEventListener('click', loadMapData);

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
  openModal(
    `${isEn ? 'Spring Details' : 'Detail Mata Air'}: ${s.name}`,
    `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b pb-3" style="border-color:var(--line)">
        <div>
          <span class="stamp ${s.status === 'active' ? 'c-accent' : 'text-amber-600'}">${s.status === 'active' ? (isEn ? 'Active Flow' : 'Aktif Mengalir') : (isEn ? 'Needs Rehabilitation' : 'Perlu Pemulihan')}</span>
          <p class="text-xs text-muted mt-1">${s.village || ''}, ${s.district || ''}, ${s.regency || ''}</p>
        </div>
        <div class="text-right">
          <p class="label c-accent">${isEn ? 'Flow Reliability' : 'Keandalan Aliran'}</p>
          <p class="serif text-2xl font-bold">${s.uptime_percentage || '95'}%</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="frame p-3">
          <p class="label muted text-[10px]">${isEn ? 'Baseline Discharge' : 'Debit Baseline'} (L/s)</p>
          <p class="serif text-2xl font-bold mt-1 text-forest">${s.baseline_discharge_lps || '—'}</p>
          <p class="muted text-[11px]">${isEn ? 'Historical' : 'Historis'}: ${s.historical_discharge_lps || s.baseline_discharge_lps || '—'} L/s</p>
        </div>
        <div class="frame p-3">
          <p class="label muted text-[10px]">${isEn ? 'Beneficiaries' : 'Penerima Manfaat'}</p>
          <p class="serif text-2xl font-bold mt-1 text-forest">${s.beneficiaries_kk || '—'} KK</p>
          <p class="muted text-[11px]">${s.supply_target || (isEn ? 'Villagers & Agriculture' : 'Warga Desa & Pertanian')}</p>
        </div>
      </div>

      <div>
        <p class="label c-accent mb-1.5">${isEn ? 'Required Conservation Treatments' : 'Tindakan Konservasi yang Dibutuhkan'}</p>
        <div class="flex flex-wrap gap-1.5">
          ${(s.treatment_needed || ['Sumur Resapan', 'Rorak Kontur', 'Bibit Endemik'])
            .map((t) => `<span class="stamp c-accent text-[11px]">${t}</span>`)
            .join('')}
        </div>
      </div>

      ${
        s.historical_impact
          ? `<div class="p-3 frame" style="background:var(--tint)"><p class="label c-accent mb-1">${isEn ? 'Historical Conservation Impact' : 'Dampak Historis Konservasi'}</p><p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">${s.historical_impact}</p></div>`
          : ''
      }

      ${
        s.crisis_history
          ? `<div class="p-3 frame border-amber-300 dark:border-amber-700"><p class="label text-amber-600 mb-1">${isEn ? 'Crisis History & Vulnerability' : 'Catatan Krisis & Kerentanan'}</p><p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">${s.crisis_history}</p></div>`
          : ''
      }

      <div class="pt-2 flex gap-3">
        <button type="button" class="btn btn-teal w-full report-this-spring-btn">${isEn ? 'Submit Field Report for This Spring' : 'Kirim Laporan untuk Mata Air Ini'}</button>
      </div>
    </div>
    `,
    true
  );

  modal.querySelector('.report-this-spring-btn')?.addEventListener('click', () => {
    closeModal();
    openReportModal('Survei Mata Air', 100, s.name);
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
    <form id="community-report-form" class="space-y-4">
      <div class="p-3 frame" style="background:var(--tint)">
        <p class="text-xs leading-relaxed">
          ${isEn ? 'Submit your field observations to be reviewed by our curation team. You will earn' : 'Kirimkan hasil pemantauan Anda untuk diverifikasi tim kurasi. Anda akan memperoleh'} 
          <b class="c-accent text-sm font-mono">+<span id="pts-reward">${points}</span> ${isEn ? 'points' : 'poin'}</b> ${isEn ? 'once approved.' : 'setelah disetujui.'}
        </p>
      </div>

      <label class="block text-xs font-semibold">${isEn ? 'Location Name / Spring / Village' : 'Nama Lokasi / Mata Air / Desa'}
        <input required name="location" value="${prefillLocation}" placeholder="${isEn ? 'e.g. Tuk Bismo, Bismo Village' : 'Contoh: Tuk Bismo, Desa Bismo'}" class="field mt-1" />
      </label>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-semibold">${isEn ? 'GPS Field Coordinates' : 'Koordinat GPS Lapangan'}</label>
          <button type="button" id="detect-gps-btn" class="link-arrow text-xs">
            <i class="ph ph-crosshair"></i> ${isEn ? 'Capture My GPS' : 'Ambil GPS Saya'}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input name="lat" type="number" step="any" placeholder="Latitude (-7.xxx)" class="field text-xs" />
          <input name="lng" type="number" step="any" placeholder="Longitude (109.xxx)" class="field text-xs" />
        </div>
        <p class="text-[11px] muted mt-1">${isEn ? 'Coordinates will be automatically fuzzed to ~5 km grids on the public map.' : 'Koordinat akan disamarkan otomatis ke grid ~5 km untuk publik.'}</p>
      </div>

      <label class="block text-xs font-semibold">${isEn ? 'Field Notes' : 'Catatan Lapangan'}
        <textarea required name="notes" rows="3" placeholder="${isEn ? 'Describe water flow, clarity, surrounding flora, or actions performed...' : 'Jelaskan kondisi debit air, vegetasi sekitar, atau pekerjaan yang telah dilakukan...'}" class="field mt-1"></textarea>
      </label>

      <button id="submit-report-btn" class="btn btn-teal w-full mt-4" type="submit">
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
  btn.addEventListener('click', () => {
    const reportType = btn.dataset.report || 'Survei Mata Air';
    const ptsMatch = btn.textContent.match(/\+[\d.]+/);
    const pts = ptsMatch ? parseInt(ptsMatch[0].replace(/[^\d]/g, '')) : 100;
    openReportModal(reportType, pts);
  });
});

$('#points-btn')?.addEventListener('click', () => {
  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'BelikHub Volunteer Points System' : 'Sistem Poin Relawan BelikHub',
    `
    <div class="space-y-4">
      <p class="muted text-xs">${isEn ? 'Every contribution is awarded measurable points upon verification by field coordinators:' : 'Setiap kontribusi Anda diapresiasi dengan poin terukur setelah diverifikasi tim lapangan:'}</p>
      <div class="space-y-2">
        <div class="log-line"><span>${isEn ? 'Initial Spring Survey' : 'Survei Mata Air Awal'}</span><b class="label c-accent">+100 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Spring Cleaning / Restoration' : 'Pembersihan / Restorasi Mata Air'}</span><b class="label c-accent">+1.000 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Rorak Infiltration Trench Digging' : 'Pembangunan Rorak Resapan Air'}</span><b class="label c-accent">+500 pts</b></div>
        <div class="log-line"><span>${isEn ? 'Native Tree Planting' : 'Penanaman Bibit Pohon Endemik'}</span><b class="label c-accent">+100 pts</b></div>
      </div>
      <div class="p-3 frame" style="background:var(--tint)">
        <p class="label c-accent mb-1">${isEn ? 'Points Benefit' : 'Manfaat Poin Relawan'}</p>
        <p class="text-xs text-slate-700 dark:text-slate-200">
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
    <form id="rorak-order-form" class="space-y-4">
      <p class="muted text-xs leading-relaxed">
        ${isEn ? 'Order contour infiltration trenches (roraks) for your sloped orchard or farmland. Trained local villagers will dig trenches according to contour lines.' : 'Pesan pembuatan parit rorak resapan di lahan perkebunan atau pekarangan miring Anda. Tenaga kerja lokal yang terlatih akan menggali rorak sesuai garis kontur.'}
      </p>

      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block text-xs font-semibold">${isEn ? 'Landowner Name' : 'Nama Pemilik Lahan'}
          <input required name="name" placeholder="${isEn ? 'Full name' : 'Nama lengkap'}" class="field mt-1" />
        </label>
        <label class="block text-xs font-semibold">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}
          <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
        </label>
      </div>

      <label class="block text-xs font-semibold">${isEn ? 'Land Location (Village & District)' : 'Lokasi Lahan (Desa & Kecamatan)'}
        <input required name="location" placeholder="Contoh: Desa Bismo, Kec. Blado, Kab. Batang" class="field mt-1" />
      </label>

      <div>
        <label class="block text-xs font-semibold mb-1">${isEn ? 'Number of Rorak Units Ordered' : 'Jumlah Rorak yang Dipesan'}</label>
        <div class="flex items-center gap-3">
          <input id="rorak-qty" type="number" min="1" max="100" value="5" class="field w-24 text-center font-bold text-lg" />
          <span class="text-xs muted">${isEn ? 'Units (standard 200 × 50 × 50 cm)' : 'Unit rorak (dimensi baku 200 × 50 × 50 cm)'}</span>
        </div>
      </div>

      <div class="p-4 frame" style="background:var(--tint)">
        <div class="flex justify-between items-baseline">
          <span class="label c-accent">${isEn ? 'Estimated Digging Cost:' : 'Estimasi Biaya Penggalian:'}</span>
          <b id="rorak-cost" class="serif text-2xl font-bold text-forest">Rp100.000</b>
        </div>
        <p class="text-xs muted mt-1">${isEn ? 'Cost Rp20,000/unit (Rp16,000 paid to village diggers + Rp4,000 field audit).' : 'Biaya Rp20.000/unit (Rp16.000 untuk upah warga penggali + Rp4.000 audit operasional).'}</p>
        <div class="mt-2 text-xs text-forest font-semibold">
          ${isEn ? 'Infiltration Capacity:' : 'Kapasitas Resapan:'} <span id="rorak-absorption">~10.000 Liter air hujan/musim</span>
        </div>
      </div>

      <label class="block text-xs font-semibold">${isEn ? 'Land Condition Notes (Optional)' : 'Catatan Kondisi Lahan (Opsional)'}
        <textarea name="notes" rows="2" placeholder="${isEn ? 'Slope steepness, crops, or access paths...' : 'Kemiringan lahan, jenis tanaman, atau akses jalan...'}" class="field mt-1"></textarea>
      </label>

      <button id="submit-rorak-order-btn" class="btn btn-teal w-full mt-2" type="submit">
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
    const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
    const cost = qty * 20000;
    const absorption = qty * 2000;
    if (costEl) costEl.textContent = `Rp${cost.toLocaleString('id-ID')}`;
    if (absorptionEl) absorptionEl.textContent = `~${absorption.toLocaleString('id-ID')} Liter`;
  };

  qtyInput?.addEventListener('input', updateCalculations);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-rorak-order-btn');
    btn.disabled = true;
    btn.textContent = isEn ? 'Submitting order…' : 'Mendaftarkan pesanan…';

    const formData = new FormData(form);
    const qty = parseInt(qtyInput?.value || '1', 10);

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
        <div class="space-y-4 text-center">
          <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
            <i class="ph ph-check-bold"></i>
          </div>
          <h4 class="serif font-bold text-xl">${isEn ? 'Thank You for Taking Action!' : 'Terima Kasih atas Aksi Nyata Anda!'}</h4>
          <p class="muted text-xs leading-relaxed max-w-sm mx-auto">
            ${isEn ? `Your order for <b>${qty} rorak units</b> has been received with reference code <b>#${data.id || 'RO-2026'}</b>. Our field coordinator will contact your WhatsApp within 24 hours for slope verification.` : `Pesanan pembuatan <b>${qty} unit rorak</b> telah diterima dengan kode referensi <b>#${data.id || 'RO-2026'}</b>. Koordinator lapangan BelikHub akan menghubungi WhatsApp Anda dalam 1×24 jam untuk survei kontur lahan.`}
          </p>
          <button type="button" data-close-modal class="btn btn-teal w-full mt-4">${isEn ? 'Close & Return' : 'Tutup & Kembali'}</button>
        </div>
        `
      );
      modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = isEn ? 'Confirm Rorak Order →' : 'Konfirmasi Pesanan Rorak →';
      toast(err.message);
    }
  });
};

$$('#order-rorak-btn, #order-rorak-support-btn, #footer-order-rorak').forEach((btn) =>
  btn.addEventListener('click', openOrderRorakModal)
);

const openJoinMakerModal = () => {
  const isEn = currentLanguage === 'en';
  openModal(
    isEn ? 'Register as a Rorak Digger' : 'Pendaftaran Tenaga Pembuat Rorak',
    `
    <form id="join-maker-form" class="space-y-4">
      <p class="muted text-xs leading-relaxed">
        ${isEn ? 'Join our trained village taskforce. Earn Rp16,000 for every verified rorak completed on contour.' : 'Bergabung menjadi tenaga penggali rorak terlatih di desa Anda. Dapatkan insentif Rp16.000 per unit rorak yang selesai digali dan terverifikasi.'}
      </p>

      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block text-xs font-semibold">${isEn ? 'Full Name' : 'Nama Lengkap'}
          <input required name="name" placeholder="${isEn ? 'Your name' : 'Nama Anda'}" class="field mt-1" />
        </label>
        <label class="block text-xs font-semibold">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}
          <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
        </label>
      </div>

      <label class="block text-xs font-semibold">${isEn ? 'Village / District Domicile' : 'Desa / Kecamatan Domisili'}
        <input required name="domicile" placeholder="Contoh: Desa Bismo, Kec. Blado" class="field mt-1" />
      </label>

      <label class="block text-xs font-semibold">${isEn ? 'Field / Farming Experience' : 'Pengalaman Pekerjaan Fisik / Tani'}
        <select name="experience" class="field mt-1">
          <option value="Petani / Buruh Tani">${isEn ? 'Active Farmer / Farmworker' : 'Petani / Buruh Tani Aktif'}</option>
          <option value="Tukang Bangunan / Galian">${isEn ? 'Construction / Excavation Worker' : 'Tukang Bangunan / Galian Tanah'}</option>
          <option value="Warga Komunitas">${isEn ? 'Community Member / Youth' : 'Warga Komunitas / Pemuda Desa'}</option>
        </select>
      </label>

      <label class="block text-xs font-semibold">${isEn ? 'Available Tools' : 'Ketersediaan Alat Kerja'}
        <div class="mt-2 space-y-1.5 text-xs text-muted">
          <label class="flex items-center gap-2"><input type="checkbox" name="tool_cangkul" checked /> ${isEn ? 'Own a hoe (cangkul)' : 'Memiliki cangkul sendiri'}</label>
          <label class="flex items-center gap-2"><input type="checkbox" name="tool_linggis" checked /> ${isEn ? 'Own a crowbar (linggis)' : 'Memiliki linggis / gancu'}</label>
        </div>
      </label>

      <button id="submit-join-maker-btn" class="btn btn-teal w-full mt-4" type="submit">
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
            experience: formData.get('experience')
          }
        },
        { auth: false }
      );

      closeModal();
      openModal(
        isEn ? 'Digger Registration Received' : 'Pendaftaran Pembuat Rorak Diterima',
        `
        <div class="space-y-4 text-center">
          <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
            <i class="ph ph-check-bold"></i>
          </div>
          <h4 class="serif font-bold text-xl">${isEn ? 'Welcome Aboard!' : 'Selamat Bergabung!'}</h4>
          <p class="muted text-xs leading-relaxed max-w-sm mx-auto">
            ${isEn ? 'Your information has been logged into the BelikHub taskforce. We will send technical contour guidelines via WhatsApp.' : 'Data Anda telah tercatat dalam satgas penggalian BelikHub. Kami akan mengirimkan jadwal pengarahan teknis garis kontur via WhatsApp.'}
          </p>
          <button type="button" data-close-modal class="btn btn-teal w-full mt-4">${isEn ? 'Finish' : 'Selesai'}</button>
        </div>
        `
      );
      modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = isEn ? 'Register as a Digger →' : 'Daftar Sebagai Pembuat Rorak →';
      toast(err.message);
    }
  });
};

$$('#join-maker-btn, #footer-join-maker').forEach((btn) =>
  btn.addEventListener('click', openJoinMakerModal)
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
      <form id="rsvp-form" class="space-y-4">
        <div class="p-3 frame" style="background:var(--tint)">
          <p class="label c-accent">${isEn ? 'Event Information' : 'Informasi Kegiatan'}</p>
          <p class="font-bold text-sm text-forest mt-0.5">${eventTitle}</p>
          <p class="text-xs text-muted mt-1">&bull; ${isEn ? 'Date' : 'Tanggal'}: <b>${date}</b> &bull; ${isEn ? 'Meeting Point' : 'Titik'}: <b>${location}</b></p>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block text-xs font-semibold">${isEn ? 'Volunteer Name' : 'Nama Lengkap Relawan'}
            <input required name="name" placeholder="${isEn ? 'Your full name' : 'Nama Anda'}" class="field mt-1" />
          </label>
          <label class="block text-xs font-semibold">${isEn ? 'WhatsApp Phone' : 'Nomor WhatsApp'}
            <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
          </label>
        </div>

        <label class="block text-xs font-semibold">${isEn ? 'Institution / Community (Optional)' : 'Instansi / Komunitas / Kampus (Opsional)'}
          <input name="community" placeholder="Contoh: Mapala / Pribadi / BUMDes" class="field mt-1" />
        </label>

        <div class="border-t pt-3" style="border-color:var(--line)">
          <p class="label c-accent mb-2">${isEn ? 'Required Field Gear:' : 'Perlengkapan Wajib yang Perlu Dibawa:'}</p>
          <ul class="text-xs text-muted list-disc list-inside space-y-1">
            <li>${isEn ? 'Trekking boots or non-slip footwear.' : 'Sepatu boots atau sepatu trekking anti-selip.'}</li>
            <li>${isEn ? 'Personal water tumbler.' : 'Botol minum pribadi (tumbler).'}</li>
            <li>${isEn ? 'Work gloves for soil work.' : 'Sarung tangan kain untuk pekerjaan tanah.'}</li>
          </ul>
        </div>

        <button id="submit-rsvp-btn" class="btn btn-teal w-full mt-4" type="submit">
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
          <div class="space-y-4 text-center">
            <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
              <i class="ph ph-ticket"></i>
            </div>
            <h4 class="serif font-bold text-xl">${isEn ? 'Field Volunteer Pass' : 'Tiket Relawan Lapangan'}</h4>
            <div class="frame p-4 text-left text-xs space-y-1 max-w-sm mx-auto" style="background:var(--tint)">
              <p><b>${isEn ? 'Event:' : 'Kegiatan:'}</b> ${eventTitle}</p>
              <p><b>${isEn ? 'Volunteer:' : 'Peserta:'}</b> ${formData.get('name')}</p>
              <p><b>${isEn ? 'Date:' : 'Jadwal:'}</b> ${date}</p>
              <p><b>${isEn ? 'Location:' : 'Lokasi:'}</b> ${location}</p>
            </div>
            <p class="muted text-xs">${isEn ? 'Your registration has been confirmed. See you on the ground!' : 'Pemberitahuan panduan keselamatan lapangan telah dicatat. Sampai jumpa di lokasi aksi!'}</p>
            <button type="button" data-close-modal class="btn btn-teal w-full mt-4">${isEn ? 'Close' : 'Tutup'}</button>
          </div>
          `
        );
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
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
        <div class="border p-4 frame">
          <h4 class="font-bold text-sm c-accent mb-1">${m.title[langKey]}</h4>
          <p class="muted text-xs leading-relaxed">${m.desc[langKey]}</p>
        </div>
      `
      )
      .join('');

    openModal(
      course.title[langKey],
      `
      <div class="space-y-4">
        <p class="muted text-xs">${isEn ? 'Field handbook for BelikHub volunteers and coordinators:' : 'Modul praktis pegangan relawan dan petugas lapangan BelikHub:'}</p>
        <div class="space-y-3">
          ${modulesHtml}
        </div>
        <div class="pt-2">
          <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold">
            ${isEn ? 'Complete Reading' : 'Selesai Membaca Modul'}
          </button>
        </div>
      </div>
      `,
      true
    );
    modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  });
});

// Learn Tab Switching
$$('.learn-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.learn-tab').forEach((t) => {
      t.classList.remove('tab-active');
      t.classList.add('tab-idle');
    });
    tab.classList.add('tab-active');
    tab.classList.remove('tab-idle');

    const isCourses = tab.dataset.tab === 'courses';
    $('#courses')?.classList.toggle('hidden', !isCourses);
    $('#readings')?.classList.toggle('hidden', isCourses);
  });
});

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
      <div class="space-y-3 text-sm leading-relaxed">
        ${story.body[langKey]}
        <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold mt-4">${isEn ? 'Close Notes' : 'Tutup Catatan'}</button>
      </div>
      `,
      true
    );
    modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  });
});

// Partnership Form
const partnerForm = $('#partner-form');
partnerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isEn = currentLanguage === 'en';
  const submitBtn = partnerForm.querySelector('button[type=submit]');
  const noteEl = $('#partner-note');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = isEn ? 'Submitting Inquiry…' : 'Mengirim Permintaan…';
  }

  const formData = new FormData(partnerForm);
  try {
    await apiRequest(
      '/api/partnerships',
      {
        name: formData.get('name'),
        institution: formData.get('institution'),
        email: formData.get('email'),
        need: formData.get('need')
      },
      { auth: false }
    );

    if (noteEl) noteEl.textContent = isEn ? 'Your partnership inquiry has been received by the BelikHub team.' : 'Permintaan kemitraan Anda telah diterima tim BelikHub.';
    toast(isEn ? 'Partnership inquiry sent successfully!' : 'Minat kemitraan berhasil dikirim!');
    partnerForm.reset();
  } catch (err) {
    toast(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = isEn ? 'Submit Partnership Inquiry' : 'Kirim Minat Kemitraan';
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
  if (!email) return;

  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (statusEl) statusEl.textContent = data.message || (isEn ? 'Thank you for subscribing!' : 'Terima kasih telah berlangganan!');
    toast(isEn ? 'Your email has been registered!' : 'Email Anda berhasil didaftarkan!');
    newsletterForm.reset();
  } catch {
    toast(isEn ? 'Subscribed to field updates.' : 'Berhasil mendaftar kabar pembaruan.');
    newsletterForm.reset();
  }
});

// Footer Informational Modals (FAQ, Mission, Privacy)
const footerModalContent = {
  faq: {
    title: { id: 'Pertanyaan yang Sering Diajukan (FAQ)', en: 'Frequently Asked Questions (FAQ)' },
    body: {
      id: `
        <div class="space-y-4">
          <div>
            <h4 class="font-bold text-forest text-sm">Apa itu BelikHub?</h4>
            <p class="muted text-xs mt-1">BelikHub adalah platform komunitas terbuka untuk mendokumentasikan, memantau debit, dan memulihkan mata air tradisional (belik) di seluruh Nusantara melalui partisipasi warga dan kemitraan kolaboratif.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">Apa itu Rorak dan mengapa penting?</h4>
            <p class="muted text-xs mt-1">Rorak adalah parit buntu berukuran baku 200x50x50 cm yang digali memotong kemiringan kontur tanah. Rorak menjebak limpasan air hujan agar tidak terbuang sia-sia melainkan meresap mengisi kembali akuifer air tanah.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">Bagaimana cara mendapatkan poin relawan?</h4>
            <p class="muted text-xs mt-1">Daftar akun relawan, kunjungi mata air sekitar Anda, dan kirimkan laporan survei, penanaman pohon, atau pembuatan rorak. Poin akan otomatis diverifikasi tim kurasi.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">Apakah data lokasi mata air aman dari privatisasi komersial?</h4>
            <p class="muted text-xs mt-1">Sangat aman. Seluruh koordinat publik di peta BelikHub disamarkan (fuzzed) dalam radius grid ~5 km untuk mencegah eksploitasi air komersial tanpa izin warga setempat.</p>
          </div>
        </div>
      `,
      en: `
        <div class="space-y-4">
          <div>
            <h4 class="font-bold text-forest text-sm">What is BelikHub?</h4>
            <p class="muted text-xs mt-1">BelikHub is an open grassroots platform to document, monitor discharge, and restore traditional natural springs (belik) across Indonesia through community action and partnerships.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">What is a Rorak and why is it important?</h4>
            <p class="muted text-xs mt-1">A rorak is a 200x50x50 cm dead-end trench dug along slope contours. It traps rainfall runoff, forcing it to percolate into groundwater aquifers rather than washing away as topsoil-eroding torrents.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">How do I earn volunteer points?</h4>
            <p class="muted text-xs mt-1">Sign up for a volunteer account, observe nearby springs, and submit survey, planting, or trench reports. Points are credited once verified by curators.</p>
          </div>
          <div>
            <h4 class="font-bold text-forest text-sm">Are spring locations protected from private exploitation?</h4>
            <p class="muted text-xs mt-1">Yes. All public coordinates on BelikHub are fuzzed within ~5 km grids to protect vital community water sources from commercial exploitation.</p>
          </div>
        </div>
      `
    }
  },
  misi: {
    title: { id: 'Misi & Peta Jalan Pemulihan 2030', en: 'Mission & 2030 Restoration Roadmap' },
    body: {
      id: `
        <div class="space-y-3">
          <p class="muted text-xs leading-relaxed">BelikHub berkomitmen mengembalikan kedaulatan air bersih masyarakat desa melalui 3 pilar aksi strategis hingga tahun 2030:</p>
          <div class="border p-3 frame">
            <p class="label c-accent">Pilar 1 &middot; 88 Mata Air Kritis</p>
            <p class="text-xs text-muted mt-1">Restorasi menyeluruh pada 88 mata air kritis berdebit besar di lereng vulkanik Jawa Tengah &amp; DIY.</p>
          </div>
          <div class="border p-3 frame">
            <p class="label c-accent">Pilar 2 &middot; 10.000 Rorak Resapan</p>
            <p class="text-xs text-muted mt-1">Membangun benteng serapan air hujan di kawasan perkebunan rakyat untuk meresapkan &ge; 20 juta liter air per tahun.</p>
          </div>
          <div class="border p-3 frame">
            <p class="label c-accent">Pilar 3 &middot; Perlindungan Berbasis Komunitas</p>
            <p class="text-xs text-muted mt-1">Memberdayakan kelompok pengawas air desa (Satgas Belik) dengan instrumen pemantauan mandiri dan legalitas desa.</p>
          </div>
        </div>
      `,
      en: `
        <div class="space-y-3">
          <p class="muted text-xs leading-relaxed">BelikHub is dedicated to restoring community water sovereignty through 3 strategic pillars through 2030:</p>
          <div class="border p-3 frame">
            <p class="label c-accent">Pillar 1 &middot; 88 Critical Springs</p>
            <p class="text-xs text-muted mt-1">Comprehensive restoration of 88 high-volume critical springs across volcanic slopes in Central Java &amp; Yogyakarta.</p>
          </div>
          <div class="border p-3 frame">
            <p class="label c-accent">Pillar 2 &middot; 10,000 Infiltration Roraks</p>
            <p class="text-xs text-muted mt-1">Constructing groundwater infiltration trenches on rural farmlands to absorb ≥ 20 million liters of rainwater annually.</p>
          </div>
          <div class="border p-3 frame">
            <p class="label c-accent">Pillar 3 &middot; Community-Led Governance</p>
            <p class="text-xs text-muted mt-1">Empowering village water taskforces with self-monitoring toolkits and village council legal protections.</p>
          </div>
        </div>
      `
    }
  },
  privasi: {
    title: { id: 'Kebijakan Privasi & Perlindungan Data Sumber Air', en: 'Privacy & Water Source Data Protection' },
    body: {
      id: `
        <div class="space-y-3 text-xs leading-relaxed muted">
          <p>BelikHub menjunjung tinggi privasi data pengguna dan kelestarian sumber daya air publik:</p>
          <ul class="list-disc list-inside space-y-1">
            <li><b>Perlindungan Koordinat:</b> Koordinat GPS asli mata air hanya disimpan di basis data terenkripsi untuk kebutuhan audit konservasi. Peta publik menerapkan penyamaran grid radius 5 km.</li>
            <li><b>Data Pribadi Relawan:</b> Email, nomor telepon WhatsApp, dan identitas hanya digunakan untuk koordinasi aksi konservasi dan tidak pernah diperjualbelikan kepada pihak ketiga.</li>
            <li><b>Transparansi Penggunaan Dana:</b> Pemesanan rorak diaudit secara terbuka dan disalurkan langsung kepada tenaga penggali lokal dari warga desa setempat.</li>
          </ul>
        </div>
      `,
      en: `
        <div class="space-y-3 text-xs leading-relaxed muted">
          <p>BelikHub upholds user privacy and the ecological preservation of public water resources:</p>
          <ul class="list-disc list-inside space-y-1">
            <li><b>Coordinate Protection:</b> Exact spring coordinates are stored in encrypted databases for conservation audits only. The public map enforces a strict 5 km grid-fuzzing protocol.</li>
            <li><b>Volunteer Data:</b> Emails, WhatsApp numbers, and personal info are solely used for field task coordination and never monetized or shared.</li>
            <li><b>Fund Transparency:</b> Rorak digging fees are disbursed directly to local village diggers and audited openly.</li>
          </ul>
        </div>
      `
    }
  }
};

$$('.footer-modal-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const isEn = currentLanguage === 'en';
    const langKey = isEn ? 'en' : 'id';
    const modalKey = btn.dataset.modal;
    const content = footerModalContent[modalKey];
    if (!content) return;
    openModal(
      content.title[langKey],
      `
      <div class="space-y-4">
        ${content.body[langKey]}
        <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold mt-4">${isEn ? 'Close Information' : 'Tutup Informasi'}</button>
      </div>
      `,
      true
    );
    modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  });
});
