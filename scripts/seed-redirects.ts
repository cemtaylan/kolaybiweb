// Canlı kolaybi.com'dan taşınan adreslerin kalıcı (301) yönlendirmeleri. Tekrar çalıştırmak güvenli (eski adres eşleşirse günceller).
// Kullanım: npm run seed:redirects
import nextEnv from '@next/env'
const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })

// Eski blog kategori sayfaları → blog listesi o kategori seçili (canlıdaki iki adres bizde farklı yazılıyor)
const KATEGORI: Record<string, string> = {
  bankacilik: 'bankacilik', 'e-arsiv': 'e-arsiv', 'e-defter': 'e-defter', 'e-donusum': 'e-donusum', 'e-fatura': 'e-fatura',
  'e-irsaliye': 'e-irsaliye', 'e-ticaret': 'e-ticaret', girisimcilik: 'girisimcilik', hukuk: 'hukuk',
  'insan-kaynaklari': 'i-nsan-kaynaklari', 'is-gelistirme': 'i-s-gelistirme', muhasebe: 'muhasebe', teknoloji: 'teknoloji', vergi: 'vergi',
}
const LISTE: { from: string; to: string; note: string }[] = [
  { from: '/kategori', to: '/blog', note: 'Canlı site taşıma: blog kategorileri' },
  ...Object.entries(KATEGORI).map(([eski, yeni]) => ({ from: `/kategori/${eski}`, to: `/blog?kategori=${yeni}`, note: 'Canlı site taşıma: blog kategorileri' })),
]

for (const r of LISTE) {
  const ex = await payload.find({ collection: 'redirects', where: { from: { equals: r.from } }, limit: 1, depth: 0 })
  const data = { ...r, type: '301', active: true }
  if (ex.docs[0]) await payload.update({ collection: 'redirects', id: ex.docs[0].id, data: data as never })
  else await payload.create({ collection: 'redirects', data: data as never })
  console.log('✓', r.from, '→', r.to)
}
process.exit(0)
