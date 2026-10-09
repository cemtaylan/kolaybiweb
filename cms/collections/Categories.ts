import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { gizle, yazabilir } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategori', plural: 'Kategoriler' },
  access: { read: () => true, create: yazabilir('kategoriler'), update: yazabilir('kategoriler'), delete: yazabilir('kategoriler') },
  admin: {
    hidden: gizle('kategoriler'), useAsTitle: 'title', group: 'Blog', defaultColumns: ['title', 'slug', 'theme', 'order'] },
  defaultSort: 'order',
  // Blog listesi kategorileri önbellekten okur: değişiklikte 'posts' etiketi yenilenir
  hooks: {
    afterChange: [() => { try { revalidateTag('posts', 'max') } catch { /* betik bağlamı */ } }],
    afterDelete: [() => { try { revalidateTag('posts', 'max') } catch { /* betik bağlamı */ } }],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Ad', required: true, admin: { description: 'Sitede görünen ad, örn. e-Fatura' } },
    { name: 'slug', type: 'text', label: 'Adres', required: true, unique: true, index: true, admin: { description: 'Filtre adresi, örn. e-fatura' } },
    {
      name: 'theme',
      type: 'select',
      label: 'Renk teması',
      defaultValue: 'theme-ofis',
      options: [
        { label: 'Ofis (mavi)', value: 'theme-ofis' },
        { label: 'Jet (turkuaz)', value: 'theme-jet' },
        { label: 'Banka (lacivert)', value: 'theme-banka' },
        { label: 'Link (çivit mavisi)', value: 'theme-link' },
      ],
    },
    { name: 'order', type: 'number', label: 'Sıra', admin: { description: 'Blog filtrelerindeki sırası' } },
  ],
}
