// Blog çağrı kutusu (CTA) ve buton HTML'i: sitedeki yazı sayfası (lib/blog.ts) ve CMS'teki canlı önizleme aynı işlevi kullanır.
// Saf modül (sunucu/istemci ortak); görünüm public/css/post.css (.bcta, .bbtn) ve site.css'teki .inline-cta/.final-cta/.side-cta.
import { BUTON_RENK, CTA_PRESETS, OTOMATIK_HOVER, type CtaPreset } from './blocks'

export const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** e-Fatura, e-Arşiv gibi kelimeler satır sonunda bölünmesin (sitedeki .nw) */
export const nowrap = (html: string) =>
  html.replace(/(^|>)([^<]+)/g, (_m, a: string, t: string) => a + t.replace(/(?<![\p{L}\d>-])([eE]-[\p{L}]+)/gu, '<span class="nw">$1</span>'))

export const ARROW = '<span class="arr"><svg><use href="#i-arrow"/></svg></span>'
// Sayfa sonu bandındaki KolayBi kurdelesi (sitedeki .cta-ribbon ile aynı)
export const RIBBON = '<svg class="cta-ribbon" viewBox="0 0 1376 420" preserveAspectRatio="none" aria-hidden="true"><g class="k-ribbon"><path class="k1" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40"/><path class="k2" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 25)"/><path class="k3" d="M-80 330 C 160 250, 340 420, 600 320 S 980 120, 1220 190 S 1480 120, 1600 40" transform="translate(0 50)"/></g></svg>'
/** Önizleme çerçevesi için gereken simgeler (sitede sayfanın SVG setinde zaten var) */
export const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-arrow" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol><symbol id="i-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M7 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol></svg>'

export type CtaFields = { preset?: string | null; style?: string | null; theme?: string | null; title?: string | null; text?: string | null; button?: string | null; link?: string | null; note?: string | null }
export type ButtonFields = { text?: string | null; link?: string | null; variant?: string | null; align?: string | null; color?: string | null; hoverColor?: string | null }

export function ctaHTML(f: CtaFields) {
  const ozel = f.preset === 'ozel'
  const p = CTA_PRESETS[f.preset as CtaPreset] || CTA_PRESETS.deneme
  const pick = (v: string | null | undefined, d: string) => v?.trim() || (ozel ? '' : d)
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
}

export type YanFields = { title?: string | null; text?: string | null; button?: string | null; link?: string | null }
/** Yazının yan sütunundaki koyu kart (sitedeki .side-cta) */
export function yanHTML(f: YanFields) {
  const em = (t: string) => nowrap(esc(t)).replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return `<div class="side-cta">${f.title ? `<b>${em(f.title)}</b>` : ''}${f.text ? `<p>${nowrap(esc(f.text))}</p>` : ''}${f.button && f.link ? `<a href="${esc(f.link)}" class="btn btn-light">${esc(f.button)}${ARROW}</a>` : ''}</div>`
}

export function buttonHTML(f: ButtonFields) {
  if (!f.text || !f.link) return ''
  // eski "Koyu" stil: dolu + lacivert
  const variant = f.variant === 'outline' ? 'outline' : 'primary'
  const renk = f.variant === 'dark' && !f.color ? 'lacivert' : f.color && BUTON_RENK[f.color] ? f.color : 'mavi'
  const hover = f.hoverColor && BUTON_RENK[f.hoverColor] ? f.hoverColor : OTOMATIK_HOVER[renk] || 'koyu-mavi'
  const c = BUTON_RENK[renk], h = BUTON_RENK[hover]
  const style = `--bb:${c.bg};--bbt:${c.fg};--bbh:${h.bg};--bbht:${h.fg}`
  return `<p class="bbtn bbtn--${f.align === 'center' ? 'center' : 'left'}"><a href="${esc(f.link)}" class="btn bbtn-${variant}" style="${style}">${esc(f.text)}${ARROW}</a></p>`
}

export type VideoFields = { url?: string | null; file?: { url?: string | null; mimeType?: string | null } | number | string | null; caption?: string | null }
/** YouTube / Vimeo bağlantısından gömülü oynatıcı adresi (çerezsiz YouTube) */
export function videoEmbed(url: string) {
  const u = url.trim()
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}
export function videoHTML(f: VideoFields) {
  const cap = f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''
  const file = typeof f.file === 'object' && f.file?.url ? f.file : null
  if (file) return `<figure class="bvideo"><div class="bvideo-box"><video src="${esc(file.url!)}" controls preload="metadata" playsinline></video></div>${cap}</figure>`
  const src = f.url ? videoEmbed(f.url) : null
  if (!src) return ''
  return `<figure class="bvideo"><div class="bvideo-box"><iframe src="${esc(src)}" title="${esc(f.caption || 'Video')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>${cap}</figure>`
}
