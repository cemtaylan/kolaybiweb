// Analitik detay ekranları:
//   /admin/analitik/sayfalar  tüm sayfalar (sıralama: en çok / son / kayıt; arama)
//   /admin/analitik/sayfa     tek sayfanın ayrıntısı (?p=/fiyatlar)
//   /admin/analitik/butonlar  tüm kayıt/giriş/iletişim butonları
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { sql } from '@payloadcms/db-postgres'
import type React from 'react'
import { rows, daysAgo } from '../analytics'
import { yetkili } from '../access'
import { YetkiYok } from './YetkiYok'
import { DonemNav, GunlukGrafik, KAYNAK, TASARIM, detayHref, donem, fmt, n, once, q1, sayfaAdlari, sayfaIstatistik, yuzde, zaman } from './analytics-shared'

function Cerceve({ p, yol, children }: { p: AdminViewServerProps; yol: string; children: React.ReactNode }) {
  const { req, locale, permissions, visibleEntities } = p.initPageResult
  if (!req.user) redirect(`/admin/login?redirect=${encodeURIComponent(yol)}`)
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={p.params} payload={req.payload} permissions={permissions} searchParams={p.searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter><div className="kb-an">{children}</div></Gutter>
    </DefaultTemplate>
  )
}
const Geri = ({ gun }: { gun: number }) => <a href={`/admin/analitik?gun=${gun}`} className="kb-an-back">← Analitik</a>

const SIRA = [
  { k: 'cok', l: 'En çok görüntülenen' },
  { k: 'son', l: 'Son görüntülenen' },
  { k: 'kayit', l: 'En çok kayıt getiren' },
]

export async function AnalyticsPagesView(p: AdminViewServerProps) {
  if (p.initPageResult.req.user && !yetkili(p.initPageResult.req.user as never, 'analitik')) return <YetkiYok p={p} />
  const payload = p.initPageResult.req.payload
  const gun = donem(p.searchParams)
  const sira = SIRA.some((s) => s.k === q1(p.searchParams, 'sira')) ? q1(p.searchParams, 'sira')! : 'cok'
  const ara = (q1(p.searchParams, 'q') || '').trim().toLowerCase()
  const tum = await sayfaIstatistik(payload, daysAgo(gun - 1))
  const ad = await sayfaAdlari(payload, tum.map((x) => x.path))
  let list = tum.filter((x) => !ara || x.path.includes(ara) || ad(x.path).toLowerCase().includes(ara))
  list = list.sort(sira === 'son' ? (a, b) => zaman(b.son) - zaman(a.son) : sira === 'kayit' ? (a, b) => b.k - a.k || b.v - a.v : (a, b) => b.v - a.v)
  const qs = (o: Record<string, string>) => '?' + new URLSearchParams({ sira, gun: String(gun), ...(ara ? { q: ara } : {}), ...o }).toString()
  return (
    <Cerceve p={p} yol="/admin/analitik/sayfalar">
      <Geri gun={gun} />
      <header className="kb-pb-head">
        <div><h1>Tüm sayfalar</h1><p>Son {gun} günde görüntülenen {fmt(tum.length)} sayfa. Ayrıntı için sayfa adına tıklayın.</p></div>
        <DonemNav base="/admin/analitik/sayfalar" gun={gun} extra={{ sira, q: ara || undefined }} />
      </header>
      <div className="kb-an-tools">
        <nav className="kb-an-range" aria-label="Sıralama">
          {SIRA.map((s) => <a key={s.k} href={`/admin/analitik/sayfalar${qs({ sira: s.k })}`} className={s.k === sira ? 'on' : ''} aria-current={s.k === sira ? 'page' : undefined}>{s.l}</a>)}
        </nav>
        <form className="kb-an-search" action="/admin/analitik/sayfalar" method="get">
          <input type="hidden" name="sira" value={sira} /><input type="hidden" name="gun" value={gun} />
          <input type="search" name="q" defaultValue={ara} placeholder="Sayfa adı ya da adresi ara" aria-label="Sayfa ara" />
        </form>
      </div>
      <section className="kb-an-card">
        <table className="kb-an-table">
          <thead><tr><th>Sayfa</th><th>Görüntüleme</th><th>Tekil</th><th title="Ziyaretin bu sayfada başladığı oturumlar">Giriş sayfası</th><th>Mobil</th><th>Kayıt</th><th>Kayıt oranı</th><th>Son görüntüleme</th></tr></thead>
          <tbody>
            {list.map((x) => (
              <tr key={x.path}>
                <td><a href={detayHref(x.path, gun)} className="kb-an-link">{ad(x.path)}</a><small>{x.path}</small></td>
                <td><b>{fmt(x.v)}</b></td><td>{fmt(x.u)}</td><td>{fmt(x.s)}</td><td>{yuzde(x.m, x.v)}</td><td>{fmt(x.k)}</td><td>{yuzde(x.kv, x.v)}</td><td>{once(x.son)}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="kb-an-none">{ara ? 'Aramanızla eşleşen sayfa yok' : 'Veri yok'}</td></tr>}
          </tbody>
        </table>
      </section>
    </Cerceve>
  )
}

export async function AnalyticsPageView(p: AdminViewServerProps) {
  if (p.initPageResult.req.user && !yetkili(p.initPageResult.req.user as never, 'analitik')) return <YetkiYok p={p} />
  const payload = p.initPageResult.req.payload
  const gun = donem(p.searchParams)
  const bas = daysAgo(gun - 1)
  const path = q1(p.searchParams, 'p') || '/'
  const [ist, gunluk, kaynak, cihaz, butonlar, ilanlar] = await Promise.all([
    sayfaIstatistik(payload, bas, path),
    rows(payload, sql`SELECT day, event, SUM(count) AS n FROM analytics WHERE kind = 'page' AND path = ${path} AND event IN ('view', 'visitor') AND day >= ${bas} GROUP BY day, event`),
    rows(payload, sql`SELECT source, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'session' AND path = ${path} AND day >= ${bas} GROUP BY source ORDER BY n DESC`),
    rows(payload, sql`SELECT device, SUM(count) AS n FROM analytics WHERE kind = 'page' AND event = 'view' AND path = ${path} AND day >= ${bas} GROUP BY device`),
    rows(payload, sql`SELECT label, event, SUM(count) AS n FROM analytics WHERE kind = 'cta' AND event IN ('signup', 'login', 'contact') AND path = ${path} AND day >= ${bas} GROUP BY label, event`),
    rows(payload, sql`SELECT popup, event, SUM(count) AS n FROM analytics WHERE kind = 'popup' AND path = ${path} AND day >= ${bas} GROUP BY popup, event`),
  ])
  const x = ist[0] || { path, v: 0, u: 0, s: 0, m: 0, k: 0, kv: 0, son: null }
  const ad = await sayfaAdlari(payload, [path])
  const gv = new Map<string, { v: number; s: number }>()
  for (const r of gunluk) { const g = gv.get(String(r.day)) || { v: 0, s: 0 }; g[r.event === 'visitor' ? 's' : 'v'] = n(r.n); gv.set(String(r.day), g) }
  const kTop = kaynak.reduce((a, r) => a + n(r.n), 0)
  const mob = n(cihaz.find((c) => c.device === 'mobile')?.n), cTop = cihaz.reduce((a, r) => a + n(r.n), 0)
  const bm = new Map<string, { s: number; l: number; c: number }>()
  for (const r of butonlar) { const b = bm.get(String(r.label)) || { s: 0, l: 0, c: 0 }; if (r.event === 'signup') b.s += n(r.n); if (r.event === 'login') b.l += n(r.n); if (r.event === 'contact') b.c += n(r.n); bm.set(String(r.label), b) }
  const bl = [...bm].map(([label, b]) => ({ label, ...b })).sort((a, b) => b.s - a.s || b.c - a.c)
  const ids = [...new Set(ilanlar.map((r) => Number(r.popup)))]
  const docs = ids.length ? (await payload.find({ collection: 'popups', where: { id: { in: ids } }, limit: ids.length, depth: 0, select: { name: true, design: true } })).docs : []
  const il = ids.map((id) => ({ id, doc: docs.find((d) => d.id === id), v: n(ilanlar.find((r) => Number(r.popup) === id && r.event === 'view')?.n), c: n(ilanlar.find((r) => Number(r.popup) === id && r.event === 'click')?.n) })).sort((a, b) => b.v - a.v)
  const kartlar = [
    { l: 'Görüntüleme', v: fmt(x.v) }, { l: 'Tekil ziyaretçi', v: fmt(x.u) }, { l: 'Giriş sayfası olduğu ziyaret', v: fmt(x.s) }, { l: 'Son görüntüleme', v: once(x.son) },
    { l: 'Kayıt tıklaması', v: fmt(x.k) }, { l: 'Kayıt oranı', v: yuzde(x.kv, x.v) }, { l: 'Mobil oranı', v: yuzde(x.m, x.v) },
  ]
  return (
    <Cerceve p={p} yol={`/admin/analitik/sayfa?p=${encodeURIComponent(path)}`}>
      <a href={`/admin/analitik/sayfalar?gun=${gun}`} className="kb-an-back">← Tüm sayfalar</a>
      <header className="kb-pb-head">
        <div><h1>{ad(path)}</h1><p><a href={path} target="_blank" rel="noreferrer" className="kb-an-link">{path} ↗</a></p></div>
        <DonemNav base="/admin/analitik/sayfa" gun={gun} extra={{ p: path }} />
      </header>
      <section className="kb-an-kpis kb-an-kpis-4">
        {kartlar.map((k) => <div className="kb-stat" key={k.l}><b>{k.v}</b><span>{k.l}</span></div>)}
      </section>
      <section className="kb-an-card">
        <div className="kb-an-card-head"><h3 className="kb-an-ct">Günlük trafik</h3><span className="kb-an-legend"><i className="v" />Görüntüleme <i className="s" />Tekil ziyaretçi</span></div>
        <GunlukGrafik gun={gun} veri={gv} etiket={`${path} için son ${gun} günün grafiği`} />
      </section>
      <div className="kb-an-grid kb-an-grid-even">
        <section className="kb-an-card">
          <div className="kb-an-card-head"><h3 className="kb-an-ct">Bu sayfaya nereden geliniyor</h3><span>Ziyaretin bu sayfada başladığı oturumlar</span></div>
          <ul className="kb-an-bars">
            {kaynak.map((k) => <li key={String(k.source)}><span>{KAYNAK[String(k.source)] || String(k.source)}</span><b>{fmt(n(k.n))}</b><i style={{ width: `${kTop ? (n(k.n) / kTop) * 100 : 0}%` }} /></li>)}
            {!kaynak.length && <li className="kb-an-none">Veri yok</li>}
          </ul>
        </section>
        <section className="kb-an-card">
          <div className="kb-an-card-head"><h3 className="kb-an-ct">Cihazlar</h3></div>
          <div className="kb-an-split"><div style={{ flex: Math.max(cTop - mob, 0.0001) }} className="d" /><div style={{ flex: Math.max(mob, cTop ? 0.0001 : 0) }} className="m" /></div>
          <p className="kb-an-legend"><i className="v" />Masaüstü {yuzde(cTop - mob, cTop)} <i className="s" />Mobil {yuzde(mob, cTop)}</p>
        </section>
      </div>
      <div className="kb-an-grid kb-an-grid-even">
        <section className="kb-an-card">
          <div className="kb-an-card-head"><h3 className="kb-an-ct">Bu sayfadaki butonlar</h3></div>
          <table className="kb-an-table">
            <thead><tr><th>Buton (yazısı · yeri)</th><th>Kayıt</th><th>Giriş</th><th>İletişim</th></tr></thead>
            <tbody>
              {bl.map((b) => <tr key={b.label}><td><span>{b.label.split(' · ').slice(1).join(' · ') || b.label}</span><small>{b.label.split(' · ')[0]}</small></td><td><b>{fmt(b.s)}</b></td><td>{fmt(b.l)}</td><td>{fmt(b.c)}</td></tr>)}
              {!bl.length && <tr><td colSpan={4} className="kb-an-none">Bu dönemde tıklama yok</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="kb-an-card">
          <div className="kb-an-card-head"><h3 className="kb-an-ct">Bu sayfada gösterilen ilanlar</h3></div>
          <table className="kb-an-table">
            <thead><tr><th>İlan</th><th>Görüntüleme</th><th>Tıklama</th><th>Oran</th></tr></thead>
            <tbody>
              {il.map((r) => <tr key={r.id}><td>{r.doc ? <a href={`/admin/collections/popups/${r.id}`} className="kb-an-link">{r.doc.name}</a> : <span>Silinmiş ilan #{r.id}</span>}<small>{r.doc ? TASARIM[r.doc.design] || r.doc.design : ''}</small></td><td>{fmt(r.v)}</td><td>{fmt(r.c)}</td><td><b>{yuzde(r.c, r.v)}</b></td></tr>)}
              {!il.length && <tr><td colSpan={4} className="kb-an-none">Bu sayfada ilan gösterilmedi</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </Cerceve>
  )
}

export async function AnalyticsButtonsView(p: AdminViewServerProps) {
  if (p.initPageResult.req.user && !yetkili(p.initPageResult.req.user as never, 'analitik')) return <YetkiYok p={p} />
  const payload = p.initPageResult.req.payload
  const gun = donem(p.searchParams)
  const r = await rows(payload, sql`SELECT label, path, event, SUM(count) AS n FROM analytics WHERE kind = 'cta' AND event IN ('signup', 'login', 'contact') AND day >= ${daysAgo(gun - 1)} GROUP BY label, path, event`)
  const m = new Map<string, { s: number; l: number; c: number; paths: Map<string, number> }>()
  for (const x of r) {
    const b = m.get(String(x.label)) || { s: 0, l: 0, c: 0, paths: new Map() }
    const v = n(x.n)
    if (x.event === 'signup') b.s += v; if (x.event === 'login') b.l += v; if (x.event === 'contact') b.c += v
    b.paths.set(String(x.path), (b.paths.get(String(x.path)) || 0) + v)
    m.set(String(x.label), b)
  }
  const list = [...m].map(([label, b]) => ({ label, ...b, top: [...b.paths].sort((a, c) => c[1] - a[1]) })).sort((a, b) => b.s - a.s || (b.l + b.c) - (a.l + a.c))
  const ad = await sayfaAdlari(payload, list.flatMap((b) => b.top.slice(0, 3).map(([pth]) => pth)))
  return (
    <Cerceve p={p} yol="/admin/analitik/butonlar">
      <Geri gun={gun} />
      <header className="kb-pb-head">
        <div><h1>Tüm butonlar</h1><p>Kayıt, giriş ve iletişim bağlantılarına yapılan tıklamalar; butonun yazısı, yeri ve en çok tıklandığı sayfalar.</p></div>
        <DonemNav base="/admin/analitik/butonlar" gun={gun} />
      </header>
      <section className="kb-an-card">
        <table className="kb-an-table">
          <thead><tr><th>Buton (yazısı · yeri)</th><th>En çok tıklandığı sayfalar</th><th>Kayıt</th><th>Giriş</th><th>İletişim</th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.label}>
                <td><span>{b.label.split(' · ').slice(1).join(' · ') || b.label}</span><small>{b.label.split(' · ')[0]}</small></td>
                <td className="kb-an-left">{b.top.slice(0, 3).map(([pth, v]) => <a key={pth} href={detayHref(pth, gun)} className="kb-an-chip">{ad(pth)} <em>{fmt(v)}</em></a>)}</td>
                <td><b>{fmt(b.s)}</b></td><td>{fmt(b.l)}</td><td>{fmt(b.c)}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="kb-an-none">Veri yok</td></tr>}
          </tbody>
        </table>
      </section>
    </Cerceve>
  )
}
