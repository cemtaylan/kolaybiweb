'use client'
// Sitenin gerçek CSS'iyle yalıtılmış önizleme çerçevesi (panel stilleri karışmaz). Yükseklik içeriğe göre ayarlanır.
// Bağlantılar tıklanmaz ama üzerine gelme (hover) çalışır; buton renkleri denenebilir.
import { useEffect, useRef, useState } from 'react'
import { SPRITE } from '../cta-html'

const CSS = ['/css/renkler.css?v=7', '/css/site.css?v=80', '/css/post.css?v=11']

export function SiteFrame({ html, mobil = false, title = 'Önizleme', prose = true }: { html: string; mobil?: boolean; title?: string; prose?: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [h, setH] = useState(160)
  const doc = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
${CSS.map((c) => `<link rel="stylesheet" href="${c}">`).join('')}
<style>html,body{margin:0;background:#fff}body{padding:4px 20px}.prose>:first-child{margin-top:12px!important}.prose>:last-child{margin-bottom:12px!important}a{cursor:pointer}</style>
<script>document.addEventListener('click',function(e){if(e.target.closest('a'))e.preventDefault()})</script>
</head><body>${SPRITE}<div class="${prose ? 'prose' : 'kb-noprose'}" style="${prose ? '' : 'padding:12px 0'}">${html}</div></body></html>`
  // Yükseklik: yüklenince ve içerik (font, CSS) değiştikçe ölçülür
  const roRef = useRef<ResizeObserver | null>(null)
  // gövdenin kendi yüksekliği (belge yüksekliği çerçeveden küçük olamayacağı için küçülmeyi yakalamaz)
  const olc = () => { const b = ref.current?.contentDocument?.body; if (b) setH(Math.ceil(b.getBoundingClientRect().height) + 2) }
  const yuklendi = () => {
    olc()
    roRef.current?.disconnect()
    const b = ref.current?.contentDocument?.body
    if (b) { roRef.current = new ResizeObserver(olc); roRef.current.observe(b) }
    setTimeout(olc, 300); setTimeout(olc, 1200)
  }
  useEffect(() => () => roRef.current?.disconnect(), [])
  // Çerçeve React bağlanmadan yüklendiyse (sunucuda üretilen sayfa) load olayı kaçar; o durumda elle ölç
  useEffect(() => {
    const d = ref.current?.contentDocument
    if (d?.readyState === 'complete' && d.body?.childElementCount) yuklendi()
  }, [doc]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`kb-sf${mobil ? ' is-mobile' : ''}`}>
      <iframe ref={ref} title={title} srcDoc={doc} style={{ height: h }} onLoad={yuklendi} />
    </div>
  )
}
