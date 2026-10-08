// proxy.ts'in okuduğu etkin yönlendirmeler: { "/eski": ["/yeni", 301] }. CMS'te kaydedince yenilenir.
import { getPayload } from 'payload'
import config from '@payload-config'

export const revalidate = 300

export async function GET() {
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'redirects', where: { active: { equals: true } }, limit: 5000, pagination: false, depth: 0, select: { from: true, to: true, type: true } })
  const map: Record<string, [string, number]> = {}
  for (const d of r.docs as { from: string; to: string; type?: string }[]) map[d.from] = [d.to, d.type === '302' ? 302 : 301]
  return Response.json(map, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}
