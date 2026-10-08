// CMS'teki yönlendirmeleri uygular (Yönlendirmeler koleksiyonu). Liste /redirects.json'dan alınır ve
// sunucu belleğinde 60 sn tutulur; her istekte veritabanına gidilmez. Liste alınamazsa istek olduğu gibi geçer.
import { NextResponse, type NextRequest } from 'next/server'

type Map = Record<string, [string, number]>
let cache: { at: number; map: Map } = { at: 0, map: {} }
let loading: Promise<void> | null = null
const TTL = 60_000

async function load(origin: string) {
  try {
    const r = await fetch(`${origin}/redirects.json`, { headers: { 'x-kb-proxy': '1' } })
    if (r.ok) cache = { at: Date.now(), map: await r.json() }
    else cache = { ...cache, at: Date.now() }
  } catch {
    cache = { ...cache, at: Date.now() }
  }
}

const norm = (p: string) => {
  try { p = decodeURIComponent(p) } catch { /* olduğu gibi */ }
  return (p.replace(/\/+$/, '') || '/').toLowerCase()
}

export async function proxy(req: NextRequest) {
  if (Date.now() - cache.at > TTL) {
    loading ||= load(req.nextUrl.origin).finally(() => { loading = null })
    // ilk istekte listeyi bekle, sonrakilerde eski listeyle devam et (arka planda yenilenir)
    if (!cache.at) await loading
  }
  const hit = cache.map[norm(req.nextUrl.pathname)]
  if (!hit) return NextResponse.next()
  const [to, status] = hit
  const url = new URL(to, req.nextUrl.origin)
  if (!url.search && req.nextUrl.search) url.search = req.nextUrl.search // kampanya parametreleri (utm vb.) korunur
  return NextResponse.redirect(url, status)
}

export const config = {
  // Panel, API, statik dosyalar ve ölçüm uçları hariç tüm adresler
  matcher: ['/((?!_next/|api/|admin|css/|js/|img/|fonts/|media/|collect|popups\\.json|redirects\\.json|favicon|robots\\.txt|sitemap).*)'],
}
