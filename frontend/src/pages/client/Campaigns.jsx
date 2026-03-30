import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Calendar, Wallet, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const statusLabels = { active: 'Active', completed: 'Terminée', draft: 'Brouillon', paused: 'En pause', archived: 'Archivée' }
const statusColors = { active: 'badge-success', completed: 'badge-info', draft: 'badge-warning', paused: 'badge-purple', archived: 'badge-danger' }

export default function Campaigns() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            campaigns(order_by: { created_at: desc }) {
              id name description status start_date end_date credits_budget credits_consumed
              actions_aggregate { aggregate { count } }
            }
          }`
        }, session.accessToken)
        if (data?.campaigns) setCampaigns(data.campaigns)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const filtered = campaigns
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>Chargement...</div>

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campagnes</h1>
          <p className="page-subtitle">{campaigns.length} campagnes</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" placeholder="Rechercher une campagne..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {['all', 'active', 'draft', 'completed', 'paused'].map(s => (
            <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Toutes' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="section-grid">
        {filtered.map(c => (
          <Link to={`/campaigns/${c.id}`} key={c.id} className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{c.description || 'Pas de description.'}</p>
              </div>
              <span className={`badge ${statusColors[c.status] || 'badge-info'}`}>{statusLabels[c.status] || c.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{c.actions_aggregate?.aggregate?.count || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Actions</div></div>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{c.credits_budget || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Budget</div></div>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{c.credits_consumed || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Consommé</div></div>
            </div>

            {(c.credits_budget || 0) > 0 && (
              <>
                <div className="credit-meter"><div className="credit-meter-fill" style={{ width: `${Math.min(100, ((c.credits_consumed || 0) / c.credits_budget) * 100)}%` }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{c.credits_consumed || 0}/{c.credits_budget} crédits</span>
                  <span>{c.start_date ? new Date(c.start_date).toLocaleDateString('fr-FR', { month: 'short' }) : '—'} - {c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
              </>
            )}
          </Link>
        ))}
        {filtered.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucune campagne.</div>}
      </div>
    </div>
  )
}
