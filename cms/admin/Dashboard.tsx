// Panel ana sayfası: karşılama, hızlı işlemler, sayılar, son düzenlenen yazılar ve hızlı erişim kartları.
// Payload'ın varsayılan koleksiyon kartları CSS ile gizlenir (custom.css), yerine aşağıdaki hızlı erişim gelir.
import type React from 'react'
import type { ServerProps } from 'payload'
import type { Category, Media, Post } from '@/cms/payload-types'
import { sql } from '@payloadcms/db-postgres'
import { rows, daysAgo } from '../analytics'
import { type Alan, tamYetkili, yetkili } from '../access'

const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const kisa = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(d)
  return `${t.getDate()} ${AY[t.getMonth()]} ${t.getFullYear()}`
}
const saat = () => {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Europe/Istanbul' }))
  return h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
}

// Hızlı erişim kartlarının simgeleri (24×24, çizgi)
const ICO: Record<string, React.ReactNode> = {
  yazi: <><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v4h4M8 12h8M8 16h6" /></>,
  kategori: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  yazar: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  ilan: <><rect x="3" y="4" width="18" height="16" rx="3" /><rect x="7" y="8" width="10" height="8" rx="1.5" /></>,
  analitik: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  gorsel: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  kullanici: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.5 5" /></>,
}

export async function Dashboard({ payload, user }: ServerProps) {
  const [yayinda, taslak, kategori, gorsel, son, ilanAktif, ilanTum, yazar, kullanici, trafik] = await Promise.all([
    payload.count({ collection: 'posts', where: { _status: { equals: 'published' } } }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'categories' }),
    payload.count({ collection: 'media' }),
    payload.find({ collection: 'posts', sort: '-updatedAt', limit: 6, depth: 1, draft: true, select: { title: true, slug: true, _status: true, updatedAt: true, category: true, cover: true } }),
    payload.count({ collection: 'popups', where: { active: { equals: true } } }),
    payload.count({ collection: 'popups' }),
    payload.count({ collection: 'authors' }),
    payload.count({ collection: 'users' }),
    rows(payload, sql`SELECT kind, event, SUM(count) AS n FROM analytics WHERE kind IN ('page', 'cta') AND day >= ${daysAgo(6)} GROUP BY kind, event`).catch(() => []),
  ])
  const tr = (e: string, k = 'page') => Number(trafik.find((r) => r.kind === k && r.event === e)?.n) || 0
  const ad = (user as { name?: string } | undefined)?.name?.split(' ')[0] || ''
  // Kişinin yetkisi olmayan bölümler pano üzerinde de gösterilmez
  const y = (a: Alan) => yetkili(user as never, a)
  const stats = [
    { n: yayinda.totalDocs, l: 'Yayındaki yazı', href: '/admin/collections/posts?where[_status][equals]=published', a: 'yazilar' as Alan },
    { n: ilanAktif.totalDocs, l: 'Aktif ilan', href: '/admin/ilanlar', a: 'ilanlar' as Alan },
    { n: tr('visitor'), l: 'Tekil ziyaretçi · son 7 gün', href: '/admin/analitik?gun=7', a: 'analitik' as Alan },
    { n: tr('signup', 'cta'), l: 'Kayıt tıklaması · son 7 gün', href: '/admin/analitik?gun=7', a: 'analitik' as Alan },
  ]
  const fmt = (v: number) => v.toLocaleString('tr-TR')
  const ERISIM_TUM = [
    { grup: 'Blog', kartlar: [
      { t: 'Yazılar', d: `${fmt(yayinda.totalDocs)} yayında, ${fmt(taslak.totalDocs)} taslak`, href: '/admin/collections/posts', yeni: '/admin/collections/posts/create', i: 'yazi', a: 'yazilar' },
      { t: 'Kategoriler', d: `${fmt(kategori.totalDocs)} kategori`, href: '/admin/collections/categories', yeni: '/admin/collections/categories/create', i: 'kategori', a: 'kategoriler' },
      { t: 'Yazarlar', d: `${fmt(yazar.totalDocs)} yazar`, href: '/admin/collections/authors', yeni: '/admin/collections/authors/create', i: 'yazar', a: 'yazarlar' },
    ] },
    { grup: 'Pazarlama', kartlar: [
      { t: 'Aktif ve Pasif İlanlar', d: `${fmt(ilanAktif.totalDocs)} aktif, ${fmt(ilanTum.totalDocs - ilanAktif.totalDocs)} pasif`, href: '/admin/ilanlar', yeni: '/admin/collections/popups/create', i: 'ilan', a: 'ilanlar' },
      { t: 'Analitik', d: `${fmt(tr('visitor'))} tekil ziyaretçi · son 7 gün`, href: '/admin/analitik', i: 'analitik', a: 'analitik' },
    ] },
    { grup: 'İçerik ve ayarlar', kartlar: [
      { t: 'Görseller', d: `${fmt(gorsel.totalDocs)} görsel`, href: '/admin/collections/media', yeni: '/admin/collections/media/create', i: 'gorsel', a: 'gorseller' },
      { t: 'Kullanıcılar', d: `${fmt(kullanici.totalDocs)} kullanıcı`, href: '/admin/collections/users', yeni: '/admin/collections/users/create', i: 'kullanici', a: 'yonetici' },
    ] },
  ]
  const erisim = ERISIM_TUM.map((g) => ({ ...g, kartlar: g.kartlar.filter((k) => (k.a === 'yonetici' ? tamYetkili(user as never) : y(k.a as Alan))) })).filter((g) => g.kartlar.length)
  return (
    <div className="kb-dash">
      <section className="kb-hero">
        <div>
          <span className="kb-eyebrow">KolayBi CMS</span>
          <h1>{saat()}{ad ? `, ${ad}` : ''} 👋</h1>
          <p>Blog yazılarını, sitedeki ilanları ve ziyaret analitiğini buradan yönetin. Yayınladığınız yazı birkaç saniye içinde sitede görünür.</p>
        </div>
        <div className="kb-actions">
          {y('yazilar') && <a className="kb-btn kb-btn-light" href="/admin/collections/posts/create">+ Yeni yazı</a>}
          {y('ilanlar') && <a className="kb-btn kb-btn-ghost" href="/admin/collections/popups/create">+ İlan oluştur</a>}
          <a className="kb-btn kb-btn-ghost" href="/" target="_blank" rel="noopener">Siteyi görüntüle ↗</a>
        </div>
      </section>

      <section className="kb-stats">
        {stats.filter((s) => y(s.a)).map((s) => (
          <a key={s.l} className="kb-stat" href={s.href}>
            <b>{s.n.toLocaleString('tr-TR')}</b>
            <span>{s.l}</span>
          </a>
        ))}
      </section>

      {y('yazilar') && <section className="kb-recent">
        <div className="kb-recent-head">
          <h2>Son düzenlenen yazılar</h2>
          <a href="/admin/collections/posts">Tümünü gör →</a>
        </div>
        <div className="kb-recent-list">
          {(son.docs as Post[]).map((p) => {
            const c = p.category as Category | null
            const m = p.cover as Media | null
            const img = m?.sizes?.card?.url || m?.url
            return (
              <a key={p.id} className="kb-post" href={`/admin/collections/posts/${p.id}`}>
                <span className="kb-post-img">{img ? <img src={img} alt="" /> : null}</span>
                <span className="kb-post-body">
                  <b>{p.title}</b>
                  <span className="kb-post-meta">
                    {c?.title && <span className="kb-chip">{c.title}</span>}
                    <span className={`kb-status ${p._status === 'published' ? 'is-live' : 'is-draft'}`}>{p._status === 'published' ? 'Yayında' : 'Taslak'}</span>
                    <span className="kb-date">{kisa(p.updatedAt)}</span>
                  </span>
                </span>
              </a>
            )
          })}
        </div>
      </section>}

      <section className="kb-quick" aria-label="Hızlı erişim">
        {erisim.map((g) => (
          <div key={g.grup} className="kb-quick-group">
            <h2>{g.grup}</h2>
            <div className="kb-quick-list">
              {g.kartlar.map((k) => (
                <div key={k.t} className="kb-quick-card">
                  <a href={k.href} className="kb-quick-main">
                    <span className="kb-quick-ico" aria-hidden="true"><svg viewBox="0 0 24 24">{ICO[k.i]}</svg></span>
                    <span><b>{k.t}</b><small>{k.d}</small></span>
                  </a>
                  {k.yeni && <a href={k.yeni} className="kb-quick-add" aria-label={`${k.t}: yeni ekle`} title="Yeni ekle">+</a>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
