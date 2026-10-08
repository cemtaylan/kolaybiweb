'use client'
// Bulunamayan adresler tablosu: her satırda yeni adresi yazıp "Yönlendir" ile kalıcı (301) yönlendirme oluşturulur.
import { useState } from 'react'

export type NotFoundRow = { path: string; n: number; last: string; refs: { host: string; n: number }[] }
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const gun = (d: string) => { const [, m, g] = d.split('-'); return `${Number(g)} ${AY[Number(m) - 1]}` }
const kaynak = (h: string) => (h === 'direct' ? 'Doğrudan' : h)

export function NotFoundList({ rows, redirects }: { rows: NotFoundRow[]; redirects: Record<string, string> }) {
  const [done, setDone] = useState<Record<string, string>>(redirects)
  const [hedef, setHedef] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [hata, setHata] = useState('')

  const yonlendir = async (path: string) => {
    const to = (hedef[path] || '').trim()
    if (!to) return setHata('Yeni adresi yazın, örn. /fiyatlar')
    setBusy(path); setHata('')
    const r = await fetch('/api/redirects', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: path, to, type: '301', active: true, note: '404 listesinden' }) })
    if (r.ok) { const { doc } = await r.json(); setDone((d) => ({ ...d, [path]: doc.to })) }
    else { const j = await r.json().catch(() => null); setHata(j?.errors?.[0]?.data?.errors?.[0]?.message || j?.errors?.[0]?.message || `${path} yönlendirilemedi`) }
    setBusy('')
  }

  if (!rows.length) return <p className="kb-pb-empty">Bu dönemde bulunamayan sayfa görüntülenmedi.</p>
  return (
    <section className="kb-an-card">
      {hata && <p className="kb-pb-err" role="alert">{hata}</p>}
      <table className="kb-an-table kb-nf">
        <thead><tr><th>Adres</th><th>Görüntüleme</th><th>Son</th><th>Nereden geldi</th><th>Yönlendirme</th></tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.path}>
              <td><span className="kb-nf-path">{x.path}</span></td>
              <td>{x.n.toLocaleString('tr-TR')}</td>
              <td>{gun(x.last)}</td>
              <td><small className="kb-nf-refs">{x.refs.slice(0, 3).map((r) => `${kaynak(r.host)} (${r.n})`).join(', ')}{x.refs.length > 3 ? ` +${x.refs.length - 3}` : ''}</small></td>
              <td>
                {done[x.path] ? (
                  <span className="kb-pb-state is-live">→ {done[x.path]}</span>
                ) : (
                  <form className="kb-nf-form" onSubmit={(e) => { e.preventDefault(); yonlendir(x.path) }}>
                    <input aria-label={`${x.path} için yeni adres`} placeholder="/yeni-adres" value={hedef[x.path] || ''} onChange={(e) => setHedef((h) => ({ ...h, [x.path]: e.target.value }))} disabled={busy === x.path} />
                    <button type="submit" disabled={busy === x.path}>Yönlendir</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
