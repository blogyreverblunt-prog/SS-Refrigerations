/* KALT Refrigeration — landing page interactions. Vanilla, no dependencies. */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── toast for inert demo links ───────────────────────────────────────── */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-demo]');
    if (!el) return;
    e.preventDefault();
    toast('Demo build — this link is not wired up.');
  });

  /* ── header hides on scroll down, returns on scroll up ────────────────── */
  (function header() {
    var hdr = $('#hdr');
    if (!hdr) return;
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var down = y > last && y > 260;
      hdr.style.transform = down ? 'translateY(-42px)' : 'translateY(0)';
      last = y;
    }, { passive: true });
  })();

  /* ── mobile drawer ────────────────────────────────────────────────────── */
  (function drawer() {
    var burger = $('#burger'), drawer = $('#drawer'), scrim = $('#scrim');
    if (!burger || !drawer || !scrim) return;
    function set(open) {
      if (open) { drawer.hidden = false; scrim.hidden = false; }
      requestAnimationFrame(function () {
        drawer.classList.toggle('is-open', open);
        scrim.classList.toggle('is-open', open);
      });
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (!open) setTimeout(function () {
        if (!drawer.classList.contains('is-open')) { drawer.hidden = true; scrim.hidden = true; }
      }, 420);
    }
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    scrim.addEventListener('click', function () { set(false); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();

  /* ── hero slideshow ───────────────────────────────────────────────────── */
  (function hero() {
    var wrap = $('#heroSlides'), dotsEl = $('#heroDots');
    if (!wrap) return;
    var slides = $$('.slide', wrap);
    if (slides.length < 2) return;
    var i = 0, timer = null, DELAY = 6000;

    if (dotsEl) slides.forEach(function (_, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show slide ' + (n + 1));
      if (n === 0) b.className = 'is-on';
      b.addEventListener('click', function () { go(n); restart(); });
      dotsEl.appendChild(b);
    });

    function go(n) {
      slides[i].classList.remove('is-on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-on');
      /* the first paint only eager-loads slide one; pull the next one in early */
      var nxt = slides[(i + 1) % slides.length].querySelector('img');
      if (nxt) nxt.loading = 'eager';
      if (dotsEl) $$('button', dotsEl).forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    }
    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { go(i + 1); }, DELAY);
    }
    restart();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else restart();
    });

    var promo = $('#promo'), px = $('#promoX');
    if (px && promo) px.addEventListener('click', function () { promo.classList.add('is-gone'); });
  })();

  /* ── horizontal rails (industries / popular / types) ──────────────────── */
  $$('[data-rail]').forEach(function (rail) {
    var view = $('.rail__view', rail);
    var track = $('.rail__track', rail);
    var prev = $('[data-prev]', rail), next = $('[data-next]', rail);
    if (!view || !track) return;

    var index = 0, step = 0, maxScroll = 0, maxIndex = 0;

    function metrics() {
      var first = track.firstElementChild;
      if (!first) return;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      step = first.getBoundingClientRect().width + gap;
      /* bound from real overflow so the last card lands flush at the right edge */
      maxScroll = Math.max(0, track.scrollWidth - view.clientWidth);
      maxIndex = step > 0 ? Math.ceil(maxScroll / step) : 0;
      if (index > maxIndex) index = maxIndex;
    }
    function offset(n) { return Math.min(n * step, maxScroll); }
    function paint() {
      track.style.transform = 'translateX(' + (-offset(index)) + 'px)';
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex;
    }
    function go(n) { index = Math.max(0, Math.min(n, maxIndex)); paint(); }

    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });

    /* drag / swipe */
    var down = false, startX = 0, startIdx = 0, moved = 0;
    view.addEventListener('pointerdown', function (e) {
      down = true; moved = 0; startX = e.clientX; startIdx = index;
      track.style.transition = 'none';
    });
    view.addEventListener('pointermove', function (e) {
      if (!down) return;
      moved = e.clientX - startX;
      e.preventDefault();
      track.style.transform = 'translateX(' + (-offset(startIdx) + moved) + 'px)';
    });
    function release() {
      if (!down) return;
      down = false;
      track.style.transition = '';
      if (Math.abs(moved) > step * 0.2) go(startIdx + (moved < 0 ? 1 : -1)); else paint();
    }
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);
    view.addEventListener('pointerleave', release);
    /* a drag must not also trigger the card's link */
    view.addEventListener('click', function (e) {
      if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    function rebuild() { metrics(); paint(); }
    rebuild();
    window.addEventListener('load', rebuild);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(rebuild, 150); });
  });

  /* ── Individual Cooling Experience: vertical scroll drives horizontal ─── */
  (function ice() {
    var sec = $('#trial'), track = $('#iceTrack'), bar = $('#iceBar');
    if (!sec || !track) return;
    var distance = 0, ticking = false;

    function measure() {
      /* how far the track must travel for its right edge to reach the viewport */
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
    }
    function frame() {
      ticking = false;
      var rect = sec.getBoundingClientRect();
      var scrollable = sec.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var p = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      track.style.transform = 'translate3d(' + (-p * distance) + 'px,0,0)';
      if (bar) bar.style.width = (p * 100) + '%';
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }
    measure(); frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); frame(); });
    window.addEventListener('load', function () { measure(); frame(); });
  })();

  /* ── sustainability slideshow ─────────────────────────────────────────── */
  (function sus() {
    var wrap = $('#susSlides');
    if (!wrap) return;
    var slides = $$('.sslide', wrap);
    if (slides.length < 2) return;
    var i = 0;
    function go(n) {
      slides[i].classList.remove('is-on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-on');
    }
    var p = $('#susPrev'), n = $('#susNext');
    if (p) p.addEventListener('click', function () { go(i - 1); });
    if (n) n.addEventListener('click', function () { go(i + 1); });
  })();

  /* ── newsletter button (demo only) ────────────────────────────────────── */
  (function sub() {
    var btn = $('#subBtn'), note = $('#subNote');
    if (!btn || !note) return;
    btn.addEventListener('click', function () {
      note.textContent = 'This is a demo — no signup form is connected.';
    });
  })();
})();
