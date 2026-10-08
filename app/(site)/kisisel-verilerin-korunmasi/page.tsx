// /kisisel-verilerin-korunmasi: metni CMS > Sayfalar'dan gelir
import { CmsPage, cmsPageMeta } from '@/lib/CmsPage'

const SLUG = 'kisisel-verilerin-korunmasi'
export const revalidate = false // CMS'te kaydedilince afterChange kancası yeniler
export const generateMetadata = () => cmsPageMeta(SLUG)
export default function Page() {
  return <CmsPage slug={SLUG} />
}
