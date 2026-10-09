// Fiyatlar: ürün (Ofis / Jet) ve dönem (yıllık / aylık) seçimi. Tek veri kaynağı: PLANS.
// İlk hâl (Ofis, Yıllık) sayfaya gömülüdür (CLS); PLANS değişirse scripts/plans-ssr.mjs ile #plans HTML'ini yenileyin.
(function () {
  const root = document.getElementById('plans');
  if (!root) return;
  const REG = 'https://app.kolaybi.com/?activeForm=register';
  const ok = '<svg><use href="#i-check"/></svg>';
  const tl = n => n.toLocaleString('tr-TR');

  const COMMON = {
    ofis: ['e-Fatura, e-Arşiv, e-SMM, e-İrsaliye, e-İhracat tek platformda', 'Cari, gelir-gider, stok ve proje takibi', 'Excel ile toplu veri yükleme', 'Ücretsiz kullanıcı desteği', 'Android ve iOS mobil uygulama'],
    jet: ['Sadece e-Fatura / e-Arşiv', 'e-Fatura kesme, gönderme, alma', 'Fatura arşivleme', 'Ücretsiz kullanıcı desteği', 'Android ve iOS mobil uygulama']
  };
  // Ücretsiz verilen kalemler (her pakette ayrı listelenir); PLUS'a özel olanlar vurgulu
  const PLANS = {
    ofis: {
      std: { name: 'Standart', for: 'Ön muhasebe ve e-Fatura',
        price: { yillik: 10800, aylik: 1550 },
        gifts: { yillik: ['5.000 e-Fatura kontörü'], aylik: [] },
        perks: ['Pazaryeri ve e-Ticaret entegrasyonu', 'e-Fatura aktivasyon ve kurulum desteği', 'Geçmiş e-Belgeleri içe aktarma', 'Total Energies istasyonlarında %5 indirim'] },
      plus: { name: 'PLUS', for: 'Ön muhasebe ve e-Fatura', badge: 'En çok tercih edilen',
        price: { yillik: 12000 },
        gifts: { yillik: ['Sınırsız e-Fatura kontörü', '1 yıllık e-İmza paketi', '1 adet online banka entegrasyonu'] },
        perks: ['Pazaryeri ve e-Ticaret entegrasyonu', 'e-Fatura aktivasyon ve kurulum desteği', 'Geçmiş e-Belgeleri içe aktarma', 'Total Energies istasyonlarında %5 indirim'] }
    },
    jet: {
      std: { name: 'Standart', for: 'Sadece e-Fatura kesmek isteyenler',
        price: { yillik: 4000 },
        gifts: { yillik: ['300 e-Fatura kontörü'] },
        perks: ['e-Fatura aktivasyon ve kurulum desteği', 'Geçmiş e-Belgeleri içe aktarma', 'Total Energies istasyonlarında %5 indirim'] },
      plus: { name: 'PLUS', for: 'Sadece e-Fatura kesmek isteyenler', badge: 'En çok tercih edilen',
        price: { yillik: 5000 },
        gifts: { yillik: ['Sınırsız e-Fatura kontörü', '1 yıllık e-İmza paketi'] },
        perks: ['e-Fatura aktivasyon ve kurulum desteği', 'Geçmiş e-Belgeleri içe aktarma', 'Total Energies istasyonlarında %5 indirim'] }
    }
  };
  const PLUS_ONLY = ['1 yıllık e-İmza paketi', '1 adet online banka entegrasyonu'];

  // Yıllık fiyatlar yıllık toplamdır (KDV dahil); kartta aylık karşılığı yuvarlanarak gösterilir
  const perMonth = (p, b) => b === 'yillik' ? Math.round(p.price.yillik / 12) : p.price.aylik;
  let product = 'ofis', bill = 'yillik';
  const prodBtns = [...document.querySelectorAll('[data-product]')];
  const billBtns = [...document.querySelectorAll('[data-bill]')];
  const billSeg = document.querySelector('.seg2.bill');

  function card(p, tier) {
    const price = p.price[bill] == null ? null : perMonth(p, bill);
    const cls = 'plan' + (tier === 'plus' ? ' plus' : '');
    if (price == null) {
      return `<article class="plan na"><div class="plan-top" style="justify-content:center"><h2>${p.name}</h2></div>
        <p>${p.name} paketi yalnızca <b>yıllık</b> ödemeyle sunulur. Yıllık ödemede aylık ${tl(perMonth(p, 'yillik'))} ₺'ye denk gelir.</p>
        <button class="btn btn-outline" type="button" data-go-yearly>Yıllık fiyatı göster<span class="arr"><svg><use href="#i-arrow"/></svg></span></button></article>`;
    }
    // Aylık ödemesi olmayan üründe (Jet) fiyat yıllık gösterilir; "/ ay" yanıltmasın
    const yearlyOnly = product !== 'ofis';
    const total = yearlyOnly ? `Aylık ${tl(price)} ₺’ye denk gelir · KDV dahil`
      : bill === 'yillik' ? `Yıllık toplam <b>${tl(p.price.yillik)} ₺</b> · KDV dahil` : 'Her ay faturalandırılır · KDV dahil';
    const gifts = (p.gifts[bill] || []).map(g => `<li class="${PLUS_ONLY.includes(g) || /Sınırsız/.test(g) ? 'hl' : ''}">${ok}${g}<span class="free">Ücretsiz</span></li>`).join('');
    const perks = p.perks.map(g => `<li>${ok}${g}<span class="free">Ücretsiz</span></li>`).join('');
    const common = COMMON[product].map(g => `<li>${ok}${g}</li>`).join('');
    return `<article class="${cls}">${p.badge ? `<span class="plan-badge">${p.badge}</span>` : ''}
      <div class="plan-top"><h2>${p.name}</h2><span class="plan-for">${p.for}</span></div>
      <div class="plan-price"><b>${tl(yearlyOnly ? p.price.yillik : price)} ₺</b><span>${yearlyOnly ? '/ yıl' : '/ ay'}</span></div>
      <div class="plan-total">${total}</div>
      <a href="${REG}" class="btn btn-primary">14 Gün Ücretsiz Deneyin<span class="arr"><svg><use href="#i-arrow"/></svg></span></a>
      <ul>${gifts}${perks}<li class="plan-sep" aria-hidden="true"></li>${common}</ul></article>`;
  }

  function render() {
    const set = PLANS[product];
    // Aylık ödeme yalnızca Ofis'te var; Jet'te "Aylık" pasif, tasarruf etiketi gizli
    const monthly = product === 'ofis';
    if (!monthly) bill = 'yillik';
    const aylik = billSeg.querySelector('[data-bill="aylik"]');
    aylik.disabled = !monthly;
    aylik.title = monthly ? '' : 'KolayBi Jet yalnızca yıllık ödemeyle sunulur';
    aylik.querySelector('small').hidden = monthly;
    billSeg.querySelector('.save').hidden = !monthly;
    prodBtns.forEach(b => b.classList.toggle('on', b.dataset.product === product));
    billBtns.forEach(b => b.classList.toggle('on', b.dataset.bill === bill));
    root.innerHTML = card(set.std, 'std') + card(set.plus, 'plus');
    document.querySelectorAll('[data-col]').forEach(th => th.classList.toggle('me', th.dataset.col === product));
  }
  prodBtns.forEach(b => b.addEventListener('click', () => { product = b.dataset.product; render(); }));
  billBtns.forEach(b => b.addEventListener('click', () => { bill = b.dataset.bill; render(); }));
  root.addEventListener('click', e => { if (e.target.closest('[data-go-yearly]')) { bill = 'yillik'; render(); } });
  const q = new URLSearchParams(location.search).get('urun');
  if (q === 'jet') product = 'jet';
  render();
})();
