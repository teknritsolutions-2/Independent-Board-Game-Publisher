/**
 * TabletopForge — main.js
 * Shared site UI and page-level interactions.
 *
 * Responsibilities:
 *   - Normalize public navigation and sync brand marks
 *   - Theme + RTL state
 *   - Shared utilities used by page-specific modules
 *   - Public page interactions for games, blog, contact, FAQ, profile, and more
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   GLOBAL HELPERS
───────────────────────────────────────────────────────────── */
window.$ = (sel, ctx = document) => ctx.querySelector(sel);
window.$$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function brandMarkSvg(size = 20) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
  <path d="M12 2.65 19.4 6.95v10.1L12 21.35 4.6 17.05V6.95L12 2.65Z" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/>
  <path d="M12 5.35 16.95 8.2v5.6L12 16.65 7.05 13.8V8.2L12 5.35Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
  <path d="M12 8.15l1 1.9 2.1.3-1.55 1.5.38 2.15L12 12.95 10.07 14l.38-2.15-1.55-1.5 2.1-.3L12 8.15Z" fill="currentColor"/>
  <path d="M7.65 7.95 12 10.45l4.35-2.5M7.65 14.05 12 11.55l4.35 2.5" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

function syncBrandMarks(ctx = document) {
  $$('.nav__logo-mark', ctx).forEach(mark => {
    mark.innerHTML = brandMarkSvg(20);
  });

  $$('.footer__brand-name', ctx).forEach(brand => {
    const current = brand.querySelector('svg');
    if (current) current.outerHTML = brandMarkSvg(16);
  });
}

/* ─────────────────────────────────────────────────────────────
   SHARED UTILITIES
───────────────────────────────────────────────────────────── */
window.TTF = window.TTF || {};

window.TTF.readingProgress = function(fillSel = '#read-progress', contentSel = '#article-content') {
  const fill    = $(fillSel);
  const content = $(contentSel);
  if (!fill || !content) return;

  function update() {
    const rect  = content.getBoundingClientRect();
    const total = content.offsetHeight - window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const pct = Math.min(100, total > 0 ? (scrolled / total) * 100 : 0);
    fill.style.width = pct.toFixed(1) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
};

window.TTF.paginationButtons = function(btnSel = '.page-btn', scrollTargetSel = null) {
  const btns = $$(btnSel);
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.querySelector('i')) return;
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (scrollTargetSel) $(scrollTargetSel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};


/* ─────────────────────────────────────────────────────────────
   1. NAV MANAGER
───────────────────────────────────────────────────────────── */
const NavManager = (() => {
  let menuOpen = false;
  const SHARED_MOBILE_ID = 'mobile-menu';
  const DESKTOP_NAV_BREAKPOINT = 980;

  function currentFile() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function currentGroup(file) {
    if (['index.html', 'home-page-2.html'].includes(file)) return 'home';
    if ([
      'about.html',
      'careers.html',
      'blog.html',
      'blog-single.html',
      'contact.html',
      'faq.html',
      'press-kit.html',
      'privacy-policy.html',
      'terms-conditions.html'
    ].includes(file)) return 'about';
    if (['forum.html', 'forum-thread.html'].includes(file)) return 'forum';
    if (['games.html', 'game-single.html', 'games-coming-soon.html', 'games-funded.html', 'retailer-info.html'].includes(file)) return 'games';
    if (file === 'campaigns.html') return 'campaigns';
    if (file === 'launch.html') return 'launch';
    if (file === 'profile.html' || file === 'shipping-status.html' || file.startsWith('dashboard-')) return 'dashboard';
    return '';
  }

  function linkClass(group, activeGroup) {
    return group === activeGroup ? 'nav__link active' : 'nav__link';
  }

  function normalizeNavFile(file) {
    return {
      'blog-single.html': 'blog.html',
      'forum-thread.html': 'forum.html',
      'game-single.html': 'games.html',
      'retailer-info.html': 'games.html',
      'profile.html': 'dashboard-user.html',
      'shipping-status.html': 'dashboard-user.html',
      'careers.html': 'about.html',
      'press-kit.html': 'about.html',
      'privacy-policy.html': 'about.html',
      'terms-conditions.html': 'about.html'
    }[file] || file;
  }

  function dropdownLinkClass(target, current) {
    return target === normalizeNavFile(current) ? 'nav__dropdown-link active' : 'nav__dropdown-link';
  }

  function mobileLinkClass(file, current, extra = '') {
    const classes = ['nav__mobile-link'];
    if (extra) classes.push(extra);
    if (file === normalizeNavFile(current)) classes.push('active');
    return classes.join(' ');
  }

  function buildFooterMarkup() {
    return `
<footer class="footer" data-footer-normalized="1">
  <div class="container">
    <div class="footer-grid footer-grid--site">
      <div class="footer-col footer-col--brand">
        <a href="index.html" class="footer__brand" aria-label="TabletopForge Home">
          <div class="nav__logo-mark" aria-hidden="true">
            ${brandMarkSvg(18)}
          </div>
          <span class="footer__brand-text">TabletopForge</span>
        </a>
        <p class="footer__summary">Crowdfunding, discovery, and launch tooling for independent board game publishers and the backers who keep them moving.</p>
        <div class="footer__cta-row">
          <a href="campaigns.html" class="btn btn--primary btn--sm">Browse Campaigns</a>
          <a href="launch.html" class="btn btn--ghost btn--sm">Launch a Game</a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-col__heading">Explore</div>
        <div class="footer-col__links">
          <a href="index.html" class="footer-col__link">Home</a>
          <a href="home-page-2.html" class="footer-col__link">Home Page 2</a>
          <a href="games.html" class="footer-col__link">Games</a>
          <a href="games-coming-soon.html" class="footer-col__link">Coming Soon</a>
          <a href="games-funded.html" class="footer-col__link">Funded Games</a>
          <a href="campaigns.html" class="footer-col__link">Campaigns</a>
          <a href="launch.html" class="footer-col__link">Launch</a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-col__heading">Company</div>
        <div class="footer-col__links">
          <a href="about.html" class="footer-col__link">About</a>
          <a href="blog.html" class="footer-col__link">Blog</a>
          <a href="contact.html" class="footer-col__link">Contact</a>
          <a href="forum.html" class="footer-col__link">Forum</a>
          <a href="faq.html" class="footer-col__link">FAQ</a>
          <a href="careers.html" class="footer-col__link">Careers</a>
          <a href="press-kit.html" class="footer-col__link">Press Kit</a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-col__heading">Account</div>
        <div class="footer-col__links">
          <a href="dashboard-user.html" class="footer-col__link">Dashboard</a>
          <a href="dashboard-admin.html" class="footer-col__link">Admin Dashboard</a>
          <a href="login.html" class="footer-col__link">Login</a>
          <a href="retailer-info.html" class="footer-col__link">Retailer Info</a>
          <a href="privacy-policy.html" class="footer-col__link">Privacy Policy</a>
          <a href="terms-conditions.html" class="footer-col__link">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 TabletopForge. All rights reserved.</span>
      <span>Independent board games, cleaner launches, stronger backer support.</span>
    </div>
  </div>
</footer>`;
  }

  function buildHeaderMarkup(file) {
    const activeGroup = currentGroup(file);
    return `
<div class="nav-wrap" data-nav-normalized="1">
<header class="nav" role="banner">
    <nav class="nav__inner" aria-label="Main navigation">
      <a href="index.html" class="nav__logo" aria-label="TabletopForge Home">
        <div class="nav__logo-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16l-1.447.724a1 1 0 0 0-.553.894V20h12v-2.382a1 1 0 0 0-.553-.894L16 16"/><path d="M8 16V9a4 4 0 0 1 8 0v7"/><path d="M9 9h6"/><circle cx="12" cy="6" r="1"/></svg>
        </div>
        <span class="nav__logo-text">TabletopForge</span>
      </a>

      <ul class="nav__links" role="list">
        <li class="nav__item">
          <a href="index.html" class="${linkClass('home', activeGroup)}" aria-haspopup="true" data-nav-group="home">
            Home
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>
          </a>
          <div class="nav__dropdown" role="menu">
            <a href="index.html" class="${dropdownLinkClass('index.html', file)}" role="menuitem">
              <i class="fa-solid fa-house" aria-hidden="true"></i>
              <div>Home Page 1 <span>Main landing experience</span></div>
            </a>
            <a href="home-page-2.html" class="${dropdownLinkClass('home-page-2.html', file)}" role="menuitem">
              <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
              <div>Home Page 2 <span>Campaign spotlight layout</span></div>
            </a>
          </div>
        </li>
        <li class="nav__item">
          <a href="about.html" class="${linkClass('about', activeGroup)}" data-nav-group="about">About Us</a>
        </li>
        <li class="nav__item">
          <a href="games.html" class="${linkClass('games', activeGroup)}" aria-haspopup="true" data-nav-group="games">
            Games
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>
          </a>
          <div class="nav__dropdown" role="menu">
            <a href="games.html" class="${dropdownLinkClass('games.html', file)}" role="menuitem">
              <i class="fa-solid fa-dice" aria-hidden="true"></i>
              <div>All Titles <span>Browse our full catalogue</span></div>
            </a>
            <a href="games-coming-soon.html" class="${dropdownLinkClass('games-coming-soon.html', file)}" role="menuitem">
              <i class="fa-solid fa-clock" aria-hidden="true"></i>
              <div>Coming Soon <span>Wishlist &amp; notify</span></div>
            </a>
            <a href="games-funded.html" class="${dropdownLinkClass('games-funded.html', file)}" role="menuitem">
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <div>Funded Games <span>Find where to buy</span></div>
            </a>
          </div>
        </li>
        <li class="nav__item">
          <a href="forum.html" class="${linkClass('forum', activeGroup)}" data-nav-group="forum">Forum</a>
        </li>
        <li class="nav__item">
          <a href="campaigns.html" class="${linkClass('campaigns', activeGroup)}" data-nav-group="campaigns">Campaigns</a>
        </li>
        <li class="nav__item">
          <a href="launch.html" class="${linkClass('launch', activeGroup)}" data-nav-group="launch">Launch</a>
        </li>
        <li class="nav__item">
          <a href="dashboard-user.html" class="${linkClass('dashboard', activeGroup)}" aria-haspopup="true" data-nav-group="dashboard">
            Dashboard
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>
          </a>
          <div class="nav__dropdown" role="menu">
            <a href="dashboard-admin.html" class="${dropdownLinkClass('dashboard-admin.html', file)}" role="menuitem">
              <i class="fa-solid fa-gear" aria-hidden="true"></i>
              <div>Admin Dashboard <span>Manage games &amp; operations</span></div>
            </a>
          </div>
        </li>
      </ul>

      <div class="nav__controls">
        <button class="nav__icon-btn" data-theme-toggle aria-label="Toggle theme" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>
        <button class="nav__icon-btn" data-rtl-toggle aria-label="Switch RTL" type="button">RTL</button>
        <a href="login.html" class="btn btn--primary btn--sm nav__login">Login</a>
      </div>

      <button class="nav__hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="${SHARED_MOBILE_ID}" type="button">
        <span></span><span></span><span></span>
      </button>
    </nav>
</header>
</div>`;
  }

  function buildMobileMarkup(file) {
    return `
<nav id="${SHARED_MOBILE_ID}" class="nav__mobile" aria-label="Mobile navigation" aria-hidden="true">
  <div class="nav__mobile-section">
    <a href="index.html" class="${mobileLinkClass('index.html', file)}">Home</a>
    <a href="about.html" class="${mobileLinkClass('about.html', file)}">About Us</a>
    <a href="games.html" class="${mobileLinkClass('games.html', file)}">Games</a>
    <a href="forum.html" class="${mobileLinkClass('forum.html', file)}">Forum</a>
    <a href="campaigns.html" class="${mobileLinkClass('campaigns.html', file)}">Campaigns</a>
    <a href="launch.html" class="${mobileLinkClass('launch.html', file)}">Launch</a>
    <a href="dashboard-user.html" class="${mobileLinkClass('dashboard-user.html', file)}">Dashboard</a>
  </div>
  <div class="nav__mobile-section nav__mobile-section--compact">
    <div class="nav__mobile-label">More</div>
    <a href="home-page-2.html" class="${mobileLinkClass('home-page-2.html', file, 'nav__mobile-sub')}">Home Page 2</a>
    <a href="games-coming-soon.html" class="${mobileLinkClass('games-coming-soon.html', file, 'nav__mobile-sub')}">Coming Soon</a>
    <a href="games-funded.html" class="${mobileLinkClass('games-funded.html', file, 'nav__mobile-sub')}">Funded Games</a>
    <a href="dashboard-admin.html" class="${mobileLinkClass('dashboard-admin.html', file, 'nav__mobile-sub')}">Admin Dashboard</a>
  </div>
  <div class="nav__mobile-controls">
    <button class="btn btn--ghost" data-theme-toggle data-theme-label="Theme" type="button">Theme</button>
    <button class="btn btn--ghost" data-rtl-toggle type="button">RTL</button>
  </div>
  <a href="login.html" class="btn btn--primary nav__mobile-login">Login</a>
</nav>`;
  }

  function normalizePublicNav(file) {
    const existing = $('.nav-wrap') || $('.nav');
    if (!existing || existing.dataset.navNormalized === '1') return;
    if (document.body.classList.contains('coming-soon-page') || document.body.classList.contains('dashboard-page')) return;

    const existingMobileNav = $('.nav__mobile');
    existing.outerHTML = buildHeaderMarkup(file);
    existingMobileNav?.remove();
    $('.nav-wrap')?.insertAdjacentHTML('afterend', buildMobileMarkup(file));
  }

  function normalizePublicFooter() {
    const existingFooter = $('.footer');
    if (!existingFooter || existingFooter.dataset.footerNormalized === '1') return;
    if (document.body.classList.contains('dashboard-page')) return;
    existingFooter.outerHTML = buildFooterMarkup();
  }

  function init() {
    const file = currentFile();
    normalizePublicNav(file);
    normalizePublicFooter();
    syncBrandMarks();

    const nav       = $('.nav-wrap .nav') || $('.nav');
    const burger    = $('.nav__hamburger');
    const mobileNav = $('.nav__mobile');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function openMenu() {
      menuOpen = true;
      burger?.classList.add('open');
      mobileNav?.classList.add('open');
      mobileNav?.setAttribute('aria-hidden', 'false');
      burger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      burger?.classList.remove('open');
      mobileNav?.classList.remove('open');
      mobileNav?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger?.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
    document.addEventListener('click', e => {
      if (menuOpen && !nav.contains(e.target) && !mobileNav?.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > DESKTOP_NAV_BREAKPOINT) closeMenu(); });

    $$('.nav__link[href]').forEach(link => {
      if (link.getAttribute('href').split('/').pop() === file) {
        link.classList.add('active');
      }
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   2. THEME MANAGER
───────────────────────────────────────────────────────────── */
const ThemeManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-theme';

  const MOON_ICON = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const SUN_ICON  = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  function getCurrent() {
    return localStorage.getItem(KEY)
      || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function updateButton(btn, theme) {
    const icon = theme === 'dark' ? SUN_ICON : MOON_ICON;
    const label = btn.dataset.themeLabel;

    if (label) {
      btn.innerHTML = `<span class="theme-toggle__icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
    } else {
      btn.innerHTML = icon;
    }

    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);

    $$('[data-theme-toggle]').forEach(btn => {
      updateButton(btn, theme);
    });
  }

  function init() {
    apply(getCurrent());
    window.TTF.syncThemeControls = () => apply(getCurrent());

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      e.preventDefault();
      apply(getCurrent() === 'dark' ? 'light' : 'dark');
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'light' : 'dark');
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   3. RTL MANAGER
───────────────────────────────────────────────────────────── */
const RTLManager = (() => {
  const root = document.documentElement;
  const KEY  = 'ttf-dir';

  function updateBtns(dir) {
    $$('[data-rtl-toggle]').forEach(btn => {
      btn.textContent = dir === 'ltr' ? 'RTL' : 'LTR';
      btn.setAttribute('aria-label', `Switch to ${dir === 'ltr' ? 'RTL' : 'LTR'} layout`);
    });
  }

  function init() {
    const saved = localStorage.getItem(KEY) || 'ltr';
    root.setAttribute('dir', saved);
    updateBtns(saved);
    window.TTF.syncDirControls = () => updateBtns(root.getAttribute('dir') || 'ltr');

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-rtl-toggle]');
      if (!btn) return;
      e.preventDefault();
      const next = root.getAttribute('dir') === 'ltr' ? 'rtl' : 'ltr';
      root.setAttribute('dir', next);
      localStorage.setItem(KEY, next);
      updateBtns(next);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   4. REVEAL MANAGER — scroll-triggered fade-ups
───────────────────────────────────────────────────────────── */
const RevealManager = (() => {
  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    $$('.reveal').forEach(el => io.observe(el));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   5. PROGRESS MANAGER — campaign progress bars
───────────────────────────────────────────────────────────── */
const ProgressManager = (() => {
  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const fill  = entry.target.querySelector('.progress__fill');
        const width = parseInt(fill?.dataset.width || '0', 10);
        if (fill) setTimeout(() => { fill.style.width = Math.min(width, 100) + '%'; }, 160);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.28 });

    $$('.progress').forEach(el => io.observe(el));

    $$('.gs-funding__fill, .h2-meter-fill').forEach(fill => {
      const io2 = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            fill.style.width = fill.dataset.width ? fill.dataset.width + '%' : '100%';
            io2.unobserve(fill);
          }
        });
      }, { threshold: 0.3 });
      io2.observe(fill);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   6. CAROUSEL MANAGER — testimonials
───────────────────────────────────────────────────────────── */
const CarouselManager = (() => {
  function init() {
    $$('[data-carousel]').forEach(carousel => {
      const track   = carousel.querySelector('.testimonials__track');
      const cards   = $$('.testi-card', carousel);
      const prev    = carousel.querySelector('[data-prev]');
      const next    = carousel.querySelector('[data-next]');
      const dotsWrap = carousel.querySelector('.testi-dots');
      if (!track || !cards.length) return;

      let current = 0;
      let timer;

      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap?.appendChild(dot);
      });

      function goTo(index) {
        current = Math.max(0, Math.min(index, cards.length - 1));
        const cardW = cards[0].offsetWidth + 16;
        track.style.transform = `translateX(-${current * cardW}px)`;
        $$('.testi-dot', carousel).forEach((d, i) => d.classList.toggle('active', i === current));
      }

      function startAuto() {
        timer = setInterval(() => goTo((current + 1) % cards.length), 5000);
      }
      function stopAuto() { clearInterval(timer); }

      prev?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
      next?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);

      let startX = 0;
      track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { stopAuto(); goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
      });

      startAuto();
      window.addEventListener('resize', () => goTo(current));
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   7. FEATURE ACCORDION — homepage how-it-works items
───────────────────────────────────────────────────────────── */
const FeatureAccordion = (() => {
  function init() {
    const items = $$('.feature-item');
    if (!items.length) return;

    items.forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');

      const activate = () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      };

      item.addEventListener('click', activate);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });

    if (items[0] && !$$('.feature-item.active').length) items[0].classList.add('active');
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   8. CURSOR MANAGER — custom cursor, desktop only
───────────────────────────────────────────────────────────── */
const CursorManager = (() => {
  const interactiveSelector = 'a,button,[role="button"],input,select,textarea,label,.campaign-card,.feature-item,.game-card,.testi-card,.post-card';

  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      * { cursor: none !important; }
      .ttf-cursor {
        position:fixed; top:0; left:0; pointer-events:none; z-index:99999;
        transform:translate3d(-100px,-100px,0); transition:opacity .18s ease;
      }
      .ttf-cursor__dot {
        position:absolute; width:5px; height:5px; border-radius:50%;
        background:var(--text-primary); top:50%; left:50%;
        transform:translate(-50%,-50%);
        transition:width .2s,height .2s,background .2s;
      }
      .ttf-cursor__ring {
        position:absolute; width:32px; height:32px; border-radius:50%;
        border:1px solid rgba(244,244,244,.22); top:50%; left:50%;
        transform:translate(-50%,-50%);
        transition:width .35s cubic-bezier(.16,1,.3,1),
                   height .35s cubic-bezier(.16,1,.3,1),
                   border-color .2s;
      }
      .ttf-cursor.hover .ttf-cursor__dot  { width:10px;height:10px;background:var(--primary); }
      .ttf-cursor.hover .ttf-cursor__ring { width:52px;height:52px;border-color:rgba(244,87,69,.35); }
      .ttf-cursor.click .ttf-cursor__ring { width:20px;height:20px; }
      .ttf-cursor.hidden { opacity:0; }
      [data-theme="light"] .ttf-cursor__ring {
        border-color: rgba(244,87,69,.30);
        box-shadow: 0 0 0 1px rgba(244,87,69,.10);
      }
      [data-theme="light"] .ttf-cursor.hover .ttf-cursor__ring {
        border-color: rgba(244,87,69,.55);
      }
    `;
    document.head.appendChild(s);
  }

  function init() {
    if (
      'ontouchstart' in window
      || window.matchMedia('(pointer:coarse)').matches
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    injectStyles();

    const cursor = document.createElement('div');
    cursor.className = 'ttf-cursor';
    cursor.innerHTML = '<div class="ttf-cursor__dot"></div><div class="ttf-cursor__ring"></div>';
    document.body.appendChild(cursor);

    let mouseX = -100;
    let mouseY = -100;

    document.addEventListener('pointermove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate3d(${mouseX}px,${mouseY}px,0)`;
      cursor.classList.toggle('hover', Boolean(e.target.closest(interactiveSelector)));
    });

    document.addEventListener('pointerdown', () => cursor.classList.add('click'));
    document.addEventListener('pointerup',   () => cursor.classList.remove('click'));
    document.addEventListener('pointerleave', () => cursor.classList.add('hidden'));
    document.addEventListener('pointerenter', () => {
      cursor.classList.remove('hidden');
      cursor.style.transform = `translate3d(${mouseX}px,${mouseY}px,0)`;
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   9. COUNTER MANAGER — data-count animated numbers
───────────────────────────────────────────────────────────── */
const CounterManager = (() => {
  function animate(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';

    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isFloat = String(el.dataset.count).includes('.');
    const dur = 1800;
    const start = performance.now();

    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 5);
      const val = target * eased;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  function init() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });

    $$('[data-count]:not([data-animated])').forEach(el => io.observe(el));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   10. MARQUEE MANAGER — clone track for seamless loop
───────────────────────────────────────────────────────────── */
const MarqueeManager = (() => {
  function init() {
    $$('.marquee-track').forEach(track => {
      if (track.dataset.cloned) return;
      track.dataset.cloned = '1';
      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.parentElement.appendChild(clone);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   11. NEWSLETTER FORM VALIDATION
───────────────────────────────────────────────────────────── */
const NewsletterForm = (() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function init() {
    $$('[data-newsletter-form]').forEach(form => {
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input || !btn) return;

      form.addEventListener('submit', e => {
        e.preventDefault();
        const valid = EMAIL_RE.test(input.value.trim());

        input.classList.toggle('error',   !valid);
        input.classList.toggle('success',  valid);

        if (!valid) {
          input.focus();
          return;
        }

        const orig = btn.textContent;
        btn.textContent = 'Subscribed ✓';
        btn.disabled = true;

        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          input.value = '';
          input.classList.remove('success');
        }, 3000);
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   12. TIMELINE MANAGER — about page timeline dots
───────────────────────────────────────────────────────────── */
const TimelineManager = (() => {
  function init() {
    const items = $$('.timeline-item');
    if (!items.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('active', e.isIntersecting));
    }, { threshold: 0.55 });

    items.forEach(item => io.observe(item));
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   13. PARTICLE MANAGER — disabled; decorative bg handled in CSS
───────────────────────────────────────────────────────────── */
const ParticleManager = (() => {
  const TARGETS = [];

  class Dot {
    constructor(W, H, initial) {
      this.W = W;
      this.H = H;
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = this.W * (0.02 + Math.random() * 0.96);
      this.y = initial ? this.H * Math.random() : this.H + Math.random() * 20;
      this.r = Math.random() < 0.75 ? 0.8 + Math.random() * 1.4 : 2.0 + Math.random() * 1.5;
      this.vy = -(0.15 + Math.random() * 0.55);
      this.vx = (Math.random() - 0.5) * 0.12;
      this.maxL = 160 + Math.random() * 200;
      this.life = initial ? Math.random() * this.maxL : 0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life += 1;
      if (this.life >= this.maxL || this.y < -8) this.reset();
    }

    draw(ctx) {
      const t = this.life / this.maxL;
      const alpha = t < 0.12 ? t / 0.12 : t > 0.82 ? (1 - t) / 0.18 : 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244,87,69,${(alpha * 0.30).toFixed(3)})`;
      ctx.fill();
    }
  }

  function attach(section) {
    if (section.dataset.ttfParticles) return;
    section.dataset.ttfParticles = '1';

    if (getComputedStyle(section).position === 'static') {
      section.style.position = 'relative';
    }

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'ttf-particles-canvas';
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1',
    });
    section.insertBefore(canvas, section.firstChild);

    const ctx = canvas.getContext('2d');
    let W;
    let H;
    let dots = [];
    let raf = null;

    function dotCount() {
      return W < 600 ? 28 : W < 1024 ? 42 : 55;
    }

    function resize() {
      W = section.offsetWidth;
      H = section.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      dots = Array.from({ length: dotCount() }, () => new Dot(W, H, true));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(dot => {
        dot.update();
        dot.draw(ctx);
      });
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();

    let resizeT;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        cancelAnimationFrame(raf);
        raf = null;
        resize();
        tick();
      }, 150);
    });
    ro.observe(section);

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) tick();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }, { threshold: 0 });
    io.observe(section);
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 480) return;

    TARGETS.forEach(sel => {
      document.querySelectorAll(sel).forEach(attach);
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   14. GS TAB MANAGER — game single page tabs
───────────────────────────────────────────────────────────── */
const GsTabManager = (() => {
  function init() {
    const tabs   = $$('.gs-tab');
    const panels = $$('.gs-panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t   => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const panelId = 'panel-' + tab.dataset.tab;
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add('active');
          panel.style.animation = 'fade-up .3s cubic-bezier(.16,1,.3,1) both';
        }
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   15. FILTER MANAGER — game/blog filter pills
───────────────────────────────────────────────────────────── */
const FilterManager = (() => {
  function init() {
    const gamePills = $$('[data-filter]');
    const gameCards = $$('.game-card');
    if (gamePills.length && gameCards.length) {
      gamePills.forEach(pill => {
        pill.addEventListener('click', () => {
          gamePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const filter = pill.dataset.filter;
          let shown = 0;

          gameCards.forEach(card => {
            const tags  = card.dataset.tags || '';
            const match = filter === 'all' || tags.includes(filter);
            card.style.transition    = 'opacity .2s ease, transform .2s ease';
            card.style.opacity       = match ? '1' : '0.25';
            card.style.pointerEvents = match ? '' : 'none';
            if (match) shown++;
          });

          const count = document.getElementById('results-count');
          if (count) count.textContent = `${shown} game${shown !== 1 ? 's' : ''}`;

          const empty = document.getElementById('empty-state');
          if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
        });
      });
    }

    const blogPills = $$('[data-blog-filter]');
    const blogCards = $$('[data-blog-tags]');
    if (blogPills.length && blogCards.length) {
      blogPills.forEach(pill => {
        pill.addEventListener('click', () => {
          blogPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          const filter = pill.dataset.blogFilter;
          let shown = 0;

          blogCards.forEach(card => {
            const tags  = card.dataset.blogTags || '';
            const match = filter === 'all' || tags.includes(filter);
            card.style.transition    = 'opacity .2s ease';
            card.style.opacity       = match ? '1' : '0.2';
            card.style.pointerEvents = match ? '' : 'none';
            if (match) shown++;
          });

          const empty = document.getElementById('blog-empty');
          if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
        });
      });
    }
  }

  window.resetFilter = function() {
    const all = $('[data-filter="all"]');
    if (all) all.click();
  };

  window.resetBlogFilter = function() {
    const all = $('[data-blog-filter="all"]');
    if (all) all.click();
  };

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   16. CONTACT FORM — contact.html validation + submit
───────────────────────────────────────────────────────────── */
const ContactForm = (() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setValid(groupId, valid, msg = '') {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.toggle('invalid', !valid);
    const err = group.querySelector('.form-error-msg');
    if (err) err.textContent = msg;
  }

  function init() {
    const form    = document.getElementById('contact-form');
    const success = document.getElementById('form-success');
    const resetBtn = document.getElementById('form-reset-btn');
    const submitBtn = document.getElementById('contact-submit');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;

      const first = form.querySelector('#first-name');
      const last  = form.querySelector('#last-name');
      const email = form.querySelector('#email');
      const msg   = form.querySelector('#message');
      const subj  = form.querySelector('#subject');
      const honeypot = form.querySelector('input[name="_honeypot"]');

      if (honeypot?.value.trim()) return;

      if (!first?.value.trim()) { setValid('fg-first', false, 'Please enter your first name.'); ok = false; } else setValid('fg-first', true);
      if (!last?.value.trim())  { setValid('fg-last',  false, 'Please enter your last name.');  ok = false; } else setValid('fg-last',  true);
      if (!EMAIL_RE.test(email?.value.trim() || '')) { setValid('fg-email', false, 'Please enter a valid email.'); ok = false; } else setValid('fg-email', true);
      if (!subj?.value)         { setValid('fg-subject', false, 'Please choose a subject.'); ok = false; } else setValid('fg-subject', true);
      if (!msg?.value.trim())   { setValid('fg-msg',   false, 'Please enter a message.');        ok = false; } else setValid('fg-msg',   true);

      if (!ok) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      setTimeout(() => {
        form.style.display  = 'none';
        if (success) { success.style.display = 'flex'; success.classList.add('visible'); }
      }, 900);
    });

    resetBtn?.addEventListener('click', () => {
      form.reset();
      ['fg-first', 'fg-last', 'fg-email', 'fg-subject', 'fg-msg'].forEach(id => setValid(id, true));
      form.style.display = '';
      if (success) { success.style.display = 'none'; success.classList.remove('visible'); }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Send message <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>'; }
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   17. READING PROGRESS — blog single reading bar
───────────────────────────────────────────────────────────── */
const ReadingProgress = (() => {
  function init() {
    window.TTF.readingProgress('#read-progress', '#article-content');
  }
  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   18. FAQ MANAGER — faq.html search filter
───────────────────────────────────────────────────────────── */
const FAQManager = (() => {
  function init() {
    const input = $('input[aria-label="Search FAQ"]');
    const groups = $$('.faq-group');
    if (!input || !groups.length) return;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      groups.forEach(group => {
        let visibleCount = 0;

        $$('.faq-item', group).forEach(item => {
          const matches = !query || item.textContent.toLowerCase().includes(query);
          item.style.display = matches ? '' : 'none';
          if (query && matches) item.open = true;
          if (!query) item.open = false;
          if (matches) visibleCount++;
        });

        group.style.display = visibleCount ? '' : 'none';
      });
    });
  }

  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   19. PAGINATION MANAGER — shared pagination buttons
───────────────────────────────────────────────────────────── */
const PaginationManager = (() => {
  function init() {
    window.TTF.paginationButtons('.blog-pagination .page-btn');
  }
  return { init };
})();


/* ─────────────────────────────────────────────────────────────
   INIT ALL — single DOMContentLoaded
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  NavManager.init();
  ThemeManager.init();
  RTLManager.init();
  RevealManager.init();
  ProgressManager.init();
  CarouselManager.init();
  FeatureAccordion.init();
  CursorManager.init();
  CounterManager.init();
  MarqueeManager.init();
  NewsletterForm.init();
  TimelineManager.init();
  ParticleManager.init();
  GsTabManager.init();
  FilterManager.init();
  ContactForm.init();
  ReadingProgress.init();
  FAQManager.init();
  PaginationManager.init();
});
