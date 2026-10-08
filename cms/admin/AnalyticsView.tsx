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

  const [toplam, onceki, gunluk, sayfalar, kaynaklar, cihazlar, ilanlar] = await Promise.all([
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
  const blogSlugs = sayfalar.map((p) => String(p.path)).filter((p) => p.startsWith('/blog/')).map((p) => p.slice(6))
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

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={payload} permissions={permissions} searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="kb-an">
          <header className="kb-pb-head">
            <div>
              <h1>Analitik</h1>
              <p>Sitedeki ziyaretler ve ilan performansı. Çerez ve kişisel veri kullanılmaz; yalnızca günlük toplamlar tutulur. Botlar sayılmaz. Tekil ziyaretçi: her tarayıcı günde bir kez sayılır. Ziyaret: 30 dakika hareketsizlikten sonra yeni ziyaret başlar.</p>
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
