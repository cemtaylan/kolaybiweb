'use client'
// Açılır pencere canlı önizlemesi: sitedeki aynı HTML ve CSS ile, bir tarayıcı çerçevesinin içinde gösterilir.
import { useEffect, useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
// Sitedeki düz JS modülü: site ve önizleme aynı HTML'i üretir
import { popupHTML } from '../../public/js/popup-markup.js'

const val = (f: { value?: unknown } | undefined) => (f?.value as string | undefined) || ''

export function PopupPreview() {
  const f = useFormFields(([fields]) => ({
    design: val(fields.design) || 'klasik', theme: val(fields.theme) || 'ofis', eyebrow: val(fields.eyebrow),
    title: val(fields.title), text: val(fields.text), buttonText: val(fields.buttonText), buttonLink: val(fields.buttonLink) || '#',
    image: fields.image?.value as number | string | { url?: string } | undefined,
  }))
  const [img, setImg] = useState<string | null>(null)
  const [mobil, setMobil] = useState(false)
  useEffect(() => {
    const v = f.image
    if (!v) return setImg(null)
    if (typeof v === 'object') return setImg(v.url || null)
    let iptal = false
    fetch(`/api/media/${v}?depth=0`).then((r) => r.json()).then((m) => { if (!iptal) setImg(m?.sizes?.cover?.url || m?.url || null) }).catch(() => {})
    return () => { iptal = true }
  }, [f.image])
  const html = popupHTML({ ...f, image: img, title: f.title || 'Başlığınız burada görünür', text: f.text || (f.title ? '' : 'Metin alanını doldurduğunuzda burada görünür.') }, { preview: true })
  return (
    <div className="kb-pp">
      <div className="kb-pp-head">
        <span>Canlı önizleme</span>
        <div className="kb-pp-toggle" role="group" aria-label="Önizleme genişliği">
          <button type="button" className={!mobil ? 'on' : ''} onClick={() => setMobil(false)}>Masaüstü</button>
          <button type="button" className={mobil ? 'on' : ''} onClick={() => setMobil(true)}>Mobil</button>
        </div>
      </div>
      <div className={`kb-pp-frame${mobil ? ' is-mobile' : ''}`}>
        <div className="kb-pp-bar"><i /><i /><i /><span>kolaybi.com</span></div>
        <div className="kb-pp-page" aria-hidden="true">
          <div className="kb-pp-skel"><b /><p /><p /><p className="s" /></div>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  )
}
