/* ANNA ICE DRINKS — small progressive enhancements. No dependencies. */
(function () {
  'use strict';

  /* --- mobile navigation --- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'باز کردن منو');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* --- current year, in Persian digits --- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    try {
      yearEl.textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
    } catch (err) {
      /* keep the hard-coded fallback already in the markup */
    }
  }

  /* --- reveal sections on scroll --- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.section-head, .about-grid, .product-card, .flavor, .feature, .cov-card, .faq details, .contact-card'
    );

    Array.prototype.forEach.call(targets, function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity .6s ease ' + ((i % 6) * 60) + 'ms, transform .6s cubic-bezier(.2,.8,.3,1) ' + ((i % 6) * 60) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }
})();
