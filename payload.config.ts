import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { tr } from '@payloadcms/translations/languages/tr'
import sharp from 'sharp'

import { Users } from './cms/collections/Users'
import { Media } from './cms/collections/Media'
import { Authors } from './cms/collections/Authors'
import { Categories } from './cms/collections/Categories'
import { Posts } from './cms/collections/Posts'
import { editorFeatures } from './cms/editor'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const DB = process.env.DATABASE_URI || 'file:./payload.db'

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
    },
    importMap: { baseDir: dirname },
  },
  i18n: { supportedLanguages: { tr }, fallbackLanguage: 'tr' },
  collections: [Posts, Categories, Authors, Media, Users],
  editor: lexicalEditor({ features: editorFeatures }),
  // Yayında Postgres (Vercel Postgres / Neon), yerelde tek dosyalık SQLite
  db: DB.startsWith('postgres')
    ? postgresAdapter({ pool: { connectionString: DB } })
    : sqliteAdapter({ client: { url: DB } }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'cms/payload-types.ts') },
})
