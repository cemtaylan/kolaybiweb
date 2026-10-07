// Blog yazısı: okuma ilerleme çubuğu, içindekilerde aktif başlık, bağlantı kopyalama.
(function () {
  const bar = document.querySelector('.read-progress');
  const article = document.querySelector('.prose');
  const links = [...document.querySelectorAll('.toc a')];
  const heads = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  let ticking = false;
  function update() {
    ticking = false;
    if (bar && article) {
      const r = article.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.3 - r.top) / (r.height - innerHeight * 0.4), 0), 1);
      bar.style.transform = `scaleX(${p})`;
    }
    let cur = 0;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur && heads.length > 0));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  const copy = document.querySelector('[data-copy]');
  if (copy) copy.addEventListener('click', () => {
    const done = () => { copy.classList.add('done'); setTimeout(() => copy.classList.remove('done'), 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
})();
