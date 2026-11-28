/* Scroll reveal for the landing. Adds the hiding class only after the observer exists,
   so the page stays fully visible if scripts fail. */
(function () {
  if (!('IntersectionObserver' in window)) return;

  var root = document.documentElement;

  var SELECTORS = [
    '.content-section > .section-eyebrow',
    '.content-section > .section-headline',
    '.content-section > .section-desc',
    '#mata-air .telemetry-grid',
    '#retribusi > div > div',
    '#retribusi > .calc-card',
    '#peran > div > div',
    '.ls-step',
    '.ls-feature',
    '.ls-tile',
    '.ls-access-row',
    '.ls-faq details',
    '.ls-note',
    '#dampak > div'
  ];

  var targets = [];
  SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (targets.indexOf(el) === -1) targets.push(el);
    });
  });
  if (!targets.length) return;

  var observer = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (e) { return e.isIntersecting; });
    visible.forEach(function (entry, i) {
      var el = entry.target;
      observer.unobserve(el);
      // 55ms between items that appear together, capped so long grids don't drag
      el.style.setProperty('--d', Math.min(i, 6) * 55 + 'ms');
      requestAnimationFrame(function () { el.classList.add('is-in'); });
      // The telemetry bars first grew while off screen; replay them as the table appears
      if (el.matches('#mata-air .telemetry-grid')) {
        el.querySelectorAll('.trend-bar-fill').forEach(function (bar) {
          bar.style.animation = 'none';
          void bar.offsetWidth;
          bar.style.animation = '';
        });
      }
      // Hand the element back to its own hover/transition styles once the entrance is done
      setTimeout(function () {
        el.removeAttribute('data-reveal');
        el.classList.remove('is-in');
        el.style.removeProperty('--d');
      }, 1600);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(function (el) {
    el.setAttribute('data-reveal', '');
    observer.observe(el);
  });
  root.classList.add('has-reveal');
})();
