import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { SITE_PAGES } from '../pages'

// Açılır pencereler: 6 tasarım, sayfa/cihaz/zamanlama hedefleme. Sitede /js/popups.js gösterir,
// verisini /popups.json'dan alır. Bir sayfa görüntülemesinde en fazla bir pencere çıkar (önceliği yüksek olan).
export const DESIGNS = [
  { label: 'Klasik — ortada kart, görsel üstte', value: 'klasik' },
  { label: 'Yan görselli — ortada geniş kart, görsel solda', value: 'yan-gorsel' },
  { label: 'Köşe kartı — sağ altta küçük kart (sayfayı kapatmaz)', value: 'kose' },
  { label: 'Alt şerit — sayfanın altında ince bant', value: 'serit' },
  { label: 'Tam ekran kampanya — koyu zeminli büyük duyuru', value: 'tam-ekran' },
  { label: 'Yan panel — sağdan açılan çekmece', value: 'yan-panel' },
] as const

export const Popups: CollectionConfig = {
  slug: 'popups',
  labels: { singular: 'Açılır pencere', plural: 'Açılır pencereler' },
  access: { read: ({ req }) => (req.user ? true : { active: { equals: true } }) },
  admin: {
    useAsTitle: 'name',
    group: 'Pazarlama',
    defaultColumns: ['name', 'design', 'show', 'active', 'priority'],
    description: 'Sitede açılan duyuru ve kampanya pencereleri. Bir sayfada aynı anda en fazla bir pencere gösterilir; birden çok pencere uyarsa önceliği yüksek olan çıkar.',
  },
  hooks: {
    afterChange: [() => { try { revalidatePath('/popups.json') } catch { /* betik bağlamı */ } }],
    afterDelete: [() => { try { revalidatePath('/popups.json') } catch { /* betik bağlamı */ } }],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Ad (yalnız panelde görünür)', required: true, admin: { width: '60%', placeholder: 'Örn. Ekim kampanyası – ana sayfa' } },
        { name: 'active', type: 'checkbox', label: 'Yayında', defaultValue: false, admin: { width: '20%', style: { alignSelf: 'center' } } },
        { name: 'priority', type: 'number', label: 'Öncelik', defaultValue: 0, admin: { width: '20%', description: 'Yüksek olan önce' } },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tasarım ve içerik',
          fields: [
            { name: 'preview', type: 'ui', admin: { components: { Field: '/cms/admin/PopupPreview#PopupPreview' } } },
            {
              type: 'row',
              fields: [
                { name: 'design', type: 'select', label: 'Tasarım', required: true, defaultValue: 'klasik', options: [...DESIGNS], admin: { width: '60%' } },
                {
                  name: 'theme', type: 'select', label: 'Renk', required: true, defaultValue: 'ofis', admin: { width: '40%' },
                  options: [
                    { label: 'Ofis mavisi', value: 'ofis' },
                    { label: 'Jet turkuazı', value: 'jet' },
                    { label: 'Lacivert', value: 'lacivert' },
                    { label: 'Açık', value: 'acik' },
                  ],
                },
              ],
            },
            { name: 'image', type: 'upload', relationTo: 'media', label: 'Görsel', admin: { description: 'Alt şerit ve köşe kartında küçük, diğerlerinde büyük gösterilir' } },
            { name: 'eyebrow', type: 'text', label: 'Üst etiket', admin: { placeholder: 'Örn. YENİ KULLANICILARA ÖZEL' } },
            { name: 'title', type: 'text', label: 'Başlık', required: true },
            { name: 'text', type: 'textarea', label: 'Metin' },
            {
              type: 'row',
              fields: [
                { name: 'buttonText', type: 'text', label: 'Düğme yazısı', admin: { width: '40%', placeholder: '14 Gün Ücretsiz Deneyin' } },
                { name: 'buttonLink', type: 'text', label: 'Düğme bağlantısı', admin: { width: '60%', placeholder: 'https://app.kolaybi.com/?activeForm=register veya /fiyatlar' } },
              ],
            },
          ],
        },
        {
          label: 'Nerede ve ne zaman',
          fields: [
            {
              name: 'show', type: 'select', label: 'Hangi sayfalarda', required: true, defaultValue: 'all',
              options: [
                { label: 'Tüm sayfalar', value: 'all' },
                { label: 'Yalnızca seçilen sayfalar', value: 'include' },
                { label: 'Seçilenler hariç tüm sayfalar', value: 'exclude' },
              ],
            },
            {
              name: 'pages', type: 'select', hasMany: true, label: 'Sayfalar', options: [...SITE_PAGES],
              admin: { condition: (_, s) => s?.show !== 'all', description: '“Tüm blog yazıları” her /blog/… sayfasını kapsar' },
            },
            {
              name: 'customPaths', type: 'text', hasMany: true, label: 'Ek adresler',
              admin: { condition: (_, s) => s?.show !== 'all', description: 'Listede olmayan adresler; * ile başlayanları kapsar (örn. /kampanyalar/*)' },
            },
            {
              type: 'row',
              fields: [
                { name: 'device', type: 'select', label: 'Cihaz', defaultValue: 'all', admin: { width: '33%' }, options: [{ label: 'Tümü', value: 'all' }, { label: 'Yalnız masaüstü', value: 'desktop' }, { label: 'Yalnız mobil', value: 'mobile' }] },
                {
                  name: 'trigger', type: 'select', label: 'Ne zaman açılsın', defaultValue: 'delay', admin: { width: '33%' },
                  options: [{ label: 'Belirli süre sonra', value: 'delay' }, { label: 'Sayfa kaydırılınca', value: 'scroll' }, { label: 'Sayfadan çıkarken (masaüstü)', value: 'exit' }],
                },
                { name: 'delay', type: 'number', label: 'Saniye', defaultValue: 5, min: 0, admin: { width: '17%', condition: (_, s) => s?.trigger === 'delay' } },
                { name: 'scroll', type: 'number', label: 'Kaydırma %', defaultValue: 50, min: 5, max: 100, admin: { width: '17%', condition: (_, s) => s?.trigger === 'scroll' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'frequency', type: 'select', label: 'Ne sıklıkla', defaultValue: 'days', admin: { width: '50%' },
                  options: [{ label: 'Her sayfa açılışında', value: 'always' }, { label: 'Oturum başına bir kez', value: 'session' }, { label: 'Kapatıldıktan X gün sonra tekrar', value: 'days' }],
                },
                { name: 'days', type: 'number', label: 'Gün', defaultValue: 7, min: 1, admin: { width: '20%', condition: (_, s) => s?.frequency === 'days' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'startsAt', type: 'date', label: 'Başlangıç', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' } } },
                { name: 'endsAt', type: 'date', label: 'Bitiş', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' } } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
