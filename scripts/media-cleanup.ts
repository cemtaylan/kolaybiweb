// Hiçbir yazı, yazar ya da metin içinde kullanılmayan görselleri siler (aktarım tekrarlarından kalan kopyalar).
// Kullanım: npm run media:cleanup            → yalnız listeler
//           npm run media:cleanup -- --sil   → siler
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })
const used = new Set<string>()
const walk = (n: any) => { if (n?.type === 'upload') used.add(String(n.value?.id ?? n.value)); n?.children?.forEach(walk) }
const posts = await payload.find({ collection: 'posts', limit: 5000, depth: 0, pagination: false, draft: true })
for (const p of posts.docs as any[]) { if (p.cover) used.add(String(p.cover)); walk(p.body?.root) }
const authors = await payload.find({ collection: 'authors', limit: 500, depth: 0, pagination: false })
for (const a of authors.docs as any[]) if (a.photo) used.add(String(a.photo))
const media = await payload.find({ collection: 'media', limit: 10000, depth: 0, pagination: false })
const unused = (media.docs as any[]).filter((m) => !used.has(String(m.id)))
console.log(`${media.docs.length} görsel · ${used.size} kullanılıyor · ${unused.length} kullanılmıyor`)
if (process.argv.includes('--sil')) {
  for (const m of unused) await payload.delete({ collection: 'media', id: m.id })
  console.log(`${unused.length} görsel silindi`)
}
process.exit(0)
