// legacy/blog altındaki yazıları Payload CMS'e aktarır (tekrar çalıştırmak güvenli: adres (slug) eşleşirse günceller).
// Kullanım:  npm run import:blog                     → tüm yazılar (esbuild ile derlenip Node ile çalışır; tsx bu paketlerle takılıyor)
//            npm run import:blog -- --limit 5     → ilk 5 yazı (deneme)
//            npm run import:blog -- --only e-fatura-nedir
import nextEnv from '@next/env'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

nextEnv.loadEnvConfig(process.cwd())
const { getPayload } = await import('payload')
const { convertHTMLToLexical, editorConfigFactory } = await import('@payloadcms/richtext-lexical')
const config = (await import('../payload.config')).default
const { editorFeatures } = await import('../cms/editor')

const ROOT = process.cwd()
const BLOG = path.join(ROOT, 'legacy/blog')
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined }
const LIMIT = Number(arg('--limit') || 0)
const ONLY = arg('--only')

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromFeatures({ config: payload.config, features: editorFeatures })
const parse = (html: string) => new JSDOM(html).window.document
const text = (el: Element | null | undefined) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

// ---------- Görseller: aynı dosya bir kez yüklenir ----------
const mediaIds = new Map<string, number | string>()
async function media(src: string, alt: string) {
  const clean = src.split('?')[0]
  if (mediaIds.has(clean)) return mediaIds.get(clean)!
  const file = path.join(ROOT, 'public', clean)
  if (!clean.startsWith('/img/') || !existsSync(file)) { console.warn('  görsel bulunamadı:', src); return null }
  const name = path.basename(clean)
  // CMS görselleri WebP olarak saklar: kaynak .jpg/.png ise kayıtlı adı .webp'dir
  const webp = name.replace(/\.(jpe?g|png|gif)$/i, '.webp')
  const found = await payload.find({ collection: 'media', where: { filename: { in: [name, webp] } }, limit: 1, depth: 0, sort: 'createdAt' })
  const id = found.docs[0]?.id ?? (await payload.create({ collection: 'media', data: { alt }, filePath: file })).id
  mediaIds.set(clean, id)
  return id
}

// ---------- Kategoriler: blog listesindeki filtrelerden (sıra ve adresler aynen) ----------
const index = parse(readFileSync(path.join(BLOG, 'index.html'), 'utf8'))
const catByLabel = new Map<string, string>() // "e-Fatura" → "e-fatura"
const catOrder: { slug: string; title: string }[] = []
index.querySelectorAll('button[data-cat]').forEach((b) => {
  const slug = b.getAttribute('data-cat')!
  if (slug === 'all') return
  catByLabel.set(text(b), slug); catOrder.push({ slug, title: text(b) })
})
const catIds = new Map<string, number | string>()
async function category(slug: string, theme: string) {
  if (catIds.has(slug)) return catIds.get(slug)!
  const c = catOrder.find((x) => x.slug === slug)!
  const data = { title: c.title, slug, theme: theme as 'theme-ofis', order: catOrder.indexOf(c) + 1 }
  const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const id = found.docs[0] ? (await payload.update({ collection: 'categories', id: found.docs[0].id, data })).id : (await payload.create({ collection: 'categories', data })).id
  catIds.set(slug, id); return id
}

// ---------- Yazarlar ----------
const authorIds = new Map<string, number | string>()
async function author(doc: Document) {
  const box = doc.querySelector('.ps-author'); const name = text(box?.querySelector('b'))
  if (!name) return null
  if (authorIds.has(name)) return authorIds.get(name)!
  const img = box!.querySelector('img')
  const data: Record<string, unknown> = { name, role: text(box!.querySelector('small')), bio: text(doc.querySelector('.author-box p')) }
  if (img) data.photo = await media(img.getAttribute('src')!, name)
  const found = await payload.find({ collection: 'authors', where: { name: { equals: name } }, limit: 1, depth: 0 })
  const id = found.docs[0] ? (await payload.update({ collection: 'authors', id: found.docs[0].id, data })).id : (await payload.create({ collection: 'authors', data: data as { name: string } })).id
  authorIds.set(name, id); return id
}

// ---------- Gövde: HTML → Lexical ----------
async function body(prose: Element) {
  const el = prose.cloneNode(true) as Element
  // SSS bölümü (gövdenin hemen ardından gelen section.ps-faq) ayrı alana gider; deneme kutusu şablondan gelir
  const faq = [...prose.ownerDocument.querySelectorAll('section.ps-faq details')].map((d) => {
    const q = d.querySelector('summary')!.cloneNode(true) as Element
    q.querySelectorAll('.no,.pm').forEach((x) => x.remove())
    return { question: text(q), answer: text(d.querySelector('.faq-a')) }
  })
  el.querySelectorAll('section.ps-faq, .inline-cta, svg, script').forEach((x) => x.remove())
  el.querySelectorAll('span.nw').forEach((s) => s.replaceWith(s.textContent || ''))
  // Hedefi olmayan bağlantılar düz metne döner (CMS geçerli URL ister)
  el.querySelectorAll('a:not([href]), a[href=""]').forEach((a) => a.replaceWith(...a.childNodes))
  // Görseller (figür + altyazı) CMS görseline bağlanır
  const captions = new Map<string, { caption: string; captionLink?: string }>()
  for (const img of [...el.querySelectorAll('img')]) {
    const fig = img.closest('figure')
    const id = await media(img.getAttribute('src') || '', img.getAttribute('alt') || '')
    if (id == null) { (fig || img).remove(); continue }
    const fc = fig?.querySelector('figcaption'); const cap = text(fc)
    const href = fc?.querySelector('a[href]')?.getAttribute('href') || undefined
    if (cap) captions.set(String(id), { caption: cap, captionLink: href })
    const node = el.ownerDocument.createElement('img')
    node.setAttribute('data-lexical-upload-relation-to', 'media'); node.setAttribute('data-lexical-upload-id', String(id))
    ;(fig || img).replaceWith(node)
  }
  const state = convertHTMLToLexical({ editorConfig, html: el.innerHTML, JSDOM })
  // Görsel düğümleri: kimlik sayıya, altyazı alanına
  const walk = (n: any) => {
    if (n.type === 'upload') { n.fields = captions.get(String(n.value)) ?? {}; n.value = isNaN(Number(n.value)) ? n.value : Number(n.value) }
    n.children?.forEach(walk)
  }
  walk(state.root)
  return { state, faq }
}

// ---------- Yazılar ----------
let slugs = readdirSync(BLOG).filter((d) => existsSync(path.join(BLOG, d, 'index.html')))
if (ONLY) slugs = slugs.filter((s) => s === ONLY)
if (LIMIT) slugs = slugs.slice(0, LIMIT)
let ok = 0
for (const slug of slugs) {
  try {
    const doc = parse(readFileSync(path.join(BLOG, slug, 'index.html'), 'utf8'))
    const title = text(doc.querySelector('.ps-head h1'))
    const head = doc.querySelector('.ps-head')!
    const catLabel = text(head.querySelector('.post-tag'))
    const catSlug = catByLabel.get(catLabel)
    if (!catSlug) throw new Error('kategori bulunamadı: ' + catLabel)
    const theme = [...head.classList].find((c) => c.startsWith('theme-')) || 'theme-ofis'
    const times = [...doc.querySelectorAll('.ps-facts time')]
    const updated = [...doc.querySelectorAll('.ps-facts span')].find((s) => s.textContent?.includes('Güncellendi'))?.querySelector('time')
    const minSpan = [...doc.querySelectorAll('.ps-facts span')].find((x) => /dk okuma/.test(x.textContent || ''))
    const minutes = Number((text(minSpan).match(/(\d+)\s*dk/) || [])[1]) || undefined
    const metaTitle = text(doc.querySelector('title'))
    const coverImg = doc.querySelector('.ps-cover img')
    const { state, faq } = await body(doc.querySelector('.prose')!)
    const data = {
      title, slug,
      metaTitle: metaTitle === `${title} | KolayBi` ? undefined : metaTitle,
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
      category: await category(catSlug, theme),
      author: await author(doc),
      publishedAt: times[0]?.getAttribute('datetime') || undefined,
      contentUpdatedAt: updated?.getAttribute('datetime') || undefined,
      readingMinutes: minutes,
      cover: coverImg ? await media(coverImg.getAttribute('src')!, coverImg.getAttribute('alt') || title) : undefined,
      body: state, faq, _status: 'published' as const,
    }
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
    if (found.docs[0]) await payload.update({ collection: 'posts', id: found.docs[0].id, data: data as never })
    else await payload.create({ collection: 'posts', data: data as never })
    ok++; console.log(`✓ ${slug}`)
  } catch (e) {
    console.error(`✗ ${slug}:`, (e as Error).message)
  }
}
console.log(`\n${ok}/${slugs.length} yazı aktarıldı · ${mediaIds.size} görsel · ${authorIds.size} yazar · ${catIds.size} kategori`)
process.exit(0)
