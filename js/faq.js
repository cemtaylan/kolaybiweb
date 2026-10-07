// SSS: yerel <details>/<summary> akordeonu. JS animasyonu ve "tek açık soru" davranışını ekler;
// JS yoksa tarayıcının kendi aç/kapa davranışı çalışır. Kategori filtreleri sekme kalıbındadır.
(function () {
  const items = [...document.querySelectorAll('details.faq-item')];

  function open(item) {
    item.open = true;
    void item.offsetHeight; // içerik 0fr ile çizilsin, sonra 1fr'ye animasyon
    item.classList.add('is-open');
  }
  function close(item) {
    if (!item.classList.contains('is-open')) return;
    item.classList.remove('is-open');
    let done = false;
    const finish = () => { if (done) return; done = true; if (!item.classList.contains('is-open')) item.open = false; };
    item.querySelector('.faq-a').addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 450);
  }

  items.forEach(item => {
    item.classList.add('js-anim');
    item.querySelector('.faq-q').addEventListener('click', e => {
      e.preventDefault();
      const willOpen = !item.classList.contains('is-open');
      items.forEach(i => { if (i !== item) close(i); });
      willOpen ? open(item) : close(item);
    });
    // Sayfa içi arama (Ctrl+F) gibi tarayıcı kaynaklı açılışlarda sınıfı eşitle
    item.addEventListener('toggle', () => {
      if (item.open && !item.classList.contains('is-open')) item.classList.add('is-open');
    });
  });

  document.querySelectorAll('.faq-filters button').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.faq-filters button').forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn); b.tabIndex = b === btn ? 0 : -1; });
    const cat = btn.dataset.cat;
    items.forEach(i => { i.hidden = cat !== 'all' && i.dataset.cat !== cat; });
  }));
  // Filtreler sekme kalıbında: sol/sağ ok, Home/End
  document.querySelectorAll('.faq-filters').forEach(list => list.addEventListener('keydown', e => {
    const tabs = [...list.querySelectorAll('button')], i = tabs.indexOf(document.activeElement);
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (i < 0 || !(e.key in map)) return;
    e.preventDefault();
    const t = tabs[(map[e.key] + tabs.length) % tabs.length];
    t.focus(); t.click();
  }));
  // #faq-q-N bağlantısıyla gelindiğinde ilgili soruyu aç
  const openFromHash = () => {
    const m = location.hash.match(/^#(faq-[qa]-\d+)$/);
    const target = m && document.getElementById(m[1]);
    const item = target && target.closest('details.faq-item');
    if (!item) return;
    items.forEach(i => { if (i !== item) close(i); });
    if (!item.classList.contains('is-open')) open(item);
    item.querySelector('.faq-q').scrollIntoView({ block: 'center' });
  };
  addEventListener('hashchange', openFromHash);
  openFromHash();
})();
