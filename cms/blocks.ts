import type { Block } from 'payload'

// Blog yazısına eklenen hazır çağrı kutuları (CTA) ve tek buton. Metinler sitedeki mevcut sayfalardan alınmıştır.
// Görünüm: lib/blog.ts (HTML) + public/css/post.css (.bcta, .bbtn).
export const REG = 'https://app.kolaybi.com/?activeForm=register'

// Başlıkta *yıldız* arasındaki kısım sitedeki gibi vurgulanır (ör. İşinizi *KolayBi’yle* kolaylaştırın).
// Not: butonun altındaki küçük güvence satırı (sitedeki "Kredi kartı istenmez…" notu).
const NOT_DENEME = 'Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz.'
export const CTA_PRESETS = {
  deneme: { label: '14 gün ücretsiz deneme', theme: 'ofis', title: 'İşinizi *KolayBi’yle* kolaylaştırın', text: 'Ön muhasebenizi KolayBi ile yönetin. 14 gün ücretsiz deneyin, kredi kartı gerekmez.', button: '14 Gün Ücretsiz Deneyin', link: REG, note: NOT_DENEME },
  efatura: { label: 'e-Fatura kampanyası (sınırsız kontör)', theme: 'ofis', title: 'e-Faturaya *ücretsiz* geçin, kontörü unutun.', text: 'Sınırsız e-Fatura kontörü KolayBi tüm PLUS paketleri ve KolayBi Jet paketi için geçerlidir.', button: 'Kampanyayı İnceleyin', link: '/kolaybi-e-faturam', note: '' },
  jet: { label: 'KolayBi Jet (sadece e-Fatura)', theme: 'jet', title: 'Sadece e-Fatura kesecekseniz *Jet ile hemen başlayın*', text: 'Uygun fiyatlı e-Fatura programı, anahtar teslim kurulum.', button: 'Jet’i İnceleyin', link: '/kolaybi-jet', note: '' },
  banka: { label: 'Banka entegrasyonu', theme: 'banka', title: 'Bütün banka hesaplarınız *tek ekranda*', text: '25+ bankadaki hesap hareketleriniz KolayBi’ye otomatik aktarılsın, carilerinizle kendiliğinden eşleşsin.', button: 'Banka Entegrasyonunu İnceleyin', link: '/online-banka-entegrasyonu', note: '' },
  ai: { label: 'KolayBi AI', theme: 'ofis', title: 'Muhasebenizi ister yazarak *ister konuşarak* yönetin', text: 'Ne istediğinizi yazın ya da sesli söyleyin; KolayBi AI hazırlasın, siz onaylayın.', button: 'KolayBi AI’ı İnceleyin', link: '/ai-muhasebe', note: '' },
  link: { label: 'KolayBi Link (mali müşavirler)', theme: 'link', title: 'Mali müşavirler için *ücretsiz* mükellef yönetim platformu', text: 'Mükelleflerinizin e-belgelerini, beyanname ve bildirgelerini tek ekrandan takip edin; Luca entegrasyonu ile faturaları dakikalar içinde aktarın.', button: 'Link’i Ücretsiz Kullanmaya Başlayın', link: '/bilink', note: 'Mali müşavirler için ücretsiz, Luca entegrasyonu dahil.' },
  iletisim: { label: 'İletişim', theme: 'ofis', title: 'Sorularınız mı var?', text: 'Yanıt almak istediğiniz diğer sorularınız için bizimle iletişime geçebilirsiniz.', button: 'Bize Ulaşın', link: '/iletisim', note: '' },
} as const
export type CtaPreset = keyof typeof CTA_PRESETS

const THEMES = [
  { label: 'Ofis mavisi', value: 'ofis' },
  { label: 'Jet turkuazı', value: 'jet' },
  { label: 'Banka laciverti', value: 'banka' },
  { label: 'Link moru', value: 'link' },
]

export const CtaBlock: Block = {
  slug: 'cta',
  labels: { singular: 'Çağrı kutusu (CTA)', plural: 'Çağrı kutuları' },
  interfaceName: 'CtaBlock',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'preset', type: 'select', label: 'Hazır CTA', required: true, defaultValue: 'deneme', admin: { width: '38%' },
          options: [...Object.entries(CTA_PRESETS).map(([value, p]) => ({ label: p.label, value })), { label: 'Özel (metni kendim yazacağım)', value: 'ozel' }],
        },
        {
          name: 'style', type: 'select', label: 'Görünüm', required: true, defaultValue: 'acik', admin: { width: '37%' },
          // Sitedeki mevcut CTA tasarımları: blog ara kutusu, sayfa sonu kapanış bandı, blog yan sütun kartı
          options: [
            { label: 'Açık kutu (blog ara kutusu)', value: 'acik' },
            { label: 'Koyu bant (sayfa sonu kapanışı)', value: 'koyu' },
            { label: 'Koyu kart (yan sütun kutusu)', value: 'kart' },
          ],
        },
        { name: 'theme', type: 'select', label: 'Renk', options: THEMES, admin: { width: '25%', description: 'Boşsa hazır CTA’nın rengi' } },
      ],
    },
    {
      type: 'collapsible', label: 'Metni değiştir (boş alanlarda hazır metin kullanılır)', admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'Başlık', admin: { description: 'Vurgulamak istediğiniz kısmı *yıldız* arasına yazın' } },
        { name: 'text', type: 'textarea', label: 'Açıklama' },
        { type: 'row', fields: [
          { name: 'button', type: 'text', label: 'Buton yazısı', admin: { width: '50%' } },
          { name: 'link', type: 'text', label: 'Buton bağlantısı', admin: { width: '50%', placeholder: '/fiyatlar ya da https://…' } },
        ] },
        { name: 'note', type: 'text', label: 'Buton altı notu', admin: { description: 'Örn. "Kredi kartı istenmez, deneme sonunda otomatik ödeme alınmaz." Notu tamamen gizlemek için - yazın.' } },
      ],
    },
  ],
}

export const ButtonBlock: Block = {
  slug: 'button',
  labels: { singular: 'Buton', plural: 'Butonlar' },
  interfaceName: 'ButtonBlock',
  fields: [
    { type: 'row', fields: [
      { name: 'text', type: 'text', label: 'Buton yazısı', required: true, defaultValue: 'Ücretsiz Deneyin', admin: { width: '40%' } },
      { name: 'link', type: 'text', label: 'Bağlantı', required: true, defaultValue: REG, admin: { width: '60%' } },
    ] },
    { type: 'row', fields: [
      { name: 'variant', type: 'select', label: 'Stil', required: true, defaultValue: 'primary', admin: { width: '50%' },
        options: [{ label: 'Dolu (ana buton)', value: 'primary' }, { label: 'Çerçeveli', value: 'outline' }, { label: 'Koyu', value: 'dark' }] },
      { name: 'align', type: 'select', label: 'Hizalama', required: true, defaultValue: 'left', admin: { width: '50%' },
        options: [{ label: 'Sola', value: 'left' }, { label: 'Ortaya', value: 'center' }] },
    ] },
  ],
}
