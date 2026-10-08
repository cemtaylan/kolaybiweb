// fiyatlar.js'i sahte DOM ile çalıştırıp #plans'ın ilk hâlini (Ofis, Yıllık) üretir. Sayfaya gömülü hâli yükleme sırasında kaymayı (CLS) önler.
// Kullanım: node scripts/plans-ssr.mjs > /tmp/plans.html  →  legacy/fiyatlar/index.html içindeki #plans içeriğini bununla değiştirin
import fs from 'fs'
const stub = () => new Proxy(function () {}, {
  get: (t, k) => k === 'classList' ? { toggle() {}, add() {}, remove() {} } : k === 'dataset' ? {} : k === 'querySelector' ? () => stub() : k === 'querySelectorAll' ? () => [] : k === 'addEventListener' ? () => {} : k === Symbol.toPrimitive ? () => '' : stub(),
  set: () => true, apply: () => stub(),
})
const root = { innerHTML: '', addEventListener() {} }
globalThis.document = { getElementById: (id) => (id === 'plans' ? root : stub()), querySelector: () => stub(), querySelectorAll: () => [] }
globalThis.location = { search: '' }
new Function(fs.readFileSync('public/js/fiyatlar.js', 'utf8'))()
process.stdout.write(root.innerHTML)
