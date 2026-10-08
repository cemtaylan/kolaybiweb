// /destek: destek merkezi giriş sayfası (metinler canlı kolaybi.com/destek sayfasından)
import type { Metadata } from 'next'
import { SITE } from '@/lib/blog'
import { Kartlar, SupportHub } from '@/lib/SupportHub'

export const metadata: Metadata = {
  title: { absolute: 'KolayBi Destek Merkezi | Yardım ve Kullanım Rehberleri' },
  description: 'KolayBi özellikleri, kurulum adımları ve kullanım senaryoları için güncel yardım içeriklerine tek yerden ulaşın. Destek rehberlerini hemen inceleyin.',
  alternates: { canonical: `${SITE}/destek` },
}

export default function Destek() {
  return (
    <SupportHub crumbs={[{ l: 'Destek' }]} h1="Dilediğin yerden destek alma kolaylığı"
      lead={<><b>KolayBi’ Destek Sayfasına Hoş Geldiniz</b><br />Ürün Özellikleri ve İşlevleri Hakkında Detaylı Bilgi için <a href="/kullanici-kilavuzu">Kullanım Kılavuzu</a></>}>
      <Kartlar items={[
        { href: '/kullanici-kilavuzu', baslik: 'KolayBi’ Kullanım Rehberi', aciklama: 'KolayBi’ye hızlı başlangıç için aradığın her şey burada!' },
        { baslik: 'Eğitim Paketleri', aciklama: 'Online ve yüz yüze eğitim paketleri çok yakında burada!', etiket: 'Çok yakında' },
        { href: '/sikca-sorulan-sorular', baslik: 'Sık Sorulan Sorular', aciklama: 'Tüm sorularını cevapları için hemen tıkla!' },
        { href: '/iletisim', baslik: 'İletişim', aciklama: '+90 (850) 303 06 67 · iletisim@kolaybi.com' },
      ]} />
    </SupportHub>
  )
}
