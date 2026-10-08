// Analitik veritabanı yardımcıları: sayaç artırma (tek SQL, yarış koşulsuz) ve rapor sorguları.
// Postgres (Neon) ve SQLite (yerel) aynı SQL'i çalıştırır; yalnızca sonuç alma yöntemi farklıdır.
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

type SQL = ReturnType<typeof sql>

type Db = { execute?: (q: SQL) => Promise<{ rows: Record<string, unknown>[] }>; all?: (q: SQL) => Promise<Record<string, unknown>[]>; run?: (q: SQL) => Promise<unknown> }
const db = (payload: Payload) => (payload.db as unknown as { drizzle: Db }).drizzle

export async function rows<T = Record<string, unknown>>(payload: Payload, q: SQL): Promise<T[]> {
  const d = db(payload)
  if (d.execute) return (await d.execute(q)).rows as T[]
  return (await d.all!(q)) as T[]
}

/** Türkiye saatine göre gün: YYYY-MM-DD */
export const today = (t = new Date()) => t.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
export const daysAgo = (n: number) => today(new Date(Date.now() - n * 864e5))

export type Hit = { kind: 'page' | 'popup' | 'cta' | 'notfound'; path: string; popup?: number; event: string; device: string; source?: string; label?: string }

export async function bump(payload: Payload, h: Hit) {
  const day = today()
  const bucket = [day, h.kind, h.path, h.popup ?? 0, h.event, h.device, h.source ?? '-', h.label ?? ''].join('|')
  const now = new Date().toISOString()
  const q = sql`INSERT INTO analytics (bucket, day, kind, path, popup, event, device, source, label, count, updated_at, created_at)
    VALUES (${bucket}, ${day}, ${h.kind}, ${h.path}, ${h.popup ?? null}, ${h.event}, ${h.device}, ${h.source ?? null}, ${h.label ?? null}, 1, ${now}, ${now})
    ON CONFLICT (bucket) DO UPDATE SET count = analytics.count + 1, updated_at = ${now}`
  const d = db(payload)
  if (d.execute) await d.execute(q)
  else await d.run!(q)
}

export type PopupStat = { views: number; clicks: number; closes: number }

/** Son N günde ilan başına görüntüleme / tıklama / kapatma */
export async function popupStats(payload: Payload, days: number): Promise<Record<number, PopupStat>> {
  const r = await rows<{ popup: number; event: string; n: number | string }>(payload, sql`
    SELECT popup, event, SUM(count) AS n FROM analytics
    WHERE kind = 'popup' AND day >= ${daysAgo(days - 1)} GROUP BY popup, event`)
  const out: Record<number, PopupStat> = {}
  for (const x of r) {
    const s = (out[Number(x.popup)] ||= { views: 0, clicks: 0, closes: 0 })
    if (x.event === 'view') s.views = Number(x.n)
    if (x.event === 'click') s.clicks = Number(x.n)
    if (x.event === 'close') s.closes = Number(x.n)
  }
  return out
}
