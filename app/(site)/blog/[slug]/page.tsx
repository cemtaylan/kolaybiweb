// Blog yazısı: içerik Payload CMS'ten; yapı ve sınıf adları eski sayfayla birebir (blog.css / post.css aynen çalışır)
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allPosts, author, blogCta, cat, isoDate, media, nowrap, postBySlug, REG, renderBody, SITE, trDate, withInlineCta } from '@/lib/blog'
import { yanHTML } from '@/cms/cta-html'
import { blogFooter, blogHeader } from '@/lib/partials'
import type { Post } from '@/cms/payload-types'

export const revalidate = false // CMS'te yayınlanınca afterChange kancası sayfayı yeniden üretir
export const dynamicParams = true // yeni yazılar ilk istekte üretilir

export async function generateStaticParams() {
  return (await allPosts()).map((p) => ({ slug: p.slug }))
}

const titleOf = (p: Post) => p.metaTitle || `${p.title} | KolayBi`

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await postBySlug((await params).slug)
  if (!p) return {}
  const url = `${SITE}/blog/${p.slug}`
  const cover = media(p.cover)
  const image = cover?.url ? (cover.url.startsWith('http') ? cover.url : SITE + cover.url) : undefined
  return {
    title: { absolute: titleOf(p) },
    description: p.description || undefined,
    alternates: { canonical: url },
    openGraph: { type: 'article', siteName: 'KolayBi', locale: 'tr_TR', url, title: titleOf(p), description: p.description || undefined, images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', site: '@kolaybicom', title: titleOf(p), description: p.description || undefined, images: image ? [image] : undefined },
  }
}

const Html = ({ html, className }: { html: string; className?: string }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
const I = ({ id }: { id: string }) => <svg><use href={`#${id}`} /></svg>
const Arrow = () => <span className="arr"><I id="i-arrow" /></span>
const Clock = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
)

function Card({ p }: { p: Post }) {
  const c = cat(p); const img = media(p.cover)
  const src = img?.sizes?.card?.url || img?.url
  return (
    <article className={`post ${c?.theme || 'theme-ofis'}`} data-cat={c?.slug}>
      <div className="post-img">{src && <img src={src} alt="" loading="lazy" width={img?.sizes?.card?.width ?? img?.width ?? undefined} height={img?.sizes?.card?.height ?? img?.height ?? undefined} />}</div>
      <div className="post-body">
        <div className="post-meta"><span className="post-tag" dangerouslySetInnerHTML={{ __html: nowrap(c?.title || '') }} />{p.publishedAt && <time dateTime={isoDate(p.publishedAt)}>{trDate(p.publishedAt)}</time>}</div>
        <h3><a href={`/blog/${p.slug}`} dangerouslySetInnerHTML={{ __html: nowrap(p.title) }} /></h3>
        {p.description && <p>{p.description}</p>}
        <span className="more">Devamını Okuyun<I id="i-right" /></span>
      </div>
    </article>
  )
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await postBySlug(slug)
  if (!p) notFound()
  const posts = await allPosts()
  const i = posts.findIndex((x) => x.slug === slug)
  const older = posts[i + 1], newer = posts[i - 1] // önceki = daha eski, sonraki = daha yeni
  const c = cat(p), a = author(p), cover = media(p.cover), photo = media(a?.photo)
  const related = posts.filter((x) => x.slug !== slug && cat(x)?.id === c?.id).slice(0, 3)
  const { html, toc } = renderBody(p.body as never)
  const ayar = await blogCta()
  const url = `${SITE}/blog/${p.slug}`
  const enc = encodeURIComponent
  const faq = p.faq || []
  const ld = faq.length
    ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }
    : null
  const Ava = () => (photo?.url ? <img src={photo.url} alt={a?.name} width={photo.width ?? undefined} height={photo.height ?? undefined} /> : <span className="ava"><I id="logo-k" /></span>)

  return (
    <>
      <link rel="stylesheet" href="/css/blog.css?v=4" precedence="default" />
      <link rel="stylesheet" href="/css/post.css?v=5" precedence="default" />
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <div className="read-progress" aria-hidden="true" />
        <article>
          <header className="ps-hero">
            <div className="container">
              <div className={`ps-head ${c?.theme || 'theme-ofis'}`}>
                <nav className="crumbs" aria-label="Sayfa yolu"><a href="/">KolayBi</a><I id="i-right" /><a href="/blog">Blog</a><I id="i-right" /><span dangerouslySetInnerHTML={{ __html: nowrap(c?.title || '') }} /></nav>
                <span className="post-tag" dangerouslySetInnerHTML={{ __html: nowrap(c?.title || '') }} />
                <h1 dangerouslySetInnerHTML={{ __html: nowrap(p.title) }} />
                {p.description && <p className="lead" dangerouslySetInnerHTML={{ __html: nowrap(p.description) }} />}
                <div className="ps-meta">
                  <div className="ps-author"><Ava /><div><b>{a?.name || 'KolayBi Editör'}</b><small>{a?.role}</small></div></div>
                  <div className="ps-facts">
                    {p.publishedAt && <span><I id="i-calendar" /><time dateTime={isoDate(p.publishedAt)}>{trDate(p.publishedAt)}</time></span>}
                    {p.contentUpdatedAt && <span><I id="i-flow" />Güncellendi: <time dateTime={isoDate(p.contentUpdatedAt)}>{trDate(p.contentUpdatedAt)}</time></span>}
                    {p.readingMinutes && <span><Clock />{p.readingMinutes} dk okuma</span>}
                  </div>
                </div>
              </div>
              {cover?.url && <div className="ps-cover"><img src={cover.sizes?.cover?.url || cover.url} alt={cover.alt || p.title} width={cover.sizes?.cover?.width ?? cover.width ?? undefined} height={cover.sizes?.cover?.height ?? cover.height ?? undefined} /></div>}
            </div>
          </header>

          <div className="container ps-body">
            <aside className="ps-side">
              {toc.length > 0 && (
                <nav className="toc" aria-label="İçindekiler"><b>Bu içerikte neler var?</b><ol>{toc.map((t) => <li key={t.id}><a className={t.tag} href={`#${t.id}`}>{t.text}</a></li>)}</ol></nav>
              )}
              {ayar.yan.aktif && <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: yanHTML(ayar.yan) }} />}
              <div className="share"><span>Paylaş</span>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener" aria-label="LinkedIn'de paylaş"><I id="s-linkedin" /></a>
                <a href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(p.title)}`} target="_blank" rel="noopener" aria-label="X'te paylaş"><I id="s-x" /></a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener" aria-label="Facebook'ta paylaş"><I id="s-facebook" /></a>
                <a href={`https://wa.me/?text=${enc(p.title + ' ' + url)}`} target="_blank" rel="noopener" aria-label="WhatsApp ile paylaş"><I id="s-whatsapp" /></a>
                <button type="button" data-copy aria-label="Bağlantıyı kopyala"><I id="i-check-solid" /></button>
              </div>
            </aside>
            <div>
              <Html className="prose" html={withInlineCta(html, ayar.orta, p.ortaCta)} />
              {faq.length > 0 && (
                <section className="ps-faq"><h2>Sıkça sorulan sorular</h2><div className="faq-list" id="faq-list-1">
                  {faq.map((f, k) => (
                    <details key={k} className={`faq-item${k === 0 ? ' is-open' : ''}`} data-cat="all" open={k === 0}>
                      <summary className="faq-q" id={`faq-q-${k + 1}`}><span className="no">{String(k + 1).padStart(2, '0')}</span>{f.question}<span className="pm"><I id="i-plus" /></span></summary>
                      <div className="faq-a" id={`faq-a-${k + 1}`} role="region" aria-labelledby={`faq-q-${k + 1}`}><div>{f.answer}</div></div>
                    </details>
                  ))}
                </div></section>
              )}
              <div className="ps-end">
                <p className="ps-ask">Yanıt almak istediğiniz diğer sorularınız için bizimle <a href="/iletisim">iletişime geçebilirsiniz</a>.</p>
                <div className="author-box"><Ava /><div><small>Yazar</small><b>{a?.name || 'KolayBi Editör'}</b>{a?.bio && <p dangerouslySetInnerHTML={{ __html: nowrap(a.bio) }} />}</div></div>
                {(older || newer) && (
                  <nav className="pn">
                    {older && <a className="prev" href={`/blog/${older.slug}`}><small><I id="i-right" />Önceki yazı</small><b>{older.title}</b></a>}
                    {newer && <a className="next" href={`/blog/${newer.slug}`}><small>Sonraki yazı<I id="i-right" /></small><b>{newer.title}</b></a>}
                  </nav>
                )}
              </div>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="section" style={{ paddingTop: 24 }}>
            <div className="container">
              <div className="blog-head"><div><h2>İlgili yazılar</h2><p dangerouslySetInnerHTML={{ __html: nowrap(`${c?.title} kategorisinden diğer rehberler.`) }} /></div><a href="/blog" className="btn btn-outline">Tüm Yazılar<Arrow /></a></div>
              <div className="posts">{related.map((r) => <Card key={r.id} p={r} />)}</div>
            </div>
          </section>
        )}

        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className="final-cta">
              <svg className="cta-ribbon" viewBox="0 0 1376 420" preserveAspectRatio="none" aria-hidden="true">
                <g className="k-ribbon">
                  <path className="k1" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" />
                  <path className="k2" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 25)" />
                  <path className="k3" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 50)" />
                </g>
              </svg>
              <h2>İşinizi <em>KolayBi’yle</em> kolaylaştırın</h2>
              <p>40.000&apos;den fazla KOBİ&apos;nin yaptığı gibi ön muhasebenizi ve <span className="nw">e-Faturanızı</span> tek ekrandan yönetin. 14 gün boyunca tüm özellikleri ücretsiz deneyin.</p>
              <a href={REG} className="btn btn-light">14 Gün Ücretsiz Deneyin<Arrow /></a>
              <div className="note"><I id="i-card" />Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.</div>
            </div>
          </div>
        </section>
      </main>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      <script src="/js/menu.js?v=3" />
      <script src="/js/faq.js?v=5" />
      <script src="/js/post.js?v=1" />
      <script type="module" src="/js/track.js?v=4" />
      <script type="module" src="/js/popups.js?v=5" />
    </>
  )
}
