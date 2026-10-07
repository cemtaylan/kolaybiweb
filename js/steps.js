// Nasıl çalışır: ekranın ortasına gelen adım aktif olur; sağdaki görsel ve sarı nokta ona göre değişir.
(function () {
  const root = document.getElementById('ss');
  if (!root) return;
  const items = [...root.querySelectorAll('.ss-item')];
  const stage = root.querySelector('.ss-stage');
  const icons = [...root.querySelectorAll('.ss-ic')];
  const dot = root.querySelector('.ss-dot');
  function set(i) {
    items.forEach((el, n) => el.classList.toggle('is-on', n === i));
    icons.forEach((el, n) => el.classList.toggle('is-on', n === i));
    stage.dataset.step = i;
    dot.style.top = (items[i].offsetTop + 14) + 'px';
  }
  function update() {
    const mid = innerHeight * 0.5;
    let best = 0, bestD = Infinity;
    items.forEach((el, n) => { const r = el.querySelector('h3').getBoundingClientRect(); const d = Math.abs(r.top - mid); if (d < bestD) { bestD = d; best = n; } });
    set(best);
  }
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update);
  update();
})();
