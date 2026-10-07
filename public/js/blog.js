// Blog listesi: kategori filtresi, arama ve sayfalama.
// Sayfa adresi canlı siteyle aynı: /blog?29587b79_page=2 (sayfa başına 24 yazı).
(function () {
  const grid = document.getElementById('posts');
  if (!grid) return;
  const KEY = '29587b79_page', PER = 24;
  const posts = [...grid.querySelectorAll('.post')];
  const cats = [...document.querySelectorAll('.bl-cats button')];
  const search = document.getElementById('blSearch');
  const count = document.getElementById('blCount');
  const empty = document.querySelector('.bl-empty');
  const pager = document.getElementById('blPager');
  const top = document.querySelector('.bl-top-wrap');
  const norm = s => s.toLocaleLowerCase('tr-TR');
  let cat = 'all';
  let page = Math.max(1, parseInt(new URLSearchParams(location.search).get(KEY), 10) || 1);

  const href = n => n === 1 ? location.pathname : `${location.pathname}?${KEY}=${n}`;
  const arrow = '<svg><use href="#i-right"/></svg>';

  function pages(cur, total) {
    // 1 … cur-1 cur cur+1 … total
    const out = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - cur) <= 1) out.push(i);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }

  function render(scroll) {
    const q = norm(search.value.trim());
    const filtered = cat !== 'all' || q;
    const match = posts.filter(p => (cat === 'all' || p.dataset.cat === cat) && (!q || norm(p.textContent).includes(q)));
    const total = Math.max(1, Math.ceil(match.length / PER));
    page = Math.min(page, total);
    posts.forEach(p => { p.hidden = true; });
    match.slice((page - 1) * PER, page * PER).forEach(p => { p.hidden = false; });
    count.textContent = `${match.length} yazı`;
    empty.classList.toggle('show', match.length === 0);
    if (top) top.hidden = filtered || page > 1;

    pager.innerHTML = total < 2 ? '' :
      `<a class="pg-nav prev${page === 1 ? ' off' : ''}" href="${href(Math.max(1, page - 1))}" data-p="${page - 1}" aria-label="Önceki sayfa">${arrow}<span>Önceki</span></a>` +
      `<div class="pg-nums">` + pages(page, total).map(n => n === '…' ? '<span class="pg-gap">…</span>' :
        `<a href="${href(n)}" data-p="${n}"${n === page ? ' class="on" aria-current="page"' : ''}>${n}</a>`).join('') + `</div>` +
      `<a class="pg-nav next${page === total ? ' off' : ''}" href="${href(Math.min(total, page + 1))}" data-p="${page + 1}" aria-label="Sonraki sayfa"><span>Sonraki</span>${arrow}</a>`;

    // Filtre/arama yokken adres çubuğu sayfayla eşleşir
    if (!filtered) history.replaceState(null, '', href(page));
    if (scroll) document.getElementById('tum-yazilar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pager.addEventListener('click', e => {
    const a = e.target.closest('a[data-p]');
    if (!a) return;
    e.preventDefault();
    if (a.classList.contains('off')) return;
    page = +a.dataset.p; render(true);
  });
  cats.forEach(b => b.addEventListener('click', () => {
    cats.forEach(x => x.classList.toggle('is-active', x === b));
    cat = b.dataset.cat; page = 1; render();
  }));
  search.addEventListener('input', () => { page = 1; render(); });
  addEventListener('popstate', () => { page = Math.max(1, parseInt(new URLSearchParams(location.search).get(KEY), 10) || 1); render(); });
  render();
})();
