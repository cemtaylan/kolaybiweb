// Mega menüler: yerel <details>/<summary>. Masaüstünde fareyle üzerine gelince, her yerde tıklayınca aç/kapa.
// JS yoksa tarayıcının kendi aç/kapa davranışı çalışır.
(function () {
  const items = [...document.querySelectorAll('.nav-item.has-mega')].filter(it => it.querySelector('details.nav-dd'));
  const desktop = matchMedia('(min-width: 1321px)');

  function open(it) {
    const dd = it.querySelector('details.nav-dd');
    dd.open = true;
    void dd.offsetHeight; // önce kapalı stil çizilsin, sonra geçiş animasyonu çalışsın
    it.classList.add('open');
  }
  function close(it) {
    if (!it.classList.contains('open')) return;
    it.classList.remove('open');
    const dd = it.querySelector('details.nav-dd');
    setTimeout(() => { if (!it.classList.contains('open')) dd.open = false; }, 220);
  }
  const closeAll = except => items.forEach(it => { if (it !== except) close(it); });

  items.forEach(it => {
    const dd = it.querySelector('details.nav-dd');
    dd.classList.add('js-dd');
    dd.querySelector('summary').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      // Masaüstünde fare üzerindeyken menü zaten hover ile açıktır; tıklama kapatmasın
      const hovering = desktop.matches && it.matches(':hover') && e.detail > 0;
      const willOpen = hovering || !it.classList.contains('open');
      closeAll(it);
      willOpen ? open(it) : close(it);
    });
    it.addEventListener('mouseenter', () => { if (desktop.matches) { closeAll(it); open(it); } });
    it.addEventListener('mouseleave', () => { if (desktop.matches) close(it); });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.mega')) closeAll(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const cur = items.find(it => it.classList.contains('open'));
    closeAll();
    if (cur) cur.querySelector('summary').focus();
  });
})();

// Animasyonlar yalnız ekrandaki bölümlerde çalışsın: görünmeyen bölüm .anim-off alır (site.css duraklatır).
// Sayfa açılırken ilk ekranın altındaki sahne ve bant animasyonları ana iş parçacığını meşgul etmez.
(function () {
  if (!('IntersectionObserver' in window)) return;
  var sections = document.querySelectorAll('main > section, main > article, main > div > section');
  if (!sections.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('anim-off', !e.isIntersecting); });
  }, { rootMargin: '150px 0px' });
  sections.forEach(function (s) { io.observe(s); });
})();
