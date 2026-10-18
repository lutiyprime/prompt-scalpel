(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // smooth "seamless" scroll
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  function go(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.3 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }

  // reveal on scroll
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      if (el.classList.contains('tbl')) {
        el.classList.remove('pending');
        var rows = el.querySelectorAll('tbody tr');
        rows.forEach(function (r, i) { r.style.transitionDelay = (0.15 + i * 0.07) + 's'; });
        setTimeout(function () { rows.forEach(function (r) { r.style.transitionDelay = ''; }); }, 2500);
      }
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv,.tbl').forEach(function (el) {
    if (el.classList.contains('tbl')) el.classList.add('pending');
    io.observe(el);
  });

  // progress bar, dots, current section label
  var secs = [].slice.call(document.querySelectorAll('main > section'));
  var dots = document.querySelector('.dots');
  var now = document.querySelector('.now');
  secs.forEach(function (s) {
    var a = document.createElement('a');
    a.href = '#' + s.id;
    a.innerHTML = '<span>' + (s.dataset.title || '') + '</span>';
    a.addEventListener('click', function (ev) { ev.preventDefault(); go(s); });
    dots.appendChild(a);
  });
  var dotEls = dots.querySelectorAll('a');
  var bar = document.querySelector('.progress');
  var cur = 0;
  function onScroll() {
    var y = window.scrollY, h = doc.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var mid = y + window.innerHeight * 0.4, idx = 0;
    secs.forEach(function (s, i) { if (s.offsetTop <= mid) idx = i; });
    if (idx !== cur || !now.textContent) {
      cur = idx;
      dotEls.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
      now.textContent = secs[idx].dataset.title || '';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // keyboard navigation for presenting
  window.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (overlay.classList.contains('on')) { if (e.key === 'Escape') closeOv(); return; }
    var k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) || k === 'ArrowRight') { e.preventDefault(); go(secs[Math.min(cur + 1, secs.length - 1)]); }
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) || k === 'ArrowLeft') {
      e.preventDefault();
      var s = secs[cur];
      go(window.scrollY - s.offsetTop > 40 ? s : secs[Math.max(cur - 1, 0)]);
    }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'f' || k === 'F' || k === 'а' || k === 'А') {
      var t = secs[cur].querySelector('.tbl');
      if (t) openOv(t);
    }
  });

  // fullscreen table view
  var overlay = document.querySelector('.overlay');
  var ovBody = overlay.querySelector('.body');
  var ovTitle = overlay.querySelector('h3');
  function openOv(t) {
    ovTitle.textContent = t.dataset.cap || '';
    ovBody.innerHTML = '';
    var c = t.querySelector('.scroller').cloneNode(true);
    c.querySelectorAll('tr.pfull').forEach(function (r) { r.hidden = false; });
    ovBody.appendChild(c);
    overlay.classList.add('on');
    if (lenis) lenis.stop();
  }
  function closeOv() { overlay.classList.remove('on'); if (lenis) lenis.start(); }
  overlay.querySelector('.close').addEventListener('click', closeOv);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOv(); });
  document.querySelectorAll('.expand').forEach(function (b) {
    b.addEventListener('click', function () { openOv(b.closest('.tbl')); });
  });
  ovBody.setAttribute('data-lenis-prevent', '');

  // prompt rows toggle full text
  document.querySelectorAll('tr.prow').forEach(function (r) {
    r.addEventListener('click', function () {
      var nx = r.nextElementSibling;
      nx.hidden = !nx.hidden;
      r.classList.toggle('open', !nx.hidden);
    });
  });

  // model tabs (appendix)
  document.querySelectorAll('.mtabs').forEach(function (tabs) {
    var btns = tabs.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
          document.getElementById(x.getAttribute('aria-controls')).hidden = x !== b;
        });
        if (lenis) lenis.resize();
      });
    });
  });
  document.querySelectorAll('.md').forEach(function (m) { m.setAttribute('data-lenis-prevent', ''); });
  document.querySelectorAll('details').forEach(function (d) { d.addEventListener('toggle', function () { if (lenis) lenis.resize(); }); });
})();
