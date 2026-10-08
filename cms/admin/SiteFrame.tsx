'use client'
// Sitenin gerçek CSS'iyle yalıtılmış önizleme çerçevesi (panel stilleri karışmaz). Yükseklik içeriğe göre ayarlanır.
import { useEffect, useRef, useState } from 'react'
import { SPRITE } from '../cta-html'

const CSS = ['/css/renkler.css?v=7', '/css/site.css?v=79', '/css/post.css?v=4']

export function SiteFrame({ html, mobil = false, title = 'Önizleme' }: { html: string; mobil?: boolean; title?: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [h, setH] = useState(160)
  const doc = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
${CSS.map((c) => `<link rel="stylesheet" href="${c}">`).join('')}
<style>html,body{margin:0;background:#fff}body{padding:4px 20px}.prose>:first-child{margin-top:12px!important}.prose>:last-child{margin-bottom:12px!important}a{pointer-events:none}</style>
</head><body>${SPRITE}<div class="prose">${html}</div></body></html>`
  useEffect(() => {
    const f = ref.current
    if (!f) return
    let ro: ResizeObserver | undefined
    const olc = () => { const b = f.contentDocument?.body; if (b) setH(Math.ceil(b.scrollHeight) + 2) }
    const yuklendi = () => { olc(); const b = f.contentDocument?.body; if (b) { ro = new ResizeObserver(olc); ro.observe(b) } setTimeout(olc, 400) }
    f.addEventListener('load', yuklendi)
    return () => { f.removeEventListener('load', yuklendi); ro?.disconnect() }
  }, [doc])
  return (
    <div className={`kb-sf${mobil ? ' is-mobile' : ''}`}>
      <iframe ref={ref} title={title} srcDoc={doc} style={{ height: h }} />
    </div>
  )
}
