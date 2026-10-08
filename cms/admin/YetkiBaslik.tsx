// Kullanıcı formunda yetki kutucuklarının üstündeki menü bölümü adı (Blog, Pazarlama, SEO, İçerik)
export function YetkiBaslik({ label }: { label?: string }) {
  return <div className="kb-yetki-baslik">{label}</div>
}
