import type { CollectionConfig, FieldHook } from 'payload'
import { revalidatePath } from 'next/cache'
import { yazabilir } from '../access'

// Adres yönlendirmeleri: eski ya da kırık bir adrese gelen ziyaretçiyi yeni adrese gönderir (proxy.ts uygular).
// Liste /redirects.json'dan okunur ve sunucuda 60 sn önbelleklenir; kaydedince en geç 1 dk içinde geçerli olur.

/** "https://www.kolaybi.com/Eski-Sayfa/?a=1" → "/eski-sayfa" */
export const normalizePath = (v: string) => {
  let s = String(v || '').trim()
  try { if (/^https?:\/\//i.test(s)) s = new URL(s).pathname } catch { /* olduğu gibi */ }
  s = s.split(/[?#]/)[0]
  if (!s.startsWith('/')) s = '/' + s
  try { s = decodeURIComponent(s) } catch { /* olduğu gibi */ }
  return (s.replace(/\/+$/, '') || '/').toLowerCase()
}
const fromHook: FieldHook = ({ value }) => (value ? normalizePath(value) : value)
const toHook: FieldHook = ({ value }) => {
  const s = String(value || '').trim()
  return /^https?:\/\//i.test(s) ? s : s ? (s.startsWith('/') ? s : '/' + s) : s
}
const refresh = () => { try { revalidatePath('/redirects.json') } catch { /* betik bağlamı */ } }

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Yönlendirme', plural: 'Yönlendirmeler' },
  access: { read: ({ req }) => (req.user ? true : { active: { equals: true } }), create: yazabilir('yonlendirmeler', 'bulunamayan'), update: yazabilir('yonlendirmeler'), delete: yazabilir('yonlendirmeler') },
  admin: {
    group: false, // menüde SEO > Yönlendirmeler (cms/admin/PopupNavLink)
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'type', 'active', 'updatedAt'],
    description: 'Eski ya da kırık bir adrese gelen ziyaretçiyi ve arama motorunu yeni adrese gönderir. Kaydettikten sonra en geç 1 dakika içinde geçerli olur.',
  },
  hooks: { afterChange: [refresh], afterDelete: [refresh] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'from', type: 'text', label: 'Eski adres', required: true, unique: true, index: true, hooks: { beforeValidate: [fromHook] }, admin: { width: '50%', placeholder: '/eski-sayfa', description: 'Tam adres de yapıştırabilirsiniz; alan adı ve sondaki / otomatik temizlenir.' } },
        { name: 'to', type: 'text', label: 'Yeni adres', required: true, hooks: { beforeValidate: [toHook] }, admin: { width: '50%', placeholder: '/yeni-sayfa ya da https://…' },
          validate: (v: unknown, { siblingData }: { siblingData: { from?: string } }) => (v && normalizePath(String(v)) === siblingData?.from ? 'Yeni adres eski adresle aynı olamaz' : true) },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'type', type: 'select', label: 'Tür', required: true, defaultValue: '301', admin: { width: '50%' },
          options: [{ label: 'Kalıcı (301) — sayfa taşındı', value: '301' }, { label: 'Geçici (302) — kısa süreliğine', value: '302' }] },
        { name: 'active', type: 'checkbox', label: 'Etkin', defaultValue: true, admin: { width: '50%', style: { alignSelf: 'center' } } },
      ],
    },
    { name: 'note', type: 'text', label: 'Not (yalnız panelde görünür)' },
  ],
}
