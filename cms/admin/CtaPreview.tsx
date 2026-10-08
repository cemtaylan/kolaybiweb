'use client'
// Editörde çağrı kutusu / buton bloğunun içinde canlı önizleme: alanlar değiştikçe sitedeki görünümü anında gösterir.
import { useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import { buttonHTML, ctaHTML, yanHTML } from '../cta-html'
import { SiteFrame } from './SiteFrame'

export function CtaPreview({ tur = 'cta', prefix = '' }: { tur?: 'cta' | 'button' | 'yan'; prefix?: string }) {
  const [fields] = useAllFormFields()
  const [mobil, setMobil] = useState(false)
  // Blok alanlarının yolu editörde farklı öneklerle gelebilir; adın son parçasına göre okunur
  // prefix verilirse (ör. "Blog CTA ayarları"ndaki orta/yan grupları) yalnızca o grubun alanları okunur
  const v = (name: string) => {
    const e = prefix ? Object.entries(fields).find(([k]) => k === `${prefix}.${name}`) : Object.entries(fields).find(([k]) => k === name || k.endsWith('.' + name))
    return (e?.[1]?.value as string | null | undefined) ?? null
  }
  const html = tur === 'yan'
    // sitede dar ekranda gizlenen yan kart önizlemede her genişlikte görünsün
    ? `<style>.side-cta{display:block!important}</style><div style="max-width:290px">${yanHTML({ title: v('title'), text: v('text'), button: v('button'), link: v('link') || '#' })}</div>`
    : tur === 'button'
    ? buttonHTML({ text: v('text'), link: v('link') || '#', variant: v('variant'), align: v('align'), color: v('color'), hoverColor: v('hoverColor') })
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
      <SiteFrame html={html || '<p style="color:#8A93A6">Buton yazısı ve bağlantısını girin.</p>'} mobil={mobil} prose={tur !== 'yan'} />
    </div>
  )
}
