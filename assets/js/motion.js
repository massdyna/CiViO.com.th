/* CiViO motion layer — additions only. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const small = window.matchMedia('(max-width: 760px)').matches;

  /* sidebar: stagger index for the entrance animation */
  $$('.sb-nav > *').forEach((el, i) => el.style.setProperty('--sb-i', i));

  if (reduce) return;

  /* ---------- 1. hero particles: drifting glowing dots + leaves ---------- */
  const hero = $('.hero');
  if (hero) {
    const cv = document.createElement('canvas'); cv.className = 'mo-particles'; cv.setAttribute('aria-hidden', 'true');
    hero.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [], run = false, raf = 0;
    const COLORS = ['211,230,106', '199,203,184', '107,127,103'];
    const make = (init) => {
      const leaf = Math.random() < 0.22;
      return {
        x: Math.random() * W, y: init ? Math.random() * H : H + 20,
        r: leaf ? 7 + Math.random() * 7 : 1.2 + Math.random() * 2.8,
        vy: 0.18 + Math.random() * 0.5, sway: 20 + Math.random() * 40, ph: Math.random() * 6.28, sp: 0.004 + Math.random() * 0.01,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.02, a: 0.25 + Math.random() * 0.5,
        c: COLORS[Math.floor(Math.random() * COLORS.length)], leaf, bx: 0
      };
    };
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = small ? 18 : Math.min(46, Math.round(W / 34));
      parts = Array.from({ length: n }, () => { const p = make(true); p.bx = p.x; return p; });
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy; p.ph += p.sp; p.rot += p.vr;
        const x = p.bx + Math.sin(p.ph) * p.sway;
        if (p.y < -30) { Object.assign(p, make(false)); p.bx = p.x; }
        ctx.save(); ctx.translate(x, p.y);
        if (p.leaf) {
          ctx.rotate(p.rot); ctx.fillStyle = `rgba(${p.c},${p.a * .7})`;
          ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.quadraticCurveTo(p.r * .9, 0, 0, p.r); ctx.quadraticCurveTo(-p.r * .9, 0, 0, -p.r); ctx.fill();
        } else {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 4);
          g.addColorStop(0, `rgba(${p.c},${p.a})`); g.addColorStop(1, `rgba(${p.c},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 4, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!run && !document.hidden) { run = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { run = false; cancelAnimationFrame(raf); };
    size(); window.addEventListener('resize', size, { passive: true });
    new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  }

  /* ---------- 2. count-up numbers ---------- */
  const counters = $$('.hero-orbit > span, [data-count]');
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const countUp = (el) => {
    const raw = el.getAttribute('data-count') || el.textContent.trim();
    const m = raw.match(/^(\D*)(\d[\d,.]*)(\D*)$/); if (!m) return;
    const end = parseFloat(m[2].replace(/,/g, '')); if (!isFinite(end)) return;
    const dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), dur = 1600;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur), v = end * ease(t);
      el.textContent = m[1] + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3];
      if (t < 1) requestAnimationFrame(tick); else el.textContent = raw;
    };
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  counters.forEach((c) => cio.observe(c));

  /* ---------- 3. staggered scroll-in for grids / cards / headings ---------- */
  const GROUPS = [
    '.about-facts > li', '.farm-services > div', '.credibility-grid > *', '.use-cases > *', '.use-case',
    '.articles-grid > *', '.proof-grid > *', '.proof-card', '.product-facts > *', '.model-table-wrap',
    '.footer-col', '.contact-topic-list > *', '.detail-step', '.novabin-feature-grid > *', '.novabin-system-card'
  ];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('mo-in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const seen = new Set();
  GROUPS.forEach((sel) => {
    $$(sel).forEach((el) => {
      if (seen.has(el) || el.closest('.award-marquee, .hero, .sb')) return; seen.add(el);
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.matches(sel.split('>').pop().trim())) : [el];
      el.style.setProperty('--mo-i', Math.min(sibs.indexOf(el), 6));
      el.classList.add('mo-pre');
      io.observe(el);
    });
  });
  $$('.section-header h2, .manifesto-content h2, .contact-copy h2').forEach((h) => { h.classList.add('mo-h'); io.observe(h); });
  /* failsafe: never leave content hidden */
  setTimeout(() => $$('.mo-pre').forEach((el) => el.classList.add('mo-in')), 6000);

  /* ---------- 4. footer floating leaves ---------- */
  const foot = $('.footer');
  if (foot && !small) {
    for (let i = 0; i < 9; i++) {
      const l = document.createElement('i'); l.className = 'mo-leaf'; l.setAttribute('aria-hidden', 'true');
      l.style.left = (6 + i * 11 + Math.random() * 6) + '%';
      l.style.setProperty('--dx', (Math.random() * 120 - 40) + 'px');
      l.style.animationDuration = (9 + Math.random() * 9) + 's';
      l.style.animationDelay = (-Math.random() * 12) + 's';
      l.style.scale = (.7 + Math.random() * .9);
      foot.appendChild(l);
    }
  }

  /* ---------- 5. icon wiggle for mascot card on hover ---------- */
  const card = $('.sb-card');
  if (card) card.addEventListener('mouseenter', () => { const h = $('.sb-hello', card); if (h) { h.classList.add('mo-wiggle'); setTimeout(() => h.classList.remove('mo-wiggle'), 1200); } });
})();
