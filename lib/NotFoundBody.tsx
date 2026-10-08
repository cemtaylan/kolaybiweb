// 404 içeriği (canlı kolaybi.com'daki metin ve bağlantılar, güncel adresleriyle). global-not-found ve (site)/not-found kullanır.
// #kb-404 işareti track.js'e bu görüntülemenin "bulunamadı" olduğunu söyler (Analitik > Bulunamayan sayfalar).
import Script from 'next/script'
import { blogFooter, blogHeader } from '@/lib/partials'

const LINKS = [
  { href: '/', l: 'Ana Sayfa' },
  { href: '/e-arsiv', l: 'e-Arşiv' },
  { href: '/e-fatura', l: 'e-Fatura' },
  { href: '/blog', l: 'Blog' },
  { href: '/siparis-takip-programi', l: 'Sipariş Yönetimi' },
]

const CSS = `
.nf { padding: clamp(56px, 9vw, 120px) 0; text-align: center; }
.nf-code { display: block; font: 800 clamp(88px, 16vw, 168px)/1 var(--font-head); letter-spacing: -.04em; background: linear-gradient(120deg, var(--logo-blue), var(--logo-mid) 50%, var(--logo-cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.nf h1 { max-width: 680px; margin: 18px auto 0; font: 800 clamp(24px, 3.2vw, 36px)/1.2 var(--font-head); color: var(--navy); }
.nf p { margin: 28px 0 16px; font-weight: 600; color: var(--ink-2); }
.nf-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.nf-links a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 20px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: var(--navy); font-weight: 600; text-decoration: none; transition: border-color .2s, color .2s; }
.nf-links a:hover { border-color: var(--primary); color: var(--primary); }
.nf-links a:first-child { background: var(--primary); border-color: var(--primary); color: #fff; }
`

export function NotFoundBody() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogHeader() }} />
      <main>
        <section className="nf">
          <div className="container">
            <span className="nf-code" aria-hidden="true">404</span>
            <h1>Böyle bir sayfa bulamadık ama bir sorun varsa düzeltmeye başladık bile!</h1>
            <p>KolayBi&apos;yi keşfetmeye devam et</p>
            <nav className="nf-links" aria-label="Önerilen sayfalar">
              {LINKS.map((x) => <a key={x.href} href={x.href}>{x.l}</a>)}
            </nav>
          </div>
        </section>
      </main>
      <div id="kb-404" hidden />
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: blogFooter() }} />
      {/* Blog yazısı bulunamayınca bu içerik sayfaya akışla eklenir; düz <script> çalışmaz, Script bileşeni yükler */}
      <Script src="/js/menu.js?v=5" strategy="afterInteractive" />
      <Script src="/js/track.js?v=4" type="module" strategy="afterInteractive" />
    </>
  )
}
