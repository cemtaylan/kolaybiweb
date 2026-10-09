import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { gizle, yazabilir } from '../access'

// Blog kapakları, içerik görselleri, yazar fotoğrafları.
// Yerelde media/ klasörüne yazılır; Vercel'de bulut depolamaya (Vercel Blob) bağlanacak.
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Görsel', plural: 'Görseller' },
  access: { read: () => true, create: yazabilir('gorseller', 'yazilar', 'yazarlar', 'ilanlar'), update: yazabilir('gorseller', 'yazilar', 'yazarlar', 'ilanlar'), delete: yazabilir('gorseller') },
  admin: {
    hidden: gizle('gorseller'), group: 'İçerik' },
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'], // video: yazı içi Video bloğu için
    imageSizes: [
      { name: 'card', width: 640 }, // liste kartları
      { name: 'cover', width: 1280 }, // yazı kapağı
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    // Görseller CDN'de bir yıl önbelleklenir: her istek sunucuya ve veritabanına uğramaz.
    // Güvenli, çünkü aynı adla yüklenen dosyaya Payload yeni ad verir (ör. gorsel-1.webp).
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable')
      return headers
    },
  },
  fields: [{ name: 'alt', type: 'text', label: 'Alternatif metin', admin: { description: 'Görme engelli kullanıcılar ve Google için görselin kısa açıklaması' } }],
}
