// Hiçbir sayfayla eşleşmeyen adresler için 404 (sitenin menüsü ve alt bilgisiyle). Yönlendirmeler proxy.ts'te önce uygulanır.
import type { Metadata } from 'next'
import { NotFoundBody } from '@/lib/NotFoundBody'

export const metadata: Metadata = { title: 'Sayfa bulunamadı | KolayBi', robots: { index: false } }

export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <head>
        <link rel="preload" href="/fonts/jakarta.woff2?v=1" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter.woff2?v=1" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/css/renkler.css?v=7" />
        <link rel="stylesheet" href="/css/site.css?v=84" />
      </head>
      <body>
        <NotFoundBody />
      </body>
    </html>
  )
}
