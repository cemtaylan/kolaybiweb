import type { CollectionConfig } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import { readingTime, slugFromTitle } from '../hooks'
import { CTA_PRESETS } from '../blocks'
import { gizle, yazabilir } from '../access'

// Blog yazıları. Taslak → yayın akışı açık; yayınlanan yazı /blog/<slug> adresinde görünür.
// Gövdenin ortasındaki deneme kutusu (inline CTA) şablon tarafından eklenir, burada saklanmaz.
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Yazı', plural: 'Yazılar' },
  access: { read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }), create: yazabilir('yazilar'), update: yazabilir('yazilar'), delete: yazabilir('yazilar') },
  admin: {
    hidden: gizle('yazilar'),
    useAsTitle: 'title',
    group: 'Blog',
    defaultColumns: ['cover', 'title', 'category', 'publishedAt', '_status'],
    listSearchableFields: ['title', 'slug'],
    pagination: { defaultLimit: 20 },
    // "Önizleme" düğmesi yazıyı sitede açar
    preview: (doc) => (doc?.slug ? `/blog/${doc.slug}` : null),
  },
  defaultSort: '-publishedAt',
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: {
    beforeChange: [readingTime],
    // Yayınlanan/güncellenen yazının sayfası ve blog listesi yeniden üretilir (Vercel ISR)
    afterDelete: [() => { try { revalidateTag('posts', 'max'); revalidatePath('/blog') } catch { /* betik bağlamı */ } }],
    afterChange: [
      ({ doc, previousDoc }) => {
        try {
          revalidatePath(`/blog/${doc.slug}`)
          if (previousDoc?.slug && previousDoc.slug !== doc.slug) revalidatePath(`/blog/${previousDoc.slug}`)
          revalidatePath('/blog')
          revalidateTag('posts', 'max')
        } catch {
          // betiklerden (içe aktarma) çalışırken Next.js bağlamı yoktur
        }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Başlık', required: true },
    {
      type: 'row',
      fields: [
        { name: 'slug', type: 'text', label: 'Adres', required: true, unique: true, index: true, hooks: { beforeValidate: [slugFromTitle] }, admin: { description: 'Boş bırakırsanız başlıktan otomatik oluşur. /blog/ sonrası, örn. e-fatura-nedir', width: '50%' } },
        { name: 'readingMinutes', type: 'number', label: 'Okuma süresi (dk)', admin: { width: '25%', description: 'Boşsa metinden hesaplanır' } },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'İçerik',
          fields: [
            { name: 'cover', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
            { name: 'body', type: 'richText', label: 'Metin' },
            {
              name: 'faq',
              type: 'array',
              label: 'Sıkça sorulan sorular',
              labels: { singular: 'Soru', plural: 'Sorular' },
              fields: [
                { name: 'question', type: 'text', label: 'Soru', required: true },
                { name: 'answer', type: 'textarea', label: 'Cevap', required: true },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoPreview', type: 'ui', admin: { components: { Field: '/cms/admin/SeoPreview#SeoPreview' } } },
            { name: 'metaTitle', type: 'text', label: 'Sayfa başlığı (title)', admin: { description: 'Boş bırakılırsa "Başlık | KolayBi" kullanılır' } },
            { name: 'description', type: 'textarea', label: 'Açıklama (meta description)', admin: { description: 'Google sonuçlarında görünen 150–160 karakterlik özet; liste kartında da kullanılır' } },
          ],
        },
      ],
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategori', required: true, admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'authors', label: 'Yazar', admin: { position: 'sidebar' } },
    {
      name: 'ortaCta', type: 'select', label: 'Yazı ortası CTA', defaultValue: 'genel', admin: { position: 'sidebar', description: 'Yazının ortasına otomatik eklenen çağrı kutusu. Yazıya kendiniz CTA eklerseniz otomatik kutu çıkmaz.' },
      options: [
        { label: 'Genel ayar (Blog CTA ayarları)', value: 'genel' },
        { label: 'Bu yazıda gösterme', value: 'gizle' },
        ...Object.entries(CTA_PRESETS).map(([value, p]) => ({ label: `Hazır: ${p.label}`, value })),
      ],
    },
    { name: 'publishedAt', type: 'date', label: 'Yayın tarihi', admin: { position: 'sidebar', description: 'Boş bırakılırsa yazı listenin sonunda, tarihsiz görünür', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
    { name: 'contentUpdatedAt', type: 'date', label: 'Güncellenme tarihi', admin: { position: 'sidebar', description: 'İçerik güncellendiyse yazıda "Güncellendi" olarak görünür', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
  ],
}
