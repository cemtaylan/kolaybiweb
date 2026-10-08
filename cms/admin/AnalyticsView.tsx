// /admin/analitik: çerezsiz site analitiği. Ziyaret, sayfa görüntüleme, kaynaklar, cihazlar ve ilan performansı.
// Veriler cms/analytics.ts'teki günlük toplamlardan okunur; dönem ?gun=7|30|90 ile seçilir.
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { sql } from '@payloadcms/db-postgres'
import { rows, daysAgo } from '../analytics'
import { SITE_PAGES } from '../pages'

const DONEM = [7, 30, 90]
const KAYNAK: Record<string, string> = { direct: 'Doğrudan', search: 'Arama motorları', social: 'Sosyal medya', ai: 'Yapay zekâ asistanları', other: 'Diğer siteler' }
const TASARIM: Record<string, string> = { klasik: 'Klasik', 'yan-gorsel': 'Yan görselli', kose: 'Köşe kartı', serit: 'Alt şerit', 'tam-ekran': 'Tam ekran', 'yan-panel': 'Yan panel' }
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const n = (v: unknown) => Number(v) || 0
const fmt = (v: number) => v.toLocaleString('tr-TR')
const yuzde = (a: number, b: number) => (b ? `%${((a / b) * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '–')
const gunAdi = (d: string) => { const [, m, g] = d.split('-'); return `${Number(g)} ${AY[Number(m) - 1]}` }
const SAYFA_ADI = new Map<string, string>(SITE_PAGES.map((p) => [p.value, p.label.replace(/\s*\([^)]*\)\s*$/, '')]))

function Degisim({ simdi, once }: { simdi: number; once: number }) {
  if (!once) return null
  const d = ((simdi - once) / once) * 100
  return <span className={`kb-an-delta ${d >= 0 ? 'is-up' : 'is-down'}`}>{d >= 0 ? '▲' : '▼'} %{Math.abs(d).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
}

export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/analitik')
  const payload = req.payload
  const gun = DONEM.includes(Number(searchParams?.gun)) ? Number(searchParams?.gun) : 30
  const bas = daysAgo(gun - 1)
  const onceBas = daysAgo(gun * 2 - 1)

  const [toplam, onceki, gunluk, sayfalar, kaynaklar, cihazlar, ilanlar, donSayfa, donButon, donKaynak, donCihaz] = await Promise.all([
    rows(payload, sql`SELECT kind, event, SUM(count) AS n FROM analytics WHERE day >= ${bas} GROUP BY kind, event`),
    rows(payload, sql`SELECT kind, event, SUM(count) AS n FROM analytics WHERE day >= ${onceBas} AND day < ${bas} GROUP BY kind, event`),
    rows(payload, sql`SELECT day, event, SUM(count) AS n FROM analytics WHERE kind = 'page' AND day >= ${bas} GROUP BY day, event`),
    rows(payload, sql`SELECT path,
        SUM(CASE WHEN event = 'view' THEN count ELSE 0 END) AS v,
        SUM(CASE WHEN event = 'session' THEN count ELSE 0 END) AS s,
        SUM(CASE WHEN event = 'view' AND device = 'mobile' THEN count ELSE 0 END) AS m
      FROM analytics WHERE kind = 'page' AND day >= ${bas} GROUP BY path ORDER BY v DESC LIMIT 25`),
    rows(payload, sql`SELECT source, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'session' AND day >= ${bas} GROUP BY source ORDER BY n DESC`),
    rows(payload, sql`SELECT device, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'view' AND day >= ${bas} GROUP BY device`),
    rows(payload, sql`SELECT popup, event, device, SUM(count) AS n FROM analytics WHERE kind = 'popup' AND day >= ${bas} GROUP BY popup, event, device`),
    // Dönüşümler: sayfa başına görüntüleme, tekil ziyaretçi ve kayıt/giriş/iletişim tıklamaları
    rows(payload, sql`SELECT path,
        SUM(CASE WHEN kind = 'page' AND event = 'view' THEN count ELSE 0 END) AS v,
        SUM(CASE WHEN kind = 'page' AND event = 'visitor' THEN count ELSE 0 END) AS u,
        SUM(CASE WHEN kind = 'cta' AND event = 'signup' THEN count ELSE 0 END) AS s,
        SUM(CASE WHEN kind = 'cta' AND event = 'signup_visitor' THEN count ELSE 0 END) AS sv,
        SUM(CASE WHEN kind = 'cta' AND event = 'login' THEN count ELSE 0 END) AS l,
        SUM(CASE WHEN kind = 'cta' AND event = 'contact' THEN count ELSE 0 END) AS c
      FROM analytics WHERE kind IN ('page', 'cta') AND day >= ${bas} GROUP BY path`),
    rows(payload, sql`SELECT label, event, SUM(count) AS n FROM analytics WHERE kind = 'cta' AND day >= ${bas} GROUP BY label, event`),
    rows(payload, sql`SELECT source, event, SUM(count) AS n FROM analytics
      WHERE day >= ${bas} AND ((kind = 'page' AND event = 'session') OR (kind = 'cta' AND event IN ('signup', 'signup_visitor'))) GROUP BY source, event`),
    rows(payload, sql`SELECT device, event, SUM(count) AS n FROM analytics
      WHERE day >= ${bas} AND ((kind = 'page' AND event = 'visitor') OR (kind = 'cta' AND event IN ('signup', 'signup_visitor'))) GROUP BY device, event`),
  ])

  const t = (r: Record<string, unknown>[], kind: string, event: string) => n(r.find((x) => x.kind === kind && x.event === event)?.n)
  const kpi = [
    { l: 'Tekil ziyaretçi', k: ['page', 'visitor'], ipucu: 'Her tarayıcı günde bir kez sayılır; dönem toplamı günlük tekillerin toplamıdır' },
    { l: 'Yeni ziyaretçi', k: ['page', 'new'], ipucu: 'Siteye ilk kez gelen tarayıcılar' },
    { l: 'Ziyaret', k: ['page', 'session'], ipucu: '30 dakika hareketsizlikten sonra yeni ziyaret başlar' },
    { l: 'Sayfa görüntüleme', k: ['page', 'view'] },
    { l: 'İlan görüntüleme', k: ['popup', 'view'] },
    { l: 'İlan tıklama', k: ['popup', 'click'] },
  ].map((x) => ({ ...x, v: t(toplam, x.k[0], x.k[1]), o: t(onceki, x.k[0], x.k[1]) }))
  const ilanGor = kpi[4].v, ilanTik = kpi[5].v

  // Günlük grafik: eksik günler 0
  const gunler = Array.from({ length: gun }, (_, i) => daysAgo(gun - 1 - i))
  const gv = new Map<string, { v: number; s: number }>(gunler.map((d) => [d, { v: 0, s: 0 }]))
  for (const r of gunluk) { const g = gv.get(String(r.day)); if (g && (r.event === 'view' || r.event === 'visitor')) g[r.event === 'visitor' ? 's' : 'v'] = n(r.n) }
  const max = Math.max(1, ...[...gv.values()].map((x) => x.v))
  const W = 1000, H = 220, bw = W / gun

  // Blog yazılarının başlıkları
  const blogSlugs = [...new Set([...sayfalar.map((p) => String(p.path)), ...donSayfa.map((p) => String(p.path))])].filter((p) => p.startsWith('/blog/')).map((p) => p.slice(6))
  const yazilar = blogSlugs.length ? (await payload.find({ collection: 'posts', where: { slug: { in: blogSlugs } }, limit: blogSlugs.length, depth: 0, select: { title: true, slug: true } })).docs : []
  const ad = (path: string) => SAYFA_ADI.get(path) || yazilar.find((y) => `/blog/${y.slug}` === path)?.title || path

  const kaynakTop = kaynaklar.reduce((a, r) => a + n(r.n), 0)
  const cihazTop = cihazlar.reduce((a, r) => a + n(r.n), 0)
  const mobil = n(cihazlar.find((c) => c.device === 'mobile')?.n)

  // İlanlar: görüntüleme/tıklama/kapatma, cihaz kırılımı
  const ids = [...new Set(ilanlar.map((r) => Number(r.popup)))]
  const ilanDocs = ids.length ? (await payload.find({ collection: 'popups', where: { id: { in: ids } }, limit: ids.length, depth: 0, select: { name: true, design: true, active: true } })).docs : []
  const ilanTablo = ids.map((id) => {
    const s = (e: string, d?: string) => ilanlar.filter((r) => Number(r.popup) === id && r.event === e && (!d || r.device === d)).reduce((a, r) => a + n(r.n), 0)
    const doc = ilanDocs.find((d) => d.id === id)
    return { id, doc, v: s('view'), c: s('click'), x: s('close'), vm: s('view', 'mobile'), cm: s('click', 'mobile'), vd: s('view', 'desktop'), cd: s('click', 'desktop') }
  }).sort((a, b) => b.v - a.v)

  const bos = !kpi[0].v && !kpi[3].v && !ilanGor

  // Dönüşümler
  const kayit = t(toplam, 'cta', 'signup'), kayitOnce = t(onceki, 'cta', 'signup')
  const tekil = kpi[0].v
  const donKpi = [
    { l: 'Kayıt tıklaması', v: fmt(kayit), d: <Degisim simdi={kayit} once={kayitOnce} />, ipucu: 'Kayıt formuna (app.kolaybi.com, ofis.kolaybi.com) giden buton ve bağlantı tıklamaları' },
    { l: 'Kayıt oranı', v: yuzde(t(toplam, 'cta', 'signup_visitor'), tekil), ipucu: 'Kayda tıklayan ziyaretçi ÷ tekil ziyaretçi (bir tarayıcı günde bir kez sayılır)' },
    { l: 'Giriş tıklaması', v: fmt(t(toplam, 'cta', 'login')), d: <Degisim simdi={t(toplam, 'cta', 'login')} once={t(onceki, 'cta', 'login')} />, ipucu: 'Mevcut müşterilerin "Giriş Yap" tıklamaları' },
    { l: 'İletişim tıklaması', v: fmt(t(toplam, 'cta', 'contact')), d: <Degisim simdi={t(toplam, 'cta', 'contact')} once={t(onceki, 'cta', 'contact')} />, ipucu: 'Telefon, e-posta ve WhatsApp bağlantıları' },
  ]
  const donSayfalar = donSayfa.map((r) => ({ path: String(r.path), v: n(r.v), u: n(r.u), s: n(r.s), sv: n(r.sv), l: n(r.l), c: n(r.c) }))
    .filter((r) => r.s || r.l || r.c).sort((a, b) => b.s - a.s || b.c - a.c).slice(0, 20)
  const butonMap = new Map<string, { s: number; l: number; c: number }>()
  for (const r of donButon) {
    const b = butonMap.get(String(r.label)) || { s: 0, l: 0, c: 0 }
    if (r.event === 'signup') b.s += n(r.n); if (r.event === 'login') b.l += n(r.n); if (r.event === 'contact') b.c += n(r.n)
    butonMap.set(String(r.label), b)
  }
  const butonlar = [...butonMap].map(([label, b]) => ({ label, ...b, top: b.s + b.l + b.c })).sort((a, b) => b.s - a.s || b.top - a.top).slice(0, 20)
  const ks = (k: string, e: string) => n(donKaynak.find((r) => r.source === k && r.event === e)?.n)
  const kaynakDon = Object.keys(KAYNAK).map((k) => ({ k, z: ks(k, 'session'), s: ks(k, 'signup'), sv: ks(k, 'signup_visitor') })).filter((r) => r.z || r.s)
  const cs = (d: string, e: string) => n(donCihaz.find((r) => r.device === d && r.event === e)?.n)
  const cihazDon = ['desktop', 'mobile'].map((d) => ({ d, u: cs(d, 'visitor'), s: cs(d, 'signup'), sv: cs(d, 'signup_visitor') }))

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={payload} permissions={permissions} searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="kb-an">
          <header className="kb-pb-head">
            <div>
              <h1>Analitik</h1>
              <p>Sitedeki ziyaretler, kayıt tıklamaları ve ilan performansı. Çerez ve kişisel veri kullanılmaz; yalnızca günlük toplamlar tutulur. Botlar sayılmaz. Tekil ziyaretçi: her tarayıcı günde bir kez sayılır. Ziyaret: 30 dakika hareketsizlikten sonra yeni ziyaret başlar.</p>
            </div>
            <nav className="kb-an-range" aria-label="Dönem">
              {DONEM.map((d) => <a key={d} href={`/admin/analitik?gun=${d}`} className={d === gun ? 'on' : ''} aria-current={d === gun ? 'page' : undefined}>Son {d} gün</a>)}
            </nav>
          </header>

          {bos && <p className="kb-pb-empty">Bu dönemde henüz veri yok. Siteye gelen ziyaretler ve ilan etkileşimleri birkaç saniye içinde burada görünmeye başlar.</p>}

          <section className="kb-an-kpis">
            {kpi.map((k) => (
              <div className="kb-stat" key={k.l} title={k.ipucu}>
                <b>{fmt(k.v)}</b>
                <span>{k.l} <Degisim simdi={k.v} once={k.o} /></span>
              </div>
            ))}
            <div className="kb-stat"><b>{yuzde(ilanTik, ilanGor)}</b><span>İlan tıklama oranı</span></div>
          </section>

          <section className="kb-an-card">
            <div className="kb-an-card-head"><h2>Günlük trafik</h2><span className="kb-an-legend"><i className="v" />Sayfa görüntüleme <i className="s" />Tekil ziyaretçi</span></div>
            <svg className="kb-an-chart" viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Son ${gun} günün günlük sayfa görüntüleme ve tekil ziyaretçi grafiği`}>
              {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} className="grid" />)}
              {gunler.map((d, i) => {
                const g = gv.get(d)!
                const h = (g.v / max) * H
                return (
                  <g key={d}>
                    <rect x={i * bw + bw * 0.15} width={bw * 0.7} y={H - h} height={h} rx={Math.min(4, bw * 0.2)} className="bar"><title>{`${gunAdi(d)}: ${fmt(g.v)} görüntüleme, ${fmt(g.s)} tekil ziyaretçi`}</title></rect>
                    {(gun <= 7 || i % Math.ceil(gun / 10) === 0) && <text x={i * bw + bw / 2} y={H + 18} className="lbl">{gunAdi(d)}</text>}
                  </g>
                )
              })}
              <polyline className="line" points={gunler.map((d, i) => `${i * bw + bw / 2},${H - (gv.get(d)!.s / max) * H}`).join(' ')} />
            </svg>
          </section>

          <section className="kb-an-card kb-an-conv">
            <div className="kb-an-card-head"><h2>Kayıt ve dönüşümler</h2><span>Sitenin asıl hedefi: ziyaretçiyi kayda yönlendirmek</span></div>
            <div className="kb-an-kpis kb-an-kpis-4">
              {donKpi.map((k) => (
                <div className="kb-stat" key={k.l} title={k.ipucu}><b>{k.v}</b><span>{k.l} {k.d}</span></div>
              ))}
            </div>
            <div className="kb-an-grid kb-an-grid-even">
              <div>
                <h3 className="kb-an-sub">Sayfaya göre</h3>
                <table className="kb-an-table">
                  <thead><tr><th>Sayfa</th><th>Görüntüleme</th><th>Kayıt</th><th title="Bu sayfada kayda tıklayan ziyaretçi ÷ sayfa görüntüleme">Kayıt oranı</th><th>Giriş</th><th>İletişim</th></tr></thead>
                  <tbody>
                    {donSayfalar.map((r) => (
                      <tr key={r.path}>
                        <td><a href={r.path} target="_blank" rel="noreferrer">{ad(r.path)}</a><small>{r.path}</small></td>
                        <td>{fmt(r.v)}</td><td><b>{fmt(r.s)}</b></td><td>{yuzde(r.sv, r.v)}</td><td>{fmt(r.l)}</td><td>{fmt(r.c)}</td>
                      </tr>
                    ))}
                    {!donSayfalar.length && <tr><td colSpan={6} className="kb-an-none">Bu dönemde kayıt, giriş ya da iletişim tıklaması yok</td></tr>}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="kb-an-sub">Butona göre</h3>
                <table className="kb-an-table">
                  <thead><tr><th>Buton (yeri · yazısı)</th><th>Kayıt</th><th>Giriş</th><th>İletişim</th></tr></thead>
                  <tbody>
                    {butonlar.map((b) => (
                      <tr key={b.label}><td><span>{b.label.split(' · ').slice(1).join(' · ') || b.label}</span><small>{b.label.split(' · ')[0]}</small></td><td><b>{fmt(b.s)}</b></td><td>{fmt(b.l)}</td><td>{fmt(b.c)}</td></tr>
                    ))}
                    {!butonlar.length && <tr><td colSpan={4} className="kb-an-none">Veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="kb-an-grid kb-an-grid-even">
              <div>
                <h3 className="kb-an-sub">Kaynağa göre</h3>
                <table className="kb-an-table">
                  <thead><tr><th>Kaynak</th><th>Ziyaret</th><th>Kayıt</th><th title="Kayda tıklayan ziyaretçi ÷ ziyaret">Kayıt oranı</th></tr></thead>
                  <tbody>
                    {kaynakDon.map((r) => <tr key={r.k}><td><span>{KAYNAK[r.k]}</span></td><td>{fmt(r.z)}</td><td><b>{fmt(r.s)}</b></td><td>{yuzde(r.sv, r.z)}</td></tr>)}
                    {!kaynakDon.length && <tr><td colSpan={4} className="kb-an-none">Veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="kb-an-sub">Cihaza göre</h3>
                <table className="kb-an-table">
                  <thead><tr><th>Cihaz</th><th>Tekil</th><th>Kayıt</th><th>Kayıt oranı</th></tr></thead>
                  <tbody>
                    {cihazDon.map((r) => <tr key={r.d}><td><span>{r.d === 'mobile' ? 'Mobil' : 'Masaüstü'}</span></td><td>{fmt(r.u)}</td><td><b>{fmt(r.s)}</b></td><td>{yuzde(r.sv, r.u)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="kb-an-grid">
            <section className="kb-an-card kb-an-wide">
              <div className="kb-an-card-head"><h2>Sayfalar</h2><span>En çok görüntülenen 25 sayfa</span></div>
              <table className="kb-an-table">
                <thead><tr><th>Sayfa</th><th>Görüntüleme</th><th title="Ziyaretin bu sayfada başladığı oturumlar">Giriş</th><th>Mobil</th></tr></thead>
                <tbody>
                  {sayfalar.map((p) => (
                    <tr key={String(p.path)}>
                      <td><a href={String(p.path)} target="_blank" rel="noreferrer">{ad(String(p.path))}</a><small>{String(p.path)}</small></td>
                      <td>{fmt(n(p.v))}</td><td>{fmt(n(p.s))}</td><td>{yuzde(n(p.m), n(p.v))}</td>
                    </tr>
                  ))}
                  {!sayfalar.length && <tr><td colSpan={4} className="kb-an-none">Veri yok</td></tr>}
                </tbody>
              </table>
            </section>
            <div className="kb-an-side">
              <section className="kb-an-card">
                <div className="kb-an-card-head"><h2>Kaynaklar</h2><span>Ziyaretler nereden geliyor</span></div>
                <ul className="kb-an-bars">
                  {kaynaklar.map((k) => (
                    <li key={String(k.source)}><span>{KAYNAK[String(k.source)] || String(k.source)}</span><b>{fmt(n(k.n))}</b><i style={{ width: `${kaynakTop ? (n(k.n) / kaynakTop) * 100 : 0}%` }} /></li>
                  ))}
                  {!kaynaklar.length && <li className="kb-an-none">Veri yok</li>}
                </ul>
              </section>
              <section className="kb-an-card">
                <div className="kb-an-card-head"><h2>Cihazlar</h2></div>
                <div className="kb-an-split">
                  <div style={{ flex: Math.max(cihazTop - mobil, 0.0001) }} className="d" />
                  <div style={{ flex: Math.max(mobil, cihazTop ? 0.0001 : 0) }} className="m" />
                </div>
                <p className="kb-an-legend"><i className="v" />Masaüstü {yuzde(cihazTop - mobil, cihazTop)} <i className="s" />Mobil {yuzde(mobil, cihazTop)}</p>
              </section>
            </div>
          </div>

          <section className="kb-an-card">
            <div className="kb-an-card-head"><h2>İlan performansı</h2><a href="/admin/ilanlar">Aktif ve Pasif İlanlar →</a></div>
            <table className="kb-an-table">
              <thead><tr><th>İlan</th><th>Görüntüleme</th><th>Tıklama</th><th>Kapatma</th><th>Tıklama oranı</th><th>Masaüstü / Mobil oran</th></tr></thead>
              <tbody>
                {ilanTablo.map((r) => (
                  <tr key={r.id}>
                    <td>{r.doc ? <a href={`/admin/collections/popups/${r.id}`}>{r.doc.name}</a> : <span>Silinmiş ilan #{r.id}</span>}<small>{r.doc ? `${TASARIM[r.doc.design] || r.doc.design} · ${r.doc.active ? 'Aktif' : 'Pasif'}` : ''}</small></td>
                    <td>{fmt(r.v)}</td><td>{fmt(r.c)}</td><td>{fmt(r.x)}</td><td><b>{yuzde(r.c, r.v)}</b></td><td>{yuzde(r.cd, r.vd)} / {yuzde(r.cm, r.vm)}</td>
                  </tr>
                ))}
                {!ilanTablo.length && <tr><td colSpan={6} className="kb-an-none">Bu dönemde gösterilen ilan yok</td></tr>}
              </tbody>
            </table>
          </section>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
