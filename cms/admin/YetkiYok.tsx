// Yetkisi olmayan bir panel ekranı açıldığında gösterilen mesaj (sunucuda kontrol edilir)
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'

export function YetkiYok({ p }: { p: AdminViewServerProps }) {
  const { req, locale, permissions, visibleEntities } = p.initPageResult
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={p.params} payload={req.payload} permissions={permissions} searchParams={p.searchParams} user={req.user || undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="kb-an">
          <header className="kb-pb-head"><div><h1>Bu bölüme erişim yetkiniz yok</h1><p>Bu menüyü kullanmanız gerekiyorsa panel yöneticisinden yetki isteyin.</p></div></header>
          <a className="kb-btn kb-btn-primary" href="/admin" style={{ justifySelf: 'start' }}>Dashboard’a dön</a>
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
