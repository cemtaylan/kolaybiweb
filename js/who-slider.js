// "Kimler için" fotoğraflı kayan kartlar: aktif kart büyür, altındaki çubuk dolunca sıradaki karta geçer.
// Fare üstündeyken ya da klavye odağındayken durur; hareket azaltma tercihinde otomatik geçiş yoktur.
(function () {
  document.querySelectorAll('.who-slider').forEach(root => {
    const track = root.querySelector('.ws-track');
    const cards = [...track.querySelectorAll('.ws-card')];
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0, userScroll = false, t;
    const pos = k => cards[k].offsetLeft - cards[0].offsetLeft; // kartın şerit içindeki konumu

    function go(i, scroll = true) {
      cur = (i + cards.length) % cards.length;
      cards.forEach((c, k) => {
        c.classList.toggle('is-active', k === cur);
        const bar = c.querySelector('.ws-bar');
        bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      if (scroll) { userScroll = false; track.scrollTo({ left: pos(cur), behavior: still ? 'auto' : 'smooth' }); }
    }
    if (!still) cards.forEach(c => c.querySelector('.ws-bar').addEventListener('animationend', () => go(cur + 1)));

    const pause = on => root.classList.toggle('is-paused', on);
    root.addEventListener('mouseenter', () => pause(true));
    root.addEventListener('mouseleave', () => pause(false));
    root.addEventListener('focusin', () => pause(true));
    root.addEventListener('focusout', () => pause(false));
    // Ekran dışındayken çubuk ilerlemesin
    new IntersectionObserver(([e]) => root.classList.toggle('is-paused', !e.isIntersecting || root.matches(':hover'))).observe(root);

    // Elle kaydırınca en yakın kart aktif olur
    track.addEventListener('pointerdown', () => { userScroll = true; });
    track.addEventListener('wheel', () => { userScroll = true; }, { passive: true });
    track.addEventListener('scroll', () => {
      if (!userScroll) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const x = track.scrollLeft;
        let best = 0; cards.forEach((c, k) => { if (Math.abs(pos(k) - x) < Math.abs(pos(best) - x)) best = k; });
        if (best !== cur) go(best, false);
      }, 120);
    }, { passive: true });

    root.querySelector('.ws-nav .prev').addEventListener('click', () => go(cur - 1));
    root.querySelector('.ws-nav .next').addEventListener('click', () => go(cur + 1));
    go(0, false);
  });
})();
