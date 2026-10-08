import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { editorFeatures } from '../editor'
import { gizle, yazabilir } from '../access'

// Düz metin sayfaları (yasal metinler, kurumsal sayfalar). Adres sitede sabittir: app/(site)/<adres>/page.tsx
// bu koleksiyondaki aynı adresli kaydı gösterir. Yeni bir adres açmak kod gerektirir; mevcut sayfaların metni buradan düzenlenir.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Sayfa', plural: 'Sayfalar' },
  access: { read: () => true, create: yazabilir('sayfalar'), update: yazabilir('sayfalar'), delete: yazabilir('sayfalar') },
  admin: {
    hidden: gizle('sayfalar'),
    group: 'İçerik',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: 'Gizlilik politikası, çerez politikası gibi metin sayfaları. Kaydettiğinizde sitede birkaç saniye içinde güncellenir.',
  },
  hooks: {
    afterChange: [({ doc, previousDoc }) => {
      try { revalidatePath(`/${doc.slug}`); if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/${previousDoc.slug}`) } catch { /* betik bağlamı */ }
    }],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Başlık', required: true },
    { type: 'row', fields: [
      { name: 'slug', type: 'text', label: 'Adres', required: true, unique: true, index: true, admin: { width: '50%', description: 'Sitedeki adres, örn. gizlilik-politikasi (değiştirilirse sayfa açılmaz; kod tarafında da aynı adres olmalı)' } },
      { name: 'metaTitle', type: 'text', label: 'Tarayıcı başlığı (SEO)', admin: { width: '50%' } },
    ] },
    { name: 'metaDescription', type: 'textarea', label: 'Açıklama (SEO)' },
    { name: 'body', type: 'richText', label: 'Metin', editor: lexicalEditor({ features: editorFeatures }) },
    { name: 'pdf', type: 'text', label: 'PDF belgesi', admin: { description: 'Doluysa metnin altında PDF gösterilir ve indirilebilir, örn. /docs/kvkk.pdf' } },
  ],
}
