// CMS içeriğinde e- önekli kelimeleri küçük e ile yazar ("E-Fatura" → "e-Fatura", "E-posta" → "e-posta").
// Adres, dosya adı ve TAMAMI BÜYÜK yazımlar (E-FATURA) değişmez. Varsayılan kuru çalıştırmadır; --yaz ile kaydeder.
// Kullanım: DATABASE_URI=... npx tsx scripts/e-kucuk-cms.ts [--yaz]
import nextEnv from '@next/env'
import { writeFileSync } from 'node:fs'
const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const yaz = process.argv.includes('--yaz')
const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })

const RE = /(?<![\p{L}\d_/.\-%])E-(?=\p{Lu}\p{Ll}|\p{Ll})/gu
// Metin içi özel durumlar: noktadan sonra boşluksuz ("verilmiştir.E-Adisyon") ve eğik çizgiyle ("Luca/E-Fatura")
const RE2 = /(?<=\p{Ll})\.E-(?=\p{Lu}\p{Ll})/gu, RE3 = /(?<=\p{L})\/E-(?=\p{Lu}\p{Ll})/gu
const ATLA = new Set(['id', 'slug', 'url', 'href', 'src', 'filename', 'mimeType', 'thumbnailURL', 'link', 'newTab', 'type', 'format', 'version', 'direction', 'mode', 'style', 'tag', 'listType', 'blockType', 'createdAt', 'updatedAt', 'publishedAt', 'contentUpdatedAt'])
const ATTR = /\b(href|src|srcset|id|class)="[^"]*"/g
const duzelt = (s: string) => {
  // HTML içeren metinde öznitelik değerlerine dokunma
  const parcalar: string[] = []; let i = 0
  for (const m of s.matchAll(ATTR)) { parcalar.push(s.slice(i, m.index).replace(RE, 'e-'), m[0]); i = m.index! + m[0].length }
  parcalar.push(s.slice(i).replace(RE, 'e-')); return parcalar.join('').replace(RE2, '. e-').replace(RE3, '/e-')
}
let sayi = 0
const gez = (v: unknown, k = ''): unknown => {
  if (typeof v === 'string') { if (ATLA.has(k) || /^(https?:|\/)/.test(v)) return v; const t = duzelt(v); if (t !== v) sayi += (v.match(RE) || []).length + (v.match(RE2) || []).length + (v.match(RE3) || []).length; return t }
  if (Array.isArray(v)) return v.map(x => gez(x, k))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([kk, x]) => [kk, gez(x, kk)]))
  return v
}
const koleksiyonlar = ['posts', 'pages', 'support', 'popups', 'authors', 'categories', 'media'] as const
let toplamDoc = 0
const yedek: { c: string; id: unknown; data: Record<string, unknown> }[] = []
for (const c of koleksiyonlar) {
  const r = await payload.find({ collection: c as never, limit: 5000, pagination: false, depth: 0 })
  let n = 0
  for (const d of r.docs as Record<string, unknown>[]) {
    const once = sayi
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(d)) {
      if (ATLA.has(k)) continue
      const t = gez(v, k)
      if (JSON.stringify(t) !== JSON.stringify(v)) data[k] = t
    }
    if (!Object.keys(data).length) continue
    n++; console.log(`${c} · ${String(d.slug ?? d.title ?? d.name ?? d.id)} · ${sayi - once} yer · ${Object.keys(data).join(', ')}`)
    yedek.push({ c, id: d.id, data: Object.fromEntries(Object.keys(data).map(k => [k, d[k]])) })
    if (yaz) await payload.update({ collection: c as never, id: d.id as never, data: data as never, context: { eKucuk: true } })
  }
  console.log(`== ${c}: ${n} belge`); toplamDoc += n
}
if (process.env.YEDEK) writeFileSync(process.env.YEDEK, JSON.stringify(yedek))
console.log(yaz ? 'KAYDEDİLDİ' : 'KURU ÇALIŞMA', '· belge', toplamDoc, '· yer', sayi)
process.exit(0)
