// e-SMM hesaplayıcı: brüt / net / tahsil edilecek tutardan stopaj ve KDV'yi hesaplar.
(function () {
  const root = document.getElementById('smmCalc');
  if (!root) return;
  const amount = root.querySelector('#smmAmount');
  const val = name => +root.querySelector(`.seg[data-name="${name}"] .on`).dataset.v;
  const mode = () => root.querySelector('.seg[data-name="mode"] .on').dataset.v;
  const fmt = n => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
  // Tutar Türkçe biçimde yazılır: binlik ayraç nokta, ondalık virgül (10.000,50)
  const parseAmount = v => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  function formatInput() {
    const raw = amount.value.replace(/[^\d,]/g, '');
    const [int, ...dec] = raw.split(',');
    const intFmt = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    amount.value = dec.length ? intFmt + ',' + dec.join('').slice(0, 2) : intFmt;
  }
  const LABEL = { brut: 'Brüt tutar', net: 'Net tutar', tahsil: 'Tahsil edilecek tutar' };
  const label = document.getElementById('smmAmountLabel');
  function calc() {
    if (label) label.textContent = LABEL[mode()];
    const a = Math.max(0, parseAmount(amount.value)), s = val('stopaj') / 100, k = val('kdv') / 100;
    // tahsil = brüt − stopaj + KDV = brüt × (1 − s + k)
    let brut = mode() === 'brut' ? a : mode() === 'net' ? a / (1 - s) : a / (1 - s + k);
    const st = brut * s, kd = brut * k;
    const out = { brut, stopaj: -st, net: brut - st, kdv: kd, tahsil: brut - st + kd };
    for (const [key, v] of Object.entries(out)) root.querySelector(`[data-out="${key}"]`).textContent = (v < 0 ? '−' : '') + fmt(Math.abs(v));
  }
  // Dinleyici her düğmenin kendisinde (denetim araçları üst öğedeki dinleyiciyi görmüyor, düğmeyi ölü bağlantı sayıyor)
  root.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    seg.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); calc();
  })));
  amount.addEventListener('input', () => { formatInput(); calc(); });
  calc();
})();
