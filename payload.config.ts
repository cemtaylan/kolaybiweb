import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { tr } from '@payloadcms/translations/languages/tr'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'

import { Users } from './cms/collections/Users'
import { Media } from './cms/collections/Media'
import { Authors } from './cms/collections/Authors'
import { Categories } from './cms/collections/Categories'
import { Posts } from './cms/collections/Posts'
import { Analytics } from './cms/collections/Analytics'
import { Redirects } from './cms/collections/Redirects'
import { BlogCta } from './cms/globals/BlogCta'
import { Popups } from './cms/collections/Popups'
import { editorFeatures } from './cms/editor'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// Vercel'de Neon bağlantısı DATABASE_URL olarak gelir; yerelde SQLite dosyası
const DB = process.env.DATABASE_URI || process.env.DATABASE_URL || 'file:./payload.db'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · KolayBi CMS' },
    theme: 'light',
    components: {
      graphics: { Logo: '/cms/admin/Brand#Logo', Icon: '/cms/admin/Brand#Icon' },
      beforeDashboard: ['/cms/admin/Dashboard#Dashboard'],
      beforeNavLinks: ['/cms/admin/PopupNavLink#PopupNavLink'],
      views: {
        popupBoard: { Component: '/cms/admin/PopupBoardView#PopupBoardView', path: '/ilanlar', meta: { title: 'Aktif ve Pasif İlanlar' } },
        analytics: { Component: '/cms/admin/AnalyticsView#AnalyticsView', path: '/analitik', exact: true, meta: { title: 'Analitik' } },
        analyticsPages: { Component: '/cms/admin/AnalyticsDetailViews#AnalyticsPagesView', path: '/analitik/sayfalar', exact: true, meta: { title: 'Tüm sayfalar · Analitik' } },
        analyticsPage: { Component: '/cms/admin/AnalyticsDetailViews#AnalyticsPageView', path: '/analitik/sayfa', exact: true, meta: { title: 'Sayfa ayrıntısı · Analitik' } },
        analyticsButtons: { Component: '/cms/admin/AnalyticsDetailViews#AnalyticsButtonsView', path: '/analitik/butonlar', exact: true, meta: { title: 'Tüm butonlar · Analitik' } },
        ctaGallery: { Component: '/cms/admin/CtaGalleryView#CtaGalleryView', path: '/cta-ornekleri', exact: true, meta: { title: 'CTA örnekleri' } },
        notFound: { Component: '/cms/admin/NotFoundView#NotFoundView', path: '/404', meta: { title: 'Bulunamayan sayfalar' } },
      },
    },
    importMap: { baseDir: dirname },
  },
  i18n: { supportedLanguages: { tr }, fallbackLanguage: 'tr' },
  collections: [Posts, Categories, Authors, Popups, Analytics, Redirects, Media, Users],
  globals: [BlogCta],
  editor: lexicalEditor({ features: editorFeatures }),
  // Panel e-postaları (şifremi unuttum, kullanıcı daveti): Yandex 360 SMTP. Ortam değişkenleri yoksa e-posta konsola yazılır.
  // SMTP_USER: gönderen @kolaybi.com kutusu, SMTP_PASS: o kutunun Yandex uygulama şifresi (Vercel'de "sensitive" eklenir)
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER,
          defaultFromName: 'KolayBi CMS',
          transportOptions: {
            host: process.env.SMTP_HOST || 'smtp.yandex.com',
            port: Number(process.env.SMTP_PORT || 465),
            secure: (process.env.SMTP_PORT || '465') === '465',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          },
        }),
      }
    : {}),
  // Yayında Postgres (Vercel Postgres / Neon), yerelde tek dosyalık SQLite
  db: DB.startsWith('postgres')
    ? postgresAdapter({ pool: { connectionString: DB } })
    : sqliteAdapter({ client: { url: DB } }),
  sharp,
  // Görseller: bulutta (Postgres + Blob anahtarı) Vercel Blob'a, yerelde (SQLite) media/ klasörüne
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) && DB.startsWith('postgres'),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  typescript: { outputFile: path.resolve(dirname, 'cms/payload-types.ts') },
})
