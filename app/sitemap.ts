// /sitemap.xml: sitenin tüm sayfaları (cms/pages.ts) ve CMS'teki yayındaki blog yazıları.
// Saatte bir yenilenir; yeni yazı yayınlanınca en geç 1 saat içinde eklenir. Adresler canlı alan adıyla (canonical) yazılır.
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SITE_PAGES } from '@/cms/pages'
import { SITE } from '@/lib/blog'

export const revalidate = 3600

const YASAL = new Set(['/gizlilik-politikasi', '/cerez-politikasi', '/cayma-hakki-metni', '/ticari-elektronik-ileti', '/kisisel-verilerin-korunmasi'])

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sayfalar: MetadataRoute.Sitemap = SITE_PAGES.filter((p) => !p.value.includes('*')).map((p) => ({
    url: p.value === '/' ? `${SITE}/` : SITE + p.value,
    changeFrequency: p.value === '/blog' ? 'daily' : YASAL.has(p.value) ? 'yearly' : 'weekly',
    priority: p.value === '/' ? 1 : p.value === '/fiyatlar' ? 0.9 : YASAL.has(p.value) ? 0.3 : 0.8,
  }))
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, pagination: false, limit: 5000, depth: 0, select: { slug: true, updatedAt: true }, sort: '-publishedAt' })
  const yazilar: MetadataRoute.Sitemap = r.docs.map((d) => ({ url: `${SITE}/blog/${d.slug}`, lastModified: d.updatedAt ? new Date(d.updatedAt) : undefined, changeFrequency: 'monthly', priority: 0.6 }))
  return [...sayfalar, ...yazilar]
}
