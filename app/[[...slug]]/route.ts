// Geçiş dönemi rotası: henüz React'e taşınmamış her sayfa legacy/ altındaki HTML'iyle birebir sunulur.
// Derleme sırasında tüm sayfalar statik olarak üretilir (Vercel'de CDN'den servis edilir).
import { legacyHtml, legacySlugs } from '@/lib/legacy'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return legacySlugs().map((slug) => ({ slug }))
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await ctx.params
  const html = legacyHtml(slug.map(decodeURIComponent))
  if (html === null) return new Response('Sayfa bulunamadı', { status: 404 })
  // CMS'teki açılır pencereler her sayfada (pencere yoksa yalnızca küçük bir JSON isteği yapar)
  const page = html.replace('</body>', '<script type="module" src="/js/track.js?v=2"></script>\n<script type="module" src="/js/popups.js?v=4"></script>\n</body>')
  return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
