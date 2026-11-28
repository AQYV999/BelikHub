document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 1. Apple / Samara Doorway Horizontal Slider
  // ========================================================================
  const track = document.getElementById('doorway-track');
  const slides = document.querySelectorAll('.doorway-slide');
  const dots = document.querySelectorAll('.doorway-dot');
  const prevBtn = document.getElementById('doorway-prev');
  const nextBtn = document.getElementById('doorway-next');
  let currentSlideIndex = 0;
  let autoTimer = null;

  function updateDoorway(index, userAction = false) {
    if (!track || slides.length === 0) return;

    currentSlideIndex = (index + slides.length) % slides.length;

    slides.forEach((s, idx) => {
      s.classList.toggle('current', idx === currentSlideIndex);
    });

    dots.forEach((d, idx) => {
      d.classList.toggle('active', idx === currentSlideIndex);
    });

    const activeSlide = slides[currentSlideIndex];
    if (activeSlide) {
      const slideOffsetLeft = activeSlide.offsetLeft;
      const slideWidth = activeSlide.offsetWidth;
      const trackWidth = track.scrollWidth;

      const targetX = (trackWidth / 2) - (slideOffsetLeft + slideWidth / 2);
      track.style.transform = `translateX(calc(-50% + ${targetX}px))`;
    }

    if (userAction && autoTimer) {
      clearInterval(autoTimer);
      startAuto();
    }
  }

  setTimeout(() => updateDoorway(0), 100);
  window.addEventListener('resize', () => updateDoorway(currentSlideIndex));

  if (prevBtn) prevBtn.addEventListener('click', () => updateDoorway(currentSlideIndex - 1, true));
  if (nextBtn) nextBtn.addEventListener('click', () => updateDoorway(currentSlideIndex + 1, true));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      updateDoorway(parseInt(dot.dataset.index, 10), true);
    });
  });

  slides.forEach((s, idx) => {
    s.addEventListener('click', (e) => {
      if (e.target.closest('.doorway-slide-learn-more') || e.target.closest('.statement-link')) return;
      if (idx !== currentSlideIndex) {
        e.preventDefault();
        updateDoorway(idx, true);
      }
    });
  });

  // Touch & Drag
  let startX = 0;
  let isDown = false;

  if (track) {
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.clientX;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDown) return;
      isDown = false;
      const diff = e.clientX - startX;
      if (diff > 50) updateDoorway(currentSlideIndex - 1, true);
      else if (diff < -50) updateDoorway(currentSlideIndex + 1, true);
    });

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 40) updateDoorway(currentSlideIndex - 1, true);
      else if (diff < -40) updateDoorway(currentSlideIndex + 1, true);
    }, { passive: true });
  }

  function startAuto() {
    autoTimer = setInterval(() => {
      updateDoorway(currentSlideIndex + 1);
    }, 6000);
  }

  startAuto();

  // ========================================================================
  // 2. Apple / Samara Mega Navigation Panel
  // ========================================================================
  const nav = document.getElementById('main-navigation');
  const navIndicator = document.getElementById('nav-indicator');
  const navLinks = document.querySelectorAll('.main-navigation-menu-link');
  const panelContents = document.querySelectorAll('.main-navigation-panel-content');

  function moveIndicator(link) {
    if (!navIndicator || !link) return;
    const rect = link.getBoundingClientRect();
    const parentRect = link.parentElement.getBoundingClientRect();
    navIndicator.style.left = `${rect.left - parentRect.left}px`;
    navIndicator.style.width = `${rect.width}px`;
  }

  const activeLink = document.querySelector('.main-navigation-menu-link.active');
  if (activeLink) moveIndicator(activeLink);

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      moveIndicator(link);
      const targetPanelId = link.dataset.navTarget;

      if (targetPanelId) {
        nav.classList.add('is-panel-visible');
        panelContents.forEach(p => p.classList.toggle('active', p.id === targetPanelId));
      } else {
        nav.classList.remove('is-panel-visible');
      }
    });
  });

  if (nav) {
    nav.addEventListener('mouseleave', () => {
      nav.classList.remove('is-panel-visible');
      const curActive = document.querySelector('.main-navigation-menu-link.active');
      if (curActive) moveIndicator(curActive);
    });
  }
});

// ==========================================================================
// 3. Interactive Telemetry Detail & 70/30 Retribution Calculator
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const SPRINGS = {
    bismo: {
      meta: 'Tuk Bismo · 940 mdpl',
      lps: '4.8',
      badge: 'Normal · 1.2 NTU',
      warn: false,
      desc: 'Mata air utama pengisi 3 tandon gravitasi BUMDes Tirta Bismo. Menyuplai 280 sambungan rumah tangga di RT 01–04.',
      history: [4.6, 4.7, 4.9, 4.8, 4.8, 4.7, 4.8]
    },
    kalisari: {
      meta: 'Tuk Kalisari · 720 mdpl',
      lps: '6.1',
      badge: 'Optimal · 0.9 NTU',
      warn: false,
      desc: 'Debit stabil bersumber dari cekungan mata air hutan lindung Kalisari. Kekeruhan sangat rendah memenuhi baku mutu air minum.',
      history: [6.0, 6.1, 6.2, 6.0, 6.1, 6.2, 6.1]
    },
    pandan: {
      meta: 'Tuk Pandansari · 310 mdpl',
      lps: '3.7',
      badge: 'Normal · 3.6 NTU',
      warn: false,
      desc: 'Melayani area permukiman hilir. Sedimentasi sedikit meningkat saat hujan lebat, filter ijuk rutin dibersihkan relawan.',
      history: [3.9, 3.8, 3.7, 3.6, 3.7, 3.8, 3.7]
    },
    gunung: {
      meta: 'Tuk Gunungsari · 1.020 mdpl',
      lps: '2.1',
      badge: 'Waspada · 14.6 NTU',
      warn: true,
      desc: 'Peringatan otomatis aktif: kekeruhan 14.6 NTU akibat longsor mikro di bibir saluran transmisi 200m di atas bak tangkapan.',
      history: [3.2, 3.0, 2.8, 2.5, 2.3, 2.2, 2.1]
    },
    wonokerto: {
      meta: 'Tuk Wonokerto · 510 mdpl',
      lps: '4.7',
      badge: 'Normal · 1.5 NTU',
      warn: false,
      desc: 'Daerah tangkapan air terlindungi vegetasi aren dan bambu. Pasokan air stabil untuk konsumsi dan pertanian organik warga.',
      history: [4.6, 4.6, 4.7, 4.8, 4.7, 4.7, 4.7]
    }
  };

  const rows = document.querySelectorAll('[data-spring]');
  const card = document.getElementById('spring-detail-card');

  function renderSpring(id) {
    const s = SPRINGS[id];
    if (!s || !card) return;
    const metaEl = card.querySelector('span');
    const badgeEl = document.getElementById('spring-badge');
    const lpsEl = document.getElementById('spring-lps');
    const descEl = document.getElementById('spring-desc');
    const trendEl = document.getElementById('spring-trend');

    if (metaEl) metaEl.textContent = s.meta;
    if (badgeEl) {
      badgeEl.textContent = s.badge;
      badgeEl.className = 'status-pill ' + (s.warn ? 'status-warn' : 'status-ok');
    }
    if (lpsEl) lpsEl.textContent = s.lps;
    if (descEl) descEl.textContent = s.desc;
    if (trendEl) {
      trendEl.innerHTML = s.history.map((val, idx) => {
        const h = Math.max(18, Math.round((val / 7.0) * 100));
        const op = (0.45 + idx * 0.09).toFixed(2);
        return `<div class="trend-bar-col"><div class="trend-bar-fill" style="height:${h}%;opacity:${op};${s.warn ? 'background:#d97706;' : ''}"></div><span class="trend-bar-val num">${val}</span></div>`;
      }).join('');
    }
  }

  rows.forEach((btn) => {
    btn.addEventListener('click', () => {
      rows.forEach((r) => r.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderSpring(btn.getAttribute('data-spring'));
    });
  });

  renderSpring('bismo');

  // 70/30 Retribution Impact Calculator
  const slider = document.getElementById('calc-kk-slider');
  const kkLabel = document.getElementById('calc-kk-label');
  const totalEl = document.getElementById('calc-total');
  const bumdesEl = document.getElementById('calc-bumdes');
  const konsEl = document.getElementById('calc-konservasi');
  const treesEl = document.getElementById('calc-trees');

  const fmtRp = (n) => 'Rp ' + n.toLocaleString('id-ID');

  function updateCalc() {
    if (!slider) return;
    const kk = parseInt(slider.value, 10) || 280;
    const total = kk * 15000;
    const bumdes = Math.round(total * 0.7);
    const kons = total - bumdes;
    const trees = Math.floor(kons / 25000);

    if (kkLabel) kkLabel.textContent = `${kk} KK`;
    if (totalEl) totalEl.textContent = fmtRp(total);
    if (bumdesEl) bumdesEl.textContent = fmtRp(bumdes);
    if (konsEl) konsEl.textContent = fmtRp(kons);
    if (treesEl) treesEl.textContent = `${trees} pohon / bln`;
  }

  if (slider) {
    slider.addEventListener('input', updateCalc);
    updateCalc();
  }
});
