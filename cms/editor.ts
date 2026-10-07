import { EXPERIMENTAL_TableFeature, type FeaturesInput, UploadFeature } from '@payloadcms/richtext-lexical'

// Yazı gövdesinin editör özellikleri: CMS alanı ve içe aktarma betiği aynı ayarı kullanır.
export const editorFeatures: FeaturesInput = ({ defaultFeatures }) => [
  ...defaultFeatures.filter((f) => f.key !== 'upload'),
  // Metin içi görsellerde altyazı (eski yazılardaki figcaption)
  UploadFeature({
    collections: {
      media: {
        fields: [
          { name: 'caption', type: 'text', label: 'Altyazı' },
          { name: 'captionLink', type: 'text', label: 'Altyazı bağlantısı', admin: { description: 'Doluysa altyazı bu adrese bağlanır, örn. /fiyatlar' } },
        ],
      },
    },
  }),
  EXPERIMENTAL_TableFeature(),
]
