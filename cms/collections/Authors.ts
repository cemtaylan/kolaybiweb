import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Yazar', plural: 'Yazarlar' },
  access: { read: () => true },
  admin: { useAsTitle: 'name', group: 'Blog' },
  fields: [
    { name: 'name', type: 'text', label: 'Ad Soyad', required: true },
    { name: 'role', type: 'text', label: 'Unvan', admin: { description: 'Örn. İçerik Ekibi, Mali Müşavir' } },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Fotoğraf' },
    { name: 'bio', type: 'textarea', label: 'Kısa biyografi' },
  ],
}
