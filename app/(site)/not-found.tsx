// Site sayfalarında notFound() çağrılınca (ör. olmayan bir blog yazısı) gösterilen 404
import type { Metadata } from 'next'
import { NotFoundBody } from '@/lib/NotFoundBody'

export const metadata: Metadata = { title: 'Sayfa bulunamadı | KolayBi', robots: { index: false } }

export default function NotFound() {
  return <NotFoundBody />
}
