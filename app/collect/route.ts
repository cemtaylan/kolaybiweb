// Sitedeki /js/track.js'in gönderdiği olaylar (sayfa görüntüleme, oturum, ilan görüntüleme/tıklama/kapatma).
// Çerez ve kişisel veri yok; yalnızca günlük sayaçlar artırılır. Botlar ve geçersiz istekler sessizce yok sayılır.
import { getPayload } from 'payload'
import config from '@payload-config'
import { bump, type Hit } from '@/cms/analytics'

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram/i
const PATH = /^\/[a-z0-9\-/]{0,150}$/
const SOURCES = ['direct', 'search', 'social', 'ai', 'other']
const ok = () => new Response(null, { status: 204 })

export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') || '')) return ok()
  let b: { t?: string; p?: string; d?: string; s?: string; id?: number; e?: string }
  try { b = JSON.parse(await req.text()) } catch { return ok() }
  const path = String(b.p || '').toLowerCase().replace(/\/+$/, '') || '/'
  if (!PATH.test(path)) return ok()
  const device = b.d === 'mobile' ? 'mobile' : 'desktop'
  const hits: Hit[] = []
  if (b.t === 'page') {
    hits.push({ kind: 'page', path, event: 'view', device })
    if (b.s) hits.push({ kind: 'page', path, event: 'session', device, source: SOURCES.includes(b.s) ? b.s : 'other' })
  } else if (b.t === 'popup' && Number.isInteger(b.id) && ['view', 'click', 'close'].includes(b.e || '')) {
    hits.push({ kind: 'popup', path, popup: b.id, event: b.e!, device })
  }
  if (!hits.length) return ok()
  try {
    const payload = await getPayload({ config })
    for (const h of hits) await bump(payload, h)
  } catch (e) {
    console.error('collect', e)
  }
  return ok()
}
