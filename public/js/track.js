// Çerezsiz ölçüm. Tarayıcıda yalnızca beş küçük işaret tutulur (localStorage), sunucuya kimlik gönderilmez:
//   kb:d  son görülen gün      → günde ilk görüntülemede "tekil ziyaretçi" sayılır
//   kb:t  son etkinlik zamanı  → 30 dk hareketsizlikten sonra yeni "ziyaret" (oturum) başlar, kaynağıyla birlikte
//   kb:f  ilk ziyaret işareti  → hiç yoksa "yeni ziyaretçi" sayılır
//   kb:k  ziyaretin kaynağı    → kayıt/giriş/iletişim tıklamaları hangi kaynaktan gelen ziyarette oldu
//   kb:c  son kayıt tıklama günü → kayıt oranı için tarayıcı başına günde bir "kayda tıklayan ziyaretçi"
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
const bugun = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
const ls = { get: (k) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch {} } }

const bot = /bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || document.visibilityState === 'prerender'
// 404 sayfası: sayfa istatistiğine girmez, "bulunamayan sayfa" olarak ve hangi siteden gelindiğiyle kaydedilir
const notFound = !!document.getElementById('kb-404')
if (!bot && notFound) {
  let r = 'direct'
  try { if (document.referrer) r = new URL(document.referrer).hostname.replace(/^www\./, '') || 'direct' } catch {}
  track({ t: '404', r })
}

// Botları ve önizleme isteklerini sayma
if (!bot && !notFound) {
  const now = Date.now()
  const gun = bugun()
  const veri = { t: 'page' }
  if (ls.get('kb:d') !== gun) { veri.u = 1; ls.set('kb:d', gun) }
  if (!ls.get('kb:f')) { veri.n = 1; ls.set('kb:f', '1') }
  if (!(now - Number(ls.get('kb:t')) < OTURUM)) { veri.s = source(); ls.set('kb:k', veri.s) }
  ls.set('kb:t', String(now))
  track(veri)
}

// Dönüşüm tıklamaları: kayıt (app.kolaybi.com kayıt formu, ofis.kolaybi.com kayıt), giriş, iletişim (telefon, e-posta, WhatsApp)
function hedef(href) {
  if (/^(tel:|mailto:)|\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'contact'
  let u
  try { u = new URL(href, location.href) } catch { return null }
  if (u.hostname === 'app.kolaybi.com') return /activeForm=login/.test(u.search) ? 'login' : 'signup'
  if (u.hostname === 'ofis.kolaybi.com' && /registration/.test(u.pathname)) return 'signup'
  return null
}
// Butonun yeri: ilan, üst menü, alt bilgi, ilk bölüm, son bölüm ya da bulunduğu bölümün başlığı
function yer(a) {
  if (a.closest('.kbp')) return 'İlan'
  if (a.closest('header, .header')) return 'Üst menü'
  if (a.closest('footer, .footer')) return 'Alt bilgi'
  const main = document.querySelector('main')
  const sec = main && [...main.children].find((c) => c.contains(a))
  if (!sec) return 'Sayfa içi'
  if (sec === main.firstElementChild) return 'İlk bölüm'
  if (sec === main.lastElementChild) return 'Son bölüm'
  const h = sec.querySelector('h2, h3')?.textContent?.replace(/\s+/g, ' ').trim()
  return h ? `Bölüm: ${h.length > 40 ? h.slice(0, 39) + '…' : h}` : 'Sayfa içi'
}
function tikla(e) {
  const a = e.target instanceof Element && e.target.closest('a[href]')
  if (!a) return
  const tur = hedef(a.getAttribute('href'))
  if (!tur) return
  const yazi = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  const veri = { t: 'cta', e: tur, l: `${yer(a)} · ${yazi || 'Bağlantı'}`, s: ls.get('kb:k') || 'direct' }
  if (tur === 'signup' && ls.get('kb:c') !== bugun()) { veri.f = 1; ls.set('kb:c', bugun()) }
  track(veri)
}
document.addEventListener('click', tikla, true)
document.addEventListener('auxclick', (e) => { if (e.button === 1) tikla(e) }, true) // orta tuşla yeni sekmede açma
