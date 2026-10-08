'use client'
// Sol menü: en üstte Dashboard, "Pazarlama" (İlan oluştur, Aktif ve Pasif İlanlar, Analitik) ve "SEO" (Yönlendirmeler, Bulunamayan sayfalar).
// İlanlar koleksiyonu menüden gizli (group: false); grup CSS ile Blog grubunun altına yerleşir.
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavGroup, useNav, useWindowInfo } from '@payloadcms/ui'

// Payload menüyü 1440 px ve altında kapalı açar. Masaüstünde (1024 px üstü) açık gelsin;
// kullanıcı menü düğmesiyle kapatırsa bu tarayıcıda kapalı kalsın.
const KAPALI = 'kb-nav-kapali'
function useNavAcik() {
  const { setNavOpen } = useNav()
  const { breakpoints: { m: orta } } = useWindowInfo()
  useEffect(() => {
    if (orta !== false) return
    let kapali = false
    try { kapali = localStorage.getItem(KAPALI) === '1' } catch {}
    if (kapali) return
    const t = setTimeout(() => setNavOpen(true), 0) // Payload'ın kendi kapatmasından sonra çalışsın
    return () => clearTimeout(t)
  }, [orta, setNavOpen])
  useEffect(() => {
    const tik = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.('.nav-toggler')) return
      setTimeout(() => {
        const acik = document.querySelector('.template-default--nav-open') !== null
        try { if (acik) localStorage.removeItem(KAPALI); else localStorage.setItem(KAPALI, '1') } catch {}
      }, 50)
    }
    document.addEventListener('click', tik, true)
    return () => document.removeEventListener('click', tik, true)
  }, [])
}

const SEO = [
  { id: 'nav-kb-yonlendirme', href: '/admin/collections/redirects', l: 'Yönlendirmeler', on: (p: string) => p.startsWith('/admin/collections/redirects') },
  { id: 'nav-kb-404', href: '/admin/404', l: 'Bulunamayan sayfalar', on: (p: string) => p.startsWith('/admin/404') },
]
const LINKS = [
  { id: 'nav-kb-ilan-olustur', href: '/admin/collections/popups/create', l: 'İlan oluştur', on: (p: string) => p.startsWith('/admin/collections/popups') },
  { id: 'nav-kb-ilanlar', href: '/admin/ilanlar', l: 'Aktif ve Pasif İlanlar', on: (p: string) => p.startsWith('/admin/ilanlar') },
  { id: 'nav-kb-analitik', href: '/admin/analitik', l: 'Analitik', on: (p: string) => p.startsWith('/admin/analitik') },
]

type NavItem = { id: string; href: string; l: string; on: (p: string) => boolean }
function Group({ label, items, path }: { label: string; items: NavItem[]; path: string }) {
  return (
    <div className="kb-navgroup">
      <NavGroup label={label}>
        {items.map((x) => {
          const on = x.on(path)
          return (
            <Link key={x.href} id={x.id} href={x.href} className="nav__link" prefetch={false} aria-current={on ? 'page' : undefined}>
              <span className="nav__link-label">{x.l}</span>
            </Link>
          )
        })}
      </NavGroup>
    </div>
  )
}

export function PopupNavLink() {
  const path = usePathname() || ''
  useNavAcik()
  const ana = path === '/admin' || path === '/admin/'
  return (
    <>
      <Link id="nav-kb-dashboard" href="/admin" className={`kb-navtop${ana ? ' is-on' : ''}`} prefetch={false} aria-current={ana ? 'page' : undefined}>
        Dashboard
      </Link>
      <Group label="Pazarlama" items={LINKS} path={path} />
      <Group label="SEO" items={SEO} path={path} />
    </>
  )
}
