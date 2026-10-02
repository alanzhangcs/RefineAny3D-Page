(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────── */
  var toggle = document.getElementById('theme-toggle');
  function setIcon() {
    toggle.innerHTML = root.getAttribute('data-theme') === 'dark'
      ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  setIcon();
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('refineany3d-theme', next); } catch (e) {}
    setIcon();
  });

  /* ── Nav: scrolled state + scrollspy ───── */
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var spyTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > hero.offsetHeight - 140);
    var current = -1;
    spyTargets.forEach(function (sec, i) {
      if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.35) current = i;
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Count-up ──────────────────────────── */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = el.hasAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 2;
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Bars ──────────────────────────────── */
  function fillBars(container) {
    var min = parseFloat(container.getAttribute('data-min'));
    var max = parseFloat(container.getAttribute('data-max'));
    container.querySelectorAll('i[data-v]').forEach(function (i) {
      var v = parseFloat(i.getAttribute('data-v'));
      i.style.width = Math.max(4, (v - min) / (max - min) * 100) + '%';
    });
  }

  /* ── Reveal on scroll ──────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  function onReveal(el) {
    el.classList.add('is-in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    el.querySelectorAll('.bars').forEach(fillBars);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { onReveal(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(onReveal);
  }

  /* ── Tabs ──────────────────────────────── */
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var card = tabs.parentElement;
    tabs.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        card.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('is-active', p.id === btn.getAttribute('data-tab'));
        });
      });
    });
  });

  /* ── Lightbox ──────────────────────────── */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  function openLb(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 200);
  }
  document.querySelectorAll('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var img = a.querySelector('img');
      openLb(a.getAttribute('href'), img ? img.alt : '');
    });
  });
  lb.querySelector('.lb-backdrop').addEventListener('click', closeLb);
  document.getElementById('lb-close').addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ── Copy BibTeX ───────────────────────── */
  var copyBtn = document.getElementById('copy-bib');
  copyBtn.addEventListener('click', function () {
    var text = document.getElementById('bib-text').textContent;
    function done() {
      copyBtn.classList.add('is-done');
      copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied</span>';
      setTimeout(function () {
        copyBtn.classList.remove('is-done');
        copyBtn.innerHTML = '<i class="far fa-copy"></i><span>Copy</span>';
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });

  /* ── KaTeX ─────────────────────────────── */
  function renderMath() {
    if (!window.katex) return;
    document.querySelectorAll('.eq[data-tex]').forEach(function (el) {
      try {
        window.katex.render(el.getAttribute('data-tex'), el, { displayMode: true, throwOnError: false });
      } catch (e) {}
    });
  }
  if (window.katex) renderMath();
  else window.addEventListener('load', renderMath);

  /* ── Wireframe alignment playground ────── */
  var svg = document.getElementById('scene');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var F = 700, CX = 260, CY = 118;          // focal length (px), principal point
  var CAM_H = 1.6;                          // camera height above ground (m)
  var OBJ = { x: 0.35, W: 1.8, H: 1.5, L: 4.2 };
  var Z_TRUE = 10;
  var S_OBJ = (OBJ.W + OBJ.H + OBJ.L) / 3;  // 2.5 m
  var ALPHA = { small: 0.20, medium: 0.55, large: 1.10 };  // paper, Appendix: bucket midpoints
  var OK_TOL = 0.10, MAX_STEPS = 8;                        // |r| <= 0.10 is <depth_ok>

  var slider = document.getElementById('s-d');
  var outD = document.getElementById('o-d');
  document.getElementById('o-true').textContent = Z_TRUE.toFixed(1) + ' m';
  document.getElementById('o-s').textContent = S_OBJ.toFixed(2) + ' m';
  var evEl = document.getElementById('v-evidence');
  var tkEl = document.getElementById('v-tokens');
  var trace = document.getElementById('trace');
  var btnStep = document.getElementById('pg-step');
  var btnRun = document.getElementById('pg-run');
  var btnReset = document.getElementById('pg-reset');

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  function P(X, Y, Z) { return [CX + F * X / Z, CY + F * Y / Z]; }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

  // Static scene: sky, ground, road, lane marks.
  el('rect', { 'class': 'sky', x: 0, y: 0, width: 520, height: CY });
  el('rect', { 'class': 'ground', x: 0, y: CY, width: 520, height: 360 - CY });
  var road = [P(-3.2, CAM_H, 3), P(4.6, CAM_H, 3), P(4.6, CAM_H, 400), P(-3.2, CAM_H, 400)];
  el('polygon', { 'class': 'road', points: pts(road) });
  for (var z0 = 4; z0 < 120; z0 += 6) {
    el('polygon', { 'class': 'lane', points: pts([P(0.62, CAM_H, z0), P(0.78, CAM_H, z0), P(0.78, CAM_H, z0 + 3), P(0.62, CAM_H, z0 + 3)]) });
  }
  el('line', { 'class': 'horizon', x1: 0, y1: CY, x2: 520, y2: CY });

  // The object (drawn at the true depth).
  function corners(z) {
    var x0 = OBJ.x - OBJ.W / 2, x1 = OBJ.x + OBJ.W / 2;
    var yT = CAM_H - OBJ.H, yB = CAM_H;
    var zn = z - OBJ.L / 2, zf = z + OBJ.L / 2;
    return {
      n: [P(x0, yT, zn), P(x1, yT, zn), P(x1, yB, zn), P(x0, yB, zn)],
      f: [P(x0, yT, zf), P(x1, yT, zf), P(x1, yB, zf), P(x0, yB, zf)]
    };
  }
  var gObj = el('g', { 'class': 'car' });
  (function drawCar() {
    var c = corners(Z_TRUE);
    el('polygon', { 'class': 'car-shadow', points: pts([P(OBJ.x - OBJ.W / 2 - 0.1, CAM_H, Z_TRUE - OBJ.L / 2), P(OBJ.x + OBJ.W / 2 + 0.1, CAM_H, Z_TRUE - OBJ.L / 2), P(OBJ.x + OBJ.W / 2 + 0.1, CAM_H, Z_TRUE + OBJ.L / 2), P(OBJ.x - OBJ.W / 2 - 0.1, CAM_H, Z_TRUE + OBJ.L / 2)]) }, gObj);
    // rear view in the near face
    var L = c.n[0][0], R = c.n[1][0], T = c.n[0][1], B = c.n[3][1], w = R - L, h = B - T;
    el('path', { 'class': 'car-body', d: 'M' + (L) + ' ' + (T + h * 0.45) + ' Q' + L + ' ' + (T + h * 0.4) + ' ' + (L + w * 0.08) + ' ' + (T + h * 0.38) + ' L' + (L + w * 0.2) + ' ' + (T + h * 0.05) + ' Q' + (L + w * 0.5) + ' ' + (T - h * 0.02) + ' ' + (R - w * 0.2) + ' ' + (T + h * 0.05) + ' L' + (R - w * 0.08) + ' ' + (T + h * 0.38) + ' Q' + R + ' ' + (T + h * 0.4) + ' ' + R + ' ' + (T + h * 0.45) + ' L' + R + ' ' + (T + h * 0.86) + ' L' + L + ' ' + (T + h * 0.86) + ' Z' }, gObj);
    el('path', { 'class': 'car-glass', d: 'M' + (L + w * 0.24) + ' ' + (T + h * 0.12) + ' Q' + (L + w * 0.5) + ' ' + (T + h * 0.06) + ' ' + (R - w * 0.24) + ' ' + (T + h * 0.12) + ' L' + (R - w * 0.14) + ' ' + (T + h * 0.36) + ' L' + (L + w * 0.14) + ' ' + (T + h * 0.36) + ' Z' }, gObj);
    el('rect', { 'class': 'car-light', x: L + w * 0.05, y: T + h * 0.5, width: w * 0.17, height: h * 0.1, rx: 2 }, gObj);
    el('rect', { 'class': 'car-light', x: R - w * 0.22, y: T + h * 0.5, width: w * 0.17, height: h * 0.1, rx: 2 }, gObj);
    el('rect', { 'class': 'car-plate', x: L + w * 0.38, y: T + h * 0.64, width: w * 0.24, height: h * 0.09, rx: 1.5 }, gObj);
    el('rect', { 'class': 'car-wheel', x: L + w * 0.06, y: T + h * 0.84, width: w * 0.16, height: h * 0.16, rx: 3 }, gObj);
    el('rect', { 'class': 'car-wheel', x: R - w * 0.22, y: T + h * 0.84, width: w * 0.16, height: h * 0.16, rx: 3 }, gObj);
  })();

  // Candidate wireframe (drawn on top).
  var gBox = el('g', { 'class': 'wire' });
  var faceFar = el('polygon', { 'class': 'wf-far' }, gBox);
  var edges = [];
  for (var i = 0; i < 4; i++) edges.push(el('line', { 'class': 'wf-edge' }, gBox));
  var faceNear = el('polygon', { 'class': 'wf-near' }, gBox);
  var label = el('text', { 'class': 'wf-label' }, gBox);

  var state = { d: parseFloat(slider.value), steps: 0, busy: false };

  function judge(d) {
    var e = (d - Z_TRUE) / S_OBJ;
    if (Math.abs(e) <= OK_TOL + 1e-9) return { dir: 'ok', mag: null, e: e };
    var mag = Math.abs(e) < 0.30 ? 'small' : Math.abs(e) < 0.80 ? 'medium' : 'large';
    return { dir: e > 0 ? 'closer' : 'farther', mag: mag, e: e };
  }
  function tokenHTML(j) {
    if (j.dir === 'ok') return '<span class="tk tk-ok">&lt;depth_ok&gt;</span>';
    return '<span class="tk tk-dir">&lt;depth_' + j.dir + '&gt;</span><span class="tk tk-mag">&lt;step_' + j.mag + '&gt;</span>';
  }

  function draw() {
    var d = state.d;
    slider.value = d;
    outD.textContent = d.toFixed(1) + ' m';
    var p = (d - slider.min) / (slider.max - slider.min) * 100;
    slider.style.setProperty('--p', p + '%');

    var c = corners(d);
    faceNear.setAttribute('points', pts(c.n));
    faceFar.setAttribute('points', pts(c.f));
    for (var i = 0; i < 4; i++) {
      edges[i].setAttribute('x1', c.n[i][0]); edges[i].setAttribute('y1', c.n[i][1]);
      edges[i].setAttribute('x2', c.f[i][0]); edges[i].setAttribute('y2', c.f[i][1]);
    }
    var j = judge(d);
    gBox.setAttribute('class', 'wire' + (j.dir === 'ok' ? ' is-ok' : ''));
    label.setAttribute('x', c.n[0][0]);
    label.setAttribute('y', c.n[0][1] - 7);
    label.textContent = 'd = ' + d.toFixed(1) + ' m';

    if (j.dir === 'ok') {
      evEl.textContent = 'The wireframe tightly encloses the car, with edges on the object boundary.';
    } else if (j.dir === 'closer') {
      evEl.textContent = 'The wireframe looks smaller than the car: the car spills past its edges, so the box is too far.';
    } else {
      evEl.textContent = 'The wireframe looks larger than the car, leaving empty space inside, so the box is too close.';
    }
    tkEl.innerHTML = tokenHTML(j);
    btnStep.disabled = btnRun.disabled = state.busy || j.dir === 'ok' || state.steps >= MAX_STEPS;
  }

  function animateTo(target, done) {
    var from = state.d, t0 = null, dur = reduceMotion ? 0 : 450;
    function f(t) {
      if (!t0) t0 = t;
      var k = dur ? Math.min(1, (t - t0) / dur) : 1;
      var e = 1 - Math.pow(1 - k, 3);
      state.d = from + (target - from) * e;
      draw();
      if (k < 1) requestAnimationFrame(f); else { state.d = target; draw(); done && done(); }
    }
    requestAnimationFrame(f);
  }

  function step(done) {
    var j = judge(state.d);
    if (j.dir === 'ok' || state.steps >= MAX_STEPS) { done && done(false); return; }
    var sign = j.dir === 'closer' ? -1 : 1;
    var delta = sign * ALPHA[j.mag] * S_OBJ;
    var target = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), state.d + delta));
    state.steps++;
    var li = document.createElement('li');
    li.innerHTML = '<b>Step ' + state.steps + '</b> ' + tokenHTML(j) +
      '<span class="tr-d">' + state.d.toFixed(1) + ' → ' + target.toFixed(1) + ' m</span>';
    trace.appendChild(li);
    state.busy = true;
    animateTo(target, function () {
      state.busy = false;
      var j2 = judge(state.d);
      if (j2.dir === 'ok') {
        var ok = document.createElement('li');
        ok.className = 'tr-ok';
        ok.innerHTML = '<b>Stop</b> ' + tokenHTML(j2) + '<span class="tr-d">error ' + Math.abs(state.d - Z_TRUE).toFixed(2) + ' m</span>';
        trace.appendChild(ok);
      }
      draw();
      done && done(j2.dir !== 'ok');
    });
  }

  function resetTrace() { trace.innerHTML = ''; state.steps = 0; }

  slider.addEventListener('input', function () {
    if (state.busy) return;
    state.d = parseFloat(slider.value);
    resetTrace();
    draw();
  });
  btnStep.addEventListener('click', function () { step(); });
  btnRun.addEventListener('click', function () {
    (function loop() { step(function (more) { if (more) setTimeout(loop, reduceMotion ? 0 : 250); }); })();
  });
  btnReset.addEventListener('click', function () {
    if (state.busy) return;
    var d;
    do { d = 5.5 + Math.random() * 15.5; } while (Math.abs(d - Z_TRUE) / S_OBJ < 1);
    state.d = Math.round(d * 10) / 10;
    resetTrace();
    draw();
  });

  draw();
})();
