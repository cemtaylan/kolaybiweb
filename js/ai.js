// AI Muhasebe demo: senaryolar sırayla oynar; kanal (Web / WhatsApp / Telegram) pencere görünümünü değiştirir.
(function () {
  const win = document.getElementById('aiWindow');
  if (!win) return;
  const chat = win.querySelector('.ai-chat');
  const input = win.querySelector('.ai-input span');
  const tabs = [...document.querySelectorAll('.ai-tabs button')];
  const chans = [...document.querySelectorAll('.ai-channels button')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = id => `<svg><use href="#${id}"/></svg>`;
  const AV = `<span class="ai-avatar">${icon('i-spark')}</span>`;

  const CH = {
    web: { title: 'KolayBi AI', sub: 'Web arayüzü · çevrimiçi' },
    wa:  { title: 'KolayBi AI', sub: 'WhatsApp · çevrimiçi' },
    tg:  { title: 'KolayBi AI Bot', sub: 'Telegram · bot' }
  };

  const S = {
    fatura: {
      ask: "Emirhan Yılmaz'a 3 adet Ofis paketi için 12.500 TL + KDV e-Fatura kes",
      reply: "Emirhan Yılmaz için e-Fatura taslağını hazırladım. Cari kayıtlarda e-Fatura mükellefi görünüyor; kontrol edip onaylayabilirsiniz.",
      card: `<div class="rc">
        <div class="rc-head"><b>e-Fatura Taslağı</b><small>04.10.2026</small></div>
        <div class="rc-body">
          <div class="rc-meta"><div><small>Alıcı</small><b>Emirhan Yılmaz</b></div><div><small>VKN</small><b>•••• ••• 482</b></div></div>
          <table><tr><th>Kalem</th><th class="r">Adet</th><th class="r">Tutar</th></tr>
            <tr><td>KolayBi Ofis paketi</td><td class="r">3</td><td class="r">₺12.500,00</td></tr>
            <tr><td>KDV %20</td><td></td><td class="r">₺2.500,00</td></tr>
            <tr class="tot"><td>Genel toplam</td><td></td><td class="r">₺15.000,00</td></tr></table>
        </div>
        <div class="rc-actions"><button class="rc-btn primary" data-press>${icon('i-check-solid')}Onayla ve GİB'e gönder</button><button class="rc-btn">Düzenle</button></div>
      </div>`,
      after: `<span class="tag-ok">${icon('i-check-solid')}Gönderildi</span><p style="margin-top:8px">e-Fatura <b>KB2026000004218</b> GİB'e iletildi ve Emirhan Yılmaz'a e-posta ile gönderildi.</p>`
    },
    stok: {
      ask: 'Kritik seviyedeki stoklarımı göster',
      reply: '4 ürün kritik seviyenin altına düştü. En acil olanı A4 fotokopi kâğıdı; 2 günlük satışa yetecek stok kaldı.',
      card: `<div class="rc">
        <div class="rc-head"><b>Kritik Stoklar</b><small>Ana depo</small></div>
        <div class="rc-body"><table><tr><th>Ürün</th><th class="r">Mevcut</th><th class="r">Kritik</th><th></th></tr>
          <tr><td>A4 fotokopi kâğıdı</td><td class="r">12 kl</td><td class="r">50</td><td class="r"><span class="bar"><i style="width:24%"></i></span></td></tr>
          <tr><td>Toner TN-2420</td><td class="r">3 ad</td><td class="r">10</td><td class="r"><span class="bar"><i style="width:30%"></i></span></td></tr>
          <tr><td>Etiket rulosu</td><td class="r">18 ad</td><td class="r">40</td><td class="r"><span class="bar"><i style="width:45%"></i></span></td></tr>
          <tr><td>Kargo kutusu (M)</td><td class="r">64 ad</td><td class="r">100</td><td class="r"><span class="bar ok"><i style="width:64%"></i></span></td></tr></table></div>
        <div class="rc-actions"><button class="rc-btn primary" data-press>${icon('i-order')}Sipariş taslağı oluştur</button><button class="rc-btn">Tedarikçiye gönder</button></div>
      </div>`,
      after: `<span class="tag-ok">${icon('i-check-solid')}Taslak hazır</span><p style="margin-top:8px">4 kalemlik satın alma siparişi taslağı <b>Öztürk Kırtasiye</b> için oluşturuldu.</p>`
    },
    ekstre: {
      ask: "Emirhan Yılmaz'ın son 3 aylık cari ekstresini çıkar",
      reply: "Emirhan Yılmaz'ın 01.07–04.10.2026 dönemi ekstresi hazır. Güncel bakiye: ₺18.750 alacaklısınız.",
      card: `<div class="rc">
        <div class="rc-head"><b>Cari Ekstre · Emirhan Yılmaz</b><small>3 ay</small></div>
        <div class="rc-body"><table><tr><th>Tarih</th><th>Açıklama</th><th class="r">Borç</th><th class="r">Alacak</th></tr>
          <tr><td>12.07</td><td>Satış faturası</td><td class="r">₺24.000</td><td class="r"></td></tr>
          <tr><td>28.07</td><td>Havale tahsilat</td><td class="r"></td><td class="r">₺20.250</td></tr>
          <tr><td>16.08</td><td>Satış faturası</td><td class="r">₺15.000</td><td class="r"></td></tr>
          <tr><td>02.09</td><td>POS tahsilat</td><td class="r"></td><td class="r">₺15.000</td></tr>
          <tr><td>04.10</td><td>Satış faturası</td><td class="r">₺15.000</td><td class="r"></td></tr>
          <tr class="tot"><td colspan="2">Bakiye</td><td class="r pos" colspan="2">₺18.750 alacak</td></tr></table></div>
        <div class="rc-actions"><button class="rc-btn primary" data-press>${icon('i-mail')}E-posta ile gönder</button><button class="rc-btn">PDF indir</button></div>
      </div>`,
      after: `<span class="tag-ok">${icon('i-check-solid')}Gönderildi</span><p style="margin-top:8px">Ekstre PDF olarak Emirhan Yılmaz'a e-posta ile iletildi.</p>`
    },
    tahsilat: {
      ask: 'Vadesi geçen alacaklarım kimde?',
      reply: '3 müşterinin toplam ₺41.300 vadesi geçmiş alacağı var. İsterseniz hepsine kibar bir hatırlatma gönderebilirim.',
      card: `<div class="rc">
        <div class="rc-head"><b>Vadesi Geçen Alacaklar</b><small>Toplam ₺41.300</small></div>
        <div class="rc-body"><table><tr><th>Müşteri</th><th class="r">Tutar</th><th class="r">Gecikme</th></tr>
          <tr><td>Deniz Ltd.</td><td class="r">₺22.800</td><td class="r"><span class="tag-warn">34 gün</span></td></tr>
          <tr><td>Yıldız A.Ş.</td><td class="r">₺11.500</td><td class="r"><span class="tag-warn">18 gün</span></td></tr>
          <tr><td>Mavi Yapı</td><td class="r">₺7.000</td><td class="r"><span class="tag-warn">6 gün</span></td></tr></table></div>
        <div class="rc-actions"><button class="rc-btn primary" data-press>${icon('i-chat')}Hatırlatma gönder</button><button class="rc-btn">Tek tek seç</button></div>
      </div>`,
      after: `<span class="tag-ok">${icon('i-check-solid')}3 hatırlatma gönderildi</span><p style="margin-top:8px">Ödeme bağlantılı hatırlatmalar e-posta ve SMS ile iletildi.</p>`
    },
    nakit: {
      ask: 'Bu ayki nakit durumum nasıl?',
      reply: 'Ekim ayında nakit akışınız pozitif. Tahsilatlar geçen aya göre %12 arttı; en büyük gider kalemi kira.',
      card: `<div class="rc">
        <div class="rc-head"><b>Nakit Durumu · Ekim</b><small>Tüm hesaplar</small></div>
        <div class="rc-body">
          <div class="kpis"><div><small>Giriş</small><b class="pos">₺186.400</b></div><div><small>Çıkış</small><b class="neg">₺121.900</b></div><div><small>Net</small><b>₺64.500</b></div></div>
          <div class="spark"><i style="height:40%"></i><i style="height:55%"></i><i style="height:35%"></i><i style="height:62%"></i><i style="height:48%"></i><i style="height:70%"></i><i style="height:58%"></i><i class="hi" style="height:88%"></i></div>
        </div>
        <div class="rc-actions"><button class="rc-btn primary" data-press>${icon('i-chart')}Detaylı rapor</button><button class="rc-btn">Muhasebeciye gönder</button></div>
      </div>`,
      after: `<span class="tag-ok">${icon('i-check-solid')}Rapor hazır</span><p style="margin-top:8px">Ekim nakit akış raporu muhasebecinize e-posta ile gönderildi.</p>`
    }
  };
  const order = Object.keys(S);
  let cur = 0, run = 0, timer;
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  function scroll() { chat.scrollTop = chat.scrollHeight; }
  function add(html, cls) {
    const el = document.createElement('div');
    el.className = 'msg ' + cls;
    el.innerHTML = html;
    chat.appendChild(el); scroll();
    return el;
  }

  async function play(key) {
    const id = ++run;
    clearTimeout(timer);
    const sc = S[key];
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.scn === key));
    chat.innerHTML = '';
    input.textContent = '';
    // Kullanıcı yazıyor
    input.classList.add('typing-now');
    for (const ch of sc.ask) {
      if (id !== run) return;
      input.textContent += ch;
      await wait(28);
    }
    await wait(350); if (id !== run) return;
    input.classList.remove('typing-now');
    input.textContent = '';
    add(sc.ask, 'me');
    // Asistan düşünüyor
    const t = add(`${AV}<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`, 'ai');
    await wait(1100); if (id !== run) return;
    t.querySelector('.bubble').innerHTML = `<p>${sc.reply}</p>${sc.card}`;
    scroll();
    // Onay: kullanıcı butona basar
    await wait(2600); if (id !== run) return;
    const btn = t.querySelector('[data-press]');
    if (btn) { btn.classList.add('pressed'); }
    await wait(500); if (id !== run) return;
    add(`${AV}<div class="bubble">${sc.after}</div>`, 'ai');
    // Sonraki senaryo
    timer = setTimeout(() => { if (id === run) play(order[(order.indexOf(key) + 1) % order.length]); }, reduce ? 6000 : 4200);
  }

  function setChannel(ch) {
    win.dataset.ch = ch;
    chans.forEach(b => { const on = b.dataset.ch === ch; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on) win.setAttribute('aria-labelledby', b.id); });
    win.querySelector('.ai-top b').textContent = CH[ch].title;
    win.querySelector('.ai-top small').textContent = CH[ch].sub;
  }

  tabs.forEach(t => t.addEventListener('click', () => play(t.dataset.scn)));
  chans.forEach(b => b.addEventListener('click', () => setChannel(b.dataset.ch)));
  // Sekme listesi: sol/sağ ok, Home/End ile kanallar arasında gezinme
  chans.forEach((b, i) => b.addEventListener('keydown', e => {
    const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: chans.length - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    const t = chans[(k + chans.length) % chans.length];
    setChannel(t.dataset.ch); t.focus();
  }));
  // Sayfadaki örnek komutlar ve kanal kartları demoyu çalıştırır
  document.querySelectorAll('[data-run]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); // bağlantı (#demo) JS yokken de demoya götürür

    if (b.dataset.ch) setChannel(b.dataset.ch);
    play(b.dataset.run || order[0]);
    document.getElementById('demo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));

  // Pencere görünür olunca başla
  const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { play(order[0]); io.disconnect(); } }, { threshold: .3 });
  io.observe(win);
})();
