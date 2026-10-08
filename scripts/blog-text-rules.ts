// Blog metinleri için yazım kuralları (fix-blog-texts ve blog listesi dosyası aynı kuralları kullanır)

// Denetimde bulunan yazım hataları (tam ifade → düzeltilmiş)
export const YAZIM: [string, string][] = [
  ['e-fatura zzorunlu hale mi geldi? Ayrıntıları neler.', 'e-Fatura zorunlu hâle mi geldi? Ayrıntıları neler?'],
  ['okuyuclarımız', 'okuyucularımız'],
  ['konunusunda', 'konusunda'],
  ['nelerdir?KolayBi Blog', 'nelerdir? KolayBi Blog'],
  ['derlediğimiz tm bu sorulara', 'derlediğimiz tüm bu sorulara'],
  ['Detaaylar', 'Detaylar'],
  ['faiz artırmı', 'faiz artırımı'],
  ['Piayasaya etikeri', 'Piyasaya etkileri'],
  ['KolayBi2 Blog', 'KolayBi Blog'],
  ['tekniklerini tekniklerini', 'tekniklerini'],
  ['denmekedir', 'denmektedir'],
  ['kesilenmektedir', 'kesilmektedir'],
  ['iğnceleyeceğiz', 'inceleyeceğiz'],
  ['Neledir?', 'Nelerdir?'],
  ['Başlanlığınca', 'Başkanlığınca'],
  ['dönem ve standarlara', 'dönem ve standartlara'],
  ['yapılandırmak ya da ödeme istiyorsanız', 'yapılandırmak ya da ödemek istiyorsanız'],
  ['bütün deyatlar', 'bütün detaylar'],
  ['akratıyoruz', 'aktarıyoruz'],
  ['dikkat etmeliyim? tüm ynaıtlarıyla', 'dikkat etmeliyim? Tüm yanıtlarıyla'],
  ['ticarri', 'ticari'],
  ['ne olduğunua', 'ne olduğuna'],
  ['Güncel Sınırlar Neler Nelerdir?', 'Güncel Sınırlar Nelerdir?'],
]

// e-belge adları: e-Fatura, e-Arşiv, e-İrsaliye… (e-SMM kısaltma olarak kalır); ekler korunur (e-faturanın → e-Faturanın)
const BELGE = ['fatura', 'arşiv', 'irsaliye', 'ihracat', 'imza', 'defter', 'beyanname', 'ticaret', 'dönüşüm', 'müstahsil', 'adisyon', 'bilet', 'döviz', 'belge']
const ilkBuyuk = (w: string) => (w[0] === 'i' ? 'İ' : w[0].toLocaleUpperCase('tr-TR')) + w.slice(1)
const RE = new RegExp(`(?<![\\p{L}\\d/_.-])[eE]-(${BELGE.join('|')})`, 'giu')

export function duzelt(s: string) {
  let t = s
  for (const [a, b] of YAZIM) t = t.split(a).join(b)
  t = t.replace(RE, (_m, w: string) => 'e-' + ilkBuyuk(w.toLocaleLowerCase('tr-TR')))
  t = t.replace(/(?<![\p{L}])[Pp]os(?![\p{L}])/gu, 'POS')
  return t
}
