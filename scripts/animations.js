// Copyright (c) 2026, The MoneroUSD Protocol
// SPDX-License-Identifier: Apache-2.0
//
// Explorer animations — scroll reveal, hero DAG canvas backdrop.
// Matches monerousd.org site.js behavior. No trackers, no third-party calls.

(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll reveal (.rv elements fade in from below when they enter the viewport) ──
  var io;
  function observeReveals() {
    var els = document.querySelectorAll('.rv:not(.in)');
    if ('IntersectionObserver' in window && !reduce) {
      if (!io) {
        io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
          });
        }, { rootMargin: '0px 0px -8% 0px' });
      }
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('in'); });
    }
  }
  observeReveals();

  // re-observe dynamically added .rv elements (SPA re-renders)
  if ('MutationObserver' in window) {
    new MutationObserver(function (muts) {
      var found = false;
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if ((n.classList && n.classList.contains('rv') && !n.classList.contains('in')) ||
              (n.querySelectorAll && n.querySelectorAll('.rv:not(.in)').length)) found = true;
        });
      });
      if (found) observeReveals();
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ── Hero DAG canvas backdrop (flowing block-DAG visualization) ──
  var cv = document.getElementById('hero-dag');
  if (!cv || reduce) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

  function size() {
    var p = cv.parentElement || cv;
    W = p.clientWidth || cv.clientWidth;
    H = p.clientHeight || cv.clientHeight;
    if (!H) H = 420;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  var cols = [], step = 110, x0 = 0, last = performance.now(), running = true;

  function addCol(x) {
    var n = 1 + Math.floor(Math.random() * 3), c = [];
    for (var i = 0; i < n; i++) {
      c.push({
        x: x,
        y: H * (0.15 + 0.7 * (i + 0.5 + (Math.random() - 0.5) * 0.6) / n)
      });
    }
    cols.push(c);
  }
  for (var x = 0; x < 2400; x += step) addCol(x);

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  function frame(t) {
    if (!running) return;
    var dt = Math.min(50, t - last); last = t;
    x0 += dt * 0.022;
    ctx.clearRect(0, 0, W, H);

    while (cols.length && cols[0][0].x - x0 < -step) cols.shift();
    while (cols.length && cols[cols.length - 1][0].x - x0 < W + step)
      addCol(cols[cols.length - 1][0].x + step);

    for (var i = 1; i < cols.length; i++) {
      for (var a = 0; a < cols[i].length; a++) {
        for (var b = 0; b < cols[i - 1].length; b++) {
          var p = cols[i][a], q = cols[i - 1][b];
          var px = p.x - x0, qx = q.x - x0;
          var edgeP = Math.min(1, px / 280, (W - px) / 280);
          var edgeQ = Math.min(1, qx / 280, (W - qx) / 280);
          var alpha = Math.max(0, Math.min(edgeP, edgeQ)) * 0.14;
          ctx.strokeStyle = 'rgba(255,122,0,' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(qx + 14, q.y);
          ctx.lineTo(px - 14, p.y);
          ctx.stroke();
        }
      }
    }

    for (i = 0; i < cols.length; i++) {
      for (a = 0; a < cols[i].length; a++) {
        var k = cols[i][a], fx = k.x - x0;
        var edge = Math.min(1, fx / 280, (W - fx) / 280);
        ctx.globalAlpha = Math.max(0, edge) * 0.85;
        ctx.shadowColor = 'rgba(255,102,0,0.25)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#0f0f13';
        ctx.strokeStyle = 'rgba(255,122,0,0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(fx - 14, k.y - 10, 28, 20, 4);
        else ctx.rect(fx - 14, k.y - 10, 28, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
