// /blog: yazı listesi CMS'ten, sunucuda üretilir. Sayfalama (?29587b79_page=2, canlı siteyle aynı), kategori (?kategori=…)
// ve arama (?q=…) gerçek bağlantılardır; her sayfa kendi canonical adresini gösterir. Tasarım eski statik sayfayla aynıdır.
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { unstable_cache } from 'next/cache'
import { allPosts, author, cat, cms, isoDate, media, nowrap, REG, SITE, trDate } from '@/lib/blog'
import { blogFooter, blogHeader, blogIndexBottom } from '@/lib/partials'
import type { Category, Post } from '@/cms/payload-types'

export const dynamic = 'force-dynamic'

const KEY = '29587b79_page', PER = 24
// Elle seçilen en çok okunanlar (eski sayfadaki sıra)
const EN_COK = ['pos-cihazi-nasil-alinir-nasil-kullanilir', 'okc-odeme-kaydedici-cihaz-nedir', 'enflasyon-muhasebesi-nedir-nasil-yapilir-ve-amaclari-nelerdir', 'asgari-ucret-nedir', 'dijital-vergi-dairesi-nedir']
// Kitleye göre başlangıç noktaları → ilgili kategori
const BASLANGIC = [
  { l: 'e-Faturaya geçiyorum', kat: 'e-fatura' },
  { l: 'Yeni şirket kuruyorum', kat: 'girisimcilik' },
  { l: 'e-Ticaret yapıyorum', kat: 'e-ticaret' },
]
const TITLE = 'Muhasebe ve Finans Blogu | Güncel Rehberler | KolayBi'
const DESC = "Ön muhasebe, vergi, e-Dönüşüm ve girişimcilik konularında güncel rehberleri KolayBi Blog'da keşfedin. İşletmeniz için pratik bilgilere hemen ulaşın."
const HERO_SVG = `<svg viewBox="0 0 1440 520" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><g style="opacity:.1"><path d="M-80 420 C 180 320, 360 520, 640 420 S 1060 160, 1300 230 S 1520 130, 1580 60" fill="none" stroke="var(--logo-blue)" stroke-width="30"/><path d="M-80 420 C 180 320, 360 520, 640 420 S 1060 160, 1300 230 S 1520 130, 1580 60" fill="none" stroke="var(--logo-mid)" stroke-width="30" transform="translate(0 30)"/><path d="M-80 420 C 180 320, 360 520, 640 420 S 1060 160, 1300 230 S 1520 130, 1580 60" fill="none" stroke="var(--logo-cyan)" stroke-width="30" transform="translate(0 60)"/></g></svg>`

type SP = Promise<{ [k: string]: string | string[] | undefined }>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || ''
const kategoriler = unstable_cache(async () => (await (await cms()).find({ collection: 'categories', limit: 100, depth: 0, sort: 'order', pagination: false })).docs as Category[], ['blog-categories'], { tags: ['posts'], revalidate: 600 })
const adres = (o: { kat?: string; q?: string; page?: number }) => {
  const u = new URLSearchParams()
  if (o.kat) u.set('kategori', o.kat)
  if (o.q) u.set('q', o.q)
  if (o.page && o.page > 1) u.set(KEY, String(o.page))
  const s = u.toString()
  return '/blog' + (s ? '?' + s : '')
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams
  const kat = one(sp.kategori), q = one(sp.q), page = Math.max(1, parseInt(one(sp[KEY]), 10) || 1)
  const c = kat ? (await kategoriler()).find((x) => x.slug === kat) : null
  const title = c ? `${c.title} Rehberleri | KolayBi Blog` : page > 1 ? `${TITLE.replace(' | KolayBi', '')} – Sayfa ${page} | KolayBi` : TITLE
  const canonical = SITE + adres({ kat: c ? kat : undefined, page })
  return {
    title: { absolute: title }, description: DESC, alternates: { canonical },
    robots: q ? { index: false, follow: true } : undefined, // arama sonuçları dizine alınmaz
    openGraph: { type: 'website', siteName: 'KolayBi', locale: 'tr_TR', url: canonical, title, description: DESC, images: [`${SITE}/img/og-kolaybi.jpg`] },
    twitter: { card: 'summary_large_image', site: '@kolaybicom', title, description: DESC, images: [`${SITE}/img/og-kolaybi.jpg`] },
  }
}

const I = ({ id }: { id: string }) => <svg><use href={`#${id}`} /></svg>
const Html = ({ html, as: Tag = 'span' }: { html: string; as?: 'span' | 'p' }) => <Tag dangerouslySetInnerHTML={{ __html: nowrap(html.replace(/&/g, '&amp;').replace(/</g, '&lt;')) }} />
const tema = (p: Post) => { const t = cat(p)?.theme || 'ofis'; return t.startsWith('theme-') ? t : `theme-${t}` } // kategori teması 'theme-link' biçiminde saklanır
const gorsel = (p: Post, boyut: 'card' | 'cover') => { const m = media(p.cover); return m?.sizes?.[boyut]?.url || m?.url || '' }

function Kart({ p }: { p: Post }) {
  const c = cat(p)
  return (
    <article className={`post ${tema(p)}`} data-cat={c?.slug}>
      <div className="post-img">{gorsel(p, 'card') && <img src={gorsel(p, 'card')} alt="" loading="lazy" width={800} height={450} />}</div>
      <div className="post-body">
        <div className="post-meta">{c && <span className="post-tag">{c.title}</span>}<span className="post-sep" aria-hidden="true">·</span><time dateTime={isoDate(p.publishedAt)}>{trDate(p.publishedAt)}</time>{author(p) && <><span className="post-sep" aria-hidden="true">·</span><span className="post-author">{author(p)!.name}</span></>}</div>
        <h3><a href={`/blog/${p.slug}`} dangerouslySetInnerHTML={{ __html: nowrap(p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')) }} /></h3>
        {p.description && <Html as="p" html={p.description} />}
        <span className="more">Rehberi Okuyun<span className="sr-only">: {p.title}</span><I id="i-right" /></span>
      </div>
    </article>
  )
}

function SayfaNo(cur: number, total: number) {
  const out: (number | '…')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - cur) <= 1) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

export default async function BlogIndex({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const cats = await kategoriler()
  const kat = cats.some((c) => c.slug === one(sp.kategori)) ? one(sp.kategori) : ''
  const q = one(sp.q).trim().slice(0, 80)
  const tum = await allPosts()
  const norm = (s: string) => s.toLocaleLowerCase('tr-TR')
  const liste = tum.filter((p) => (!kat || cat(p)?.slug === kat) && (!q || norm(`${p.title} ${p.description || ''}`).includes(norm(q))))
  const filtreli = !!(kat || q)
  // 1. sayfada (filtresiz) en yeni yazı öne çıkar, ızgara ondan sonra başlar
  const one_cikan = !filtreli ? liste[0] : null
  const izgara = one_cikan ? liste.slice(1) : liste
  const toplam = Math.max(1, Math.ceil(izgara.length / PER))
  const page = Math.min(Math.max(1, parseInt(one(sp[KEY]), 10) || 1), toplam)
  const sayfa = izgara.slice((page - 1) * PER, page * PER)
  const ilkSayfa = page === 1 && !filtreli
  const enCok = EN_COK.map((s) => tum.find((p) => p.slug === s)).filter(Boolean) as Post[]
  const aktif = cats.find((c) => c.slug === kat)

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: aktif ? `${aktif.title} Rehberleri` : 'Muhasebe ve Finans Blogu', url: SITE + adres({ kat, page }), description: DESC, inLanguage: 'tr-TR',
      isPartOf: { '@type': 'WebSite', name: 'KolayBi', url: SITE },
      mainEntity: { '@type': 'ItemList', itemListElement: sayfa.map((p, i) => ({ '@type': 'ListItem', position: (page - 1) * PER + i + 1, url: `${SITE}/blog/${p.slug}`, name: p.title })) },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'KolayBi', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'KolayBi Blog', item: SITE + '/blog' },
        ...(aktif ? [{ '@type': 'ListItem', position: 3, name: aktif.title, item: SITE + adres({ kat }) }] : []),
      ],
    },
  ]

  return (
    <>
      <link rel="stylesheet" href="/css/blog.css?v=8" precedence="default" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <section className="bl-hero">
          <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: HERO_SVG }} />
          <div className="container">
            <nav className="crumbs" aria-label="Sayfa yolu"><a href="/">KolayBi</a><I id="i-right" />{aktif ? <><a href="/blog">KolayBi Blog</a><I id="i-right" /><span>{aktif.title}</span></> : <span>KolayBi Blog</span>}</nav>
            <h1>{aktif ? <>{aktif.title} <em>rehberleri</em></> : <>Muhasebe ve <em>finans blogu</em></>}</h1>
            <p className="lead">Ön muhasebe, vergi, <span className="nw">e-Dönüşüm</span> ve girişimcilik konularında güncel rehberler.</p>
            <a href={REG} className="btn btn-light bl-hero-cta">14 Gün Ücretsiz Deneyin<span className="arr"><I id="i-arrow" /></span></a>
            <p className="bl-hero-note">Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.</p>
            <div className="bl-tools">
              <form className="bl-search" action="/blog" method="get" role="search">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                {kat && <input type="hidden" name="kategori" value={kat} />}
                <input name="q" type="search" defaultValue={q} placeholder="Yazılarda ara: e-Fatura, KDV, stok…" aria-label="Blog yazılarında ara" />
              </form>
              <span className="bl-count">{liste.length} yazı</span>
            </div>
            <nav className="bl-cats" aria-label="Kategoriye göre filtrele">
              <a href={adres({ q })} className={!kat ? 'is-active' : undefined} aria-current={!kat ? 'page' : undefined}>Tümü</a>
              {cats.map((c) => <a key={c.slug} href={adres({ kat: c.slug, q })} className={kat === c.slug ? 'is-active' : undefined} aria-current={kat === c.slug ? 'page' : undefined}>{c.title}</a>)}
            </nav>
          </div>
        </section>

        {ilkSayfa && one_cikan && (
          <section className="section bl-top-wrap" style={{ paddingTop: 32, paddingBottom: 0 }}>
            <div className="container bl-top">
              <article className={`bl-feat post ${tema(one_cikan)}`}>
                <div className="post-img">{gorsel(one_cikan, 'cover') && <img src={gorsel(one_cikan, 'cover')} alt="" loading="eager" width={1080} height={608} />}</div>
                <div className="post-body">
                  <span className="bl-label"><i></i>Son yazı</span>
                  <h2><a href={`/blog/${one_cikan.slug}`} dangerouslySetInnerHTML={{ __html: nowrap(one_cikan.title.replace(/</g, '&lt;')) }} /></h2>
                  {one_cikan.description && <Html as="p" html={one_cikan.description} />}
                  <div className="post-meta"><span className="post-tag">{cat(one_cikan)?.title}</span><span className="post-sep" aria-hidden="true">·</span><time dateTime={isoDate(one_cikan.publishedAt)}>{trDate(one_cikan.publishedAt)}</time>{author(one_cikan) && <><span className="post-sep" aria-hidden="true">·</span><span className="post-author">{author(one_cikan)!.name}</span></>}</div>
                </div>
              </article>
              <div className="bl-side">
                <aside className="bl-most">
                  <h2><I id="i-chart" />En çok okunanlar</h2>
                  <ol>{enCok.map((p) => <li key={p.slug}><a href={`/blog/${p.slug}`} dangerouslySetInnerHTML={{ __html: nowrap(p.title.replace(/</g, '&lt;')) }} /></li>)}</ol>
                </aside>
                <nav className="bl-start" aria-label="Nereden başlamalı">
                  <span>Nereden başlamalı?</span>
                  {BASLANGIC.map((b) => <a key={b.kat} href={adres({ kat: b.kat })} dangerouslySetInnerHTML={{ __html: `<span>${nowrap(b.l)}</span><svg><use href="#i-right"/></svg>` }} />)}
                </nav>
              </div>
            </div>
          </section>
        )}

        <section className="section" id="tum-yazilar" style={{ paddingTop: 20, scrollMarginTop: 90 }}>
          <div className="container">
            {sayfa.length ? (
              <div className="posts bl-grid" id="posts">
                {sayfa.slice(0, 6).map((p) => <Kart key={p.slug} p={p} />)}
                {page === 1 && sayfa.length > 6 && (
                  <aside className="inline-cta bl-inline-cta">
                    <div><b>Ön muhasebenizi ve <span className="nw">e-Faturanızı</span> KolayBi’de 14 gün ücretsiz deneyin</b><span>Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.</span></div>
                    <a href={REG} className="btn btn-primary">14 Gün Ücretsiz Deneyin<span className="arr"><I id="i-arrow" /></span></a>
                  </aside>
                )}
                {sayfa.slice(6).map((p) => <Kart key={p.slug} p={p} />)}
              </div>
            ) : (
              <div className="bl-empty show">Aramanıza uygun yazı bulunamadı. Farklı bir kelime deneyin ya da <a href="/blog">kategoriyi temizleyin</a>.</div>
            )}
            {toplam > 1 && (
              <nav className="bl-pager" aria-label="Sayfalar">
                <a className={`pg-nav prev${page === 1 ? ' off' : ''}`} href={adres({ kat, q, page: page - 1 })} aria-label="Önceki sayfa" rel="prev"><I id="i-right" /><span>Önceki</span></a>
                <div className="pg-nums">{SayfaNo(page, toplam).map((n, i) => <Fragment key={n === '…' ? `g${i}` : n}>{i > 0 && ' '}{n === '…' ? <span className="pg-gap" aria-hidden="true">…</span> : <a href={adres({ kat, q, page: n })} className={n === page ? 'on' : undefined} aria-current={n === page ? 'page' : undefined} aria-label={`Sayfa ${n}`}>{n}</a>}</Fragment>)}</div>
                <a className={`pg-nav next${page === toplam ? ' off' : ''}`} href={adres({ kat, q, page: page + 1 })} aria-label="Sonraki sayfa" rel="next"><span>Sonraki</span><I id="i-right" /></a>
              </nav>
            )}
          </div>
        </section>
        <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogIndexBottom() }} />
      </main>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      <script src="/js/menu.js?v=5" />
      <script type="module" src="/js/track.js?v=4" />
      <script type="module" src="/js/popups.js?v=5" />
    </>
  )
}
