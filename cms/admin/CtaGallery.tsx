'use client'
// CTA örnekleri ve deneme alanı: ayarları değiştirip sitedeki görünümü anında görün; altta tüm hazır CTA'lar seçilen görünümde.
import { useState } from 'react'
import { CTA_PRESETS } from '../blocks'
import { buttonHTML, ctaHTML, type CtaFields } from '../cta-html'
import { SiteFrame } from './SiteFrame'

const GORUNUM = [
  { v: 'acik', l: 'Açık kutu (blog ara kutusu)' },
  { v: 'koyu', l: 'Koyu bant (sayfa sonu kapanışı)' },
  { v: 'kart', l: 'Koyu kart (yan sütun kutusu)' },
]
const RENK = [{ v: '', l: 'Hazır CTA’nın rengi' }, { v: 'ofis', l: 'Ofis mavisi' }, { v: 'jet', l: 'Jet turkuazı' }, { v: 'banka', l: 'Banka laciverti' }, { v: 'link', l: 'Link moru' }]
const HAZIR = [...Object.entries(CTA_PRESETS).map(([v, p]) => ({ v, l: p.label })), { v: 'ozel', l: 'Özel (metni kendim yazacağım)' }]

export function CtaGallery() {
  const [f, setF] = useState<CtaFields>({ preset: 'deneme', style: 'acik', theme: '', title: '', text: '', button: '', link: '', note: '' })
  const [mobil, setMobil] = useState(false)
  const [galeri, setGaleri] = useState('acik')
  const set = (k: keyof CtaFields) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const p = f.preset && f.preset !== 'ozel' ? CTA_PRESETS[f.preset as keyof typeof CTA_PRESETS] : null
  return (
    <div className="kb-an">
      <header className="kb-pb-head">
        <div>
          <h1>CTA örnekleri</h1>
          <p>Blog yazılarına eklenebilen çağrı kutularını burada deneyin. Beğendiğiniz ayarı yazıda <b>CTA / Buton ekle</b> menüsünden aynı seçimlerle ekleyin; yazının içinde de canlı önizleme görünür.</p>
        </div>
      </header>

      <section className="kb-an-card kb-ctg-play">
        <div className="kb-an-card-head"><h3 className="kb-an-ct">Deneme alanı</h3>
          <div className="kb-pp-toggle" role="group" aria-label="Önizleme genişliği">
            <button type="button" className={!mobil ? 'on' : ''} onClick={() => setMobil(false)}>Masaüstü</button>
            <button type="button" className={mobil ? 'on' : ''} onClick={() => setMobil(true)}>Mobil</button>
          </div>
        </div>
        <div className="kb-ctg-grid">
          <form className="kb-ctg-form" onSubmit={(e) => e.preventDefault()}>
            <label>Hazır CTA<select value={f.preset || ''} onChange={set('preset')}>{HAZIR.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
            <label>Görünüm<select value={f.style || ''} onChange={set('style')}>{GORUNUM.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
            <label>Renk<select value={f.theme || ''} onChange={set('theme')}>{RENK.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
            <label>Başlık <small>vurgu için *yıldız* arasına yazın</small><input value={f.title || ''} onChange={set('title')} placeholder={p?.title || 'Başlık'} /></label>
            <label>Açıklama<textarea rows={2} value={f.text || ''} onChange={set('text')} placeholder={p?.text || 'Açıklama'} /></label>
            <div className="kb-ctg-row">
              <label>Buton yazısı<input value={f.button || ''} onChange={set('button')} placeholder={p?.button || 'Buton yazısı'} /></label>
              <label>Bağlantı<input value={f.link || ''} onChange={set('link')} placeholder={p?.link || '/sayfa'} /></label>
            </div>
            <label>Buton altı notu <small>gizlemek için - yazın</small><input value={f.note || ''} onChange={set('note')} placeholder={p?.note || 'Not yok'} /></label>
            <button type="button" className="kb-ctg-reset" onClick={() => setF((x) => ({ ...x, title: '', text: '', button: '', link: '', note: '' }))}>Metni hazır hâline döndür</button>
          </form>
          <div><SiteFrame html={ctaHTML(f)} mobil={mobil} title="CTA deneme önizlemesi" /></div>
        </div>
      </section>

      <section className="kb-an-sec">
        <h2 className="kb-an-h">Tüm hazır CTA’lar</h2>
        <nav className="kb-an-range" aria-label="Görünüm">
          {GORUNUM.map((o) => <button key={o.v} type="button" className={galeri === o.v ? 'on' : ''} onClick={() => setGaleri(o.v)}>{o.l}</button>)}
        </nav>
        <div className="kb-ctg-list">
          {Object.entries(CTA_PRESETS).map(([k, pr]) => (
            <div key={k} className="kb-an-card">
              <div className="kb-an-card-head"><h3 className="kb-an-ct">{pr.label}</h3>
                <button type="button" className="kb-ctg-try" onClick={() => { setF({ preset: k, style: galeri, theme: '', title: '', text: '', button: '', link: '', note: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Denemede aç</button>
              </div>
              <SiteFrame html={ctaHTML({ preset: k, style: galeri })} title={pr.label} />
            </div>
          ))}
          <div className="kb-an-card">
            <div className="kb-an-card-head"><h3 className="kb-an-ct">Tek buton</h3><span>Renk ve üzerine gelince rengi seçilebilir; önizlemede üzerine gelin</span></div>
            <SiteFrame html={[{ variant: 'primary', color: 'mavi', text: 'Ücretsiz Deneyin' }, { variant: 'primary', color: 'turkuaz', text: 'Jet’i İnceleyin' }, { variant: 'outline', color: 'lacivert', text: 'Fiyatları İnceleyin' }, { variant: 'primary', color: 'sari', text: 'Kampanyayı İnceleyin' }].map((b) => buttonHTML({ ...b, link: '#', align: 'left' })).join('')} title="Buton örnekleri" />
          </div>
        </div>
      </section>
    </div>
  )
}
