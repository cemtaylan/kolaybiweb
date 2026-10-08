// Her tasarımdan bir örnek açılır pencere oluşturur (hepsi kapalı; panelde tasarımları görmek için).
// Metinler sitedeki mevcut kampanya ve ürün metinlerinden alınmıştır. Tekrar çalıştırmak güvenli (ada göre atlar).
import nextEnv from '@next/env'
const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target
const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })

const img = async (name: string) => (await payload.find({ collection: 'media', where: { filename: { equals: name } }, limit: 1, depth: 0 })).docs[0]?.id
const REG = 'https://app.kolaybi.com/?activeForm=register'
const kapak = await img('2026-fatura-duzenleme-siniri-ve-cezalar-guncel-rehber.webp')

const ORNEKLER = [
  { name: 'Örnek 1 · Klasik', design: 'klasik', theme: 'ofis', eyebrow: 'Yeni kullanıcılara özel', title: 'e-Faturaya geçişte 3 büyük avantaj', text: 'Sınırsız e-Fatura kontörü, 1 yıllık e-İmza ve banka entegrasyonu PLUS paketlerinde ücretsiz.', buttonText: 'Kampanyayı İnceleyin', buttonLink: '/kolaybi-e-faturam' },
  { name: 'Örnek 2 · Yan görselli', design: 'yan-gorsel', theme: 'ofis', eyebrow: 'Blog', title: '2026 fatura düzenleme sınırı ve cezalar', text: 'Fatura kesme ve almama cezaları, e-defter berat süreleri ve güncel tutarlar tek rehberde.', buttonText: 'Rehberi Okuyun', buttonLink: '/blog/2026-fatura-duzenleme-siniri-ve-cezalar-guncel-rehber' },
  { name: 'Örnek 3 · Köşe kartı', design: 'kose', theme: 'jet', eyebrow: 'KolayBi Jet', title: 'Sadece e-Fatura mı kesiyorsunuz?', text: 'Jet ile hemen başlayın.', buttonText: 'Jet’i İnceleyin', buttonLink: '/kolaybi-jet' },
  { name: 'Örnek 4 · Alt şerit', design: 'serit', theme: 'ofis', title: '14 gün ücretsiz deneyin', text: 'Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.', buttonText: 'Hemen Başlayın', buttonLink: REG },
  { name: 'Örnek 5 · Tam ekran', design: 'tam-ekran', theme: 'lacivert', eyebrow: 'Yeni', title: 'KolayBi AI ile yazarak muhasebe', text: 'Fatura kesin, stok sorun, cari ekstre alın. Web, WhatsApp veya Telegram’dan yazın.', buttonText: 'AI Muhasebeyi Keşfedin', buttonLink: '/ai-muhasebe' },
  { name: 'Örnek 6 · Yan panel', design: 'yan-panel', theme: 'acik', eyebrow: 'Mali müşavirler için', title: 'KolayBi Link ücretsiz', text: 'Mükelleflerinizin faturalarına ve belgelerine anında ulaşın; Luca entegrasyonu dahil.', buttonText: 'Link’i İnceleyin', buttonLink: '/bilink' },
]
for (const o of ORNEKLER) {
  const ex = await payload.find({ collection: 'popups', where: { name: { equals: o.name } }, limit: 1 })
  if (ex.docs[0]) { console.log('var:', o.name); continue }
  const usesImg = ['klasik', 'yan-gorsel', 'kose', 'tam-ekran', 'yan-panel'].includes(o.design)
  await payload.create({ collection: 'popups', data: { ...o, image: usesImg ? kapak : undefined, active: false, show: 'all', trigger: 'delay', delay: 5, frequency: 'days', days: 7, device: 'all' } as never })
  console.log('✓', o.name)
}
process.exit(0)
