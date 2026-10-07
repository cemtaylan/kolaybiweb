// "AI muhasebeye hazır mısınız?": büyük kart kaydırdıkça küçülür, ardından kart şeridi yana kayar.
(function () {
  const story = document.getElementById('story');
  if (!story) return;
  const sticky = story.querySelector('.story-sticky');
  const track = story.querySelector('.story-track');
  const title = story.querySelector('.story-title');
  // Mobil başlık: metin HTML'de tekrar etmesin diye kart girişindeki H2'den kopyalanır
  const mt = story.querySelector('.story-mtitle'), h2 = story.querySelector('.sc-intro h2');
  if (mt && h2 && !mt.innerHTML.trim()) mt.innerHTML = h2.innerHTML;
  const cards = [...track.children];
  const lead = cards[0];
  const CARD_W = 400, CARD_H = 560, GAP = 18;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const mq = matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)');
  let gut = 32;

  function layout() {
    story.classList.toggle('is-static', mq.matches);
    const g = parseFloat(getComputedStyle(document.querySelector('.container')).paddingLeft) || 32;
    gut = Math.max(16, (sticky.clientWidth - 1240) / 2, g);
    story.style.setProperty('--gut', gut + 'px');
    if (mq.matches) { lead.style.width = lead.style.height = ''; track.style.transform = ''; return; }
    update();
  }

  function update() {
    if (mq.matches) return;
    const vw = sticky.clientWidth, vh = sticky.clientHeight;
    const total = story.offsetHeight - vh;
    const p = clamp(-story.getBoundingClientRect().top + 72, 0, total) / total;
    const a = ease(clamp(p / 0.34, 0, 1));          // 1. evre: büyük kart küçülür (tam kart boyuna)
    const b = clamp((p - 0.44) / 0.56, 0, 1);       // 2. evre: şerit yana kayar
    const cardH = Math.min(CARD_H, vh - 150);
    const cardW = cardH * CARD_W / CARD_H;
    const bigW = vw - gut * 2, bigH = vh - 40;
    const w = lerp(bigW, cardW, a), h = lerp(bigH, cardH, a);
    lead.style.width = w + 'px';
    lead.style.height = h + 'px';
    // Büyük kart açıkken diğer kartlar görünmez; küçüldükçe sağdan süzülerek gelir
    cards.slice(1).forEach(c => {
      c.style.width = cardW + 'px'; c.style.height = cardH + 'px';
      c.style.opacity = clamp((a - .35) / .5, 0, 1).toFixed(3);
      c.style.transform = `translateX(${((1 - a) * 160).toFixed(1)}px)`;
    });
    lead.style.setProperty('--big', (1 - clamp(a * 1.6, 0, 1)).toFixed(3));
    lead.style.setProperty('--pe', a > .3 ? 'none' : 'auto');
    const rowW = w + (cards.length - 1) * (cardW + GAP);
    const shift = Math.max(0, rowW - (vw - gut * 2)) * b;
    const cardTop = (vh - (cardH + 64)) / 2 + 64;   // başlık + kartlar birlikte dikeyde ortalı
    const top = lerp(20, cardTop, a);
    title.style.top = (cardTop - 56) + 'px';
    track.style.transform = `translate(${gut - shift}px, ${top}px)`;
    story.classList.toggle('show-title', a > .85);
  }

  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', layout);
  mq.addEventListener('change', layout);
  layout();
})();
