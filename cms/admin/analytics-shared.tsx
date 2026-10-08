// Analitik ekranlarının ortak parçaları: biçimlendirme, sayfa adları, sayfa istatistikleri sorgusu, dönem seçici, günlük grafik.
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { rows, daysAgo } from '../analytics'
import { SITE_PAGES } from '../pages'

export const DONEM = [7, 30, 90]
export const KAYNAK: Record<string, string> = { direct: 'Doğrudan', search: 'Arama motorları', social: 'Sosyal medya', ai: 'Yapay zekâ asistanları', other: 'Diğer siteler' }
export const TASARIM: Record<string, string> = { klasik: 'Klasik', 'yan-gorsel': 'Yan görselli', kose: 'Köşe kartı', serit: 'Alt şerit', 'tam-ekran': 'Tam ekran', 'yan-panel': 'Yan panel' }
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

export const n = (v: unknown) => Number(v) || 0
export const fmt = (v: number) => v.toLocaleString('tr-TR')
export const yuzde = (a: number, b: number) => (b ? `%${((a / b) * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '–')
export const gunAdi = (d: string) => { const [, m, g] = d.split('-'); return `${Number(g)} ${AY[Number(m) - 1]}` }
export const donem = (sp: AnySP) => (DONEM.includes(Number(sp?.gun)) ? Number(sp?.gun) : 30)
type AnySP = { [k: string]: string | string[] | undefined } | undefined
export const q1 = (sp: AnySP, k: string) => { const v = sp?.[k]; return Array.isArray(v) ? v[0] : v }

/** "az önce", "12 dk önce", "3 sa önce", "dün 14:20", "5 Eki 09:10" */
export function once(v: unknown) {
  if (!v) return '–'
  const d = new Date(String(v).includes('T') || String(v).includes('-') ? String(v).replace(' ', 'T') : Number(v))
  if (isNaN(d.getTime())) return '–'
  const dk = Math.floor((Date.now() - d.getTime()) / 60000)
  const saat = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
  if (dk < 1) return 'az önce'
  if (dk < 60) return `${dk} dk önce`
  if (dk < 24 * 60) return `${Math.floor(dk / 60)} sa önce`
  if (dk < 48 * 60) return `dün ${saat}`
  return `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })} ${saat}`
}
export const zaman = (v: unknown) => (v ? new Date(String(v).replace(' ', 'T')).getTime() || 0 : 0)

const SAYFA_ADI = new Map<string, string>(SITE_PAGES.map((p) => [p.value, p.label.replace(/\s*\([^)]*\)\s*$/, '')]))
/** Adres → sayfa adı (site sayfaları listeden, blog yazıları başlığından) */
export async function sayfaAdlari(payload: Payload, paths: string[]) {
  const slugs = [...new Set(paths)].filter((p) => p.startsWith('/blog/')).map((p) => p.slice(6))
  const yazilar = slugs.length ? (await payload.find({ collection: 'posts', where: { slug: { in: slugs } }, limit: slugs.length, depth: 0, select: { title: true, slug: true } })).docs : []
  return (path: string) => SAYFA_ADI.get(path) || yazilar.find((y) => `/blog/${y.slug}` === path)?.title || path
}

export type SayfaSatir = { path: string; v: number; u: number; s: number; m: number; k: number; kv: number; son: unknown }
/** Sayfa başına: görüntüleme, tekil, ziyaret başlangıcı, mobil görüntüleme, kayıt tıklaması, kayda tıklayan ziyaretçi, son görüntüleme */
export async function sayfaIstatistik(payload: Payload, bas: string, path?: string): Promise<SayfaSatir[]> {
  const r = await rows(payload, sql`SELECT path,
      SUM(CASE WHEN kind = 'page' AND event = 'view' THEN count ELSE 0 END) AS v,
      SUM(CASE WHEN kind = 'page' AND event = 'visitor' THEN count ELSE 0 END) AS u,
      SUM(CASE WHEN kind = 'page' AND event = 'session' THEN count ELSE 0 END) AS s,
      SUM(CASE WHEN kind = 'page' AND event = 'view' AND device = 'mobile' THEN count ELSE 0 END) AS m,
      SUM(CASE WHEN kind = 'cta' AND event = 'signup' THEN count ELSE 0 END) AS k,
      SUM(CASE WHEN kind = 'cta' AND event = 'signup_visitor' THEN count ELSE 0 END) AS kv,
      MAX(CASE WHEN kind = 'page' AND event = 'view' THEN updated_at END) AS son
    FROM analytics WHERE kind IN ('page', 'cta') AND day >= ${bas} ${path ? sql`AND path = ${path}` : sql.empty()} GROUP BY path`)
  return r.map((x) => ({ path: String(x.path), v: n(x.v), u: n(x.u), s: n(x.s), m: n(x.m), k: n(x.k), kv: n(x.kv), son: x.son })).filter((x) => x.v || x.k)
}

export function Degisim({ simdi, once: o }: { simdi: number; once: number }) {
  if (!o) return null
  const d = ((simdi - o) / o) * 100
  return <span className={`kb-an-delta ${d >= 0 ? 'is-up' : 'is-down'}`}>{d >= 0 ? '▲' : '▼'} %{Math.abs(d).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
}

/** Dönem seçici; diğer sorgu parametrelerini korur */
export function DonemNav({ base, gun, extra = {} }: { base: string; gun: number; extra?: Record<string, string | undefined> }) {
  const qs = (d: number) => '?' + new URLSearchParams({ ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) as Record<string, string>, gun: String(d) }).toString()
  return (
    <nav className="kb-an-range" aria-label="Dönem">
      {DONEM.map((d) => <a key={d} href={base + qs(d)} className={d === gun ? 'on' : ''} aria-current={d === gun ? 'page' : undefined}>Son {d} gün</a>)}
    </nav>
  )
}

/** Günlük çubuk (görüntüleme) + çizgi (tekil ziyaretçi) grafiği */
export function GunlukGrafik({ gun, veri, etiket }: { gun: number; veri: Map<string, { v: number; s: number }>; etiket: string }) {
  const gunler = Array.from({ length: gun }, (_, i) => daysAgo(gun - 1 - i))
  const max = Math.max(1, ...gunler.map((d) => veri.get(d)?.v || 0))
  const W = 1000, H = 220, bw = W / gun
  const g = (d: string) => veri.get(d) || { v: 0, s: 0 }
  return (
    <svg className="kb-an-chart" viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={etiket}>
      {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1="0" x2={W} y1={H - H * f} y2={H - H * f} className="grid" />)}
      {gunler.map((d, i) => {
        const h = (g(d).v / max) * H
        return (
          <g key={d}>
            <rect x={i * bw + bw * 0.15} width={bw * 0.7} y={H - h} height={h} rx={Math.min(4, bw * 0.2)} className="bar"><title>{`${gunAdi(d)}: ${fmt(g(d).v)} görüntüleme, ${fmt(g(d).s)} tekil ziyaretçi`}</title></rect>
            {(gun <= 7 || i % Math.ceil(gun / 10) === 0) && <text x={i * bw + bw / 2} y={H + 18} className="lbl">{gunAdi(d)}</text>}
          </g>
        )
      })}
      <polyline className="line" points={gunler.map((d, i) => `${i * bw + bw / 2},${H - (g(d).s / max) * H}`).join(' ')} />
    </svg>
  )
}

export const detayHref = (path: string, gun: number) => `/admin/analitik/sayfa?p=${encodeURIComponent(path)}&gun=${gun}`
