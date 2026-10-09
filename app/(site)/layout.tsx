// React'e taşınan site sayfalarının kök yerleşimi (yönetim paneli (payload) grubunda ayrı)
import type React from 'react'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preload" href="/fonts/jakarta.woff2?v=1" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter.woff2?v=1" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/css/renkler.css?v=7" />
        <link rel="stylesheet" href="/css/site.css?v=91" />
      </head>
      <body>{children}</body>
    </html>
  )
}
