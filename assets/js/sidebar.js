/* CiViO collapsible sidebar: collapse/expand, submenu, mobile drawer, active-section highlight */
(function () {
  'use strict';
  var body = document.body;
  var sb = document.getElementById('sidebar');
  if (!sb) return;
  var KEY = 'civio-sidebar-collapsed';
  var mq = window.matchMedia('(max-width: 900px)');
  var narrow = window.matchMedia('(max-width: 1180px)');

  function store(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function setCollapsed(c, save) {
    body.classList.toggle('sb-collapsed', c);
    var t = sb.querySelector('.sb-toggle');
    if (t) { t.setAttribute('aria-expanded', String(!c)); t.setAttribute('aria-label', c ? 'ขยายเมนู' : 'ย่อเมนู'); }
    if (c) sb.querySelectorAll('.sb-group.is-open').forEach(function (g) { setGroup(g, false); });
    if (save) store(c);
  }
  function setDrawer(open) {
    body.classList.toggle('sb-open', open);
    var o = document.querySelector('.sb-open');
    if (o) o.setAttribute('aria-expanded', String(open));
  }
  function setGroup(g, open) {
    g.classList.toggle('is-open', open);
    var b = g.querySelector('.sb-parent');
    if (b) b.setAttribute('aria-expanded', String(open));
  }

  /* initial state */
  var s = stored();
  setCollapsed(mq.matches ? false : (s === null ? narrow.matches : s === '1'), false);

  /* collapse toggle */
  var tg = sb.querySelector('.sb-toggle');
  if (tg) tg.addEventListener('click', function () { setCollapsed(!body.classList.contains('sb-collapsed'), true); });

  /* mobile open / close */
  var op = document.querySelector('.sb-open');
  if (op) op.addEventListener('click', function () { setDrawer(true); });
  var bd = document.querySelector('.sb-backdrop');
  if (bd) bd.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* groups */
  sb.querySelectorAll('.sb-group').forEach(function (g) {
    var b = g.querySelector('.sb-parent');
    b.addEventListener('click', function () {
      if (body.classList.contains('sb-collapsed') && !mq.matches) {
        setCollapsed(false, true); setGroup(g, true); return;
      }
      setGroup(g, !g.classList.contains('is-open'));
    });
  });

  /* close drawer after choosing a link */
  sb.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { if (mq.matches) setDrawer(false); });
  });

  /* react to viewport changes */
  function onMq() {
    if (!mq.matches) setDrawer(false);
    var st = stored();
    setCollapsed(mq.matches ? false : (st === null ? narrow.matches : st === '1'), false);
  }
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(onMq);

  /* active state: current page */
  var file = (location.pathname.split('/').pop() || 'index.html');
  var isHome = file === '' || file === 'index.html';
  var pageLinks = sb.querySelectorAll('[data-page]');
  pageLinks.forEach(function (a) {
    if (a.getAttribute('data-page') === file) {
      a.classList.add('is-active');
      var g = a.closest('.sb-group');
      if (g && !body.classList.contains('sb-collapsed')) setGroup(g, true);
      else if (g) g.querySelector('.sb-parent').classList.add('is-active');
    }
  });

  /* active state: section on the home page */
  if (isHome && 'IntersectionObserver' in window) {
    var map = {};
    sb.querySelectorAll('[data-section]').forEach(function (a) { map[a.getAttribute('data-section')] = a; });
    var ids = Object.keys(map);
    var current = null;
    function mark(id) {
      if (current === id) return; current = id;
      sb.querySelectorAll('[data-section].is-active').forEach(function (x) { x.classList.remove('is-active'); });
      if (id && map[id]) map[id].classList.add('is-active');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    window.addEventListener('scroll', function () { if (window.scrollY < 200) mark('top'); }, { passive: true });
    mark('top');
  }
})();
