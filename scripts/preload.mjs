// Payload paketlerini sırayla önceden yükler. Derlenmiş betik hepsini aynı anda yüklerse
// paketlerin üst düzey await'leri birbirini bekleyip kilitleniyor (Node çıkış kodu 13).
for (const m of ['@next/env', 'jsdom', 'next/cache.js', 'payload', '@payloadcms/richtext-lexical', '@payloadcms/db-postgres', '@payloadcms/db-sqlite', '@payloadcms/storage-vercel-blob', '@payloadcms/translations/languages/tr', 'sharp']) await import(m)
