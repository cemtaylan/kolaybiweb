// Blog: CMS'ten okuma ve eski sitenin HTML kurallarını (başlık kimlikleri, tarih biçimi, e- kelimeleri) aynen uygulama
import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToHTML, defaultHTMLConverters, type HTMLConverters } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Author, Category, Media, Post } from '@/cms/payload-types'
import { buttonHTML, ctaHTML, videoHTML, type ButtonFields, type CtaFields, type VideoFields } from '@/cms/cta-html'
import { BLOG_CTA_VARSAYILAN } from '@/cms/blocks'

export const SITE = 'https://www.kolaybi.com'
export { REG } from '@/cms/blocks'
import { REG } from '@/cms/blocks'

export const cms = cache(() => getPayload({ config }))

// Yayındaki tüm yazılar, yeniden eskiye (blog listesi ve önceki/sonraki sırası)
// Veritabanı aktarımını azaltmak için sonuç Next veri önbelleğinde tutulur (10 dk); yazı ya da kategori
// kaydedilince 'posts' etiketi yenilenir (cms/collections/Posts.ts, Categories.ts)
export const allPosts = cache(unstable_cache(async () => {
  const p = await cms()
  // Liste/önceki-sonraki/ilgili yazılar için gövde gerekmez: yalnız kart alanları çekilir (gövde postBySlug'da)
  const r = await p.find({
    collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1000, depth: 1, pagination: false,
    select: { title: true, slug: true, description: true, publishedAt: true, category: true, cover: true, author: true },
  })
  // Tarihsiz yazılar sona (veritabanları boş tarihleri farklı sıralar; burada sabitlenir)
  return (r.docs as Post[]).sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
}, ['blog-all-posts'], { tags: ['posts'], revalidate: 600 }))

export const postBySlug = cache(async (slug: string) => {
  const p = await cms()
  const r = await p.find({ collection: 'posts', where: { slug: { equals: slug }, _status: { equals: 'published' } }, limit: 1, depth: 2, pagination: false })
  return (r.docs[0] as Post | undefined) ?? null
})

const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
export const isoDate = (d?: string | null) => (d ? d.slice(0, 10) : '')
export const trDate = (d?: string | null) => {
  if (!d) return ''
  const [y, m, g] = isoDate(d).split('-')
  return `${Number(g)} ${AY[Number(m) - 1]} ${y}`
}

// Eski sitedeki başlık kimliği kuralı: küçük harf, Türkçe harfler sadeleşir, 60 karakter, tekrarına -2, boşsa "bolum"
const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
export function headingId(text: string, used: Set<string>) {
  let base = text.trim().toLowerCase().replace(/[çğıöşüâîû]/g, (c) => TR[c]).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  if (!base) base = 'bolum'
  let id = base
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`
  used.add(id)
  return id
}

// e-Fatura, e-Arşiv… satır sonunda tireden bölünmesin (eski sitedeki .nw kuralı)
export const nowrap = (html: string) =>
  html.replace(/(^|>)([^<]+)/g, (_m, a: string, t: string) => a + t.replace(/(?<![\p{L}\d>-])([eE]-[\p{L}]+)/gu, '<span class="nw">$1</span>'))

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

export type Toc = { tag: 'h2' | 'h3'; id: string; text: string }

// Gövde: Lexical → HTML. Başlıklara kimlik, görsellere figür/altyazı; içindekiler listesi de döner.
export function renderBody(data: SerializedEditorState | null | undefined) {
  const toc: Toc[] = []
  const used = new Set<string>()
  if (!data) return { html: '', toc }
  const converters: HTMLConverters = {
    ...defaultHTMLConverters,
    heading: ({ node, nodesToHTML }) => {
      const inner = nodesToHTML({ nodes: node.children }).join('')
      const tag = node.tag
      if (tag !== 'h2' && tag !== 'h3') return `<${tag}>${inner}</${tag}>`
      const text = plain(inner)
      const id = headingId(text, used)
      toc.push({ tag, id, text: text.trim() })
      return `<${tag} id="${id}">${inner}</${tag}>`
    },
    blocks: {
      // Hazır çağrı kutusu ve buton: HTML'i CMS önizlemesiyle ortak modülden (cms/cta-html.ts)
      cta: ({ node }) => ctaHTML(node.fields as CtaFields),
      button: ({ node }) => buttonHTML(node.fields as ButtonFields),
      video: ({ node }) => videoHTML(node.fields as VideoFields),
    },
    upload: ({ node }) => {
      const m = node.value as Media
      if (typeof m !== 'object' || !m?.url) return ''
      const f = (node.fields || {}) as { caption?: string; captionLink?: string }
      const img = `<img src="${esc(m.url)}" alt="${esc(m.alt || '')}" loading="lazy" width="${m.width ?? ''}" height="${m.height ?? ''}">`
      const cap = f.caption ? (f.captionLink ? `<a href="${esc(f.captionLink)}">${esc(f.caption)}</a>` : esc(f.caption)) : ''
      return `<figure>${img}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`
    },
  }
  const html = convertLexicalToHTML({ data, converters, disableContainer: true, disableIndent: true, disableTextAlign: true })
  return { html: nowrap(tidy(html)), toc }
}

// Editör çıktısını eski HTML biçimine yaklaştırır (prose CSS'i bu yapıya göre yazıldı):
// - alt liste ayrı, işaretsiz bir madde yerine üst maddenin içinde durur
// - tablo hücresindeki tek paragraf kaldırılır; boş class/style/value öznitelikleri silinir
export function tidy(html: string) {
  let s = html.replace(/<li\s+class="(?:nestedListItem)?"\s+style="[^"]*"\s+value="\d+"\s*>/g, (m) => (m.includes('nestedListItem') ? '<li data-nested>' : '<li>'))
  s = s.replace(/<(ul|ol) class="list-(?:bullet|number|check)"/g, '<$1')
  // <li>…</li><li data-nested><ul>…</ul></li>  →  <li>…<ul>…</ul></li>
  for (let i = s.indexOf('<li data-nested>'); i > -1; i = s.indexOf('<li data-nested>')) {
    let depth = 0, j = i
    const re = /<\/?li[\s>]/g
    re.lastIndex = i
    for (let m; (m = re.exec(s)); ) { depth += m[0][1] === '/' ? -1 : 1; if (depth === 0) { j = m.index; break } }
    const inner = s.slice(i + '<li data-nested>'.length, j)
    const before = s.slice(0, i), after = s.slice(j + '</li>'.length)
    s = before.endsWith('</li>') ? before.slice(0, -'</li>'.length) + inner + '</li>' + after : before + '<li>' + inner + '</li>' + after
  }
  s = s.replace(/<(td|th)([^>]*)><p>((?:(?!<\/?p[\s>]).)*)<\/p><\/\1>/gs, '<$1$2>$3</$1>')
  return s
}

// Yazılara otomatik eklenen çağrı kutuları: CMS > Blog CTA ayarları (kaydedilene kadar bugünkü varsayılanlar)
export const blogCta = cache(async () => {
  const g = (await (await cms()).findGlobal({ slug: 'blog-cta', depth: 0 }).catch(() => null)) as { updatedAt?: string; orta?: Record<string, unknown>; yan?: Record<string, unknown> } | null
  return g?.updatedAt ? { orta: { ...BLOG_CTA_VARSAYILAN.orta, ...g.orta }, yan: { ...BLOG_CTA_VARSAYILAN.yan, ...g.yan } } : BLOG_CTA_VARSAYILAN
})
type Orta = (typeof BLOG_CTA_VARSAYILAN)['orta']

// Yazının ortasındaki kutu: ayardaki ara başlıktan (h2) önce, yoksa sona. Yazar kendi kutusunu eklediyse ya da yazıda
// gizlendiyse eklenmez; yazıda farklı bir hazır CTA seçildiyse o kullanılır (görünüm ve renk genel ayardan).
export function withInlineCta(html: string, orta: Orta, secim?: string | null) {
  if (html.includes(' bcta ')) return html
  if (secim === 'gizle') return html
  const ozelSecim = secim && secim !== 'genel'
  if (!orta.aktif && !ozelSecim) return html
  const kutu = ctaHTML(ozelSecim ? { preset: secim, style: orta.style, theme: orta.theme } : orta)
  const n = orta.konum === 'h2-2' ? 1 : orta.konum === 'son' ? -1 : 2
  const h2 = [...html.matchAll(/<h2[\s>]/g)]
  return n >= 0 && h2.length > n ? html.slice(0, h2[n].index) + kutu + html.slice(h2[n].index) : html + kutu
}

export const cat = (p: Post) => (typeof p.category === 'object' ? (p.category as Category) : null)
export const author = (p: Post) => (typeof p.author === 'object' ? (p.author as Author) : null)
export const media = (m: unknown) => (m && typeof m === 'object' ? (m as Media) : null)
