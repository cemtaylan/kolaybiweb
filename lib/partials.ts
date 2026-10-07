// Henüz bileşene dönüşmemiş ortak parçalar (menü + ikon seti, footer): site/partials altındaki HTML
import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'site/partials')
const read = (f: string) => readFileSync(path.join(DIR, f), 'utf8')

export const blogHeader = () => read('blog-header.html')
export const blogFooter = () => read('blog-footer.html')
