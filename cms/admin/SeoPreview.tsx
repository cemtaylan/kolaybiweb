'use client'
// SEO sekmesi: Google sonuç önizlemesi ve başlık/açıklama uzunluk göstergeleri (yazarken anında güncellenir)
import { useFormFields } from '@payloadcms/ui'

const SINIR = { title: [30, 60], desc: [120, 160] } as const

function Olcu({ n, aralik }: { n: number; aralik: readonly [number, number] }) {
  const [min, max] = aralik
  const durum = n === 0 ? 'bos' : n < min ? 'kisa' : n > max ? 'uzun' : 'iyi'
  const yazi = { bos: 'Boş', kisa: 'Kısa', uzun: 'Uzun — Google kesebilir', iyi: 'İdeal' }[durum]
  return (
    <div className={`kb-meter is-${durum}`}>
      <div className="kb-meter-bar"><i style={{ width: `${Math.min(100, (n / max) * 100)}%` }} /></div>
      <span>{n} / {max} karakter · {yazi}</span>
    </div>
  )
}

export function SeoPreview() {
  const f = useFormFields(([fields]) => ({
    title: (fields.title?.value as string) || '',
    metaTitle: (fields.metaTitle?.value as string) || '',
    description: (fields.description?.value as string) || '',
    slug: (fields.slug?.value as string) || '',
  }))
  const baslik = f.metaTitle || (f.title ? `${f.title} | KolayBi` : '')
  return (
    <div className="kb-seo">
      <div className="kb-seo-label">Google önizlemesi</div>
      <div className="kb-serp">
        <div className="kb-serp-site">
          <span className="kb-serp-fav">K</span>
          <div><b>KolayBi</b><small>www.kolaybi.com › blog › {f.slug || 'yazi-adresi'}</small></div>
        </div>
        <div className="kb-serp-title">{baslik || 'Sayfa başlığı burada görünür'}</div>
        <div className="kb-serp-desc">{f.description || 'Açıklama (meta description) burada görünür. Yazıyı özetleyen, tıklamaya davet eden 150–160 karakterlik bir metin yazın.'}</div>
      </div>
      <div className="kb-seo-meters">
        <div><small>Sayfa başlığı</small><Olcu n={baslik.length} aralik={SINIR.title} /></div>
        <div><small>Açıklama</small><Olcu n={f.description.length} aralik={SINIR.desc} /></div>
      </div>
    </div>
  )
}
