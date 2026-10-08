import type { CollectionConfig } from 'payload'

// Çerezsiz site analitiği: günlük toplamlar. Her satır bir "kova"dır (gün + tür + sayfa + ilan + olay + cihaz + kaynak)
// ve /collect isteği geldiğinde sayacı 1 artırılır (cms/analytics.ts). Ziyaretçiye ait hiçbir kişisel veri tutulmaz.
// Panelde menüde görünmez; raporlar /admin/analitik ekranındadır.
export const Analytics: CollectionConfig = {
  slug: 'analytics',
  labels: { singular: 'Analitik kaydı', plural: 'Analitik kayıtları' },
  access: { read: ({ req }) => !!req.user, create: () => false, update: () => false, delete: ({ req }) => !!req.user },
  admin: { group: false, useAsTitle: 'bucket' },
  timestamps: true,
  fields: [
    { name: 'bucket', type: 'text', required: true, unique: true },
    { name: 'day', type: 'text', required: true, index: true }, // YYYY-MM-DD (İstanbul saati)
    { name: 'kind', type: 'text', required: true }, // page | popup | cta | notfound (404; label = gelinen site)
    { name: 'path', type: 'text', required: true },
    { name: 'popup', type: 'number' }, // ilan kimliği (kind = popup)
    { name: 'event', type: 'text', required: true }, // page: view | session | visitor | new · popup: view | click | close · cta: signup | signup_visitor | login | contact
    { name: 'device', type: 'text', required: true }, // desktop | mobile
    { name: 'source', type: 'text' }, // session ve cta satırlarında: direct | search | social | other | ai
    { name: 'label', type: 'text' }, // cta: butonun yeri ve yazısı
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
  ],
}
