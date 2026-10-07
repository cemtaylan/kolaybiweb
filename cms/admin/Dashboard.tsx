// Panel ana sayfası: karşılama, hızlı işlemler, sayılar ve son düzenlenen yazılar
import type { ServerProps } from 'payload'
import type { Category, Media, Post } from '@/cms/payload-types'

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

export async function Dashboard({ payload, user }: ServerProps) {
  const [yayinda, taslak, kategori, gorsel, son] = await Promise.all([
    payload.count({ collection: 'posts', where: { _status: { equals: 'published' } } }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'draft' } } }),
    payload.count({ collection: 'categories' }),
    payload.count({ collection: 'media' }),
    payload.find({ collection: 'posts', sort: '-updatedAt', limit: 6, depth: 1, draft: true, select: { title: true, slug: true, _status: true, updatedAt: true, category: true, cover: true } }),
  ])
  const ad = (user as { name?: string } | undefined)?.name?.split(' ')[0] || ''
  const stats = [
    { n: yayinda.totalDocs, l: 'Yayındaki yazı', href: '/admin/collections/posts?where[_status][equals]=published' },
    { n: taslak.totalDocs, l: 'Taslak', href: '/admin/collections/posts?where[_status][equals]=draft' },
    { n: kategori.totalDocs, l: 'Kategori', href: '/admin/collections/categories' },
    { n: gorsel.totalDocs, l: 'Görsel', href: '/admin/collections/media' },
  ]
  return (
    <div className="kb-dash">
      <section className="kb-hero">
        <div>
          <span className="kb-eyebrow">KolayBi Blog</span>
          <h1>{saat()}{ad ? `, ${ad}` : ''} 👋</h1>
          <p>Yazılarınızı buradan yazın, düzenleyin ve yayınlayın. Yayınladığınız yazı birkaç saniye içinde sitede görünür.</p>
        </div>
        <div className="kb-actions">
          <a className="kb-btn kb-btn-light" href="/admin/collections/posts/create">+ Yeni yazı</a>
          <a className="kb-btn kb-btn-ghost" href="/blog" target="_blank" rel="noopener">Blogu görüntüle ↗</a>
        </div>
      </section>

      <section className="kb-stats">
        {stats.map((s) => (
          <a key={s.l} className="kb-stat" href={s.href}>
            <b>{s.n.toLocaleString('tr-TR')}</b>
            <span>{s.l}</span>
          </a>
        ))}
      </section>

      <section className="kb-recent">
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
      </section>
    </div>
  )
}
