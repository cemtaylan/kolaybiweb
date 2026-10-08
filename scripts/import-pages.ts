// Canlı kolaybi.com'daki metin sayfalarını (yasal metinler vb.) CMS > Sayfalar'a birebir aktarır.
// Tekrar çalıştırmak güvenli: adres eşleşirse günceller.  Kullanım: npm run import:pages [-- --only gizlilik-politikasi]
import nextEnv from '@next/env'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'

const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const { getPayload } = await import('payload')
const { convertHTMLToLexical, editorConfigFactory } = await import('@payloadcms/richtext-lexical')
const config = (await import('../payload.config')).default
const { editorFeatures } = await import('../cms/editor')

// adres → canlıdaki içerik kutusu. html: canlıda metni yalnızca PDF olarak duran sayfa; metin PDF'ten sayfa görüntüleriyle
// doğrulanarak content/sayfalar/<adres>.html dosyasına aktarıldı (PDF'in metin katmanında ğ/ü/ö işaretleri kayıptı)
const SAYFALAR: { slug: string; html?: string }[] = [
  { slug: 'gizlilik-politikasi' },
  { slug: 'cerez-politikasi' },
  { slug: 'cayma-hakki-metni' },
  { slug: 'ticari-elektronik-ileti' },
  { slug: 'kisisel-verilerin-korunmasi', html: 'content/sayfalar/kisisel-verilerin-korunmasi.html' },
]
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : undefined

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromFeatures({ config: payload.config, features: editorFeatures })
const text = (el: Element | null | undefined) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

for (const s of SAYFALAR.filter((x) => !only || x.slug === only)) {
  const res = await fetch(`https://www.kolaybi.com/${s.slug}`)
  if (!res.ok) { console.warn('alınamadı:', s.slug, res.status); continue }
  const doc = new JSDOM(await res.text()).window.document
  const title = text(doc.querySelector('h1'))
  const metaTitle = text(doc.querySelector('title'))
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || undefined
  const box = s.html ? new JSDOM(`<div>${readFileSync(s.html, 'utf8')}</div>`).window.document.querySelector('div') : doc.querySelector('.policy-content')
  let body: unknown = undefined
  if (box) {
    // Webflow öznitelikleri ve boş paragraflar temizlenir; metin değişmez
    box.querySelectorAll('*').forEach((e) => { for (const a of [...e.attributes]) if (!['href', 'target'].includes(a.name)) e.removeAttribute(a.name) })
    box.querySelectorAll('p').forEach((p) => { if (!text(p) && !p.querySelector('img')) p.remove() })
    box.querySelectorAll('a:not([href]), a[href=""], a[href="#"]').forEach((a) => a.replaceWith(...a.childNodes))
    body = convertHTMLToLexical({ editorConfig, html: box.innerHTML, JSDOM })
  }
  const data = { title, slug: s.slug, metaTitle, metaDescription, body, pdf: null }
  const ex = await payload.find({ collection: 'pages', where: { slug: { equals: s.slug } }, limit: 1, depth: 0 })
  if (ex.docs[0]) await payload.update({ collection: 'pages', id: ex.docs[0].id, data: data as never })
  else await payload.create({ collection: 'pages', data: data as never })
  console.log('✓', s.slug, '·', title, `· ${text(box).split(' ').length} kelime`)
}
process.exit(0)
