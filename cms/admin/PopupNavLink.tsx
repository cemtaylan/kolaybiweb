'use client'
// Sol menüde "Açılır pencere yönetimi" bağlantısı
import { usePathname } from 'next/navigation'

export function PopupNavLink() {
  const on = usePathname()?.startsWith('/admin/pencereler')
  return (
    <a href="/admin/pencereler" className={`kb-navlink${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="6" y="7" width="8" height="6" rx="1.2" fill="currentColor" /></svg>
      Açılır pencere yönetimi
    </a>
  )
}
