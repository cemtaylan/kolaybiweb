import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { editorFeatures } from '../editor'
import { gizle, yazabilir } from '../access'

// Destek merkezi makaleleri: /destek/<adres>. Kullanım kılavuzu (/kullanici-kilavuzu) bu makaleleri gruplarına göre listeler.
// "Başlarken" grubundaki kullanici-rehberi makalesi kök adreste (/kullanici-rehberi) gösterilir.
export const DESTEK_GRUPLARI = [
  { label: 'Başlarken', value: 'baslangic' },
  { label: 'Kullanım Rehberi', value: 'kullanim' },
  { label: 'Ek Özellikler', value: 'ek' },
  { label: 'KolayBi Link', value: 'link' },
  { label: 'Diğer', value: 'diger' },
] as const

export const Support: CollectionConfig = {
  slug: 'support',
  labels: { singular: 'Destek makalesi', plural: 'Destek makaleleri' },
  access: { read: () => true, create: yazabilir('destek'), update: yazabilir('destek'), delete: yazabilir('destek') },
  admin: {
    hidden: gizle('destek'),
    group: 'İçerik',
    useAsTitle: 'title',
    defaultColumns: ['title', 'group', 'order', 'updatedAt'],
    description: 'Destek merkezindeki kullanım anlatımları. Kullanım kılavuzu sayfası bu makaleleri gruplarına ve sıralarına göre listeler.',
  },
  hooks: {
    afterChange: [({ doc, previousDoc }) => {
      try {
        revalidatePath(doc.slug === 'kullanici-rehberi' ? '/kullanici-rehberi' : `/destek/${doc.slug}`)
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/destek/${previousDoc.slug}`)
        revalidatePath('/kullanici-kilavuzu')
        revalidatePath('/destek')
      } catch { /* betik bağlamı */ }
    }],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Başlık', required: true },
    { type: 'row', fields: [
      { name: 'slug', type: 'text', label: 'Adres', required: true, unique: true, index: true, admin: { width: '40%', description: '/destek/ sonrası, örn. cari-hesaplar' } },
      { name: 'group', type: 'select', label: 'Grup', required: true, defaultValue: 'kullanim', options: [...DESTEK_GRUPLARI], admin: { width: '35%' } },
      { name: 'order', type: 'number', label: 'Sıra', admin: { width: '25%', description: 'Gruptaki sırası' } },
    ] },
    { name: 'summary', type: 'text', label: 'Kısa açıklama', admin: { description: 'Kullanım kılavuzundaki kartta başlığın altında görünür' } },
    { name: 'body', type: 'richText', label: 'Metin', editor: lexicalEditor({ features: editorFeatures }) },
    { type: 'row', fields: [
      { name: 'metaTitle', type: 'text', label: 'Tarayıcı başlığı (SEO)', admin: { width: '50%' } },
      { name: 'metaDescription', type: 'text', label: 'Açıklama (SEO)', admin: { width: '50%' } },
    ] },
  ],
}
