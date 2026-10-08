'use client'
// Sol menüde "Pazarlama" grubu: İlan oluştur ve Aktif ve Pasif İlanlar.
// İlanlar koleksiyonu menüden gizli (group: false); grup CSS ile Blog grubunun altına yerleşir.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavGroup } from '@payloadcms/ui'

const LINKS = [
  { href: '/admin/collections/popups/create', l: 'İlan oluştur', on: (p: string) => p.startsWith('/admin/collections/popups') },
  { href: '/admin/ilanlar', l: 'Aktif ve Pasif İlanlar', on: (p: string) => p.startsWith('/admin/ilanlar') },
]

export function PopupNavLink() {
  const path = usePathname() || ''
  return (
    <div className="kb-navgroup">
      <NavGroup label="Pazarlama">
        {LINKS.map((x) => {
          const on = x.on(path)
          return (
            <Link key={x.href} href={x.href} className="nav__link" prefetch={false} aria-current={on ? 'page' : undefined}>
              {on && <div className="nav__link-indicator" />}
              <span className="nav__link-label">{x.l}</span>
            </Link>
          )
        })}
      </NavGroup>
    </div>
  )
}
