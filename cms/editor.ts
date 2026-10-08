import { BlocksFeature, EXPERIMENTAL_TableFeature, FixedToolbarFeature, type LexicalEditorProps, UploadFeature } from '@payloadcms/richtext-lexical'
import { ButtonBlock, CtaBlock } from './blocks'

type FeaturesInput = NonNullable<LexicalEditorProps['features']>

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
  // Yazı içine hazır çağrı kutusu (CTA) ve buton: editörde "+" menüsünden ya da / komutuyla eklenir
  BlocksFeature({ blocks: [CtaBlock, ButtonBlock] }),
  // Editörün üstünde sabit araç çubuğu: biçimlendirme ve "Ekle" menüsü (çağrı kutusu, buton, tablo, görsel)
  FixedToolbarFeature(),
]
