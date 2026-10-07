import type { CollectionConfig } from 'payload'

// Yönetim paneline giriş yapan editörler
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  auth: true,
  admin: { useAsTitle: 'email', group: 'Ayarlar' },
  fields: [{ name: 'name', type: 'text', label: 'Ad Soyad' }],
}
