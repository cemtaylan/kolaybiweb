// Çerezsiz ölçüm: sayfa görüntüleme ve oturum başlangıcı (kaynak: doğrudan / arama / sosyal / yapay zekâ / diğer).
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

// Botları ve önizleme isteklerini sayma
if (!/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) && document.visibilityState !== 'prerender') {
  let first = false
  try { if (!sessionStorage.getItem('kb:s')) { sessionStorage.setItem('kb:s', '1'); first = true } } catch {}
  track({ t: 'page', ...(first ? { s: source() } : {}) })
}
