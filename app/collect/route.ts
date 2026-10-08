// Sitedeki /js/track.js'in gönderdiği olaylar (sayfa görüntüleme, ziyaret, tekil/yeni ziyaretçi, ilan görüntüleme/tıklama/kapatma, kayıt/giriş/iletişim tıklamaları).
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
  let b: { t?: string; p?: string; d?: string; s?: string; u?: number; n?: number; id?: number; e?: string; l?: string; f?: number }
  try { b = JSON.parse(await req.text()) } catch { return ok() }
  const path = String(b.p || '').toLowerCase().replace(/\/+$/, '') || '/'
  if (!PATH.test(path)) return ok()
  const device = b.d === 'mobile' ? 'mobile' : 'desktop'
  const hits: Hit[] = []
  if (b.t === 'page') {
    hits.push({ kind: 'page', path, event: 'view', device })
    if (b.s) hits.push({ kind: 'page', path, event: 'session', device, source: SOURCES.includes(b.s) ? b.s : 'other' })
    if (b.u) hits.push({ kind: 'page', path, event: 'visitor', device }) // günün ilk görüntülemesi: tekil ziyaretçi
    if (b.n) hits.push({ kind: 'page', path, event: 'new', device }) // ilk kez gelen tarayıcı
  } else if (b.t === 'cta' && ['signup', 'login', 'contact'].includes(b.e || '')) {
    // dönüşüm tıklaması: butonun yeri ve yazısı (ör. "İlk bölüm · 14 Gün Ücretsiz Deneyin"), ziyaretin kaynağı
    const label = String(b.l || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 120) || 'Bağlantı'
    const source = SOURCES.includes(b.s || '') ? b.s : 'direct'
    hits.push({ kind: 'cta', path, event: b.e!, device, label, source })
    // tarayıcının günün ilk kayıt tıklaması: kayıt oranının payı (oran %100'ü geçmez)
    if (b.e === 'signup' && b.f) hits.push({ kind: 'cta', path, event: 'signup_visitor', device, source })
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
