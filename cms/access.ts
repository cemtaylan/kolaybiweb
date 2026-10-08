// Panel yetkileri: "Tam yetkili" kullanıcı her şeyi yönetir; "Seçili menüler" rolündeki kullanıcı yalnızca
// işaretlenen menü bölümlerini görür ve düzenler. Kullanıcı ve yetki yönetimi yalnız tam yetkilidedir.
// Aynı kurallar koleksiyon erişiminde (sunucu), özel ekranlarda ve sol menüde kullanılır.
import type { Access, PayloadRequest } from 'payload'

export const ALANLAR = [
  { key: 'yazilar', label: 'Yazılar', grup: 'Blog' },
  { key: 'kategoriler', label: 'Kategoriler', grup: 'Blog' },
  { key: 'yazarlar', label: 'Yazarlar', grup: 'Blog' },
  { key: 'ilanlar', label: 'İlanlar (oluştur, aktif ve pasif)', grup: 'Pazarlama' },
  { key: 'analitik', label: 'Analitik', grup: 'Pazarlama' },
  { key: 'yonlendirmeler', label: 'Yönlendirmeler', grup: 'SEO' },
  { key: 'bulunamayan', label: 'Bulunamayan sayfalar', grup: 'SEO' },
  { key: 'gorseller', label: 'Görseller', grup: 'İçerik' },
  { key: 'sayfalar', label: 'Sayfalar (yasal ve kurumsal metinler)', grup: 'İçerik' },
] as const
export type Alan = (typeof ALANLAR)[number]['key']

type U = { id?: number | string; role?: string | null; yetki?: Partial<Record<Alan, boolean | null>> | null } | null | undefined

/** Eski kayıtlar (rol alanı boş) tam yetkili sayılır; yeni kullanıcılar varsayılan olarak "Seçili menüler" rolündedir */
export const tamYetkili = (u: U) => !!u && u.role !== 'editor'
export const yetkili = (u: U, alan: Alan) => !!u && (tamYetkili(u) || !!u.yetki?.[alan])
export const yetkiliHerhangi = (u: U, alanlar: Alan[]) => alanlar.some((a) => yetkili(u, a))

const kullanici = (req: PayloadRequest) => req.user as U

/** Koleksiyon yazma erişimi: ilgili menü yetkisi */
export const yazabilir = (...alanlar: Alan[]): Access => ({ req }) => yetkiliHerhangi(kullanici(req), alanlar)
export const yonetici: Access = ({ req }) => tamYetkili(kullanici(req))
/** Panelde koleksiyonu gizle (menü ve pano); erişim kuralları ayrıca sunucuda uygulanır */
export const gizle = (...alanlar: Alan[]) => ({ user }: { user: unknown }) => !!user && !yetkiliHerhangi(user as U, alanlar)
