import { useState, useEffect } from 'react'
import { CreditCard, Plus, Search, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

export default function CreditManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ client_id: '', amount: 0, description: '' })

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            clients(order_by: { name: asc }) {
              id name
              offer { name monthly_credits }
              wallet { id balance reserved }
              actions_aggregate(where: { status: { _nin: ["terminee", "annulee"] } }) { aggregate { sum { credits_reserved } } }
            }
          }`
        }, session.accessToken)
        if (data?.clients) setClients(data.clients)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const handleAdjust = async () => {
    if (!adjustForm.client_id || !adjustForm.amount) return
    const client = clients.find(c => c.id === adjustForm.client_id)
    if (!client?.wallet?.id) return
    const amt = parseInt(adjustForm.amount)
    try {
      await nhost.graphql.request({
        query: `mutation($walletId: uuid!, $amount: Int!, $balanceAfter: Int!, $description: String) {
          insert_wallet_transactions_one(object: { wallet_id: $walletId, type: adjustment, amount: $amount, balance_after: $balanceAfter, description: $description }) { id }
          update_wallets_by_pk(pk_columns: { id: $walletId }, _inc: { balance: $amount }) { id balance }
        }`,
        variables: { walletId: client.wallet.id, amount: amt, balanceAfter: (client.wallet.balance || 0) + amt, description: adjustForm.description || 'Ajustement manuel' }
      }, session.accessToken)
      setShowAdjust(false)
      setAdjustForm({ client_id: '', amount: 0, description: '' })
      // Refresh
      const { data } = await nhost.graphql.request({ query: `query { clients(order_by: { name: asc }) { id name offer { name monthly_credits } wallet { id balance reserved } actions_aggregate(where: { status: { _nin: ["terminee", "annulee"] } }) { aggregate { sum { credits_reserved } } } } }` }, session.accessToken)
      if (data?.clients) setClients(data.clients)
    } catch (err) { console.error(err) }
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const totalBalance = filtered.reduce((s, c) => s + (c.wallet?.balance || 0), 0)
  const totalReserved = filtered.reduce((s, c) => s + (c.wallet?.reserved || 0), 0)
  const totalAllocation = filtered.reduce((s, c) => s + (c.offer?.monthly_credits || 0), 0)

  if (loading) return <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>Chargement...</div>

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Crédits</h1><p className="page-subtitle">Allocations, ajustements, règles de report et suivi global.</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdjust(true)}><Plus size={16} /> Ajustement manuel</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-success-soft)', '--stat-color': 'var(--color-success)' }}>
          <div className="stat-icon"><CreditCard size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{totalBalance.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Total en circulation</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-warning-soft)', '--stat-color': 'var(--color-warning)' }}>
          <div className="stat-icon"><ArrowDownRight size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{totalReserved.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Total réservé</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-primary-soft)', '--stat-color': 'var(--color-primary)' }}>
          <div className="stat-icon"><ArrowUpRight size={20} /></div>
          <div className="stat-value">{totalAllocation.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Allocation mensuelle totale</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-purple-soft)', '--stat-color': 'var(--color-purple)' }}>
          <div className="stat-icon"><RotateCcw size={20} /></div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-label">Wallets actifs</div>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>Client</th><th>Offre</th><th>Allocation</th><th>Balance</th><th>Réservé</th><th>Utilisation</th></tr></thead>
          <tbody>
            {filtered.map(c => {
              const balance = c.wallet?.balance || 0
              const allocation = c.offer?.monthly_credits || 1
              const consumed = allocation - balance
              const pct = Math.min(100, Math.max(0, Math.round((consumed / allocation) * 100)))
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td><span className="badge badge-primary">{c.offer?.name || 'N/A'}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{allocation.toLocaleString('fr-FR')}</td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: balance < 200 ? 'var(--color-danger)' : 'var(--color-success)' }}>{balance.toLocaleString('fr-FR')}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-warning)' }}>{(c.wallet?.reserved || 0).toLocaleString('fr-FR')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="credit-meter" style={{ flex: 1, height: 6 }}>
                        <div className="credit-meter-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--color-danger)' : 'var(--gradient-primary)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: pct > 80 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun client.</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Ajustement manuel</h3><button className="modal-close" onClick={() => setShowAdjust(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={adjustForm.client_id} onChange={e => setAdjustForm({...adjustForm, client_id: e.target.value})}><option value="">Sélectionner...</option>{clients.filter(c => c.wallet).map(c => <option key={c.id} value={c.id}>{c.name} (solde: {c.wallet?.balance || 0})</option>)}</select></div>
            <div className="form-group"><label className="form-label">Montant (positif = crédit, négatif = débit)</label><input className="form-input" type="number" placeholder="Ex: 200 ou -50" value={adjustForm.amount} onChange={e => setAdjustForm({...adjustForm, amount: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Motif</label><textarea className="form-textarea" placeholder="Geste commercial, correction, etc." value={adjustForm.description} onChange={e => setAdjustForm({...adjustForm, description: e.target.value})} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Annuler</button><button className="btn btn-primary" onClick={handleAdjust}>Appliquer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
