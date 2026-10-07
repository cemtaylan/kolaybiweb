# KolayBi Web (Next.js)

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Yapı (geçiş dönemi)

| Klasör | İçerik |
|---|---|
| `public/css`, `public/js`, `public/img` | Statik varlıklar; adresleri aynı (`/css/site.css?v=…`) |
| `legacy/` | Henüz React'e taşınmamış sayfaların HTML'i (`legacy/fiyatlar/index.html` → `/fiyatlar`) |
| `app/[[...slug]]/route.ts` | `legacy/` sayfalarını birebir sunan genel rota; derlemede statik üretilir |
| `lib/legacy.ts` | `legacy/` dosyalarını bulan ve okuyan yardımcılar |
| `next.config.ts` | Önbellek başlıkları (eski `_headers`), sonda "/" olmayan adresler |

Bir sayfa React'e ya da CMS'e taşındığında `app/` altında kendi rotası açılır ve
ilgili `legacy/…/index.html` silinir; özel rota genel rotanın önüne geçer.

## Yol haritası

1. Birebir taşıma: tüm sayfalar Next.js'ten aynen sunuluyor ✅
2. Ortak parçaları bileşene çevirme: menü, footer, SSS, kampanya, CTA
3. Payload CMS: blog (227 yazı) ve sonraki içerik alanları, `/admin`
4. Vercel'e yayın (Postgres veritabanı ile)
