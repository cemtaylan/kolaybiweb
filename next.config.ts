import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

// Önbellek kuralları eski _headers dosyasından taşındı.
const nextConfig: NextConfig = {
  // Yayındaki adreslerle birebir: sonda "/" yok (/fiyatlar/ → /fiyatlar)
  trailingSlash: false,
  async headers() {
    return [
      // CSS ve JS her sayfada ?v= sürümüyle çağrılıyor; içerik değişince sürüm de değişir
      { source: '/css/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/js/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // Görseller ve SVG animasyonları: 30 gün (dosya yenilenirse bağlantıya ?v= eklenir)
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    ]
  },
}

export default withPayload(nextConfig)
