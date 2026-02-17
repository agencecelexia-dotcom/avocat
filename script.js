/* ============================================================
   CABINET MAÎTRE IGOR MINKO MI NZE — JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── NAVBAR scroll behaviour ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── Mobile nav toggle ── */
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    // Animate hamburger → cross
    const spans = navToggle.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  });

  // Close menu on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.querySelectorAll('span').forEach(s => {
        s.style.transform = '';
        s.style.opacity   = '';
      });
    });
  });

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('.nav-link[href^="#"]');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
    allNavLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + (el.dataset.target === '100' ? '%' : '+');
    }
    requestAnimationFrame(step);
  }

  /* ── Intersection Observer — reveal elements & counters ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Counter-specific observer
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ── Add reveal classes to elements ── */
  function addRevealClasses() {
    // Domaine cards
    document.querySelectorAll('.domaine-card').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${i + 1}`);
    });
    // Service items
    document.querySelectorAll('.service-item').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${(i % 3) + 1}`);
    });
    // Value items
    document.querySelectorAll('.value-item').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${i + 1}`);
    });
    // Contact items
    document.querySelectorAll('.contact-item').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${i + 1}`);
    });
    // CTA features
    document.querySelectorAll('.cta-feature').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${i + 1}`);
    });
    // Section headers
    document.querySelectorAll('.section-header').forEach(el => {
      el.classList.add('reveal');
    });
    // profil grid children
    document.querySelectorAll('.profil-visual, .profil-content').forEach((el, i) => {
      el.classList.add('reveal', `reveal-delay-${i + 1}`);
    });

    // Re-observe after adding classes
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  addRevealClasses();

  /* ── Contact form ── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;

      // Loading state
      btn.disabled = true;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite">
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span>Envoi en cours...</span>
      `;

      // Simulate async send (replace with real fetch/API call)
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        contactForm.reset();
        formSuccess.classList.add('visible');
        setTimeout(() => formSuccess.classList.remove('visible'), 6000);
      }, 1600);
    });
  }

  /* ── Smooth scroll offset for fixed nav ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: 'smooth'
      });
    });
  });

  /* ── CSS: spinner keyframe (injected) ── */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .nav-link.active {
      color: #fff !important;
    }
    .nav-link.active::after {
      width: 100% !important;
    }
  `;
  document.head.appendChild(style);

})();
