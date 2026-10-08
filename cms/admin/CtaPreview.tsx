'use client'
// Editörde çağrı kutusu / buton bloğunun içinde canlı önizleme: alanlar değiştikçe sitedeki görünümü anında gösterir.
import { useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import { buttonHTML, ctaHTML } from '../cta-html'
import { SiteFrame } from './SiteFrame'

export function CtaPreview({ tur = 'cta' }: { tur?: 'cta' | 'button' }) {
  const [fields] = useAllFormFields()
  const [mobil, setMobil] = useState(false)
  // Blok alanlarının yolu editörde farklı öneklerle gelebilir; adın son parçasına göre okunur
  const v = (name: string) => {
    const e = Object.entries(fields).find(([k]) => k === name || k.endsWith('.' + name))
    return (e?.[1]?.value as string | null | undefined) ?? null
  }
  const html = tur === 'button'
    ? buttonHTML({ text: v('text'), link: v('link') || '#', variant: v('variant'), align: v('align') })
    : ctaHTML({ preset: v('preset'), style: v('style'), theme: v('theme'), title: v('title'), text: v('text'), button: v('button'), link: v('link'), note: v('note') })
  return (
    <div className="kb-cp">
      <div className="kb-pp-head">
        <span>Canlı önizleme · sitede böyle görünür</span>
        <div className="kb-pp-toggle" role="group" aria-label="Önizleme genişliği">
          <button type="button" className={!mobil ? 'on' : ''} onClick={() => setMobil(false)}>Masaüstü</button>
          <button type="button" className={mobil ? 'on' : ''} onClick={() => setMobil(true)}>Mobil</button>
        </div>
      </div>
      <SiteFrame html={html || '<p style="color:#8A93A6">Buton yazısı ve bağlantısını girin.</p>'} mobil={mobil} />
    </div>
  )
}
