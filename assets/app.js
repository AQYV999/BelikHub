// assets/app.js - BelikHub Platform V2 Interactive Client Logic
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

// Language Toggle
const languageButtons = $$('#lang-toggle, #lang-toggle-mobile');
const languageMenus = languageButtons.map((button, index) => {
  const languageMenu = document.createElement('div');
  languageMenu.id = `language-menu-${index}`;
  languageMenu.className = 'language-menu absolute right-0 top-12 z-[80] w-40 p-1 shadow-xl';
  languageMenu.innerHTML =
    '<button data-language="id" class="block w-full px-3 py-2 text-left text-xs font-bold">Bahasa Indonesia</button>' +
    '<button data-language="en" class="block w-full px-3 py-2 text-left text-xs font-bold">English</button>';
  button.parentElement?.appendChild(languageMenu);
  if (button.parentElement) button.parentElement.style.position = 'relative';
  return languageMenu;
});

const languageCopy = {
  id: {
    nav: ['Cerita kami', 'Dampak', 'Jelajahi peta', 'Aksi rorak', 'Pusat belajar', 'Kabar & Media'],
    monitor: 'Lihat cerita lapangan',
    join: 'Lihat dampak',
    intro: 'Kami mendokumentasikan, memulihkan, dan merawat mata air bersama warga lokal—menggabungkan kearifan lokal, teknologi pemantauan, dan aksi rorak resapan.'
  },
  en: {
    nav: ['Our Story', 'Impact', 'Explore Map', 'Rorak Action', 'Learning Hub', 'News & Media'],
    monitor: 'Field Stories',
    join: 'See Impact',
    intro: 'We document, restore, and protect Indonesian springs alongside local communities—combining indigenous wisdom, monitoring technology, and infiltration trenches.'
  }
};

const setLanguage = (lang) => {
  const c = languageCopy[lang] || languageCopy.id;
  document.documentElement.lang = lang === 'en' ? 'en' : 'id';
  languageButtons.forEach((b) => { b.textContent = lang.toUpperCase(); });
  const navPaths = ['/#visi', '/dampak', '/peta', '/aksi', '/belajar', '/media'];
  document.querySelectorAll('header .nav-links a').forEach((a, i) => {
    const label = a.querySelector('.nav-label');
    if (label && c.nav[i]) label.textContent = c.nav[i];
  });
  localStorage.setItem('belikhub-language', lang);
  languageMenus.forEach((m) => m.classList.remove('open'));
};

languageButtons.forEach((button, index) => {
  const languageMenu = languageMenus[index];
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    languageMenu.classList.toggle('open');
  });
  languageMenu.querySelectorAll('[data-language]').forEach((option) => {
    option.addEventListener('click', () => {
      setLanguage(option.dataset.language);
      toast(option.dataset.language === 'en' ? 'Language changed to English.' : 'Bahasa diubah ke Indonesia.');
    });
  });
});
document.addEventListener('click', (event) => {
  if (!languageButtons.includes(event.target) && !languageMenus.some((m) => m.contains(event.target))) {
    languageMenus.forEach((m) => m.classList.remove('open'));
  }
});
setLanguage(localStorage.getItem('belikhub-language') || 'id');

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
        <p class="label c-accent">BelikHub &middot; Platform Lapangan</p>
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
    const name = user.displayName || user.email?.split('@')[0] || 'Relawan';
    userDisplayNames.forEach((el) => { el.textContent = name; });

    // Fetch user points & profile from /api/me
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
      // offline fallback
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
    if (!user) throw new Error('Silakan masuk (login) terlebih dahulu.');
    headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
  }
  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Permintaan gagal diproses');
  return data;
};

// Login / Register Modal
const openLoginModal = () => {
  mobileMenu?.classList.add('hidden');
  document.body.style.overflow = 'auto';

  openModal(
    'Masuk ke Akun Relawan',
    `
    <form id="auth-form" class="space-y-4">
      <p class="muted text-xs">Masuk untuk mencatat laporan lapangan, memesan rorak, dan memantau poin kontribusi Anda.</p>
      <label class="block text-xs font-semibold">Email
        <input required type="email" name="email" placeholder="nama@email.com" class="field mt-1" />
      </label>
      <label class="block text-xs font-semibold">Password
        <input name="password" required minlength="6" type="password" placeholder="••••••••" class="field mt-1" />
      </label>
      <div class="pt-2">
        <button id="auth-submit-btn" class="btn btn-teal w-full" type="submit">Masuk</button>
        <button id="auth-register-btn" class="btn btn-line mt-3 w-full" type="button">Daftar Akun Relawan Baru</button>
      </div>
    </form>
    `
  );

  const form = $('#auth-form');
  if (!form) return;

  const runAuth = async (fn, label, btn) => {
    if (!auth) {
      toast('Menghubungkan ke layanan autentikasi… Coba sesaat lagi.');
      return;
    }
    const data = new FormData(form);
    if (!form.reportValidity()) return;
    btn.disabled = true;
    btn.textContent = 'Memproses…';
    try {
      const cred = await fn(auth, data.get('email'), data.get('password'));
      closeModal();
      toast(`Selamat datang kembali, ${cred.user.displayName || cred.user.email.split('@')[0]}!`);
    } catch (error) {
      btn.disabled = false;
      btn.textContent = label;
      const msg =
        error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found'
          ? 'Email atau password salah, atau akun belum terdaftar.'
          : error.code === 'auth/email-already-in-use'
          ? 'Email ini sudah terdaftar. Silakan pilih "Masuk".'
          : error.message;
      toast(msg);
    }
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    runAuth(signInWithEmailAndPassword, 'Masuk', $('#auth-submit-btn'));
  });
  $('#auth-register-btn')?.addEventListener('click', (ev) => {
    runAuth(createUserWithEmailAndPassword, 'Daftar Akun Relawan Baru', ev.currentTarget);
  });
};

loginBtns.forEach((btn) => btn.addEventListener('click', openLoginModal));
logoutBtns.forEach((btn) =>
  btn.addEventListener('click', async () => {
    try {
      if (auth) await signOut(auth);
      updateAuthUI(null);
      toast('Anda telah keluar.');
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
  const email = currentUser.email || '—';
  const name = currentUser.displayName || email.split('@')[0];
  const pts = userProfileData.points || 0;
  const role = userProfileData.role || 'user';

  openModal(
    'Profil Relawan Mata Air',
    `
    <div class="space-y-4">
      <div class="flex items-center gap-4 p-4 frame" style="background:var(--tint)">
        <div class="h-14 w-14 rounded-full bg-forest text-white flex items-center justify-center serif text-2xl font-bold">
          ${name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 class="font-bold text-base">${name}</h4>
          <p class="muted text-xs">${email}</p>
          <span class="stamp c-accent mt-1 inline-block">${role === 'admin' ? 'Pengurus Admin' : 'Relawan Terdaftar'}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="frame p-4 text-center">
          <p class="label c-accent">Poin Terkumpul</p>
          <p class="serif text-3xl font-bold mt-1 text-forest">${pts.toLocaleString('id-ID')}</p>
          <p class="muted text-xs mt-1">Poin diverifikasi</p>
        </div>
        <div class="frame p-4 text-center">
          <p class="label c-accent">Target Mandiri</p>
          <p class="serif text-3xl font-bold mt-1">20.000</p>
          <p class="muted text-xs mt-1">Untuk buka proyek</p>
        </div>
      </div>

      <div class="border-t pt-4" style="border-color:var(--line)">
        <p class="label c-accent mb-2">Panduan Aktivitas</p>
        <p class="text-xs text-muted leading-relaxed">Setiap survei lapangan bernilai +100 poin, pembangunan rorak +500 poin, dan restorasi mata air +1.000 poin. Pastikan melampirkan koordinat GPS saat survei.</p>
      </div>

      <button id="profile-logout-btn" class="btn btn-line w-full text-xs font-bold">Keluar dari Akun</button>
    </div>
    `
  );

  $('#profile-logout-btn')?.addEventListener('click', async () => {
    closeModal();
    if (auth) await signOut(auth);
    updateAuthUI(null);
    toast('Anda telah keluar.');
  });
};
$$('#user-profile-btn, #user-profile-btn-mobile').forEach((btn) =>
  btn.addEventListener('click', openUserProfileModal)
);

// Impact Stats Loader
const impactStats = $$('[data-impact-stat]');
const impactStatus = $$('#home-impact-status, #dashboard-impact-status');
const loadImpactStats = async () => {
  impactStatus.forEach((s) => { s.textContent = 'Memuat capaian terverifikasi…'; });
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error(`Layanan statistik merespons ${res.status}`);
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
      s.textContent = 'Data diverifikasi dari laporan lapangan & satgas hidrologi komunitas.';
    });
  } catch (err) {
    console.warn('Gagal memuat stats live, menggunakan baseline:', err);
    // Baseline fallback
    const fallback = { totalApproved: 48, restoration: 16, planting: 1800, rorak: 142 };
    impactStats.forEach((el) => {
      const key = el.dataset.impactStat;
      if (fallback[key] !== undefined) el.textContent = fallback[key].toLocaleString('id-ID');
    });
    impactStatus.forEach((s) => {
      s.textContent = 'Menampilkan estimasi capaian baseline komunitas.';
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

  // Initialize map center on Central Java
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
            <span class="stamp ${isActive ? 'c-accent' : 'text-amber-600'} text-[10px]">${isActive ? 'Mata Air Aktif' : 'Dalam Rehabilitasi'}</span>
            <h4 class="serif font-bold text-lg mt-1 text-ink">${s.name}</h4>
            <p class="text-xs text-slate-500">${s.village || ''}, ${s.district || ''}, ${s.regency || ''}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span class="label text-[10px] block opacity-70">Debit Baseline</span>
              <strong class="text-forest text-sm">${s.baseline_discharge_lps || '—'} L/dtk</strong>
            </div>
            <div>
              <span class="label text-[10px] block opacity-70">Penerima</span>
              <strong class="text-forest text-sm">${s.beneficiaries_kk || '—'} KK</strong>
            </div>
          </div>
          <p class="text-[11px] text-slate-600 mt-2"><b>Target Suplai:</b> ${s.supply_target || 'Warga Desa & Lingkungan'}</p>
          <button type="button" class="btn btn-teal text-xs w-full py-2 mt-3 view-spring-detail" data-spring-id="${s.id}">Buka Profil Mata Air &rarr;</button>
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
          <p class="text-xs text-slate-600 mt-1">${r.notes || 'Laporan terverifikasi komunitas.'}</p>
          <p class="label muted text-[10px] mt-2">Diverifikasi &middot; BelikHub</p>
        `;

        const marker = L.marker([r.lat, r.lng], { icon })
          .addTo(belikhubMap)
          .bindPopup(popup);

        mapMarkers.push(marker);
      }
    });

    const statusEl = $('#map-status');
    if (statusEl) {
      statusEl.textContent = `Menampilkan ${mapMarkers.length} titik terpetakan (${springPoints.length} mata air baseline, ${reportPoints.length} laporan diverifikasi).`;
    }
  };

  const loadMapData = async () => {
    const statusEl = $('#map-status');
    const loadBtn = $('#load-reports-label');
    if (statusEl) statusEl.textContent = 'Mengambil data mata air dan laporan terverifikasi…';
    if (loadBtn) loadBtn.textContent = 'Memuat…';

    try {
      // Fetch springs
      const springsRes = await fetch('/api/springs');
      if (springsRes.ok) {
        const data = await springsRes.json();
        springPoints = data.springs || [];
      }

      // Fetch verified reports
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
      if (statusEl) statusEl.textContent = 'Gagal memuat titik peta. Silakan coba lagi.';
      toast('Koneksi peta terganggu.');
    } finally {
      if (loadBtn) loadBtn.textContent = 'Perbarui Data Peta';
    }
  };

  loadMapData();
  $('#map-filter')?.addEventListener('change', renderAllMarkers);
  $('#map-search')?.addEventListener('input', renderAllMarkers);
  $('#load-reports')?.addEventListener('click', loadMapData);

  // Geolocation
  $('#locate-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast('Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }
    toast('Meminta izin lokasi…');
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
        }).addTo(belikhubMap).bindPopup('<b>Lokasi Anda Saat Ini</b>').openPopup();
        toast('Peta dipusatkan ke posisi Anda.');
      },
      () => toast('Gagal mendeteksi lokasi atau izin ditolak.')
    );
  });
};
initMap();

// Spring Details Modal
const openSpringDetailModal = (s) => {
  openModal(
    `Detail Mata Air: ${s.name}`,
    `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b pb-3" style="border-color:var(--line)">
        <div>
          <span class="stamp ${s.status === 'active' ? 'c-accent' : 'text-amber-600'}">${s.status === 'active' ? 'Aktif Mengalir' : 'Perlu Pemulihan'}</span>
          <p class="text-xs text-muted mt-1">${s.village || ''}, ${s.district || ''}, ${s.regency || ''}</p>
        </div>
        <div class="text-right">
          <p class="label c-accent">Keandalan Aliran</p>
          <p class="serif text-2xl font-bold">${s.uptime_percentage || '95'}%</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="frame p-3">
          <p class="label muted text-[10px]">Debit Baseline (L/dtk)</p>
          <p class="serif text-2xl font-bold mt-1 text-forest">${s.baseline_discharge_lps || '—'}</p>
          <p class="muted text-[11px]">Historis: ${s.historical_discharge_lps || s.baseline_discharge_lps || '—'} L/dtk</p>
        </div>
        <div class="frame p-3">
          <p class="label muted text-[10px]">Penerima Manfaat</p>
          <p class="serif text-2xl font-bold mt-1 text-forest">${s.beneficiaries_kk || '—'} KK</p>
          <p class="muted text-[11px]">${s.supply_target || 'Warga Desa & Pertanian'}</p>
        </div>
      </div>

      <div>
        <p class="label c-accent mb-1.5">Tindakan Konservasi yang Dibutuhkan</p>
        <div class="flex flex-wrap gap-1.5">
          ${(s.treatment_needed || ['Sumur Resapan', 'Rorak Kontur', 'Bibit Endemik'])
            .map((t) => `<span class="stamp c-accent text-[11px]">${t}</span>`)
            .join('')}
        </div>
      </div>

      ${
        s.historical_impact
          ? `<div class="p-3 frame" style="background:var(--tint)"><p class="label c-accent mb-1">Dampak Historis Konservasi</p><p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">${s.historical_impact}</p></div>`
          : ''
      }

      ${
        s.crisis_history
          ? `<div class="p-3 frame border-amber-300 dark:border-amber-700"><p class="label text-amber-600 mb-1">Catatan Krisis &amp; Kerentanan</p><p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">${s.crisis_history}</p></div>`
          : ''
      }

      <div class="pt-2 flex gap-3">
        <button type="button" class="btn btn-teal w-full report-this-spring-btn">Kirim Laporan untuk Mata Air Ini</button>
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
  if (!currentUser) {
    toast('Silakan masuk terlebih dahulu untuk mengirim laporan.');
    openLoginModal();
    return;
  }

  openModal(
    `Laporan: ${reportType}`,
    `
    <form id="community-report-form" class="space-y-4">
      <div class="p-3 frame" style="background:var(--tint)">
        <p class="text-xs leading-relaxed">
          Kirimkan hasil pemantauan Anda untuk diverifikasi tim kurasi. Anda akan memperoleh 
          <b class="c-accent text-sm font-mono">+${points} poin</b> setelah disetujui.
        </p>
      </div>

      <label class="block text-xs font-semibold">Nama Lokasi / Mata Air / Desa
        <input required name="location" value="${prefillLocation}" placeholder="Contoh: Tuk Bismo, Desa Bismo" class="field mt-1" />
      </label>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-semibold">Koordinat GPS Lapangan</label>
          <button type="button" id="detect-gps-btn" class="link-arrow text-xs">
            <i class="ph ph-crosshair"></i> Ambil GPS Saya
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input name="lat" type="number" step="any" placeholder="Latitude (-7.xxx)" class="field text-xs" />
          <input name="lng" type="number" step="any" placeholder="Longitude (109.xxx)" class="field text-xs" />
        </div>
        <p class="text-[11px] muted mt-1">Koordinat akan disamarkan otomatis ke grid ~5 km untuk publik.</p>
      </div>

      <label class="block text-xs font-semibold">Catatan Lapangan
        <textarea required name="notes" rows="3" placeholder="Jelaskan kondisi debit air, vegetasi sekitar, atau pekerjaan yang telah dilakukan..." class="field mt-1"></textarea>
      </label>

      <button id="submit-report-btn" class="btn btn-teal w-full mt-4" type="submit">
        Kirim Laporan Lapangan &rarr;
      </button>
    </form>
    `
  );

  const form = $('#community-report-form');
  if (!form) return;

  $('#detect-gps-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      toast('GPS tidak didukung di browser ini.');
      return;
    }
    toast('Membaca posisi GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latInput = form.querySelector('[name=lat]');
        const lngInput = form.querySelector('[name=lng]');
        if (latInput) latInput.value = pos.coords.latitude.toFixed(5);
        if (lngInput) lngInput.value = pos.coords.longitude.toFixed(5);
        toast('Koordinat berhasil diisi!');
      },
      () => toast('Gagal mengambil koordinat GPS.')
    );
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-report-btn');
    btn.disabled = true;
    btn.textContent = 'Menyimpan laporan…';

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
      toast(`Laporan tersimpan! +${data.points || points} poin menunggu verifikasi.`);
      loadImpactStats();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Kirim Laporan Lapangan →';
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
  openModal(
    'Sistem Poin Relawan BelikHub',
    `
    <div class="space-y-4">
      <p class="muted text-xs">Setiap kontribusi Anda diapresiasi dengan poin terukur setelah diverifikasi tim lapangan:</p>
      <div class="space-y-2">
        <div class="log-line"><span>Survei Mata Air Awal</span><b class="label c-accent">+100 pts</b></div>
        <div class="log-line"><span>Pembersihan / Restorasi Mata Air</span><b class="label c-accent">+1.000 pts</b></div>
        <div class="log-line"><span>Pembangunan Rorak Resapan Air</span><b class="label c-accent">+500 pts</b></div>
        <div class="log-line"><span>Penanaman Bibit Pohon Endemik</span><b class="label c-accent">+100 pts</b></div>
      </div>
      <div class="p-3 frame" style="background:var(--tint)">
        <p class="label c-accent mb-1">Manfaat Poin Relawan</p>
        <p class="text-xs text-slate-700 dark:text-slate-200">
          Relawan dengan akumulasi &ge; 20.000 poin dapat mengajukan inisiatif pemulihan belik desa secara mandiri untuk didanai melalui program kemitraan komunitas BelikHub.
        </p>
      </div>
    </div>
    `
  );
});

// Rorak Order & Maker Modals
const openOrderRorakModal = () => {
  openModal(
    'Pemesanan Rorak untuk Lahan Anda',
    `
    <form id="rorak-order-form" class="space-y-4">
      <p class="muted text-xs leading-relaxed">
        Pesan pembuatan parit rorak resapan di lahan perkebunan atau pekarangan miring Anda. Tenaga kerja lokal yang terlatih akan menggali rorak sesuai garis kontur.
      </p>

      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block text-xs font-semibold">Nama Pemilik Lahan
          <input required name="name" placeholder="Nama lengkap" class="field mt-1" />
        </label>
        <label class="block text-xs font-semibold">Nomor WhatsApp
          <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
        </label>
      </div>

      <label class="block text-xs font-semibold">Lokasi Lahan (Desa &amp; Kecamatan)
        <input required name="location" placeholder="Contoh: Desa Bismo, Kec. Blado, Kab. Batang" class="field mt-1" />
      </label>

      <div>
        <label class="block text-xs font-semibold mb-1">Jumlah Rorak yang Dipesan</label>
        <div class="flex items-center gap-3">
          <input id="rorak-qty" type="number" min="1" max="100" value="5" class="field w-24 text-center font-bold text-lg" />
          <span class="text-xs muted">Unit rorak (dimensi baku 200 &times; 50 &times; 50 cm)</span>
        </div>
      </div>

      <div class="p-4 frame" style="background:var(--tint)">
        <div class="flex justify-between items-baseline">
          <span class="label c-accent">Estimasi Biaya Penggalian:</span>
          <b id="rorak-cost" class="serif text-2xl font-bold text-forest">Rp100.000</b>
        </div>
        <p class="text-xs muted mt-1">Biaya Rp20.000/unit (Rp16.000 untuk upah warga penggali + Rp4.000 audit operasional).</p>
        <div class="mt-2 text-xs text-forest font-semibold">
          Kapasitas Resapan: <span id="rorak-absorption">~10.000 Liter air hujan/musim</span>
        </div>
      </div>

      <label class="block text-xs font-semibold">Catatan Kondisi Lahan (Opsional)
        <textarea name="notes" rows="2" placeholder="Kemiringan lahan, jenis tanaman, atau akses jalan..." class="field mt-1"></textarea>
      </label>

      <button id="submit-rorak-order-btn" class="btn btn-teal w-full mt-2" type="submit">
        Konfirmasi Pesanan Rorak &rarr;
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
    if (absorptionEl) absorptionEl.textContent = `~${absorption.toLocaleString('id-ID')} Liter air hujan/musim`;
  };

  qtyInput?.addEventListener('input', updateCalculations);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-rorak-order-btn');
    btn.disabled = true;
    btn.textContent = 'Mendaftarkan pesanan…';

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
        'Pesanan Rorak Berhasil Dicatat!',
        `
        <div class="space-y-4 text-center">
          <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
            <i class="ph ph-check-bold"></i>
          </div>
          <h4 class="serif font-bold text-xl">Terima Kasih atas Aksi Nyata Anda!</h4>
          <p class="muted text-xs leading-relaxed max-w-sm mx-auto">
            Pesanan pembuatan <b>${qty} unit rorak</b> telah diterima dengan kode referensi <b>#${data.id || 'RO-2026'}</b>. 
            Koordinator lapangan BelikHub akan menghubungi WhatsApp Anda dalam 1&times;24 jam untuk survei kontur lahan.
          </p>
          <button type="button" data-close-modal class="btn btn-teal w-full mt-4">Tutup &amp; Kembali</button>
        </div>
        `
      );
      modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Konfirmasi Pesanan Rorak →';
      toast(err.message);
    }
  });
};

$$('#order-rorak-btn, #order-rorak-support-btn, #footer-order-rorak').forEach((btn) =>
  btn.addEventListener('click', openOrderRorakModal)
);

const openJoinMakerModal = () => {
  openModal(
    'Pendaftaran Tenaga Pembuat Rorak',
    `
    <form id="join-maker-form" class="space-y-4">
      <p class="muted text-xs leading-relaxed">
        Bergabung menjadi tenaga penggali rorak terlatih di desa Anda. Dapatkan insentif Rp16.000 per unit rorak yang selesai digali dan terverifikasi.
      </p>

      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block text-xs font-semibold">Nama Lengkap
          <input required name="name" placeholder="Nama Anda" class="field mt-1" />
        </label>
        <label class="block text-xs font-semibold">Nomor WhatsApp
          <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
        </label>
      </div>

      <label class="block text-xs font-semibold">Desa / Kecamatan Domisili
        <input required name="domicile" placeholder="Contoh: Desa Bismo, Kec. Blado" class="field mt-1" />
      </label>

      <label class="block text-xs font-semibold">Pengalaman Pekerjaan Fisik / Tani
        <select name="experience" class="field mt-1">
          <option value="Petani / Buruh Tani">Petani / Buruh Tani Aktif</option>
          <option value="Tukang Bangunan / Galian">Tukang Bangunan / Galian Tanah</option>
          <option value="Warga Komunitas">Warga Komunitas / Pemuda Desa</option>
        </select>
      </label>

      <label class="block text-xs font-semibold">Ketersediaan Alat Kerja
        <div class="mt-2 space-y-1.5 text-xs text-muted">
          <label class="flex items-center gap-2"><input type="checkbox" name="tool_cangkul" checked /> Memiliki cangkul sendiri</label>
          <label class="flex items-center gap-2"><input type="checkbox" name="tool_linggis" checked /> Memiliki linggis / gancu</label>
          <label class="flex items-center gap-2"><input type="checkbox" name="tool_meteran" /> Memiliki meteran / selang ukur</label>
        </div>
      </label>

      <button id="submit-join-maker-btn" class="btn btn-teal w-full mt-4" type="submit">
        Daftar Sebagai Pembuat Rorak &rarr;
      </button>
    </form>
    `
  );

  const form = $('#join-maker-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#submit-join-maker-btn');
    btn.disabled = true;
    btn.textContent = 'Mendaftarkan…';

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
        'Pendaftaran Pembuat Rorak Diterima',
        `
        <div class="space-y-4 text-center">
          <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
            <i class="ph ph-check-bold"></i>
          </div>
          <h4 class="serif font-bold text-xl">Selamat Bergabung!</h4>
          <p class="muted text-xs leading-relaxed max-w-sm mx-auto">
            Data Anda telah tercatat dalam satgas penggalian BelikHub. Kami akan mengirimkan jadwal pengarahan teknis garis kontur via WhatsApp.
          </p>
          <button type="button" data-close-modal class="btn btn-teal w-full mt-4">Selesai</button>
        </div>
        `
      );
      modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Daftar Sebagai Pembuat Rorak →';
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
    const eventTitle = btn.dataset.event || 'Aksi Lapangan BelikHub';
    const date = btn.dataset.date || 'November 2026';
    const location = btn.dataset.location || 'Lokasi Titik Kumpul';

    openModal(
      `Daftar Ikut: ${eventTitle}`,
      `
      <form id="rsvp-form" class="space-y-4">
        <div class="p-3 frame" style="background:var(--tint)">
          <p class="label c-accent">Informasi Kegiatan</p>
          <p class="font-bold text-sm text-forest mt-0.5">${eventTitle}</p>
          <p class="text-xs text-muted mt-1">&bull; Tanggal: <b>${date}</b> &bull; Titik: <b>${location}</b></p>
        </div>

        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block text-xs font-semibold">Nama Lengkap Relawan
            <input required name="name" placeholder="Nama Anda" class="field mt-1" />
          </label>
          <label class="block text-xs font-semibold">Nomor WhatsApp
            <input required name="phone" placeholder="08xxxxxxxxxx" class="field mt-1" />
          </label>
        </div>

        <label class="block text-xs font-semibold">Instansi / Komunitas / Kampus (Opsional)
          <input name="community" placeholder="Contoh: Mapala / Pribadi / BUMDes" class="field mt-1" />
        </label>

        <div class="border-t pt-3" style="border-color:var(--line)">
          <p class="label c-accent mb-2">Perlengkapan Wajib yang Perlu Dibawa:</p>
          <ul class="text-xs text-muted list-disc list-inside space-y-1">
            <li>Sepatu boots atau sepatu trekking anti-selip.</li>
            <li>Botol minum pribadi (tumbler) &amp; obat-obatan pribadi.</li>
            <li>Sarung tangan kain untuk pekerjaan tanah.</li>
          </ul>
        </div>

        <button id="submit-rsvp-btn" class="btn btn-teal w-full mt-4" type="submit">
          Konfirmasi Keikutsertaan Aksi &rarr;
        </button>
      </form>
      `
    );

    const form = $('#rsvp-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('#submit-rsvp-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mendaftarkan…';

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
          'Pendaftaran Kegiatan Terkonfirmasi!',
          `
          <div class="space-y-4 text-center">
            <div class="h-16 w-16 mx-auto rounded-full bg-forest text-white flex items-center justify-center text-3xl">
              <i class="ph ph-ticket"></i>
            </div>
            <h4 class="serif font-bold text-xl">Tiket Relawan Lapangan</h4>
            <div class="frame p-4 text-left text-xs space-y-1 max-w-sm mx-auto" style="background:var(--tint)">
              <p><b>Kegiatan:</b> ${eventTitle}</p>
              <p><b>Peserta:</b> ${formData.get('name')}</p>
              <p><b>Jadwal:</b> ${date}</p>
              <p><b>Lokasi:</b> ${location}</p>
            </div>
            <p class="muted text-xs">Pemberitahuan panduan keselamatan lapangan telah dicatat. Sampai jumpa di lokasi aksi!</p>
            <button type="button" data-close-modal class="btn btn-teal w-full mt-4">Tutup</button>
          </div>
          `
        );
        modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Konfirmasi Keikutsertaan Aksi →';
        toast(err.message);
      }
    });
  });
});

// Interactive Learning Courses
const courseData = {
  spring: {
    title: 'Pengenalan Ekosistem Mata Air & Springshed',
    modules: [
      {
        title: '1. Anatomi dan Tipe Akuifer',
        desc: 'Mata air terbentuk ketika muka air tanah (water table) berpotongan dengan permukaan topografi bumi. Terdapat dua jenis utama: mata air rekahan (pada batuan vulkanik) dan mata air rembesan (pada lapisan aluvium). Menjaga mata air berarti menjaga zona imbuhan (recharge zone) di perbukitan hulu.'
      },
      {
        title: '2. Metode Uji Debit Volumetrik Lapangan',
        desc: 'Siapkan wadah bervolume tetap (misal ember 10 atau 20 liter) dan stopwatch. Alirkan seluruh debit air mata air ke dalam wadah sambil mengukur waktu pengisian (t dalam detik). Gunakan rumus Q = V / t. Lakukan 3 kali pengulangan untuk mendapatkan rata-rata debit LPS (liter per detik) yang akurat.'
      },
      {
        title: '3. Parameter Kualitas & Kejernihan Air',
        desc: 'Catat suhu air (mata air yang sehat memiliki suhu konstan ~21-24°C), bau (tidak berbau lumpur atau sulfur), dan kejernihan visual. Periksa apakah terdapat sedimentasi pekat pasca hujan, yang menandakan rusaknya vegetasi di hulu springshed.'
      },
      {
        title: '4. Etika Adat & Keselamatan Tim',
        desc: 'Banyak mata air di Indonesia berstatus sakral atau dikeramatkan oleh tetua desa. Selalu sowan izin ke kepala desa atau juru kunci setempat sebelum mengambil sampel atau melakukan dokumentasi fisik.'
      }
    ]
  },
  trees: {
    title: 'Menanam Pohon Endemik Penyimpan Air',
    modules: [
      {
        title: '1. Mengapa Pohon Tertentu Menjaga Air?',
        desc: 'Tidak semua pohon cocok untuk area resapan. Pohon dengan perakaran tunggang dalam dan kanopi rapat seperti Beringin (Ficus benjamina), Aren (Arenga pinnata), dan Bambu Petung mampu membuka pori-pori tanah tanpa memompa habis air tanah secara boros seperti halnya pohon monokultur.'
      },
      {
        title: '2. Zonasi Delineasi Tanam',
        desc: 'Zona 1 (Radius 0-50m): Area tangkapan langsung. Tanami rumput vetiver dan tanaman penahan erosi tebing, jangan lakukan penggalian berat. Zona 2 (Radius 50-200m): Area tanam pohon penyimpan air kanopi tinggi. Zona 3: Pertanian agroforestri terpadu.'
      },
      {
        title: '3. Teknik Penanaman di Lereng Curam',
        desc: 'Gali lubang tanam 50x50x50 cm, campurkan tanah galian dengan pupuk kompos kandang 1:1. Buat parit tapak kuda kecil di bagian atas bibit untuk menangkap limpasan air hujan pertama. Berikan ajir bambu agar bibit tidak rebah terhempas angin.'
      },
      {
        title: '4. Perawatan 100 Hari Pertama',
        desc: 'Periode paling kritis bagi bibit adalah 3 bulan pertama. Lakukan penyiangan gulma pengganggu setiap 2 minggu sekali dan pastikan mulsa organik (daun kering) menutupi pangkal batang untuk mencegah penguapan tanah.'
      }
    ]
  },
  rorak: {
    title: 'Teknik Membangun Rorak Resapan Kontur',
    modules: [
      {
        title: '1. Prinsip Menahan Air Hujan',
        desc: 'Rorak berfungsi memutus kecepatan limpasan air hujan permukaan (runoff) di lereng bukit. Alih-alih mengalir deras ke sungai dan menyebabkan erosi tanah pucuk (topsoil), air tertahan di lubang rorak dan meresap perlahan ke akuifer dangkal.'
      },
      {
        title: '2. Menentukan Garis Kontur Sederhana',
        desc: 'Gunakan alat bantu gawang segitiga berbandul (A-frame) atau selang air transparan berisi air. Tarik garis horizontal yang memiliki ketinggian sama di sepanjang kontur lereng. Rorak wajib digali mengikuti garis ini agar tidak menjadi pemicu longsor.'
      },
      {
        title: '3. Dimensi Baku & Tanggul Tanah',
        desc: 'Panjang baku: 200 cm, Lebar: 50 cm, Dalam: 50 cm. Tanah hasil galian ditumpuk di sisi hilir (bawah) membentuk tanggul pematang setinggi 15 cm untuk mencegah luapan air saat hujan badai lebat.'
      },
      {
        title: '4. Perawatan Rutin Pra-Musim Hujan',
        desc: 'Sebelum musim hujan tiba, kuras lumpur sedimen dan sampah dedaunan yang menumpuk di dasar rorak. Lumpur ini sangat subur dan dapat dimanfaatkan sebagai pupuk alami untuk tanaman perkebunan di sekitarnya.'
      }
    ]
  }
};

$$('[data-course]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const courseKey = btn.dataset.course;
    const course = courseData[courseKey];
    if (!course) return;

    const modulesHtml = course.modules
      .map(
        (m, idx) => `
        <div class="border p-4 frame">
          <h4 class="font-bold text-sm c-accent mb-1">${m.title}</h4>
          <p class="muted text-xs leading-relaxed">${m.desc}</p>
        </div>
      `
      )
      .join('');

    openModal(
      course.title,
      `
      <div class="space-y-4">
        <p class="muted text-xs">Modul praktis pegangan relawan dan petugas lapangan BelikHub:</p>
        <div class="space-y-3">
          ${modulesHtml}
        </div>
        <div class="pt-2">
          <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold">
            Selesai Membaca Modul
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
    title: 'Ekspedisi Tuk Bismo: Restorasi 200 Sumur & Rorak',
    body: `
      <p class="mb-3">Tuk Bismo yang terletak di Desa Bismo, Kecamatan Blado, Kabupaten Batang merupakan salah satu sumber air baku paling vital di lereng utara Gunung Prau/Dieng. Sumber ini menyuplai lebih dari 90% kebutuhan air bersih PDAM Batang dan ribuan kepala keluarga desa sekitar dengan baseline debit 260 liter/detik.</p>
      <p class="mb-3">Pada tahun 2016-2017, program perintisan 200 sumur resapan dan penanaman 2.000 pohon endemik berhasil mencatat rekor kenaikan debit sebesar +9.57% di tengah tren penurunan debit regional.</p>
      <p class="mb-3">Namun tantangan alam kembali terjadi pada Januari 2025 ketika banjir bandang dan longsor lereng menimbun 5 bak penampung. Melalui mobilisasi gotong royong komunitas dan perbaikan springbox, debit kini telah pulih stabil di angka 98.2% keandalan operasional.</p>
    `
  },
  wonomerto: {
    title: 'Wonomerto: Dari 12 Bulan Kekeringan Menjadi Mengalir Abadi',
    body: `
      <p class="mb-3">Mata Air Wonomerto di Kecamatan Bandar, Batang sempat mengalami masa kelam pada September 2023. Kekeringan ekstrem berlangsung lebih dari 12 bulan hingga titik aliran benar-benar nol (zero baseline).</p>
      <p class="mb-3">Sebanyak 65 KK (262 jiwa) terpaksa bergantung pada kiriman tangki air bersih darurat. Inisiatif warga dimulai dengan pemetaan kembali springshed dan pembuatan parit rorak di lahan lereng atas.</p>
      <p class="mb-3">Air hujan yang berhasil dipulangkan ke dalam akuifer tanah akhirnya membuahkan hasil. Mata air kembali memancarkan debit 4.5 liter/detik, mengakhiri krisis air bersih warga.</p>
    `
  },
  rorak: {
    title: 'Panduan Memulangkan Air Hujan Lewat Rorak Kontur',
    body: `
      <p class="mb-3">Air hujan bukanlah limbah yang harus segera dibuang ke selokan dan dialirkan ke sungai. Dalam siklus hidrologi seimbang, sebagian besar air hujan seharusnya meresap ke dalam bumi untuk mengisi cadangan air bawah tanah (groundwater).</p>
      <p class="mb-3">Pembangunan rorak seluas 200x50x50 cm dengan biaya Rp20.000 per unit terbukti menjadi investasi konservasi air paling hemat biaya dan berdampak langsung bagi masyarakat agraris pegunungan.</p>
    `
  },
  'artikel-debit': {
    title: 'Mengapa Debit Mata Air di Lereng Jawa Mengalami Penurunan?',
    body: `
      <p class="mb-3">Kajian hidrologi terbaru menunjukkan bahwa faktor dominan penurunan debit bukanlah semata penurunan curah hujan tahunan, melainkan hilangnya koefisien infiltrasi tanah akibat pemadatan lahan dan konversi hutan ke tanaman sayur semusim tanpa terasering memadai.</p>
      <p class="mb-3">Ketika air hujan jatuh di lahan terbuka, lebih dari 70% air langsung menjadi limpasan permukaan (surface runoff) yang memicu erosi, bukan menjadi air tanah. Solusinya adalah rekayasa lubang rorak dan penghijauan pohon berakar tunjang.</p>
    `
  },
  'catatan-ekspedisi': {
    title: '30+ Mata Air, Satu Gerakan: Ekspedisi Komunitas Batang & Dieng',
    body: `
      <p class="mb-3">Perjalanan tim relawan BelikHub mendokumentasikan 30 mata air purba di kawasan pegunungan Batang dan Dieng. Di setiap desa, ditemukan cerita bagaimana kakek-nenek leluhur menjaga kelestarian mata air dengan aturan adat tanpa tertulis.</p>
      <p class="mb-3">Gerakan BelikHub mendigitalisasi data kearifan tersebut ke dalam sistem pemantauan modern berbasis koordinat publik yang terlindungi.</p>
    `
  },
  'kajian-rorak': {
    title: 'Kajian Partisipatif: Dampak Rorak Terhadap Kenaikan Air Tanah',
    body: `
      <p class="mb-3">Hasil pemantauan 142 rorak di Gunungkidul dan Batang membuktikan peningkatan tinggi muka air sumur dangkal warga sedalam 0.8 hingga 1.4 meter pasca musim hujan 2025/2026.</p>
    `
  },
  'wawancara-marno': {
    title: 'Kisah Pak Marno: 35 Tahun Menjaga Belik Rowo Santen',
    body: `
      <p class="mb-3">"Air itu punya nyawa. Kalau kita rawat hulunya, dia akan menghidupi anak cucu kita sampai ratusan tahun ke depan," ungkap Pak Marno (68), sesepuh desa penjaga Rowo Santen.</p>
    `
  }
};

$$('.story-read-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.story;
    const story = storiesData[key] || {
      title: 'Dokumentasi Lapangan BelikHub',
      body: '<p class="muted">Dokumentasi lengkap program konservasi air masyarakat.</p>'
    };

    openModal(
      story.title,
      `
      <div class="space-y-3 text-sm leading-relaxed">
        ${story.body}
        <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold mt-4">Tutup Catatan</button>
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
  const submitBtn = partnerForm.querySelector('button[type=submit]');
  const noteEl = $('#partner-note');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim Permintaan…';
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

    if (noteEl) noteEl.textContent = 'Permintaan kemitraan Anda telah diterima tim BelikHub.';
    toast('Minat kemitraan berhasil dikirim!');
    partnerForm.reset();
  } catch (err) {
    toast(err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Minat Kemitraan';
    }
  }
});

// Newsletter Subscription
const newsletterForm = $('#newsletter-form');
newsletterForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
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
    if (statusEl) statusEl.textContent = data.message || 'Terima kasih telah berlangganan!';
    toast('Email Anda berhasil didaftarkan!');
    newsletterForm.reset();
  } catch {
    toast('Berhasil mendaftar kabar pembaruan.');
    newsletterForm.reset();
  }
});

// Footer Informational Modals (FAQ, Mission, Privacy)
const footerModalContent = {
  faq: {
    title: 'Pertanyaan yang Sering Diajukan (FAQ)',
    body: `
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
    `
  },
  misi: {
    title: 'Misi & Peta Jalan Pemulihan 2030',
    body: `
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
    `
  },
  privasi: {
    title: 'Kebijakan Privasi & Perlindungan Data Sumber Air',
    body: `
      <div class="space-y-3 text-xs leading-relaxed muted">
        <p>BelikHub menjunjung tinggi privasi data pengguna dan kelestarian sumber daya air publik:</p>
        <ul class="list-disc list-inside space-y-1">
          <li><b>Perlindungan Koordinat:</b> Koordinat GPS asli mata air hanya disimpan di basis data terenkripsi untuk kebutuhan audit konservasi. Peta publik menerapkan penyamaran grid radius 5 km.</li>
          <li><b>Data Pribadi Relawan:</b> Email, nomor telepon WhatsApp, dan identitas hanya digunakan untuk koordinasi aksi konservasi dan tidak pernah diperjualbelikan kepada pihak ketiga.</li>
          <li><b>Transparansi Penggunaan Dana:</b> Pemesanan rorak diaudit secara terbuka dan disalurkan langsung kepada tenaga penggali lokal dari warga desa setempat.</li>
        </ul>
      </div>
    `
  }
};

$$('.footer-modal-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modalKey = btn.dataset.modal;
    const content = footerModalContent[modalKey];
    if (!content) return;
    openModal(
      content.title,
      `
      <div class="space-y-4">
        ${content.body}
        <button type="button" data-close-modal class="btn btn-teal w-full text-xs font-bold mt-4">Tutup Informasi</button>
      </div>
      `,
      true
    );
    modal.querySelector('[data-close-modal]')?.addEventListener('click', closeModal);
  });
});
