// Destek merkezi ortak çerçevesi: başlık alanı + içerik + deneme bandı (/destek ve /kullanici-kilavuzu)
import 'server-only'
import type React from 'react'
import { nowrap, REG, SITE } from '@/lib/blog'
import { blogFooter, blogHeader } from '@/lib/partials'
import { ctaHTML } from '@/cms/cta-html'

const I = ({ id }: { id: string }) => <svg><use href={`#${id}`} /></svg>
export const BANT = ctaHTML({ preset: 'ozel', style: 'koyu', title: '14 Gün Boyunca *Ücretsiz* Kullanın!', text: 'Şimdi KolayBi’ Ön Muhasebe Programını kullanmaya başlayın ve ücretsiz e-Fatura kontörü fırsatından yararlanın!', button: '14 Gün Ücretsiz Deneyin', link: REG, note: 'Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.' })

export type Kart = { href?: string; baslik: string; aciklama?: string | null; etiket?: string }
export function Kartlar({ items }: { items: Kart[] }) {
  return (
    <ul className="sh-cards">
      {items.map((k) => {
        const ic = <><b dangerouslySetInnerHTML={{ __html: nowrap(k.baslik) }} />{k.aciklama && <span dangerouslySetInnerHTML={{ __html: nowrap(k.aciklama) }} />}{k.etiket && <em>{k.etiket}</em>}{k.href && <I id="i-right" />}</>
        return <li key={k.baslik}>{k.href ? <a href={k.href}>{ic}</a> : <div className="is-soon">{ic}</div>}</li>
      })}
    </ul>
  )
}

export function SupportHub({ crumbs, h1, lead, children, ld }: { crumbs: { href?: string; l: string }[]; h1: string; lead?: React.ReactNode; children: React.ReactNode; ld?: object }) {
  const bc = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ href: '/', l: 'KolayBi' }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.l, ...(c.href ? { item: SITE + c.href } : {}) })) }
  return (
    <>
      <link rel="stylesheet" href="/css/post.css?v=11" precedence="default" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld ? [bc, ld] : bc).replace(/</g, '\\u003c') }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <header className="ps-hero">
          <div className="container">
            <div className="ps-head theme-ofis">
              <nav className="crumbs" aria-label="Sayfa yolu"><a href="/">KolayBi</a>{crumbs.map((c) => <span key={c.l} style={{ display: 'contents' }}><I id="i-right" />{c.href ? <a href={c.href}>{c.l}</a> : <span>{c.l}</span>}</span>)}</nav>
              <h1 dangerouslySetInnerHTML={{ __html: nowrap(h1) }} />
              {lead && <div className="lead">{lead}</div>}
            </div>
          </div>
        </header>
        <div className="container sh-body">
          {children}
          <div dangerouslySetInnerHTML={{ __html: BANT }} />
        </div>
      </main>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      <script src="/js/menu.js?v=5" />
      <script type="module" src="/js/track.js?v=4" />
      <script type="module" src="/js/popups.js?v=5" />
    </>
  )
}
