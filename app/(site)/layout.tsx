// React'e taşınan site sayfalarının kök yerleşimi (yönetim paneli (payload) grubunda ayrı)
import type React from 'react'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/css/renkler.css?v=7" />
        <link rel="stylesheet" href="/css/site.css?v=79" />
      </head>
      <body>{children}</body>
    </html>
  )
}
