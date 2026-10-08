// /destek/<adres>: CMS > Destek makaleleri
import { destekler, destekMeta, SupportPage } from '@/lib/SupportPage'

export const revalidate = false // CMS'te kaydedilince afterChange kancası yeniler
export const dynamicParams = true

export async function generateStaticParams() {
  return (await destekler()).filter((d) => d.slug !== 'kullanici-rehberi').map((d) => ({ slug: d.slug }))
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return destekMeta((await params).slug)
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'kullanici-rehberi') return (await import('next/navigation')).notFound()
  return <SupportPage slug={slug} />
}
