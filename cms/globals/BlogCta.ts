import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { BLOG_CTA_VARSAYILAN as D, ctaFields } from '../blocks'
import { yazabilir } from '../access'

// Blog yazılarına otomatik eklenen çağrı kutuları: yazının ortasındaki kutu ve yan sütundaki kart.
// Yazar yazıya kendi çağrı kutusunu eklerse ortadaki otomatik kutu o yazıda çıkmaz; yazı bazında gizlenebilir de.
export const BlogCta: GlobalConfig = {
  slug: 'blog-cta',
  label: 'Blog CTA ayarları',
  access: { read: () => true, update: yazabilir('yazilar') },
  admin: { group: false, description: 'Her blog yazısında otomatik görünen çağrı kutuları. Kaydettiğinizde tüm yazılarda birkaç saniye içinde güncellenir.' },
  hooks: {
    afterChange: [() => { try { revalidatePath('/blog/[slug]', 'page') } catch { /* betik bağlamı */ } }],
  },
  fields: [
    {
      name: 'orta', type: 'group', label: 'Yazının ortasındaki kutu',
      admin: { description: 'Yazara kendi çağrı kutusunu eklediği yazılarda bu kutu çıkmaz. Tek bir yazıda gizlemek için yazının sağ panelindeki "Yazı ortası CTA" seçimini kullanın.' },
      fields: [
        { type: 'row', fields: [
          { name: 'aktif', type: 'checkbox', label: 'Yazılarda göster', defaultValue: D.orta.aktif, admin: { width: '40%', style: { alignSelf: 'center' } } },
          { name: 'konum', type: 'select', label: 'Konum', required: true, defaultValue: D.orta.konum, admin: { width: '60%' },
            options: [{ label: '2. ara başlıktan önce', value: 'h2-2' }, { label: '3. ara başlıktan önce', value: 'h2-3' }, { label: 'Yazının sonunda', value: 'son' }] },
        ] },
        ...ctaFields('orta', D.orta, true),
      ],
    },
    {
      name: 'yan', type: 'group', label: 'Yan sütundaki kart',
      admin: { description: 'Masaüstünde yazının solundaki içindekiler listesinin altında görünür.' },
      fields: [
        { name: 'onizleme', type: 'ui', admin: { components: { Field: { path: '/cms/admin/CtaPreview#CtaPreview', clientProps: { tur: 'yan', prefix: 'yan' } } } } },
        { name: 'aktif', type: 'checkbox', label: 'Yazılarda göster', defaultValue: D.yan.aktif },
        { name: 'title', type: 'text', label: 'Başlık', defaultValue: D.yan.title, admin: { description: 'Vurgulamak istediğiniz kısmı *yıldız* arasına yazın' } },
        { name: 'text', type: 'textarea', label: 'Açıklama', defaultValue: D.yan.text },
        { type: 'row', fields: [
          { name: 'button', type: 'text', label: 'Buton yazısı', defaultValue: D.yan.button, admin: { width: '50%' } },
          { name: 'link', type: 'text', label: 'Buton bağlantısı', defaultValue: D.yan.link, admin: { width: '50%' } },
        ] },
      ],
    },
  ],
}
