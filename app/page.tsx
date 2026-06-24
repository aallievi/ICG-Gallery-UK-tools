'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

// ── TYPES ──
type Movement = { id: string; date: string; qty: number; finish: string; thickness: number; status: string; project?: string; deliveryCost: number; notes?: string; delivery?: string; product: { color: string; collection: { name: string; brand: { name: string; color: string } } }; client: { name: string; type?: string }; user: { name: string } }
type Product = { id: string; color: string; stock: number; collection: { name: string; finishes: string[]; thickness: number[]; brand: { name: string; color: string } } }
type Brand = { id: string; name: string; color: string; collections: { id: string; name: string; finishes: string[]; thickness: number[]; products: { id: string; color: string; stock: number }[] }[] }

const ACTIONS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  DELIVERED: { label: 'Consegnato', color: '#22c55e', bg: '#f0fdf4', emoji: '📦' },
  SENT: { label: 'Spedito', color: '#3b82f6', bg: '#eff6ff', emoji: '🚚' },
  RETURNED: { label: 'Restituito', color: '#8b5cf6', bg: '#f5f3ff', emoji: '↩️' },
  LOST: { label: 'Perso', color: '#ef4444', bg: '#fef2f2', emoji: '❌' },
  TO_REORDER: { label: 'Da riordinare', color: '#f59e0b', bg: '#fffbeb', emoji: '🔔' },
  IN_SHOWROOM: { label: 'In showroom', color: '#6b7280', bg: '#f9fafb', emoji: '🏪' },
}
const CLIENTS = ['Trimline','Mudrak','Esher Bathroom','Gansler','Zulufish','Tile Centre','Floresco','Solus','Claybroke','Parkside','Studio Milo','EA Designers','Gerald Culliford','Endara','Federica','Jamie','Carbogno Architects','Tapis & Co','Betty','Vanessa','Marco','Anna','Ahila','Wisin']
const CLIENT_TYPES = ['ICG Team','Distributor','Architects','Interior Designer','Private Client']
const DELIVERY_OPTIONS = ['Client Collection','Sent DPD','Sent Gophr','Courier']

function StatusBadge({ s }: { s: string }) {
  const a = ACTIONS[s] || { color: '#6b7280', bg: '#f9f9f9', label: s }
  return <span className="badge" style={{ background: a.bg, color: a.color }}><span className="badge-dot" style={{ background: a.color }} />{a.label || s}</span>
}

function fdate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── SIDEBAR ──
function Sidebar({ page, setPage, user }: { page: string; setPage: (p: string) => void; user: any }) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'movements', label: 'Movimenti', icon: '↕' },
    { id: 'catalog', label: 'Catalogo', icon: '☰' },
    { id: 'stock', label: 'Stock & Riordino', icon: '◫' },
    { id: 'clients', label: 'Clienti', icon: '◎' },
    { id: 'reports', label: 'Report', icon: '▤' },
    ...(user?.role === 'ADMIN' ? [{ id: 'users', label: 'Utenti', icon: '◉' }] : []),
  ]
  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-mark">G</div>
        <div><div className="sb-name">ICG Gallery Tools</div><div className="sb-sub">Samples</div></div>
      </div>
      <nav className="sb-nav">
        {nav.map(n => (
          <a key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)} href="#">
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </a>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="user-chip" onClick={() => signOut({ callbackUrl: '/login' })}>
          <div className="av">{user?.name?.[0] || '?'}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>{user?.role}</div>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>⎋</span>
        </div>
      </div>
    </div>
  )
}

// ── NEW MOVEMENT MODAL ──
function NewMovementModal({ brands, onSave, onClose, userId }: { brands: Brand[]; onSave: () => void; onClose: () => void; userId: string }) {
  const [step, setStep] = useState(1)
  const [cart, setCart] = useState<any[]>([])
  const [brand, setBrand] = useState(''), [col, setCol] = useState(''), [color, setColor] = useState(''), [finish, setFinish] = useState(''), [mm, setMm] = useState('')
  const [qty, setQty] = useState(1)
  const [client, setClient] = useState(''), [ctype, setCtype] = useState(''), [proj, setProj] = useState('')
  const [delivery, setDel] = useState(''), [status, setStatus] = useState(''), [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [cost, setCost] = useState(''), [notes, setNotes] = useState(''), [saving, setSaving] = useState(false)

  const brandData = brands.find(b => b.name === brand)
  const cols = brandData?.collections || []
  const colData = cols.find(c => c.name === col)
  const colors = colData?.products.map(p => p.color) || []
  const fins = colData?.finishes || []
  const mms = colData?.thickness || []
  const curProd = colData?.products.find(p => p.color === color)
  const stock = curProd?.stock ?? null

  const reset = () => { setColor(''); setFinish(''); setMm(''); setQty(1) }

  const addToCart = () => {
    if (!brand || !col || !color || !finish || !mm) return
    setCart(c => [...c, { brand, collection: col, color, finish, thickness: Number(mm), qty }])
    reset()
  }

  const save = async () => {
    if (!cart.length || !client || !status) return
    setSaving(true)
    await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, clientName: client, clientType: ctype, project: proj, delivery, status, date, deliveryCost: Number(cost) || 0, notes }),
    })
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nuovo Ordine Campioni</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="steps">
            <span style={{ fontSize: 11, gap: 6, display: 'flex', alignItems: 'center' }}>
              <span className={`step-num ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>{step > 1 ? '✓' : '1'}</span>
              <span style={{ fontSize: 11, color: step === 1 ? 'var(--stone)' : 'var(--mid)', fontWeight: step === 1 ? 600 : 400 }}>Prodotti</span>
            </span>
            <div className="step-line" />
            <span style={{ fontSize: 11, gap: 6, display: 'flex', alignItems: 'center' }}>
              <span className={`step-num ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>{step > 2 ? '✓' : '2'}</span>
              <span style={{ fontSize: 11, color: step === 2 ? 'var(--stone)' : 'var(--mid)', fontWeight: step === 2 ? 600 : 400 }}>Cliente & Azione</span>
            </span>
            <div className="step-line" />
            <span style={{ fontSize: 11, gap: 6, display: 'flex', alignItems: 'center' }}>
              <span className={`step-num ${step === 3 ? 'active' : ''}`}>3</span>
              <span style={{ fontSize: 11, color: step === 3 ? 'var(--stone)' : 'var(--mid)', fontWeight: step === 3 ? 600 : 400 }}>Riepilogo</span>
            </span>
          </div>

          {step === 1 && (
            <div>
              <div style={{ background: '#f4f3ef', borderRadius: 8, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--bdr)' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 12 }}>Aggiungi prodotto</div>
                <div className="form-grid form-grid-2" style={{ marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Brand *</label>
                    <select className="form-control" value={brand} onChange={e => { setBrand(e.target.value); setCol(''); reset() }}>
                      <option value="">Seleziona brand…</option>
                      {brands.map(b => <option key={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Collezione *</label>
                    <select className="form-control" value={col} onChange={e => { setCol(e.target.value); reset() }} disabled={!brand}>
                      <option value="">Seleziona…</option>
                      {cols.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Colore *</label>
                    <select className="form-control" value={color} onChange={e => setColor(e.target.value)} disabled={!col}>
                      <option value="">Seleziona…</option>
                      {colors.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Finitura *</label>
                    <select className="form-control" value={finish} onChange={e => setFinish(e.target.value)} disabled={!col}>
                      <option value="">Seleziona…</option>
                      {fins.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Spessore mm *</label>
                    <select className="form-control" value={mm} onChange={e => setMm(e.target.value)} disabled={!col}>
                      <option value="">–</option>
                      {mms.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantità</label>
                    <input className="form-control" type="number" min={1} max={50} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} />
                  </div>
                </div>
                {stock !== null && (
                  <div className={`alert ${stock === 0 ? 'alert-err' : stock <= 3 ? 'alert-warn' : 'alert-ok'}`} style={{ marginBottom: 10 }}>
                    Stock disponibile: <strong>{stock} pz</strong> {stock === 0 ? '— ESAURITO' : stock <= 3 ? '— SCORTA BASSA' : '— OK'}
                  </div>
                )}
                <button className="btn btn-primary btn-sm" onClick={addToCart} disabled={!brand || !col || !color || !finish || !mm || stock === 0}>
                  + Aggiungi al carrello
                </button>
              </div>
              {cart.length === 0
                ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--mid)', fontSize: 12 }}>Nessun prodotto aggiunto ancora</div>
                : <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Nel carrello ({cart.length})</div>
                  {cart.map((it, i) => (
                    <div key={i} className="cart-item">
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: brands.find(b => b.name === it.brand)?.color || 'var(--acc)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{it.brand} · {it.collection}</div>
                        <div style={{ fontSize: 11, color: 'var(--mid)' }}>{it.color} · {it.finish} · {it.thickness}mm</div>
                      </div>
                      <span className="tag">{it.qty} pz</span>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => setCart(c => c.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo cliente</label>
                  <select className="form-control" value={ctype} onChange={e => setCtype(e.target.value)}>
                    <option value="">Seleziona…</option>
                    {CLIENT_TYPES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente / Studio *</label>
                  <select className="form-control" value={client} onChange={e => setClient(e.target.value)}>
                    <option value="">Seleziona…</option>
                    {CLIENTS.sort().map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Consegna</label>
                  <select className="form-control" value={delivery} onChange={e => setDel(e.target.value)}>
                    <option value="">Seleziona…</option>
                    {DELIVERY_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Costo spedizione £</label>
                  <input className="form-control" type="number" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Progetto</label>
                <input className="form-control" placeholder="es. Foster & Partners…" value={proj} onChange={e => setProj(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Azione *</label>
                <div className="action-cards">
                  {Object.entries(ACTIONS).map(([k, v]) => (
                    <div key={k} className={`action-card ${status === k ? 'selected' : ''}`} onClick={() => setStatus(k)}>
                      <div style={{ fontSize: 18 }}>{v.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note aggiuntive…" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background: '#f9f8f6', borderRadius: 8, padding: '14px 16px', border: '1px solid var(--bdr)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Riepilogo — {cart.length} prodott{cart.length === 1 ? 'o' : 'i'}</div>
              {cart.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '1px solid #ede8e2' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: brands.find(b => b.name === it.brand)?.color || 'var(--acc)' }} />
                  <div style={{ flex: 1, fontSize: 12 }}><strong>{it.brand}</strong> · {it.collection} · {it.color} · {it.finish} · {it.thickness}mm</div>
                  <span className="tag">{it.qty} pz</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.9 }}>
                <div>Cliente: <strong>{client}</strong>{proj ? ` · ${proj}` : ''}</div>
                <div>Consegna: {delivery || '–'} · £{cost || '0'}</div>
                <div>Azione: <StatusBadge s={status} /></div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Indietro</button>}
          <div style={{ flex: 1 }} />
          {step < 3
            ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 ? cart.length === 0 : !client || !status}>Avanti →</button>
            : <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Salvataggio…' : `✓ Registra ${cart.length} prodott${cart.length === 1 ? 'o' : 'i'}`}</button>
          }
        </div>
      </div>
    </div>
  )
}

// ── DASHBOARD ──
function Dashboard({ movs, stock, setPage }: { movs: Movement[]; stock: Product[]; setPage: (p: string) => void }) {
  const out = movs.filter(m => ['SENT', 'DELIVERED'].includes(m.status)).length
  const lost = movs.filter(m => m.status === 'LOST').length
  const reorder = movs.filter(m => m.status === 'TO_REORDER').length
  const lowS = stock.filter(p => p.stock > 0 && p.stock <= 3).length
  const noS = stock.filter(p => p.stock === 0).length

  const byBrand = useMemo(() => {
    const m: Record<string, number> = {}
    movs.forEach(v => { const b = v.product.collection.brand.name; m[b] = (m[b] || 0) + v.qty })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [movs])

  const byClient = useMemo(() => {
    const m: Record<string, number> = {}
    movs.forEach(v => { m[v.client.name] = (m[v.client.name] || 0) + v.qty })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [movs])

  const recent = movs.slice(0, 8)

  return (
    <div>
      {(lowS + noS) > 0 && (
        <div className="alert alert-warn">
          ⚠ <div><strong>Attenzione stock:</strong> {noS} prodotti esauriti · {lowS} sotto soglia. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setPage('stock')}>Vai a Stock →</span></div>
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card bl-acc"><div className="stat-label">Movimenti</div><div className="stat-value">{movs.length}</div><div className="stat-sub">totali nel sistema</div></div>
        <div className="stat-card bl-warn"><div className="stat-label">Fuori showroom</div><div className="stat-value">{out}</div><div className="stat-sub">inviati o consegnati</div></div>
        <div className="stat-card bl-err"><div className="stat-label">Persi / Riordino</div><div className="stat-value">{lost + reorder}</div><div className="stat-sub">{lost} persi · {reorder} da riordinare</div></div>
        <div className="stat-card bl-ok"><div className="stat-label">Stock sotto soglia</div><div className="stat-value" style={{ color: (lowS + noS) > 0 ? 'var(--err)' : 'var(--ok)' }}>{lowS + noS}</div><div className="stat-sub">{noS} esauriti · {lowS} bassi</div></div>
      </div>
      <div className="grid-2 mb-5">
        <div className="card">
          <div className="card-header mb-3"><div className="card-title">Brand più richiesti</div></div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {byBrand.map(([b, q]) => (
              <div key={b} className="flex items-center gap-2 mb-3">
                <div className="brand-dot" style={{ background: movs.find(m => m.product.collection.brand.name === b)?.product.collection.brand.color || 'var(--acc)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 550, marginBottom: 2 }}>{b}</div>
                  <div style={{ height: 3, background: '#f0e6da', borderRadius: 99 }}><div style={{ height: '100%', width: `${(q / byBrand[0][1]) * 100}%`, background: 'var(--acc)', borderRadius: 99 }} /></div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--acc)' }}>{q}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header mb-3"><div className="card-title">Clienti più attivi</div></div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {byClient.map(([c, q]) => (
              <div key={c} className="flex items-center gap-2 mb-3">
                <div className="av av-sm">{c[0]}</div>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 550 }}>{c}</div>
                <span className="tag">{q} pz</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <div className="card-title">Ultimi movimenti</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('movements')}>Vedi tutti</button>
        </div>
        <div className="card-body" style={{ paddingTop: 8, paddingBottom: 0 }}>
          <div className="table-wrap">
            <table><thead><tr><th>Data</th><th>Brand</th><th>Collezione · Colore</th><th>Cliente</th><th>Qtà</th><th>Stato</th><th>Team</th></tr></thead>
            <tbody>{recent.map(m => (
              <tr key={m.id}>
                <td className="td-muted">{fdate(m.date)}</td>
                <td><div className="flex items-center gap-2"><div className="brand-dot" style={{ background: m.product.collection.brand.color }} /><span>{m.product.collection.brand.name}</span></div></td>
                <td><div style={{ fontWeight: 550 }}>{m.product.collection.name}</div><div className="td-muted">{m.product.color} · {m.finish}</div></td>
                <td>{m.client.name}</td>
                <td><strong>{m.qty}</strong></td>
                <td><StatusBadge s={m.status} /></td>
                <td><div className="flex items-center gap-2"><div className="av av-sm">{m.user.name[0]}</div><span>{m.user.name}</span></div></td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MOVEMENTS ──
function Movements({ movs, brands, reload, userRole }: { movs: Movement[]; brands: Brand[]; reload: () => void; userRole: string }) {
  const [showNew, setShowNew] = useState(false)
  const [q, setQ] = useState(''), [fs, setFs] = useState(''), [fb, setFb] = useState(''), [fc, setFc] = useState('')

  const filtered = movs.filter(m => {
    const ql = q.toLowerCase()
    return (!ql || [m.product.collection.brand.name, m.product.collection.name, m.product.color, m.client.name, m.finish].some(v => v?.toLowerCase().includes(ql)))
      && (!fs || m.status === fs) && (!fb || m.product.collection.brand.name === fb) && (!fc || m.client.name === fc)
  })

  const allBrands = [...new Set(movs.map(m => m.product.collection.brand.name))].sort()
  const allClients = [...new Set(movs.map(m => m.client.name))].sort()

  const exportCSV = () => {
    const h = ['Data', 'Brand', 'Collezione', 'Colore', 'Finitura', 'mm', 'Qtà', 'Cliente', 'Progetto', 'Consegna', 'Stato', 'Team', '£', 'Note']
    const r = filtered.map(m => [m.date.slice(0, 10), m.product.collection.brand.name, m.product.collection.name, m.product.color, m.finish, m.thickness, m.qty, m.client.name, m.project || '', m.delivery || '', m.status, m.user.name, m.deliveryCost, m.notes || ''])
    const csv = [h, ...r].map(row => row.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'movimenti.csv'; a.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>Movimenti</div><div className="text-muted text-sm">{filtered.length} record</div></div>
        <div className="flex gap-2">
          {userRole !== 'VIEWER' && <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Nuovo Ordine</button>}
          <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        <input className="form-control" style={{ flex: '1 1 200px' }} placeholder="Cerca brand, colore, cliente…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="form-control" style={{ width: 140 }} value={fs} onChange={e => setFs(e.target.value)}><option value="">Tutti gli stati</option>{Object.keys(ACTIONS).map(s => <option key={s} value={s}>{ACTIONS[s].label}</option>)}</select>
        <select className="form-control" style={{ width: 140 }} value={fb} onChange={e => setFb(e.target.value)}><option value="">Tutti i brand</option>{allBrands.map(b => <option key={b}>{b}</option>)}</select>
        <select className="form-control" style={{ width: 130 }} value={fc} onChange={e => setFc(e.target.value)}><option value="">Tutti i clienti</option>{allClients.map(c => <option key={c}>{c}</option>)}</select>
        {(q || fs || fb || fc) && <button className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setFs(''); setFb(''); setFc('') }}>Reset</button>}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table><thead><tr><th>Data</th><th>Brand</th><th>Collezione</th><th>Colore · Fin</th><th>mm</th><th>Qtà</th><th>Cliente</th><th>Progetto</th><th>Stato</th><th>Team</th></tr></thead>
          <tbody>{filtered.length === 0
            ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--mid)' }}>Nessun risultato</td></tr>
            : filtered.map(m => (
              <tr key={m.id}>
                <td className="td-muted">{fdate(m.date)}</td>
                <td><div className="flex items-center gap-2"><div className="brand-dot" style={{ background: m.product.collection.brand.color }} /><span style={{ fontWeight: 550 }}>{m.product.collection.brand.name}</span></div></td>
                <td style={{ fontSize: 11 }}>{m.product.collection.name}</td>
                <td><div style={{ fontWeight: 550 }}>{m.product.color}</div><div className="td-muted">{m.finish}</div></td>
                <td className="td-muted">{m.thickness}</td>
                <td><strong>{m.qty}</strong></td>
                <td><div style={{ fontWeight: 550 }}>{m.client.name}</div>{m.client.type && <div className="td-muted" style={{ fontSize: 10 }}>{m.client.type}</div>}</td>
                <td className="td-muted">{m.project || '–'}</td>
                <td><StatusBadge s={m.status} /></td>
                <td><div className="flex items-center gap-2"><div className="av av-sm">{m.user.name[0]}</div><span>{m.user.name}</span></div></td>
              </tr>
            ))
          }</tbody></table>
        </div>
      </div>
      {showNew && <NewMovementModal brands={brands} onSave={reload} onClose={() => setShowNew(false)} userId="" />}
    </div>
  )
}

// ── CATALOG ──
function Catalog({ brands }: { brands: Brand[] }) {
  const [q, setQ] = useState(''), [sel, setSel] = useState<string | null>(null)
  const filtered = brands.filter(b => !q || b.name.toLowerCase().includes(q.toLowerCase()) || b.collections.some(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.products.some(p => p.color.toLowerCase().includes(q.toLowerCase()))))
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>Catalogo Brand</div><div className="text-muted text-sm">{brands.length} brand · {brands.reduce((s, b) => s + b.collections.reduce((ss, c) => ss + c.products.length, 0), 0)} colori</div></div>
      </div>
      <input className="form-control mb-4" style={{ maxWidth: 380 }} placeholder="Cerca brand, collezione o colore…" value={q} onChange={e => setQ(e.target.value)} />
      {filtered.map(b => (
        <div key={b.id} className="card mb-3">
          <div style={{ height: 4, background: b.color, borderRadius: '9px 9px 0 0' }} />
          <div className="card-body">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="brand-dot" style={{ background: b.color, width: 9, height: 9 }} />
                <div style={{ fontSize: 15, fontWeight: 700 }}>{b.name}</div>
                <span className="tag">{b.collections.length} collezioni</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSel(sel === b.id ? null : b.id)}>{sel === b.id ? '▲ Chiudi' : '▼ Espandi'}</button>
            </div>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 5 }}>
              {b.collections.map(c => <span key={c.id} style={{ padding: '2px 8px', background: '#f4f3ef', border: '1px solid var(--bdr)', borderRadius: 5, fontSize: 10, color: 'var(--mid)' }}>{c.name}</span>)}
            </div>
            {sel === b.id && b.collections.map(c => (
              <div key={c.id} style={{ marginTop: 12, borderTop: '1px solid var(--bdr)', paddingTop: 12 }}>
                <div className="flex justify-between items-center mb-3">
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div className="text-muted text-sm">Spessore: {c.thickness.join(', ')}mm · {c.finishes.join(' / ')}</div>
                </div>
                <div className="flex" style={{ flexWrap: 'wrap', gap: 4 }}>
                  {c.products.map(p => (
                    <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#faf9f7', border: '1px solid var(--bdr)', borderRadius: 5, fontSize: 10 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: `hsl(${p.color.charCodeAt(0) * 13 % 360},28%,70%)` }} />
                      {p.color}
                      {p.stock <= 3 && <span style={{ color: p.stock === 0 ? 'var(--err)' : 'var(--warn)', fontSize: 9, fontWeight: 700 }}>{p.stock === 0 ? ' ✕' : ` ${p.stock}`}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── STOCK ──
function StockPage({ stock, reload }: { stock: Product[]; reload: () => void }) {
  const [fb, setFb] = useState(''), [fs, setFs] = useState('')
  const LIMIT = 3
  const allBrands = [...new Set(stock.map(p => p.collection.brand.name))].sort()
  const filtered = stock.filter(p => (!fb || p.collection.brand.name === fb) && (!fs || (fs === 'empty' && p.stock === 0) || (fs === 'low' && p.stock > 0 && p.stock <= LIMIT) || (fs === 'ok' && p.stock > LIMIT)))
  const reorderList = stock.filter(p => p.stock <= LIMIT)

  const adjustStock = async (id: string, delta: number) => {
    await fetch(`/api/stock/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta }) })
    reload()
  }

  const exportReorder = () => {
    const h = ['Brand', 'Collezione', 'Colore', 'Stock', 'Da Riordinare']
    const r = reorderList.map(p => [p.collection.brand.name, p.collection.name, p.color, p.stock, Math.max(0, 5 - p.stock)])
    const csv = [h, ...r].map(row => row.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'riordino.csv'; a.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div><div style={{ fontSize: 18, fontWeight: 700 }}>Stock & Riordino</div><div className="text-muted text-sm">{reorderList.length} prodotti sotto soglia</div></div>
        {reorderList.length > 0 && <button className="btn btn-warn btn-sm" onClick={exportReorder}>⬇ Export Riordino</button>}
      </div>
      {reorderList.length > 0 && (
        <div className="reorder-box">
          <div className="flex items-center gap-2 mb-3"><span>⚠</span><strong>Area Riordino — {reorderList.length} prodotti (≤{LIMIT} pz)</strong></div>
          <div className="table-wrap">
            <table><thead><tr><th>Brand</th><th>Collezione</th><th>Colore</th><th>Stock</th><th>Suggerito</th><th>Aggiusta</th></tr></thead>
            <tbody>{reorderList.map(p => (
              <tr key={p.id}>
                <td><div className="flex items-center gap-2"><div className="brand-dot" style={{ background: p.collection.brand.color }} />{p.collection.brand.name}</div></td>
                <td style={{ fontSize: 11 }}>{p.collection.name}</td>
                <td style={{ fontWeight: 550 }}>{p.color}</td>
                <td><span className={p.stock === 0 ? 'stock-empty' : 'stock-low'}>{p.stock} pz</span></td>
                <td className="td-muted">{Math.max(0, 5 - p.stock)} pz</td>
                <td><div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => adjustStock(p.id, -1)} disabled={p.stock === 0}>–</button>
                  <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{p.stock}</span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => adjustStock(p.id, 1)}>+</button>
                </div></td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <select className="form-control" style={{ width: 150 }} value={fb} onChange={e => setFb(e.target.value)}><option value="">Tutti i brand</option>{allBrands.map(b => <option key={b}>{b}</option>)}</select>
        <select className="form-control" style={{ width: 150 }} value={fs} onChange={e => setFs(e.target.value)}><option value="">Tutto lo stock</option><option value="empty">Esauriti</option><option value="low">Scorta bassa</option><option value="ok">Disponibile</option></select>
        {(fb || fs) && <button className="btn btn-ghost btn-sm" onClick={() => { setFb(''); setFs('') }}>Reset</button>}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table><thead><tr><th>Brand</th><th>Collezione</th><th>Colore</th><th>Stock</th><th>Stato</th><th>±</th></tr></thead>
          <tbody>{filtered.map(p => (
            <tr key={p.id}>
              <td><div className="flex items-center gap-2"><div className="brand-dot" style={{ background: p.collection.brand.color }} /><span style={{ fontWeight: 550 }}>{p.collection.brand.name}</span></div></td>
              <td style={{ fontSize: 11 }}>{p.collection.name}</td>
              <td style={{ fontWeight: 550 }}>{p.color}</td>
              <td><span className={p.stock === 0 ? 'stock-empty' : p.stock <= LIMIT ? 'stock-low' : 'stock-ok'}>{p.stock} pz</span></td>
              <td>{p.stock === 0 ? <span className="badge" style={{ background: '#fef2f2', color: 'var(--err)' }}><span className="badge-dot" style={{ background: 'var(--err)' }} />Esaurito</span> : p.stock <= LIMIT ? <span className="badge" style={{ background: '#fffbeb', color: 'var(--warn)' }}><span className="badge-dot" style={{ background: 'var(--warn)' }} />Basso</span> : <span className="badge" style={{ background: '#f0fdf4', color: 'var(--ok)' }}><span className="badge-dot" style={{ background: 'var(--ok)' }} />OK</span>}</td>
              <td><div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => adjustStock(p.id, -1)} disabled={p.stock === 0}>–</button>
                <span style={{ fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{p.stock}</span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => adjustStock(p.id, 1)}>+</button>
              </div></td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ── CLIENTS ──
function Clients({ movs }: { movs: Movement[] }) {
  const data = useMemo(() => {
    const m: Record<string, any> = {}
    movs.forEach(mv => {
      const n = mv.client.name
      if (!m[n]) m[n] = { name: n, type: mv.client.type, count: 0, qty: 0, last: '' }
      m[n].count++; m[n].qty += mv.qty
      if (!m[n].last || mv.date > m[n].last) m[n].last = mv.date
    })
    return Object.values(m).sort((a: any, b: any) => b.qty - a.qty)
  }, [movs])
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Clienti & Studi</div>
      <div className="card"><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Tipo</th><th>Movimenti</th><th>Campioni</th><th>Ultimo contatto</th></tr></thead>
      <tbody>{data.map((c: any) => (
        <tr key={c.name}><td><div className="flex items-center gap-2"><div className="av av-sm">{c.name[0]}</div><span style={{ fontWeight: 550 }}>{c.name}</span></div></td>
        <td className="td-muted">{c.type || '–'}</td><td>{c.count}</td><td><strong>{c.qty}</strong></td><td className="td-muted">{fdate(c.last)}</td></tr>
      ))}</tbody></table></div></div>
    </div>
  )
}

// ── REPORTS ──
function Reports({ movs }: { movs: Movement[] }) {
  const byMonth = useMemo(() => {
    const m: Record<string, any> = {}
    movs.forEach(mv => { const mo = mv.date.slice(0, 7); if (!m[mo]) m[mo] = { mo, qty: 0, cost: 0 }; m[mo].qty += mv.qty; m[mo].cost += mv.deliveryCost || 0 })
    return Object.values(m).sort((a: any, b: any) => a.mo.localeCompare(b.mo))
  }, [movs])
  const byStatus = useMemo(() => { const m: Record<string, number> = {}; movs.forEach(mv => { m[mv.status] = (m[mv.status] || 0) + mv.qty }); return Object.entries(m).sort((a, b) => b[1] - a[1]) }, [movs])
  const tq = movs.reduce((s, m) => s + m.qty, 0)
  const tc = movs.reduce((s, m) => s + (m.deliveryCost || 0), 0)
  const exp = () => {
    const h = ['Data', 'Brand', 'Collezione', 'Colore', 'Cliente', 'Qtà', 'Stato', '£']
    const r = movs.map(m => [m.date.slice(0, 10), m.product.collection.brand.name, m.product.collection.name, m.product.color, m.client.name, m.qty, m.status, m.deliveryCost])
    const csv = [h, ...r].map(row => row.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'report.csv'; a.click()
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div style={{ fontSize: 18, fontWeight: 700 }}>Report & Analisi</div>
        <button className="btn btn-ghost" onClick={exp}>⬇ Export CSV</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card bl-acc"><div className="stat-label">Campioni totali</div><div className="stat-value">{tq}</div><div className="stat-sub">pezzi movimentati</div></div>
        <div className="stat-card bl-warn"><div className="stat-label">Costi spedizione</div><div className="stat-value">£{tc.toFixed(0)}</div><div className="stat-sub">totale logistica</div></div>
        <div className="stat-card"><div className="stat-label">Media per mov.</div><div className="stat-value">{(tq / Math.max(movs.length, 1)).toFixed(1)}</div><div className="stat-sub">pezzi</div></div>
        <div className="stat-card"><div className="stat-label">Clienti attivi</div><div className="stat-value">{new Set(movs.map(m => m.client.name)).size}</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header mb-3"><div className="card-title">Attività per mese</div></div>
        <div className="card-body" style={{ paddingTop: 4 }}>{byMonth.map((m: any) => (
          <div key={m.mo} className="flex items-center gap-3 mb-3">
            <div style={{ fontSize: 11, width: 50, color: 'var(--mid)' }}>{new Date(m.mo + '-01').toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })}</div>
            <div style={{ flex: 1 }}><div style={{ height: 5, background: '#f0e6da', borderRadius: 99 }}><div style={{ height: '100%', width: `${(m.qty / Math.max(...byMonth.map((x: any) => x.qty))) * 100}%`, background: 'var(--acc)', borderRadius: 99 }} /></div></div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--acc)', width: 24, textAlign: 'right' }}>{m.qty}</div>
            <div style={{ fontSize: 10, color: 'var(--mid)', width: 40, textAlign: 'right' }}>£{m.cost.toFixed(0)}</div>
          </div>
        ))}</div></div>
        <div className="card"><div className="card-header mb-3"><div className="card-title">Per stato</div></div>
        <div className="card-body" style={{ paddingTop: 4 }}>{byStatus.map(([s, q]) => { const a = ACTIONS[s] || {}; return (
          <div key={s} className="flex items-center gap-3 mb-3">
            <StatusBadge s={s} />
            <div style={{ flex: 1, height: 5, background: '#f0e6da', borderRadius: 99 }}><div style={{ height: '100%', width: `${(q / tq) * 100}%`, background: (a as any).color || 'var(--acc)', borderRadius: 99 }} /></div>
            <div style={{ fontSize: 12, fontWeight: 700, width: 24, textAlign: 'right' }}>{q}</div>
          </div>
        )})}</div></div>
      </div>
    </div>
  )
}

// ── MAIN APP ──
export default function App() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [page, setPage] = useState('dashboard')
  const [movs, setMovs] = useState<Movement[]>([])
  const [stock, setStock] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status])

  const loadAll = async () => {
    setLoading(true)
    const [m, s, b] = await Promise.all([
      fetch('/api/movements').then(r => r.json()),
      fetch('/api/stock').then(r => r.json()),
      fetch('/api/catalog').then(r => r.json()),
    ])
    if (Array.isArray(m)) setMovs(m)
    if (Array.isArray(s)) setStock(s)
    if (Array.isArray(b)) setBrands(b)
    setLoading(false)
  }

  useEffect(() => { if (session) loadAll() }, [session])

  if (status === 'loading' || loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pale)' }}><div style={{ color: 'var(--mid)', fontSize: 14 }}>Caricamento…</div></div>
  if (!session) return null

  const lowStock = stock.filter(p => p.stock <= 3).length
  const user = session.user as any

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard movs={movs} stock={stock} setPage={setPage} />,
    movements: <Movements movs={movs} brands={brands} reload={loadAll} userRole={user.role} />,
    catalog: <Catalog brands={brands} />,
    stock: <StockPage stock={stock} reload={loadAll} />,
    clients: <Clients movs={movs} />,
    reports: <Reports movs={movs} />,
    users: <div style={{ padding: 40, textAlign: 'center', color: 'var(--mid)' }}>Gestione utenti — disponibile nella prossima versione.</div>,
  }

  const titles: Record<string, string> = { dashboard: 'Dashboard', movements: 'Movimenti', catalog: 'Catalogo Brand', stock: 'Stock & Riordino', clients: 'Clienti & Studi', reports: 'Report & Analisi', users: 'Utenti' }

  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage} user={user} />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{titles[page]}</div>
          {lowStock > 0 && <button className="btn btn-warn btn-sm" onClick={() => setPage('stock')}>⚠ {lowStock} stock bassi</button>}
          {user.role !== 'VIEWER' && <button className="btn btn-primary btn-sm" onClick={() => setPage('movements')}>+ Nuovo Ordine</button>}
          <div className="av" title={user.name}>{user.name?.[0]}</div>
        </div>
        <div className="page">{pages[page]}</div>
      </div>
    </div>
  )
}
