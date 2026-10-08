// /admin/analitik: çerezsiz site analitiği, bölüm bölüm özet. Her listede ilk 10 kayıt; "Tümünü gör" detay ekranına,
// sayfa satırları sayfa detayına gider (/admin/analitik/sayfalar, /admin/analitik/sayfa, /admin/analitik/butonlar).
// Veriler cms/analytics.ts'teki günlük toplamlardan okunur; dönem ?gun=7|30|90 ile seçilir.
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { sql } from '@payloadcms/db-postgres'
import { rows, daysAgo } from '../analytics'
import { Degisim, DonemNav, GunlukGrafik, KAYNAK, TASARIM, detayHref, donem, fmt, n, once, sayfaAdlari, sayfaIstatistik, yuzde, zaman } from './analytics-shared'

const ILK = 10

export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/analitik')
  const payload = req.payload
  const gun = donem(searchParams)
  const bas = daysAgo(gun - 1)
  const onceBas = daysAgo(gun * 2 - 1)

  const [toplam, onceki, gunluk, sayfalar, kaynaklar, cihazlar, ilanlar, donButon, donKaynak, donCihaz] = await Promise.all([
    rows(payload, sql`SELECT kind, event, SUM(count) AS n FROM analytics WHERE day >= ${bas} GROUP BY kind, event`),
    rows(payload, sql`SELECT kind, event, SUM(count) AS n FROM analytics WHERE day >= ${onceBas} AND day < ${bas} GROUP BY kind, event`),
    rows(payload, sql`SELECT day, event, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event IN ('view', 'visitor') AND day >= ${bas} GROUP BY day, event`),
    sayfaIstatistik(payload, bas),
    rows(payload, sql`SELECT source, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'session' AND day >= ${bas} GROUP BY source ORDER BY n DESC`),
    rows(payload, sql`SELECT device, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'view' AND day >= ${bas} GROUP BY device`),
    rows(payload, sql`SELECT popup, event, SUM(count) AS n FROM analytics WHERE kind = 'popup' AND day >= ${bas} GROUP BY popup, event`),
    rows(payload, sql`SELECT label, event, SUM(count) AS n FROM analytics WHERE kind = 'cta' AND event IN ('signup', 'login', 'contact') AND day >= ${bas} GROUP BY label, event`),
    rows(payload, sql`SELECT source, event, SUM(count) AS n FROM analytics
      WHERE day >= ${bas} AND ((kind = 'page' AND event = 'session') OR (kind = 'cta' AND event IN ('signup', 'signup_visitor'))) GROUP BY source, event`),
    rows(payload, sql`SELECT device, event, SUM(count) AS n FROM analytics
      WHERE day >= ${bas} AND ((kind = 'page' AND event = 'visitor') OR (kind = 'cta' AND event IN ('signup', 'signup_visitor'))) GROUP BY device, event`),
  ])

  const t = (r: Record<string, unknown>[], kind: string, event: string) => n(r.find((x) => x.kind === kind && x.event === event)?.n)
  const kart = (l: string, kind: string, event: string, ipucu?: string) => ({ l, v: fmt(t(toplam, kind, event)), d: <Degisim simdi={t(toplam, kind, event)} once={t(onceki, kind, event)} />, ipucu })
  const tekil = t(toplam, 'page', 'visitor')
  const ozet = [
    { baslik: 'Trafik', kartlar: [
      kart('Tekil ziyaretçi', 'page', 'visitor', 'Her tarayıcı günde bir kez sayılır; dönem toplamı günlük tekillerin toplamıdır'),
      kart('Yeni ziyaretçi', 'page', 'new', 'Siteye ilk kez gelen tarayıcılar'),
      kart('Ziyaret', 'page', 'session', '30 dakika hareketsizlikten sonra yeni ziyaret başlar'),
      kart('Sayfa görüntüleme', 'page', 'view'),
    ] },
    { baslik: 'Dönüşüm', kartlar: [
      kart('Kayıt tıklaması', 'cta', 'signup', 'Kayıt formuna (app.kolaybi.com, ofis.kolaybi.com) giden buton ve bağlantı tıklamaları'),
      { l: 'Kayıt oranı', v: yuzde(t(toplam, 'cta', 'signup_visitor'), tekil), d: null, ipucu: 'Kayda tıklayan ziyaretçi ÷ tekil ziyaretçi' },
      kart('Giriş tıklaması', 'cta', 'login', 'Mevcut müşterilerin "Giriş Yap" tıklamaları'),
      kart('İletişim tıklaması', 'cta', 'contact', 'Telefon, e-posta ve WhatsApp bağlantıları'),
    ] },
    { baslik: 'İlanlar', kartlar: [
      kart('İlan görüntüleme', 'popup', 'view'),
      kart('İlan tıklama', 'popup', 'click'),
      { l: 'İlan tıklama oranı', v: yuzde(t(toplam, 'popup', 'click'), t(toplam, 'popup', 'view')), d: null, ipucu: undefined },
      kart('İlan kapatma', 'popup', 'close'),
    ] },
  ]

  const gv = new Map<string, { v: number; s: number }>()
  for (const r of gunluk) { const g = gv.get(String(r.day)) || { v: 0, s: 0 }; g[r.event === 'visitor' ? 's' : 'v'] = n(r.n); gv.set(String(r.day), g) }

  const enCok = [...sayfalar].filter((x) => x.v).sort((a, b) => b.v - a.v).slice(0, ILK)
  const sonGor = [...sayfalar].filter((x) => x.son).sort((a, b) => zaman(b.son) - zaman(a.son)).slice(0, ILK)
  const kayitSayfa = [...sayfalar].filter((x) => x.k).sort((a, b) => b.k - a.k).slice(0, ILK)
  const ad = await sayfaAdlari(payload, [...enCok, ...sonGor, ...kayitSayfa].map((x) => x.path))

  const butonMap = new Map<string, { s: number; l: number; c: number }>()
  for (const r of donButon) {
    const b = butonMap.get(String(r.label)) || { s: 0, l: 0, c: 0 }
    if (r.event === 'signup') b.s += n(r.n); if (r.event === 'login') b.l += n(r.n); if (r.event === 'contact') b.c += n(r.n)
    butonMap.set(String(r.label), b)
  }
  const butonlar = [...butonMap].map(([label, b]) => ({ label, ...b, top: b.s + b.l + b.c })).sort((a, b) => b.s - a.s || b.top - a.top)

  const ks = (k: string, e: string) => n(donKaynak.find((r) => r.source === k && r.event === e)?.n)
  const kaynakDon = Object.keys(KAYNAK).map((k) => ({ k, z: ks(k, 'session'), s: ks(k, 'signup'), sv: ks(k, 'signup_visitor') })).filter((r) => r.z || r.s).sort((a, b) => b.z - a.z)
  const kaynakTop = kaynaklar.reduce((a, r) => a + n(r.n), 0)
  const cs = (d: string, e: string) => n(donCihaz.find((r) => r.device === d && r.event === e)?.n)
  const cihazTop = cihazlar.reduce((a, r) => a + n(r.n), 0)
  const mobil = n(cihazlar.find((c) => c.device === 'mobile')?.n)

  const ids = [...new Set(ilanlar.map((r) => Number(r.popup)))]
  const ilanDocs = ids.length ? (await payload.find({ collection: 'popups', where: { id: { in: ids } }, limit: ids.length, depth: 0, select: { name: true, design: true, active: true } })).docs : []
  const ilanTablo = ids.map((id) => {
    const s = (e: string) => n(ilanlar.find((r) => Number(r.popup) === id && r.event === e)?.n)
    return { id, doc: ilanDocs.find((d) => d.id === id), v: s('view'), c: s('click'), x: s('close') }
  }).sort((a, b) => b.v - a.v)

  const bos = !tekil && !t(toplam, 'page', 'view') && !t(toplam, 'popup', 'view')
  const tum = (sira: string) => `/admin/analitik/sayfalar?sira=${sira}&gun=${gun}`

  const SayfaHucre = ({ path }: { path: string }) => (
    <td><a href={detayHref(path, gun)} className="kb-an-link">{ad(path)}</a><small>{path}</small></td>
  )

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={payload} permissions={permissions} searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="kb-an">
          <header className="kb-pb-head">
            <div>
              <h1>Analitik</h1>
              <p>Sitedeki ziyaretler, kayıt tıklamaları ve ilan performansı. Çerez ve kişisel veri kullanılmaz; botlar sayılmaz. Bir sayfanın ayrıntısını görmek için adına tıklayın.</p>
            </div>
            <DonemNav base="/admin/analitik" gun={gun} />
          </header>
          <nav className="kb-an-toc" aria-label="Bölümler">
            <a href="#ozet">Özet</a><a href="#sayfalar">Sayfalar</a><a href="#donusum">Dönüşüm</a><a href="#kaynak">Kaynak ve cihaz</a><a href="#ilanlar">İlanlar</a>
          </nav>

          {bos && <p className="kb-pb-empty">Bu dönemde henüz veri yok. Siteye gelen ziyaretler birkaç saniye içinde burada görünmeye başlar.</p>}

          {/* 1. Özet */}
          <section id="ozet" className="kb-an-sec">
            <h2 className="kb-an-h">Özet <small>Son {gun} gün, önceki {gun} günle karşılaştırmalı</small></h2>
            {ozet.map((g) => (
              <div key={g.baslik} className="kb-an-kgrp">
                <h3>{g.baslik}</h3>
                <div className="kb-an-kpis kb-an-kpis-4">
                  {g.kartlar.map((k) => <div className="kb-stat" key={k.l} title={k.ipucu}><b>{k.v}</b><span>{k.l} {k.d}</span></div>)}
                </div>
              </div>
            ))}
            <div className="kb-an-card">
              <div className="kb-an-card-head"><h3 className="kb-an-ct">Günlük trafik</h3><span className="kb-an-legend"><i className="v" />Sayfa görüntüleme <i className="s" />Tekil ziyaretçi</span></div>
              <GunlukGrafik gun={gun} veri={gv} etiket={`Son ${gun} günün günlük sayfa görüntüleme ve tekil ziyaretçi grafiği`} />
            </div>
          </section>

          {/* 2. Sayfalar */}
          <section id="sayfalar" className="kb-an-sec">
            <h2 className="kb-an-h">Sayfalar</h2>
            <div className="kb-an-grid kb-an-grid-even">
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">En çok görüntülenen 10 sayfa</h3><a href={tum('cok')}>Tümünü gör →</a></div>
                <table className="kb-an-table">
                  <thead><tr><th>Sayfa</th><th>Görüntüleme</th><th>Tekil</th><th>Mobil</th></tr></thead>
                  <tbody>
                    {enCok.map((x) => <tr key={x.path}><SayfaHucre path={x.path} /><td><b>{fmt(x.v)}</b></td><td>{fmt(x.u)}</td><td>{yuzde(x.m, x.v)}</td></tr>)}
                    {!enCok.length && <tr><td colSpan={4} className="kb-an-none">Veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">Son görüntülenen 10 sayfa</h3><a href={tum('son')}>Tümünü gör →</a></div>
                <table className="kb-an-table">
                  <thead><tr><th>Sayfa</th><th>Son görüntüleme</th><th>Görüntüleme</th></tr></thead>
                  <tbody>
                    {sonGor.map((x) => <tr key={x.path}><SayfaHucre path={x.path} /><td><b>{once(x.son)}</b></td><td>{fmt(x.v)}</td></tr>)}
                    {!sonGor.length && <tr><td colSpan={3} className="kb-an-none">Veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3. Dönüşüm */}
          <section id="donusum" className="kb-an-sec">
            <h2 className="kb-an-h">Dönüşüm <small>Ziyaretçiyi kayda yönlendiren sayfalar ve butonlar</small></h2>
            <div className="kb-an-grid kb-an-grid-even">
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">En çok kayıt getiren 10 sayfa</h3><a href={tum('kayit')}>Tümünü gör →</a></div>
                <table className="kb-an-table">
                  <thead><tr><th>Sayfa</th><th>Kayıt</th><th title="Bu sayfada kayda tıklayan ziyaretçi ÷ sayfa görüntüleme">Kayıt oranı</th></tr></thead>
                  <tbody>
                    {kayitSayfa.map((x) => <tr key={x.path}><SayfaHucre path={x.path} /><td><b>{fmt(x.k)}</b></td><td>{yuzde(x.kv, x.v)}</td></tr>)}
                    {!kayitSayfa.length && <tr><td colSpan={3} className="kb-an-none">Bu dönemde kayıt tıklaması yok</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">En çok tıklanan 10 buton</h3><a href={`/admin/analitik/butonlar?gun=${gun}`}>Tümünü gör →</a></div>
                <table className="kb-an-table">
                  <thead><tr><th>Buton (yazısı · yeri)</th><th>Kayıt</th><th>Giriş</th><th>İletişim</th></tr></thead>
                  <tbody>
                    {butonlar.slice(0, ILK).map((b) => <tr key={b.label}><td><span>{b.label.split(' · ').slice(1).join(' · ') || b.label}</span><small>{b.label.split(' · ')[0]}</small></td><td><b>{fmt(b.s)}</b></td><td>{fmt(b.l)}</td><td>{fmt(b.c)}</td></tr>)}
                    {!butonlar.length && <tr><td colSpan={4} className="kb-an-none">Veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4. Kaynak ve cihaz */}
          <section id="kaynak" className="kb-an-sec">
            <h2 className="kb-an-h">Kaynak ve cihaz</h2>
            <div className="kb-an-grid kb-an-grid-even">
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">Ziyaretler nereden geliyor</h3></div>
                <ul className="kb-an-bars">
                  {kaynaklar.map((k) => <li key={String(k.source)}><span>{KAYNAK[String(k.source)] || String(k.source)}</span><b>{fmt(n(k.n))}</b><i style={{ width: `${kaynakTop ? (n(k.n) / kaynakTop) * 100 : 0}%` }} /></li>)}
                  {!kaynaklar.length && <li className="kb-an-none">Veri yok</li>}
                </ul>
                {kaynakDon.length > 0 && (
                  <table className="kb-an-table kb-an-mt">
                    <thead><tr><th>Kaynak</th><th>Ziyaret</th><th>Kayıt</th><th title="Kayda tıklayan ziyaretçi ÷ ziyaret">Kayıt oranı</th></tr></thead>
                    <tbody>{kaynakDon.map((r) => <tr key={r.k}><td><span>{KAYNAK[r.k]}</span></td><td>{fmt(r.z)}</td><td><b>{fmt(r.s)}</b></td><td>{yuzde(r.sv, r.z)}</td></tr>)}</tbody>
                  </table>
                )}
              </div>
              <div className="kb-an-card">
                <div className="kb-an-card-head"><h3 className="kb-an-ct">Cihazlar</h3></div>
                <div className="kb-an-split">
                  <div style={{ flex: Math.max(cihazTop - mobil, 0.0001) }} className="d" />
                  <div style={{ flex: Math.max(mobil, cihazTop ? 0.0001 : 0) }} className="m" />
                </div>
                <p className="kb-an-legend"><i className="v" />Masaüstü {yuzde(cihazTop - mobil, cihazTop)} <i className="s" />Mobil {yuzde(mobil, cihazTop)}</p>
                <table className="kb-an-table kb-an-mt">
                  <thead><tr><th>Cihaz</th><th>Tekil</th><th>Kayıt</th><th>Kayıt oranı</th></tr></thead>
                  <tbody>{['desktop', 'mobile'].map((d) => <tr key={d}><td><span>{d === 'mobile' ? 'Mobil' : 'Masaüstü'}</span></td><td>{fmt(cs(d, 'visitor'))}</td><td><b>{fmt(cs(d, 'signup'))}</b></td><td>{yuzde(cs(d, 'signup_visitor'), cs(d, 'visitor'))}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. İlanlar */}
          <section id="ilanlar" className="kb-an-sec">
            <h2 className="kb-an-h">İlanlar</h2>
            <div className="kb-an-card">
              <div className="kb-an-card-head"><h3 className="kb-an-ct">En çok görüntülenen 10 ilan</h3><a href="/admin/ilanlar">Aktif ve Pasif İlanlar →</a></div>
              <table className="kb-an-table">
                <thead><tr><th>İlan</th><th>Görüntüleme</th><th>Tıklama</th><th>Kapatma</th><th>Tıklama oranı</th></tr></thead>
                <tbody>
                  {ilanTablo.slice(0, ILK).map((r) => (
                    <tr key={r.id}>
                      <td>{r.doc ? <a href={`/admin/collections/popups/${r.id}`} className="kb-an-link">{r.doc.name}</a> : <span>Silinmiş ilan #{r.id}</span>}<small>{r.doc ? `${TASARIM[r.doc.design] || r.doc.design} · ${r.doc.active ? 'Aktif' : 'Pasif'}` : ''}</small></td>
                      <td>{fmt(r.v)}</td><td>{fmt(r.c)}</td><td>{fmt(r.x)}</td><td><b>{yuzde(r.c, r.v)}</b></td>
                    </tr>
                  ))}
                  {!ilanTablo.length && <tr><td colSpan={5} className="kb-an-none">Bu dönemde gösterilen ilan yok</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
