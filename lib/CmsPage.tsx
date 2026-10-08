// CMS'teki "Sayfalar" kaydını sitenin tasarımıyla gösterir (yasal ve kurumsal metin sayfaları).
// Her adresin kendi küçük rota dosyası vardır: app/(site)/<adres>/page.tsx → <CmsPage slug="<adres>" />
import 'server-only'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { cms, renderBody, SITE } from '@/lib/blog'
import { blogFooter, blogHeader } from '@/lib/partials'

type Sayfa = { title: string; slug: string; metaTitle?: string | null; metaDescription?: string | null; body?: unknown; pdf?: string | null }

const sayfa = cache(async (slug: string) => {
  const r = await (await cms()).find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return (r.docs[0] as Sayfa | undefined) ?? null
})

export async function cmsPageMeta(slug: string): Promise<Metadata> {
  const p = await sayfa(slug)
  if (!p) return {}
  return { title: p.metaTitle || `${p.title} | KolayBi`, description: p.metaDescription || undefined, alternates: { canonical: `${SITE}/${slug}` } }
}

const CSS = `
.cp-hero { padding: clamp(40px, 6vw, 72px) 0 clamp(24px, 4vw, 40px); background: linear-gradient(180deg, var(--blue-50), transparent); }
.cp-hero h1 { max-width: 820px; margin: 0 auto; font: 800 clamp(30px, 4vw, 46px)/1.15 var(--font-head); color: var(--navy); }
.cp-body { max-width: 820px; padding-bottom: clamp(48px, 8vw, 96px); }
.cp-body .prose td:first-child { min-width: 170px; }
.cp-pdf { margin-top: 28px; border: 1px solid var(--line); border-radius: var(--radius-lg); overflow: hidden; background: #fff; }
.cp-pdf iframe { display: block; width: 100%; height: min(80vh, 900px); border: 0; }
.cp-pdf-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); font-weight: 600; color: var(--navy); }
.cp-pdf-bar a { color: var(--primary); }
`

export async function CmsPage({ slug }: { slug: string }) {
  const p = await sayfa(slug)
  if (!p) notFound()
  const { html } = renderBody(p.body as never)
  return (
    <>
      <link rel="stylesheet" href="/css/post.css?v=11" precedence="default" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <section className="cp-hero"><div className="container"><h1>{p.title}</h1></div></section>
        <section className="container cp-body">
          {html && <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />}
          {p.pdf && (
            <div className="cp-pdf">
              <div className="cp-pdf-bar"><span>{p.title} (PDF)</span><a href={p.pdf} target="_blank" rel="noopener">PDF’i indirin</a></div>
              <iframe src={p.pdf} title={p.title} />
            </div>
          )}
        </section>
      </main>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      <script src="/js/menu.js?v=5" />
      <script type="module" src="/js/track.js?v=4" />
      <script type="module" src="/js/popups.js?v=5" />
    </>
  )
}
