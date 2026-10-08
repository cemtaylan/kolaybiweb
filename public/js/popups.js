// Açılır pencereler: /popups.json'daki yayındaki pencerelerden bu sayfaya, cihaza ve tarihe uyan en yüksek öncelikli
// olanı seçer; tetikleyici (süre / kaydırma / çıkış) gelince gösterir. Kapatma sıklık ayarına göre hatırlanır.
import { MODAL, popupHTML } from './popup-markup.js?v=2'
import { track } from './track.js?v=1'

const path = location.pathname.replace(/\/+$/, '') || '/'
const mobile = matchMedia('(max-width: 767px)').matches
const store = { get: (s, k) => { try { return s.getItem(k) } catch { return null } }, set: (s, k, v) => { try { s.setItem(k, v) } catch {} } }
const matches = (pattern) => (pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1).replace(/\/+$/, '') + '/') || path === pattern.slice(0, -2) : path === (pattern.replace(/\/+$/, '') || '/'))

function eligible(p) {
  const now = Date.now()
  if (p.startsAt && now < Date.parse(p.startsAt)) return false
  if (p.endsAt && now > Date.parse(p.endsAt)) return false
  if (p.device === 'desktop' && mobile) return false
  if (p.device === 'mobile' && !mobile) return false
  if (p.trigger === 'exit' && mobile) return false // dokunmatik ekranda "çıkış" algılanamaz
  const list = [...(p.pages || []), ...(p.customPaths || [])]
  if (p.show === 'include' && !list.some(matches)) return false
  if (p.show === 'exclude' && list.some(matches)) return false
  const key = 'kbp:' + p.id
  if (p.frequency === 'session' && store.get(sessionStorage, key)) return false
  if (p.frequency === 'days') { const t = Number(store.get(localStorage, key)); if (t && now - t < (p.days || 7) * 864e5) return false }
  return true
}

function remember(p) {
  const key = 'kbp:' + p.id
  if (p.frequency === 'session') store.set(sessionStorage, key, '1')
  if (p.frequency === 'days') store.set(localStorage, key, String(Date.now()))
}

function show(p) {
  if (!document.querySelector('link[href^="/css/popups.css"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/popups.css?v=2'; document.head.appendChild(l)
  }
  const wrap = document.createElement('div')
  wrap.innerHTML = popupHTML(p)
  const el = wrap.firstElementChild
  document.body.appendChild(el)
  const modal = MODAL.includes(p.design)
  const prevFocus = document.activeElement
  const prevOverflow = document.documentElement.style.overflow
  if (modal) document.documentElement.style.overflow = 'hidden'
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')))
  track({ t: 'popup', id: p.id, e: 'view' })
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    track({ t: 'popup', id: p.id, e: 'close' })
    remember(p)
    el.classList.remove('is-open')
    document.documentElement.style.overflow = prevOverflow
    removeEventListener('keydown', onKey)
    setTimeout(() => el.remove(), 350)
    if (modal && prevFocus && prevFocus.focus) prevFocus.focus()
  }
  const onKey = (e) => {
    if (e.key === 'Escape') close()
    if (e.key === 'Tab' && modal) { // odak pencerenin içinde kalsın
      const f = [...el.querySelectorAll('a[href], button')]; const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }
  addEventListener('keydown', onKey)
  el.querySelectorAll('[data-kbp-close]').forEach((b) => b.addEventListener('click', close))
  el.querySelector('[data-kbp-cta]')?.addEventListener('click', () => { track({ t: 'popup', id: p.id, e: 'click' }); remember(p) })
  if (modal) setTimeout(() => el.querySelector('.kbp-x')?.focus(), 60)
}

function arm(p) {
  let done = false
  const go = () => { if (!done) { done = true; show(p) } }
  if (p.trigger === 'scroll') {
    const on = () => { const h = document.documentElement; if ((h.scrollTop + innerHeight) / h.scrollHeight * 100 >= (p.scroll || 50)) { removeEventListener('scroll', on); go() } }
    addEventListener('scroll', on, { passive: true })
  } else if (p.trigger === 'exit') {
    const on = (e) => { if (!e.relatedTarget && e.clientY <= 0) { document.removeEventListener('mouseout', on); go() } }
    document.addEventListener('mouseout', on)
  } else setTimeout(go, Math.max(0, (p.delay ?? 5) * 1000))
}

fetch('/popups.json', { credentials: 'omit' })
  .then((r) => (r.ok ? r.json() : { popups: [] }))
  .then(({ popups = [] }) => { const p = popups.find(eligible); if (p) arm(p) })
  .catch(() => {})
