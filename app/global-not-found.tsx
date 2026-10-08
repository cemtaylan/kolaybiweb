// Hiçbir sayfayla eşleşmeyen adresler için 404 (sitenin menüsü ve alt bilgisiyle). Yönlendirmeler proxy.ts'te önce uygulanır.
import type { Metadata } from 'next'
import { NotFoundBody } from '@/lib/NotFoundBody'

export const metadata: Metadata = { title: 'Sayfa bulunamadı | KolayBi', robots: { index: false } }

export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/renkler.css?v=7" />
        <link rel="stylesheet" href="/css/site.css?v=80" />
      </head>
      <body>
        <NotFoundBody />
      </body>
    </html>
  )
}
