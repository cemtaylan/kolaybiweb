// /admin/pencereler: tüm açılır pencereler tek sayfada, aktif ve pasif olarak ayrılmış.
// Panelin standart çerçevesi (sol menü, üst bar) içinde gösterilir; içerik istemci tarafında yönetilir.
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { PopupBoard } from './PopupBoard'

export function PopupBoardView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/pencereler')
  return (
    <DefaultTemplate
      i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions}
      searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}
    >
      <Gutter>
        <PopupBoard />
      </Gutter>
    </DefaultTemplate>
  )
}
