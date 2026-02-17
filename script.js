/* ============================================================
   CABINET MAÎTRE IGOR MINKO MI NZE — JavaScript v3 (fixes)
   ============================================================ */

(function () {
  'use strict';

  /* ── NAVBAR scroll behaviour (home page only) ── */
  var navbar = document.getElementById('navbar');
  if (navbar && !navbar.classList.contains('scrolled')) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          navbar.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── Mobile nav toggle ── */
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');

  function closeNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    var spans = navToggle.querySelectorAll('span');
    spans.forEach(function (s) { s.style.transform = ''; s.style.opacity = ''; });
    // Close all mobile dropdowns too
    document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
  }

  function openNav() {
    if (!navToggle || !navLinks) return;
    navLinks.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    var spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      if (navLinks.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Close on link click inside nav
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  /* ── Close mobile nav on click outside ── */
  document.addEventListener('click', function (e) {
    if (!navLinks || !navToggle) return;
    if (!navLinks.classList.contains('open')) return;
    if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      closeNav();
    }
  });

  /* ── Close mobile nav on ESC key ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (navLinks && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
      // Also close any open FAQ
      document.querySelectorAll('.faq-question.open').forEach(function (btn) {
        toggleFaq(btn, false);
      });
    }
  });

  /* ── Mobile dropdown toggle ── */
  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var btn = dropdown.querySelector('.nav-dropdown-btn');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = dropdown.classList.contains('open');
        // Close other dropdowns
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          d.classList.remove('open');
          var b = d.querySelector('.nav-dropdown-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          dropdown.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  /* ── Close mobile nav on resize to desktop ── */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768 && navLinks && navLinks.classList.contains('open')) {
      closeNav();
    }
  }, { passive: true });

  /* ── Intersection Observer — reveal elements ── */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show all elements immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ── Counter animation ── */
  function animateCounter(el) {
    var target   = parseInt(el.dataset.target, 10);
    var suffix   = el.dataset.suffix || '';
    var duration = 1800;
    var start    = performance.now();

    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + (progress >= 1 ? suffix : '');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    // Fallback: show final values immediately
    document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
      el.textContent = el.dataset.target + (el.dataset.suffix || '');
    });
  }

  /* ── FAQ accordion ── */
  function toggleFaq(btn, forceOpen) {
    var item   = btn.closest('.faq-item');
    if (!item) return;
    var answer = item.querySelector('.faq-answer');
    if (!answer) return;
    var isOpen = typeof forceOpen === 'boolean' ? !forceOpen : btn.classList.contains('open');

    if (!isOpen) {
      // Close all others first
      document.querySelectorAll('.faq-question.open').forEach(function (openBtn) {
        openBtn.classList.remove('open');
        openBtn.setAttribute('aria-expanded', 'false');
        var openAnswer = openBtn.closest('.faq-item').querySelector('.faq-answer');
        if (openAnswer) openAnswer.classList.remove('open');
      });
      // Open this one
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.add('open');
    } else {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      answer.classList.remove('open');
    }
  }

  document.querySelectorAll('.faq-question').forEach(function (btn) {
    // Set initial aria state
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', function () {
      toggleFaq(btn);
    });
  });

  /* ── Contact form ── */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = contactForm.querySelector('button[type="submit"]');
      if (!btn || btn.disabled) return; // Prevent double submit

      var originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon" aria-hidden="true"><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span>Envoi en cours\u2026</span>';

      // Simulate send — replace with real fetch/FormData POST
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        contactForm.reset();
        if (formSuccess) {
          formSuccess.classList.add('visible');
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(function () { formSuccess.classList.remove('visible'); }, 8000);
        }
      }, 1800);
    });
  }

  /* ── Smooth scroll for same-page anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var offset = 90;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: 'smooth'
      });
      // Update URL without page jump
      history.pushState(null, '', href);
    });
  });

  /* ── Inject utility CSS ── */
  var style = document.createElement('style');
  style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin .8s linear infinite;width:18px;height:18px}';
  document.head.appendChild(style);

})();
