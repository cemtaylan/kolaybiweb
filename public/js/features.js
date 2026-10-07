// Gruplu kart bileşeni (.fg): ok ile açık grubun kartları kayar; son karttan sonra sıradaki grup açılır.
// Sayfada birden çok olabilir; her bileşen hemen ardındaki .fg-nav ile çalışır. Tek gruplu kullanımda başa döner.
document.querySelectorAll('.fg').forEach(root => {
  const groups = [...root.querySelectorAll('.fg-group')];
  const nav = root.nextElementSibling && root.nextElementSibling.classList.contains('fg-nav') ? root.nextElementSibling : null;
  if (!groups.length || !nav) return;
  const dots = nav.querySelector('.fg-dots');
  let g = Math.max(0, groups.findIndex(el => el.classList.contains('is-open'))), pos = 0;

  const step = i => groups[i].querySelector('.fg-track').children[0].offsetWidth + 14;
  function maxPos(i) {
    const body = groups[i].querySelector('.fg-body');
    const track = groups[i].querySelector('.fg-track');
    const visible = Math.max(1, Math.floor((body.clientWidth - 22 + 14) / step(i)));
    return Math.max(0, track.children.length - visible);
  }
  function render() {
    groups.forEach((el, i) => {
      el.classList.toggle('is-open', i === g);
      const tab = el.querySelector('.fg-tab'); if (tab.tagName === 'BUTTON') tab.setAttribute('aria-expanded', i === g);
      el.querySelector('.fg-track').style.transform = `translateX(${i === g ? -pos * step(i) : 0}px)`;
    });
    dots.innerHTML = Array.from({ length: maxPos(g) + 1 }, (_, i) => `<i class="${i === pos ? 'on' : ''}"></i>`).join('');
  }
  function next() {
    if (pos < maxPos(g)) pos++;
    else { g = (g + 1) % groups.length; pos = 0; }
    render();
  }
  function prev() {
    if (pos > 0) { pos--; render(); return; }
    g = (g - 1 + groups.length) % groups.length;
    pos = 0; render();
    setTimeout(() => { pos = maxPos(g); render(); }, groups.length > 1 ? 620 : 0);
  }
  groups.forEach((el, i) => el.querySelector('.fg-tab').addEventListener('click', () => { if (i !== g) { g = i; pos = 0; render(); } }));
  // Gruplar arasında sol/sağ ok, Home/End ile gezinme
  root.addEventListener('keydown', e => {
    const map = { ArrowRight: g + 1, ArrowLeft: g - 1, Home: 0, End: groups.length - 1 };
    if (!(e.key in map) || !e.target.classList.contains('fg-tab')) return;
    e.preventDefault();
    g = (map[e.key] + groups.length) % groups.length; pos = 0; render();
    groups[g].querySelector('.fg-tab').focus();
  });
  nav.querySelector('.fg-next').addEventListener('click', next);
  nav.querySelector('.fg-prev').addEventListener('click', prev);
  addEventListener('resize', () => { pos = Math.min(pos, maxPos(g)); render(); });
  // Açılma animasyonu bitince görünen kart sayısı doğru hesaplansın
  root.addEventListener('transitionend', e => { if (e.propertyName === 'flex-grow' || e.propertyName === 'flex') render(); });
  render();
});
