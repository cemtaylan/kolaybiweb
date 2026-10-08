import type { CollectionConfig } from 'payload'
import { gizle, yazabilir } from '../access'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Yazar', plural: 'Yazarlar' },
  access: { read: () => true, create: yazabilir('yazarlar'), update: yazabilir('yazarlar'), delete: yazabilir('yazarlar') },
  admin: {
    hidden: gizle('yazarlar'), useAsTitle: 'name', group: 'Blog' },
  fields: [
    { name: 'name', type: 'text', label: 'Ad Soyad', required: true },
    { name: 'role', type: 'text', label: 'Unvan', admin: { description: 'Örn. İçerik Ekibi, Mali Müşavir' } },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Fotoğraf' },
    { name: 'bio', type: 'textarea', label: 'Kısa biyografi' },
  ],
}
