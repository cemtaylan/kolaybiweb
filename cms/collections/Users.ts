import { APIError, type CollectionConfig, type Field } from 'payload'
import { ALANLAR, tamYetkili } from '../access'

// Yönetim paneline giriş yapan kişiler ve yetkileri. Kullanıcı ekleme/silme ve yetki verme yalnızca tam yetkilide;
// herkes kendi adını ve şifresini değiştirebilir.
const sadeceYonetici = { create: ({ req }: { req: { user: unknown } }) => tamYetkili(req.user as never), update: ({ req }: { req: { user: unknown } }) => tamYetkili(req.user as never) }

// Sol menüdeki bölümlerle aynı sıra ve gruplar
const gruplar = [...new Set(ALANLAR.map((a) => a.grup))]
// Her bölümün adı ve altında kutucuklar alt alta
const yetkiAlanlariBaslikli: Field[] = gruplar.flatMap((g, i) => [
  { name: `baslik_${i}`, type: 'ui', admin: { components: { Field: { path: '/cms/admin/YetkiBaslik#YetkiBaslik', clientProps: { label: g } } } } } as Field,
  ...ALANLAR.filter((a) => a.grup === g).map((a) => ({ name: a.key, type: 'checkbox', label: a.label, defaultValue: false, admin: { className: 'kb-yetki-cb' } }) as Field),
])

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Ayarlar',
    defaultColumns: ['email', 'name', 'role'],
    // yalnızca oturum açmış ve tam yetkili olmayan kişiden gizlenir (giriş sayfası bu koleksiyona bağlı; oturumsuz gizlenirse sayfa döngüye girer)
    hidden: ({ user }) => !!user && !tamYetkili(user as never),
    description: 'Panele giriş yapabilen kişiler. "Seçili menüler" rolündeki kişi yalnızca işaretlediğiniz bölümleri görür ve düzenler.',
  },
  access: {
    // tam yetkili herkesi, diğerleri yalnızca kendini görür ve düzenler
    read: ({ req }) => (tamYetkili(req.user as never) ? true : req.user ? { id: { equals: req.user.id } } : false),
    create: ({ req }) => tamYetkili(req.user as never),
    delete: ({ req }) => tamYetkili(req.user as never),
    update: ({ req }) => (tamYetkili(req.user as never) ? true : req.user ? { id: { equals: req.user.id } } : false),
  },
  hooks: {
    // Tam yetkili kişi kendi rolünü düşüremez (panel yöneticisiz kalmasın)
    beforeChange: [({ req, data, originalDoc, operation }) => {
      if (operation === 'update' && originalDoc && req.user?.id === originalDoc.id && originalDoc.role !== 'editor' && data.role === 'editor') {
        throw new APIError('Kendi rolünüzü "Seçili menüler" yapamazsınız. Önce başka bir kişiyi tam yetkili yapın; o kişi sizin rolünüzü değiştirebilir.', 400, undefined, true)
      }
      return data
    }],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Ad Soyad' },
    {
      name: 'role', type: 'select', label: 'Rol', required: true, defaultValue: 'editor', access: sadeceYonetici,
      options: [
        { label: 'Tam yetkili (her şeyi yönetir, kullanıcı ekler)', value: 'admin' },
        { label: 'Seçili menüler', value: 'editor' },
      ],
      admin: { description: 'Tam yetkili kişi kullanıcı ekleyip yetki verebilir.' },
    },
    {
      name: 'yetki', type: 'group', label: 'Menü yetkileri', access: sadeceYonetici,
      admin: { condition: (data) => data?.role === 'editor', description: 'İşaretlenen bölümler bu kişinin sol menüsünde görünür; işaretlenmeyenlere erişemez.' },
      fields: yetkiAlanlariBaslikli,
    },
  ],
}
