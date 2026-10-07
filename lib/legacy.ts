// Geçiş dönemi: legacy/ altındaki statik HTML sayfaları olduğu gibi sunulur.
// Bir sayfa React'e (ya da CMS'e) taşındığında app/ altında kendi rotası açılır;
// Next.js özel rotayı bu genel rotanın önüne koyduğu için legacy dosyası devreden çıkar.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Sayfalar derleme anında statik üretilir; dosyalar sunucu paketine eklenmesin
const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), 'legacy')

// React/CMS'e taşınan adresler: genel rota bunları üretmez (özel rota sunar)
const MIGRATED = (slug: string[]) => slug[0] === 'blog' && slug.length === 2 // /blog/<yazı> → app/(site)/blog/[slug]

// legacy/<yol>/index.html → ['yol', ...]; kök sayfa → []
export function legacySlugs(dir = ROOT, prefix: string[] = []): string[][] {
  const out: string[][] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...legacySlugs(full, [...prefix, name]))
    else if (name === 'index.html' && !MIGRATED(prefix)) out.push(prefix)
  }
  return out
}

export function legacyHtml(slug: string[] = []): string | null {
  if (slug.some((s) => s === '..' || s.includes('/'))) return null
  try {
    return readFileSync(path.join(ROOT, ...slug, 'index.html'), 'utf8')
  } catch {
    return null
  }
}
