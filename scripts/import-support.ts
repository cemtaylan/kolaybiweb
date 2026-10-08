// Canlı kolaybi.com destek merkezi makalelerini CMS > Destek makaleleri'ne birebir aktarır; ekran görüntüleri Webflow'dan
// indirilip Görseller'e yüklenir (aynı dosya bir kez). Tekrar çalıştırmak güvenli (adres eşleşirse günceller).
// Kullanım: npm run import:support [-- --only cari-hesaplar]
import nextEnv from '@next/env'
import { JSDOM } from 'jsdom'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const { getPayload } = await import('payload')
const { convertHTMLToLexical, editorConfigFactory } = await import('@payloadcms/richtext-lexical')
const config = (await import('../payload.config')).default
const { editorFeatures } = await import('../cms/editor')

// adres, grup, sıra ve kılavuzdaki kart açıklaması (canlı /kullanici-kilavuzu sayfasından)
const MAKALELER: { slug: string; group: string; order: number; summary?: string; url?: string }[] = [
  { slug: 'kullanici-rehberi', group: 'baslangic', order: 1, url: 'https://www.kolaybi.com/kullanici-rehberi' },
  { slug: 'guncel-durum', group: 'kullanim', order: 1, summary: 'Nakit akışı, tahsilat ve ödeme özetleri' },
  { slug: 'satis-yonetimi', group: 'kullanim', order: 2, summary: 'Satış Faturası , Alınan Siparişler, Satış Proformaları/Teklifler ve Tekrarlı Satış İşlemleri' },
  { slug: 'satin-alma-yonetimi', group: 'kullanim', order: 3, summary: 'Alış Faturası / Alış İrsaliyeleri / Verilen Siparişler / Alış Proformaları ve Tekrarlı Alış İşlemleri' },
  { slug: 'genel-gider-yonetimi', group: 'kullanim', order: 4, summary: 'İşletmeniz için genel gelir ve gider yönetimi özellikleri' },
  { slug: 'kolaybi-urun-ve-hizmetler', group: 'kullanim', order: 5, summary: 'Ürün/hizmet, varyant oluşturma, fiyat belirleme ve çok daha fazlası' },
  { slug: 'depo-takip', group: 'kullanim', order: 6, summary: 'Stok, ürün ve depo yönetimi' },
  { slug: 'cari-hesaplar', group: 'kullanim', order: 7, summary: 'Personel, tekrarlı maaşlar ve müşteri yönetimi' },
  { slug: 'kolaybi-finans', group: 'kullanim', order: 8, summary: 'Banka, kasa, çek, senet ekleme ve yönetme' },
  { slug: 'projeler', group: 'kullanim', order: 9, summary: 'Proje bazlı fatura takibi, Proje gelir-gider yönetimi' },
  { slug: 'kolaybi-raporlar', group: 'kullanim', order: 10, summary: 'Alış- satış, cari bakiye, banka kasa raporları' },
  { slug: 'ek-ozellikler', group: 'ek', order: 1, summary: 'İşletmenizi hızlandıracak ek özellikler' },
  { slug: 'mukellef-bilgilendirme-kolaybilink', group: 'link', order: 1, summary: 'Önemli duruyu ve güncellemeleri anında iletin.' },
  { slug: 'mukellef-takibi-kolaybilink', group: 'link', order: 2, summary: 'Siz neredeyseniz mükellefiniz orada.' },
  { slug: 'destek-sorgulama-ve-e-fatura-aktarimi-kolaybilink', group: 'link', order: 3, summary: 'Anlaşmalı entegratörlerle en kolay Luca aktarımı' },
  { slug: 'beyanname-ve-gorev-takibi-kolaybilink', group: 'link', order: 4, summary: "KolayBi'Link ile yapılacak işleri görüntüleyin ve atayın" },
  { slug: 'beyanname-ve-bildirge-takibi-kolaybilink', group: 'link', order: 5, summary: 'Mükelleflerinize ait beyannameleri anında görüntüleyin.' },
  { slug: 'abonelik', group: 'diger', order: 1 },
  { slug: 'ayarlar', group: 'diger', order: 2 },
  { slug: 'destek', group: 'diger', order: 3 },
]
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : undefined

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromFeatures({ config: payload.config, features: editorFeatures })
const text = (el: Element | null | undefined) => (el?.textContent || '').replace(/\s+/g, ' ').trim()
const DIR = path.join(process.cwd(), '.cache/destek-img'); mkdirSync(DIR, { recursive: true })

// Webflow görseli → Görseller (dosya adı: Webflow ön eki atılır; aynı ad varsa yeniden yüklenmez)
const ids = new Map<string, number | string>()
async function gorsel(src: string, alt: string) {
  if (ids.has(src)) return ids.get(src)!
  let name = decodeURIComponent(path.basename(new URL(src).pathname)).replace(/^[0-9a-f]{24}_/, '')
  name = name.normalize('NFC').replace(/[^\w.-]+/g, '-').toLowerCase()
  const webp = name.replace(/\.(jpe?g|png|gif)$/i, '.webp')
  const found = await payload.find({ collection: 'media', where: { filename: { in: [name, webp] } }, limit: 1, depth: 0 })
  let id = found.docs[0]?.id
  if (!id) {
    const file = path.join(DIR, name)
    if (!existsSync(file)) {
      const r = await fetch(src)
      if (!r.ok) { console.warn('  görsel alınamadı:', src); return null }
      writeFileSync(file, Buffer.from(await r.arrayBuffer()))
    }
    id = (await payload.create({ collection: 'media', data: { alt }, filePath: file })).id
  }
  ids.set(src, id)
  return id
}

for (const m of MAKALELER.filter((x) => !only || x.slug === only)) {
  const res = await fetch(m.url || `https://www.kolaybi.com/destek/${m.slug}`)
  if (!res.ok) { console.warn('alınamadı:', m.slug, res.status); continue }
  const doc = new JSDOM(await res.text()).window.document
  const title = text(doc.querySelector('h1'))
  const metaTitle = text(doc.querySelector('title'))
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || undefined
  // Makale gövdesi (rehber sayfası dört ayrı bloktan oluşur)
  const parcalar = [...doc.querySelectorAll('.guide-body, .guide-body-start')]
  const el = doc.createElement('div')
  parcalar.forEach((p) => el.append(...[...p.childNodes].map((n) => n.cloneNode(true))))
  // Başlık düzeni: H1'den sonra H2 gelsin (H3 → H2, H4 → H3; rehberde H4 → H2)
  const ust = el.querySelector('h3') ? 'h3' : 'h4'
  el.querySelectorAll(ust === 'h3' ? 'h3, h4' : 'h4').forEach((h) => {
    const yeni = doc.createElement(h.tagName === (ust === 'h3' ? 'H3' : 'H4') ? 'h2' : 'h3'); yeni.innerHTML = h.innerHTML; h.replaceWith(yeni)
  })
  el.querySelectorAll('*').forEach((e) => { for (const a of [...e.attributes]) if (!['href', 'src', 'alt'].includes(a.name)) e.removeAttribute(a.name) })
  el.querySelectorAll('p').forEach((p) => { if (!text(p) && !p.querySelector('img')) p.remove() })
  // görünmez karakterden ibaret başlıklar (Webflow'da kalan \u200d) atılır
  el.querySelectorAll('h2, h3').forEach((h) => { if (!text(h).replace(/[\u200b-\u200d\ufeff]/g, '').trim()) h.remove() })
  el.querySelectorAll('a:not([href]), a[href=""], a[href="#"]').forEach((a) => a.replaceWith(...a.childNodes))
  let n = 0
  const altyazi = new Map<string, string>() // görsel → figür altyazısı (canlıdaki figcaption)
  for (const img of [...el.querySelectorAll('img')]) {
    const fig = img.closest('figure')
    const id = await gorsel(img.getAttribute('src') || '', `${title} ekran görüntüsü ${++n}`)
    if (id == null) { (fig || img).remove(); continue }
    const cap = text(fig?.querySelector('figcaption'))
    if (cap) altyazi.set(String(id), cap)
    const node = doc.createElement('img')
    node.setAttribute('data-lexical-upload-relation-to', 'media'); node.setAttribute('data-lexical-upload-id', String(id))
    ;(fig || img).replaceWith(node)
  }
  const body = convertHTMLToLexical({ editorConfig, html: el.innerHTML, JSDOM })
  const walk = (x: { type?: string; value?: unknown; fields?: unknown; children?: unknown[] }) => {
    if (x.type === 'upload') { const c = altyazi.get(String(x.value)); x.fields = c ? { caption: c } : {}; x.value = isNaN(Number(x.value)) ? x.value : Number(x.value) }
    ;(x.children as typeof x[] | undefined)?.forEach(walk)
  }
  walk(body.root as never)
  const data = { title, slug: m.slug, group: m.group, order: m.order, summary: m.summary, body, metaTitle, metaDescription }
  const ex = await payload.find({ collection: 'support', where: { slug: { equals: m.slug } }, limit: 1, depth: 0 })
  if (ex.docs[0]) await payload.update({ collection: 'support', id: ex.docs[0].id, data: data as never })
  else await payload.create({ collection: 'support', data: data as never })
  console.log('✓', m.slug, '·', title, '·', `${text(el).split(' ').length} kelime, ${n} görsel`)
}
process.exit(0)
