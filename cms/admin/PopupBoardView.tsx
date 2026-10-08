// /admin/ilanlar: tüm açılır pencereler tek sayfada, aktif ve pasif olarak ayrılmış.
// Panelin standart çerçevesi (sol menü, üst bar) içinde gösterilir; içerik istemci tarafında yönetilir.
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { PopupBoard } from './PopupBoard'
import { popupStats } from '../analytics'

export async function PopupBoardView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=/admin/ilanlar')
  const stats = await popupStats(req.payload, 30).catch(() => ({}))
  return (
    <DefaultTemplate
      i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions}
      searchParams={searchParams} user={req.user} visibleEntities={visibleEntities}
    >
      <Gutter>
        <PopupBoard stats={stats} />
      </Gutter>
    </DefaultTemplate>
  )
}
