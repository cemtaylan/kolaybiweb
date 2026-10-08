// Destek makalesi sayfası (CMS > Destek makaleleri): solda başlıklardan içindekiler, sağda metin, altta aynı gruptaki
// diğer rehberler ve deneme bandı. /destek/<adres> ve /kullanici-rehberi bu bileşeni kullanır.
import 'server-only'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { cms, nowrap, REG, renderBody, SITE } from '@/lib/blog'
import { blogFooter, blogHeader } from '@/lib/partials'
import { ctaHTML } from '@/cms/cta-html'

export type Destek = { id: number; title: string; slug: string; group: string; order?: number | null; summary?: string | null; body?: unknown; metaTitle?: string | null; metaDescription?: string | null }

export const destekler = cache(async () =>
  ((await (await cms()).find({ collection: 'support', limit: 500, depth: 0, pagination: false, sort: 'order', select: { title: true, slug: true, group: true, order: true, summary: true } })).docs as Destek[]))
export const destek = cache(async (slug: string) =>
  ((await (await cms()).find({ collection: 'support', where: { slug: { equals: slug } }, limit: 1, depth: 1 })).docs[0] as Destek | undefined) ?? null)

export const destekAdres = (slug: string) => (slug === 'kullanici-rehberi' ? '/kullanici-rehberi' : `/destek/${slug}`)

export async function destekMeta(slug: string): Promise<Metadata> {
  const d = await destek(slug)
  if (!d) return {}
  const url = SITE + destekAdres(slug)
  return { title: { absolute: d.metaTitle || `${d.title} | KolayBi Destek` }, description: d.metaDescription || undefined, alternates: { canonical: url } }
}

const I = ({ id }: { id: string }) => <svg><use href={`#${id}`} /></svg>
const BANT = ctaHTML({ preset: 'ozel', style: 'koyu', title: '14 Gün Boyunca *Ücretsiz* Kullanın!', text: 'Şimdi KolayBi’ Ön Muhasebe Programını kullanmaya başlayın ve ücretsiz e-Fatura kontörü fırsatından yararlanın!', button: '14 Gün Ücretsiz Deneyin', link: REG, note: 'Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.' })
// Eski adresteki #anchor1…4 bağlantıları (kullanım kılavuzundan) aynı sıradaki başlığa gitsin
const ANCHOR_JS = `(function(){var m=location.hash.match(/^#anchor(\\d)$/);if(!m)return;var h=document.querySelectorAll('.prose h2')[m[1]-1];if(h){history.replaceState(null,'','#'+h.id);h.scrollIntoView();}})();`

export async function SupportPage({ slug }: { slug: string }) {
  const d = await destek(slug)
  if (!d) notFound()
  const { html, toc } = renderBody(d.body as never)
  const ayni = (await destekler()).filter((x) => x.group === d.group && x.slug !== d.slug)
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'KolayBi', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Destek', item: SITE + '/destek' },
      { '@type': 'ListItem', position: 3, name: 'Kullanım Kılavuzu', item: SITE + '/kullanici-kilavuzu' },
      { '@type': 'ListItem', position: 4, name: d.title, item: SITE + destekAdres(slug) },
    ],
  }
  return (
    <>
      <link rel="stylesheet" href="/css/post.css?v=11" precedence="default" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <div className="read-progress" aria-hidden="true" />
        <article>
          <header className="ps-hero">
            <div className="container">
              <div className="ps-head theme-ofis">
                <nav className="crumbs" aria-label="Sayfa yolu"><a href="/">KolayBi</a><I id="i-right" /><a href="/destek">Destek</a><I id="i-right" /><a href="/kullanici-kilavuzu">Kullanım Kılavuzu</a><I id="i-right" /><span dangerouslySetInnerHTML={{ __html: nowrap(d.title) }} /></nav>
                <h1 dangerouslySetInnerHTML={{ __html: nowrap(d.title) }} />
                <p className="lead">Ürün Özellikleri ve İşlevleri Hakkında Detaylı Bilgi için <a href="/kullanici-kilavuzu">Kullanım Kılavuzu</a></p>
              </div>
            </div>
          </header>
          <div className="container ps-body">
            <aside className="ps-side">
              {toc.length > 0 && <nav className="toc" aria-label="İçindekiler"><b>Bu rehberde</b><ol>{toc.map((t) => <li key={t.id}><a className={t.tag} href={`#${t.id}`}>{t.text}</a></li>)}</ol></nav>}
              <div className="side-cta"><b>Ön muhasebe <em>tek ekranda</em></b><p>Fatura, cari, stok ve banka takibini KolayBi ile yönetin.</p><a href={REG} className="btn btn-light">14 Gün Ücretsiz Deneyin<span className="arr"><I id="i-arrow" /></span></a></div>
            </aside>
            <div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
              {ayni.length > 0 && (
                <nav className="sp-more" aria-label="Diğer rehberler">
                  <h2>Diğer rehberler</h2>
                  <ul>{ayni.map((x) => <li key={x.slug}><a href={destekAdres(x.slug)}><b dangerouslySetInnerHTML={{ __html: nowrap(x.title) }} />{x.summary && <span>{x.summary}</span>}</a></li>)}</ul>
                </nav>
              )}
              <div dangerouslySetInnerHTML={{ __html: BANT }} />
            </div>
          </div>
        </article>
      </main>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      {slug === 'kullanici-rehberi' && <script dangerouslySetInnerHTML={{ __html: ANCHOR_JS }} />}
      <script src="/js/menu.js?v=4" />
      <script src="/js/post.js?v=1" />
      <script type="module" src="/js/track.js?v=4" />
      <script type="module" src="/js/popups.js?v=5" />
    </>
  )
}
