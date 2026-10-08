// Açılır pencere HTML'i: sitedeki /js/popups.js ve CMS'teki canlı önizleme aynı işlevi kullanır.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// e-Fatura, e-İmza gibi kelimeler satır sonunda tireden bölünmesin
const nw = (s) => s.replace(/(^|[\s(])(e-[\p{L}]+(?:['’][\p{L}]+)?)/gu, '$1<span class="kbp-nw">$2</span>')

// Sayfayı kapatan (modal) tasarımlar; köşe kartı ve alt şerit sayfayı kapatmaz
export const MODAL = ['klasik', 'yan-gorsel', 'tam-ekran', 'yan-panel']

export function popupHTML(p, { preview = false } = {}) {
  const design = p.design || 'klasik'
  const modal = MODAL.includes(design)
  const img = p.image ? `<div class="kbp-img"><img src="${esc(p.image)}" alt="" loading="lazy"></div>` : ''
  const btn = p.buttonText && p.buttonLink
    ? `<a class="kbp-btn" href="${esc(p.buttonLink)}" data-kbp-cta>${esc(p.buttonText)}<span class="kbp-arr" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>`
    : ''
  return `<div class="kbp kbp--${esc(design)} kbp--${esc(p.theme || 'ofis')}${preview ? ' kbp--preview is-open' : ''}" role="dialog" aria-modal="${modal}" aria-labelledby="kbp-title-${esc(p.id || 'onizleme')}">
  ${modal ? '<div class="kbp-backdrop" data-kbp-close></div>' : ''}
  <div class="kbp-box">
    <button type="button" class="kbp-x" data-kbp-close aria-label="Kapat"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    ${img}
    <div class="kbp-body">
      ${p.eyebrow ? `<span class="kbp-eyebrow">${nw(esc(p.eyebrow))}</span>` : ''}
      <h2 class="kbp-title" id="kbp-title-${esc(p.id || 'onizleme')}">${nw(esc(p.title || 'Başlık'))}</h2>
      ${p.text ? `<p class="kbp-text">${nw(esc(p.text)).replace(/\n/g, '<br>')}</p>` : ''}
      ${btn}
    </div>
  </div>
</div>`
}
