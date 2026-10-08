'use client'
// Açılır pencere yönetimi: aktif ve pasif pencereler, yayın süreleri ve tek tıkla açma/kapatma.
import { useCallback, useEffect, useState } from 'react'
import type { Popup } from '@/cms/payload-types'

const TASARIM: Record<string, string> = { klasik: 'Klasik', 'yan-gorsel': 'Yan görselli', kose: 'Köşe kartı', serit: 'Alt şerit', 'tam-ekran': 'Tam ekran', 'yan-panel': 'Yan panel' }
const CIHAZ: Record<string, string> = { all: 'Tüm cihazlar', desktop: 'Masaüstü', mobile: 'Mobil' }

// <input type="datetime-local"> yerel saatle çalışır; ISO tarihe ve geri çevirme
const toLocal = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
}
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null)
const tarih = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function durum(p: Popup) {
  const now = Date.now()
  if (!p.active) return { cls: 'off', l: 'Pasif' }
  if (p.endsAt && Date.parse(p.endsAt) < now) return { cls: 'warn', l: 'Süresi doldu, sitede görünmüyor' }
  if (p.startsAt && Date.parse(p.startsAt) > now) return { cls: 'plan', l: `${tarih(p.startsAt)} tarihinde başlayacak` }
  return { cls: 'live', l: p.endsAt ? `Yayında · ${tarih(p.endsAt)} tarihine kadar` : 'Yayında · süresiz' }
}

const nerede = (p: Popup) => {
  const list = [...(p.pages || []), ...(p.customPaths || [])]
  if (p.show === 'all' || !list.length) return 'Tüm sayfalar'
  const s = list.length > 3 ? `${list.slice(0, 3).join(', ')} +${list.length - 3}` : list.join(', ')
  return p.show === 'exclude' ? `Hariç: ${s}` : s
}
const ne_zaman = (p: Popup) => (p.trigger === 'scroll' ? `%${p.scroll ?? 50} kaydırınca` : p.trigger === 'exit' ? 'Sayfadan çıkarken' : `${p.delay ?? 5} sn sonra`)

export function PopupBoard() {
  const [docs, setDocs] = useState<Popup[] | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    const r = await fetch('/api/popups?limit=200&depth=0&sort=-priority', { credentials: 'include' })
    if (!r.ok) return setHata('Pencereler yüklenemedi.')
    setDocs((await r.json()).docs)
  }, [])
  useEffect(() => { yukle() }, [yukle])

  const kaydet = async (p: Popup, data: Partial<Popup>) => {
    setBusy(p.id); setHata('')
    const r = await fetch(`/api/popups/${p.id}?depth=0`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (r.ok) { const { doc } = await r.json(); setDocs((d) => d && d.map((x) => (x.id === p.id ? doc : x))) } else setHata(`"${p.name}" kaydedilemedi.`)
    setBusy(null)
  }

  // Aynı pencereyi (tasarım, içerik, hedefleme) pasif bir kopya olarak çoğaltır
  const cogalt = async (p: Popup) => {
    setBusy(p.id); setHata('')
    const { id: _id, createdAt: _c, updatedAt: _u, ...veri } = p
    const r = await fetch('/api/popups?depth=0', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...veri, name: `${p.name} (kopya)`, active: false }) })
    if (r.ok) { const { doc } = await r.json(); setDocs((d) => d && [...d, doc]) } else setHata(`"${p.name}" çoğaltılamadı.`)
    setBusy(null)
  }

  if (!docs) return <div className="kb-pb"><p className="kb-pb-empty">{hata || 'Yükleniyor…'}</p></div>
  const aktif = docs.filter((p) => p.active)
  const pasif = docs.filter((p) => !p.active)

  const Satir = ({ p }: { p: Popup }) => {
    const d = durum(p)
    return (
      <li className={`kb-pb-row${busy === p.id ? ' is-busy' : ''}`}>
        <label className="kb-pb-switch" title={p.active ? 'Pasif yap' : 'Aktif yap'}>
          <input type="checkbox" checked={!!p.active} disabled={busy === p.id} onChange={(e) => kaydet(p, { active: e.target.checked })} aria-label={`${p.name}: ${p.active ? 'aktif' : 'pasif'}`} />
          <i />
        </label>
        <div className="kb-pb-main">
          <a href={`/admin/collections/popups/${p.id}`} className="kb-pb-name">{p.name}</a>
          <div className="kb-pb-meta">
            <span className="kb-chip">{TASARIM[p.design] || p.design}</span>
            <span>{nerede(p)}</span>
            <span>{CIHAZ[p.device || 'all']}</span>
            <span>{ne_zaman(p)}</span>
            {typeof p.priority === 'number' && p.priority !== 0 && <span>Öncelik {p.priority}</span>}
          </div>
          <span className={`kb-pb-state is-${d.cls}`}>{d.l}</span>
        </div>
        <div className="kb-pb-dates">
          <label>Başlangıç
            <input type="datetime-local" defaultValue={toLocal(p.startsAt)} disabled={busy === p.id} onBlur={(e) => { const v = fromLocal(e.target.value); if (v !== (p.startsAt || null)) kaydet(p, { startsAt: v }) }} />
          </label>
          <label>Bitiş
            <input type="datetime-local" defaultValue={toLocal(p.endsAt)} disabled={busy === p.id} onBlur={(e) => { const v = fromLocal(e.target.value); if (v !== (p.endsAt || null)) kaydet(p, { endsAt: v }) }} />
          </label>
        </div>
        <div className="kb-pb-acts">
          <a href={`/admin/collections/popups/${p.id}`}>Düzenle</a>
          <button type="button" onClick={() => cogalt(p)} disabled={busy === p.id}>Çoğalt</button>
        </div>
      </li>
    )
  }

  const Bolum = ({ baslik, list, bos }: { baslik: string; list: Popup[]; bos: string }) => (
    <section className="kb-pb-sec">
      <h2>{baslik} <small>{list.length}</small></h2>
      {list.length ? <ul>{list.map((p) => <Satir key={`${p.id}-${p.updatedAt}`} p={p} />)}</ul> : <p className="kb-pb-empty">{bos}</p>}
    </section>
  )

  return (
    <div className="kb-pb">
      <header className="kb-pb-head">
        <div>
          <h1>Açılır pencere yönetimi</h1>
          <p>Anahtarla pencereyi açıp kapatın. Aynı tasarımdan istediğiniz kadar ilan oluşturabilirsiniz; Çoğalt ile var olan bir pencereyi kopyalayıp düzenleyin. Tarihleri boş bırakırsanız pencere süresiz yayında kalır. Değişiklikler sitede en geç 5 dakika içinde görünür.</p>
        </div>
        <a className="kb-btn kb-btn-primary" href="/admin/collections/popups/create">+ Yeni pencere</a>
      </header>
      {hata && <p className="kb-pb-err" role="alert">{hata}</p>}
      <Bolum baslik="Aktif" list={aktif} bos="Şu an aktif pencere yok." />
      <Bolum baslik="Pasif" list={pasif} bos="Pasif pencere yok." />
    </div>
  )
}
