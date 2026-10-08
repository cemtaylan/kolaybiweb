// /kullanici-rehberi: "KolayBi'ye Başlarken" (CMS > Destek makaleleri, adres kullanici-rehberi)
import { destekMeta, SupportPage } from '@/lib/SupportPage'

export const revalidate = false
export const generateMetadata = () => destekMeta('kullanici-rehberi')
export default function Page() {
  return <SupportPage slug="kullanici-rehberi" />
}
