import path from 'node:path'
import type { CollectionConfig } from 'payload'

// Blog kapakları, içerik görselleri, yazar fotoğrafları.
// Yerelde media/ klasörüne yazılır; Vercel'de bulut depolamaya (Vercel Blob) bağlanacak.
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Görsel', plural: 'Görseller' },
  access: { read: () => true },
  admin: { group: 'İçerik' },
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'card', width: 640 }, // liste kartları
      { name: 'cover', width: 1280 }, // yazı kapağı
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [{ name: 'alt', type: 'text', label: 'Alternatif metin', admin: { description: 'Görme engelli kullanıcılar ve Google için görselin kısa açıklaması' } }],
}
