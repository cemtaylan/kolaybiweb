// Yerel SQLite'taki panel kullanıcılarını, şifreleri değişmeden (hash + salt) hedef veritabanına kopyalar.
// Hedef, DATABASE_URI ortam değişkeninden gelir (ör. Neon). Kaynak: USERS_JSON dosyası
// (yerel payload.db'den çıkarılmış email/name/hash/salt listesi). Kullanım: npm run users:copy
import nextEnv from '@next/env'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

const target = process.env.DATABASE_URI
nextEnv.loadEnvConfig(process.cwd())
if (target) process.env.DATABASE_URI = target // .env.local'daki yerel SQLite adresi hedefi ezmesin
if (!process.env.DATABASE_URI?.startsWith('postgres')) throw new Error('Hedef veritabanı (DATABASE_URI) Postgres olmalı')

const rows = JSON.parse(readFileSync(process.env.USERS_JSON || '.cache/users.json', 'utf8')) as { email: string; name: string | null; hash: string; salt: string }[]

const { getPayload } = await import('payload')
const config = (await import('../payload.config')).default
const payload = await getPayload({ config })

for (const u of rows) {
  const found = await payload.find({ collection: 'users', where: { email: { equals: u.email } }, limit: 1, depth: 0 })
  // Geçici rastgele şifreyle oluşturulur, hemen ardından yerel hash/salt yazılır (eski şifre geçerli olur)
  const id = found.docs[0]?.id ?? (await payload.create({ collection: 'users', data: { email: u.email, name: u.name ?? undefined, password: randomBytes(24).toString('hex') } })).id
  await payload.db.updateOne({ collection: 'users', where: { id: { equals: id } }, data: { hash: u.hash, salt: u.salt } })
  console.log('✓', u.email)
}
process.exit(0)
