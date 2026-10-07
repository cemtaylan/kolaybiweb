// Birden çok sayfada kullanılan bölüm animasyonları (entegrasyon destesi, kurdele, telefon grafiği, sayaçlar)
// Entegrasyon kartları: deste gibi; üstüne binen her kart, arkadakini biraz daha daraltır
(function () {
  const cards = [...document.querySelectorAll('.ic-card')];
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update() {
    ticking = false;
    const prog = cards.map((card, i) => {
      if (i === 0) return 0;
      const prev = cards[i - 1];
      const dist = card.getBoundingClientRect().top - parseFloat(getComputedStyle(card).top);
      return Math.min(Math.max(1 - dist / prev.offsetHeight, 0), 1);
    });
    cards.forEach((card, i) => {
      const depth = prog.slice(i + 1).reduce((s, v) => s + v, 0);   // üstündeki kartların sayısı (kısmi)
      card.style.transform = `scale(${1 - depth * 0.05})`;
    });
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

// Telefon maketi: grafik görünür olunca dolarak çizilir
(function () {
  const chart = document.querySelector('.ph-chart');
  if (!chart || !('IntersectionObserver' in window)) return;
  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) { chart.classList.add('animate'); io.disconnect(); }
  }, { threshold: .5 }).observe(chart);
})();

// Rakamlar görünür olunca sayarak artar
(function () {
  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fmt = n => n.toLocaleString('tr-TR');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1400, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = fmt(v) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .6 });
  els.forEach(el => io.observe(el));
})();

// Enerji bandı: kart görünür olunca çizilerek belirir
(function () {
  const sw = document.querySelector('.swoosh');
  if (!sw || !('IntersectionObserver' in window)) return;
  sw.classList.add('draw'); sw.style.animationPlayState = 'paused';
  const paths = [...sw.querySelectorAll('path')]; paths.forEach(p => p.style.animationPlayState = 'paused');
  new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { paths.forEach(p => p.style.animationPlayState = 'running'); io.disconnect(); } }, { threshold: .3 }).observe(sw);
})();

