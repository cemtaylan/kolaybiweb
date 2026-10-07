// Yazı kancaları: adres başlıktan otomatik, okuma süresi metinden otomatik
import type { CollectionBeforeChangeHook, FieldHook } from 'payload'

const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
export const slugify = (s: string) =>
  s.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => TR[c] || c).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Adres boşsa başlıktan üretilir (ör. "e-Fatura Nedir?" → "e-fatura-nedir"); elle yazılan adres yalnızca adres kurallarına uydurulur
export const slugFromTitle: FieldHook = ({ value, data }) => (value ? slugify(String(value)) : data?.title ? slugify(String(data.title)).slice(0, 90).replace(/-+$/, '') : value)

// Okuma süresi boşsa metindeki kelime sayısından hesaplanır (dakikada ~200 kelime)
const words = (n: { text?: string; children?: unknown[] } | undefined): number =>
  !n ? 0 : (n.text ? n.text.split(/\s+/).filter(Boolean).length : 0) + ((n.children as typeof n[]) || []).reduce((t, c) => t + words(c), 0)
export const readingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (!data.readingMinutes && data.body?.root) data.readingMinutes = Math.max(1, Math.round(words(data.body.root) / 200))
  return data
}
