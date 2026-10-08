// /admin/404: ziyaretçilerin düştüğü bulunamayan adresler (son N gün), gelinen siteler ve tek tıkla yönlendirme.
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { sql } from '@payloadcms/db-postgres'
import { rows, daysAgo } from '../analytics'
import { yetkili } from '../access'
import { YetkiYok } from './YetkiYok'
import { NotFoundList, type NotFoundRow } from './NotFoundList'

const DONEM = [7, 30, 90]

export async function NotFoundView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/404')
  if (!yetkili(req.user as never, 'bulunamayan')) return <YetkiYok p={props} />
  const payload = req.payload
  const gun = DONEM.includes(Number(searchParams?.gun)) ? Number(searchParams?.gun) : 30
  const r = await rows<{ path: string; label: string; n: number | string; last: string }>(payload, sql`
    SELECT path, label, SUM(count) AS n, MAX(day) AS last FROM analytics
    WHERE kind = 'notfound' AND day >= ${daysAgo(gun - 1)} GROUP BY path, label`)
  const map = new Map<string, NotFoundRow>()
  for (const x of r) {
    const row = map.get(x.path) || { path: x.path, n: 0, last: '', refs: [] }
    row.n += Number(x.n) || 0
    if (x.last > row.last) row.last = x.last
    row.refs.push({ host: x.label || 'direct', n: Number(x.n) || 0 })
    map.set(x.path, row)
  }
  const list = [...map.values()].sort((a, b) => b.n - a.n).slice(0, 200)
  for (const x of list) x.refs.sort((a, b) => b.n - a.n)
  const yon = list.length
    ? (await payload.find({ collection: 'redirects', where: { from: { in: list.map((x) => x.path) } }, limit: list.length, depth: 0, select: { from: true, to: true } })).docs
    : []
  const redirects = Object.fromEntries((yon as { from: string; to: string }[]).map((d) => [d.from, d.to]))
  const toplam = list.reduce((a, x) => a + x.n, 0)

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={payload} permissions={permissions} searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="kb-an">
          <header className="kb-pb-head">
            <div>
              <h1>Bulunamayan sayfalar (404)</h1>
              <p>Ziyaretçilerin açmaya çalışıp bulamadığı adresler. Sık görülenleri yeni adrese yönlendirin; yönlendirme en geç 1 dakika içinde geçerli olur. Botlar ve arama motorları sayılmaz.</p>
            </div>
            <nav className="kb-an-range" aria-label="Dönem">
              {DONEM.map((d) => <a key={d} href={`/admin/404?gun=${d}`} className={d === gun ? 'on' : ''} aria-current={d === gun ? 'page' : undefined}>Son {d} gün</a>)}
            </nav>
          </header>
          <section className="kb-an-kpis kb-an-kpis-4">
            <div className="kb-stat"><b>{toplam.toLocaleString('tr-TR')}</b><span>404 görüntüleme</span></div>
            <div className="kb-stat"><b>{list.length.toLocaleString('tr-TR')}</b><span>Farklı adres</span></div>
            <div className="kb-stat"><b>{list.filter((x) => !redirects[x.path]).length.toLocaleString('tr-TR')}</b><span>Yönlendirilmemiş</span></div>
            <a className="kb-stat" href="/admin/collections/redirects"><b>→</b><span>Tüm yönlendirmeler</span></a>
          </section>
          <NotFoundList rows={list} redirects={redirects} />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
