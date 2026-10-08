// /admin/cta-ornekleri: blog çağrı kutularının örnekleri ve deneme alanı (yetki: Yazılar)
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { yetkili } from '../access'
import { YetkiYok } from './YetkiYok'
import { CtaGallery } from './CtaGallery'

export function CtaGalleryView(props: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = props.initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/cta-ornekleri')
  if (!yetkili(req.user as never, 'yazilar')) return <YetkiYok p={props} />
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={props.params} payload={req.payload} permissions={permissions} searchParams={props.searchParams} user={req.user} visibleEntities={visibleEntities}>
      <Gutter><CtaGallery /></Gutter>
    </DefaultTemplate>
  )
}
