// Blog yazılarının başlık, SEO başlığı ve özetlerindeki yazım hatalarını düzeltir; e-belge adlarını sitedeki yazıma getirir
// (e-Fatura, e-Arşiv, e-İmza…; "Pos" → "POS"). Metin gövdesine dokunmaz. Tekrar çalıştırmak güvenli.
// Kullanım: npm run fix:blog-texts            (yerel)  ·  bulut ortamında DATABASE_URI ile canlı veritabanına
import nextEnv from '@next/env'
import { duzelt } from './blog-text-rules'
const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })

const r = await payload.find({ collection: 'posts', limit: 1000, pagination: false, depth: 0, draft: false, select: { title: true, metaTitle: true, description: true, slug: true } })
let n = 0
for (const p of r.docs as { id: number; slug: string; title: string; metaTitle?: string | null; description?: string | null }[]) {
  const data: Record<string, string> = {}
  for (const k of ['title', 'metaTitle', 'description'] as const) {
    const v = p[k]
    if (v && duzelt(v) !== v) data[k] = duzelt(v)
  }
  if (!Object.keys(data).length) continue
  await payload.update({ collection: 'posts', id: p.id, data: data as never })
  n++
  for (const [k, v] of Object.entries(data)) console.log(`✓ ${p.slug} · ${k}: ${v}`)
}
console.log('güncellenen yazı:', n)
process.exit(0)
