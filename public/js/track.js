// Çerezsiz ölçüm. Tarayıcıda yalnızca üç küçük işaret tutulur (localStorage), sunucuya kimlik gönderilmez:
//   kb:d  son görülen gün      → günde ilk görüntülemede "tekil ziyaretçi" sayılır
//   kb:t  son etkinlik zamanı  → 30 dk hareketsizlikten sonra yeni "ziyaret" (oturum) başlar, kaynağıyla birlikte
//   kb:f  ilk ziyaret işareti  → hiç yoksa "yeni ziyaretçi" sayılır
// İlan olayları için popups.js aynı track() işlevini kullanır. Veriler yalnızca günlük toplam olarak saklanır.
export const path = location.pathname.replace(/\/+$/, '') || '/'
export const device = matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop'

export function track(data) {
  const body = JSON.stringify({ ...data, p: path, d: device })
  try { if (navigator.sendBeacon && navigator.sendBeacon('/collect', body)) return } catch {}
  fetch('/collect', { method: 'POST', body, keepalive: true, credentials: 'omit' }).catch(() => {})
}

function source() {
  let h = ''
  try { h = new URL(document.referrer).hostname.replace(/^www\./, '') } catch { return 'direct' }
  if (!h || h === location.hostname.replace(/^www\./, '')) return 'direct'
  if (/(^|\.)(google|bing|yandex|duckduckgo|yahoo|ecosia|search\.brave|baidu)\./.test(h)) return 'search'
  if (/(^|\.)(chatgpt|openai|perplexity|claude|gemini|copilot)\./.test(h)) return 'ai'
  if (/(^|\.)(facebook|instagram|linkedin|lnkd|t|x|twitter|youtube|tiktok|pinterest|reddit)\.(com|co|in)$/.test(h) || /^(l|m)\.facebook\.com$/.test(h)) return 'social'
  return 'other'
}

const OTURUM = 30 * 60 * 1000
const ls = { get: (k) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch {} } }

// Botları ve önizleme isteklerini sayma
if (!/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) && document.visibilityState !== 'prerender') {
  const now = Date.now()
  const gun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const veri = { t: 'page' }
  if (ls.get('kb:d') !== gun) { veri.u = 1; ls.set('kb:d', gun) }
  if (!ls.get('kb:f')) { veri.n = 1; ls.set('kb:f', '1') }
  if (!(now - Number(ls.get('kb:t')) < OTURUM)) veri.s = source()
  ls.set('kb:t', String(now))
  track(veri)
}
