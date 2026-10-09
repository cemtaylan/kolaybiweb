// /kullanici-kilavuzu: destek makalelerinin gruplu listesi (CMS > Destek makaleleri). Başlık ve açıklamalar canlı sayfadan.
import type { Metadata } from 'next'
import { renderBody, SITE } from '@/lib/blog'
import { destek, destekAdres, destekler } from '@/lib/SupportPage'
import { Kartlar, SupportHub } from '@/lib/SupportHub'

export const revalidate = false // makale kaydedilince yenilenir

export const metadata: Metadata = {
  title: { absolute: 'Kullanıcı Kılavuzu | KolayBi Destek' },
  description: 'KolayBi Kullanım Rehberi ile KolayBi Ön Muhasebe Programına dair tüm detaylara sahip olabilir, dilediğiniz her yerden destek alabilirsiniz.',
  alternates: { canonical: `${SITE}/kullanici-kilavuzu` },
}

// "Ek Özellikler" kartları tek makaledeki başlıklara gider (canlı sayfadaki kart metinleri)
const EK = [
  { baslik: 'e-İmza Başvurusu', aciklama: 'Siz neredeyseniz imzanız orada' },
  { baslik: 'e-Fatura Entegrasyon', aciklama: '10 dakikada ücretsiz entegrasyon', h: 'e-Fatura Entegrasyonları' },
  { baslik: 'KolayBi’ Banka', aciklama: "20'den fazla Banka ile entegrasyon", h: 'Banka Entegrasyonları' },
  { baslik: 'Sanal POS', aciklama: 'Uzaktan tahsilatlarınızı kolayca gerçekleştirin!', h: 'Sanal Pos' },
  { baslik: 'Pazaryeri Entegrasyon', aciklama: 'E - ticaretinizi uçtan uca yönetmenin kolay yolu', h: 'Pazaryeri Entegrasyonu' },
  { baslik: 'Serbest Meslek Makbuzu', aciklama: 'Kolay ve Hızlı makbuz kesme' },
  { baslik: 'Diğer Ek Özellikler', aciklama: 'İşletmenizi hızlandıracak ek özellikler' },
]
const BASLARKEN = ['Hesap nasıl oluşturulur?', 'Nasıl giriş yaparım?', 'Nasıl abonelik alırım?', 'Nasıl şirket oluştururum?']

export default async function Kilavuz() {
  const tum = await destekler()
  const grup = (g: string) => tum.filter((d) => d.group === g).map((d) => ({ href: destekAdres(d.slug), baslik: d.title, aciklama: d.summary }))
  // başlık kimlikleri makale sayfasındakiyle aynı üretilir
  const tocOf = async (slug: string) => { const d = await destek(slug); return d ? renderBody(d.body as never).toc : [] }
  const [rehber, ek] = await Promise.all([tocOf('kullanici-rehberi'), tocOf('ek-ozellikler')])
  const ekId = (b: string) => ek.find((t) => t.text.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR'))?.id
  return (
    <SupportHub crumbs={[{ href: '/destek', l: 'Destek' }, { l: 'Kullanım Kılavuzu' }]} h1="KolayBi Kullanıcı Kılavuzu: Adım Adım Başlangıç"
      lead="Ürün Özellikleri ve İşlevleri Hakkında Detaylı Bilgi İçin Kullanım Kılavuzu">
      <section className="sh-sec"><h2>Başlarken</h2>
        <Kartlar items={BASLARKEN.map((b, i) => ({ baslik: b, href: `/kullanici-rehberi${rehber[i] ? '#' + rehber[i].id : ''}` }))} />
      </section>
      <section className="sh-sec"><h2>Kullanım Rehberi</h2><p>KolayBi&apos; Ön Muhasebe Programı hakkında merak ettiğiniz tüm kullanım özelliklerine göz atın!</p>
        <Kartlar items={grup('kullanim')} />
      </section>
      <section className="sh-sec"><h2>Ek Özellikler</h2><p>Ürün Özellikleri ve İşlevleri Hakkında Detaylı Bilgi İçin Kullanım Kılavuzu</p>
        <Kartlar items={EK.map((k) => { const id = ekId(k.h || k.baslik); return { ...k, href: `/destek/ek-ozellikler${id ? '#' + id : ''}` } })} />
      </section>
      <section className="sh-sec"><h2>KolayBi’ Link</h2><p>KolayBi’ Link Mali Müşavirlerin işlerini kolaylaştırması ve büro yönetimi için geliştirilmiş yazılım programıdır. Siz neredeyseniz, mükellefiniz orada!</p>
        <Kartlar items={grup('link')} />
      </section>
      {grup('diger').length > 0 && <section className="sh-sec"><h2>Diğer rehberler</h2><Kartlar items={grup('diger')} /></section>}
    </SupportHub>
  )
}
