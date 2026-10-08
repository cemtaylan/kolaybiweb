// Blog: CMS'ten okuma ve eski sitenin HTML kurallarını (başlık kimlikleri, tarih biçimi, e- kelimeleri) aynen uygulama
import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToHTML, defaultHTMLConverters, type HTMLConverters } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Author, Category, Media, Post } from '@/cms/payload-types'
import { CTA_PRESETS, type CtaPreset } from '@/cms/blocks'

export const SITE = 'https://www.kolaybi.com'
export { REG } from '@/cms/blocks'
import { REG } from '@/cms/blocks'

export const cms = cache(() => getPayload({ config }))

// Yayındaki tüm yazılar, yeniden eskiye (blog listesi ve önceki/sonraki sırası)
export const allPosts = cache(async () => {
  const p = await cms()
  // Liste/önceki-sonraki/ilgili yazılar için gövde gerekmez: yalnız kart alanları çekilir (gövde postBySlug'da)
  const r = await p.find({
    collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1000, depth: 1, pagination: false,
    select: { title: true, slug: true, description: true, publishedAt: true, category: true, cover: true },
  })
  // Tarihsiz yazılar sona (veritabanları boş tarihleri farklı sıralar; burada sabitlenir)
  return (r.docs as Post[]).sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
})

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
      // Hazır çağrı kutusu: boş bırakılan alanlarda seçilen hazır CTA'nın metni kullanılır
      cta: ({ node }) => {
        const f = node.fields as { preset?: string; style?: string; theme?: string; title?: string; text?: string; button?: string; link?: string; note?: string }
        const ozel = f.preset === 'ozel'
        const p = CTA_PRESETS[f.preset as CtaPreset] || CTA_PRESETS.deneme
        const pick = (v: string | undefined, d: string) => v?.trim() || (ozel ? '' : d)
        const title = pick(f.title, p.title), text = pick(f.text, p.text), button = pick(f.button, p.button), link = pick(f.link, p.link)
        const note = f.note?.trim() === '-' ? '' : pick(f.note, p.note)
        const style = ['acik', 'koyu', 'kart'].includes(f.style || '') ? f.style! : 'acik'
        const theme = f.theme || p.theme
        const em = (t: string) => nowrap(esc(t)).replace(/\*([^*]+)\*/g, '<em>$1</em>')
        const btn = button && link ? `<a href="${esc(link)}" class="btn ${style === 'acik' ? 'btn-primary' : 'btn-light'}">${esc(button)}${ARROW}</a>` : ''
        const not = note ? `<span class="note"><svg><use href="#i-card"/></svg>${esc(note)}</span>` : ''
        const attrs = `data-cta="${esc(f.preset || 'deneme')}"`
        // Sitedeki tasarımların aynısı: .inline-cta (blog ara kutusu), .final-cta (sayfa sonu bandı), .side-cta (yan sütun kartı)
        if (style === 'koyu') return `<aside class="final-cta bcta bcta--koyu theme-${esc(theme)}" ${attrs}>${RIBBON}${title ? `<b class="bcta-h">${em(title)}</b>` : ''}${text ? `<p>${nowrap(esc(text))}</p>` : ''}${btn}${not}</aside>`
        if (style === 'kart') return `<aside class="side-cta bcta bcta--kart theme-${esc(theme)}" ${attrs}><div>${title ? `<b>${em(title)}</b>` : ''}${text ? `<p>${nowrap(esc(text))}</p>` : ''}</div><div class="bcta-act">${btn}${not}</div></aside>`
        return `<aside class="inline-cta bcta bcta--acik theme-${esc(theme)}" ${attrs}><div>${title ? `<b>${em(title)}</b>` : ''}${text ? `<span>${nowrap(esc(text))}</span>` : ''}</div><div class="bcta-act">${btn}${not}</div></aside>`
      },
      button: ({ node }) => {
        const f = node.fields as { text?: string; link?: string; variant?: string; align?: string }
        if (!f.text || !f.link) return ''
        return `<p class="bbtn bbtn--${esc(f.align || 'left')}"><a href="${esc(f.link)}" class="btn bbtn-${esc(f.variant || 'primary')}">${esc(f.text)}${ARROW}</a></p>`
      },
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

// Yazının ortasındaki deneme kutusu: 3. ara başlıktan (h2) önce, yoksa sona (eski şablonla aynı kural)
export const INLINE_CTA = `<div class="inline-cta"><div><b>Ön muhasebenizi KolayBi ile kolaylaştırın</b><span>14 gün ücretsiz deneyin, kredi kartı gerekmez.</span></div><a href="${REG}" class="btn btn-primary">Ücretsiz Deneyin<span class="arr"><svg><use href="#i-arrow"/></svg></span></a></div>`
const ARROW = '<span class="arr"><svg><use href="#i-arrow"/></svg></span>'
// Sayfa sonu bandındaki KolayBi kurdelesi (sitedeki .cta-ribbon ile aynı)
const RIBBON = '<svg class="cta-ribbon" viewBox="0 0 1376 420" preserveAspectRatio="none" aria-hidden="true"><g class="k-ribbon"><path class="k1" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40"/><path class="k2" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 25)"/><path class="k3" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 50)"/></g></svg>'
export function withInlineCta(html: string) {
  if (html.includes(' bcta ')) return html // yazar kendi çağrı kutusunu eklediyse otomatik kutu eklenmez
  const h2 = [...html.matchAll(/<h2[\s>]/g)]
  return h2.length >= 3 ? html.slice(0, h2[2].index) + INLINE_CTA + html.slice(h2[2].index) : html + INLINE_CTA
}

export const cat = (p: Post) => (typeof p.category === 'object' ? (p.category as Category) : null)
export const author = (p: Post) => (typeof p.author === 'object' ? (p.author as Author) : null)
export const media = (m: unknown) => (m && typeof m === 'object' ? (m as Media) : null)
