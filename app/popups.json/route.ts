// Sitedeki /js/popups.js'in okuduğu, yayındaki açılır pencerelerin özet listesi (öncelik sırasıyla).
// CMS'te pencere kaydedilince afterChange kancası bu yanıtı yeniler.
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Popup } from '@/cms/payload-types'

export const revalidate = 300

export async function GET() {
  const payload = await getPayload({ config })
  const r = await payload.find({ collection: 'popups', where: { active: { equals: true } }, sort: '-priority', limit: 50, depth: 1, pagination: false })
  const popups = (r.docs as Popup[]).map((p) => {
    const m = p.image as Media | null
    return {
      id: p.id, design: p.design, theme: p.theme, image: m?.sizes?.cover?.url || m?.url || null,
      eyebrow: p.eyebrow, title: p.title, text: p.text, buttonText: p.buttonText, buttonLink: p.buttonLink,
      show: p.show, pages: p.pages || [], customPaths: p.customPaths || [], device: p.device,
      trigger: p.trigger, delay: p.delay, scroll: p.scroll, frequency: p.frequency, days: p.days,
      startsAt: p.startsAt, endsAt: p.endsAt,
    }
  })
  return Response.json({ popups }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
}
