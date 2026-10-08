// /cayma-hakki-metni: metni CMS > Sayfalar'dan gelir
import { CmsPage, cmsPageMeta } from '@/lib/CmsPage'

const SLUG = 'cayma-hakki-metni'
export const revalidate = false // CMS'te kaydedilince afterChange kancası yeniler
export const generateMetadata = () => cmsPageMeta(SLUG)
export default function Page() {
  return <CmsPage slug={SLUG} />
}
