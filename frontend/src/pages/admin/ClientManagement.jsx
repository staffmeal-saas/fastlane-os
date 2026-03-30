import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Users, Eye, MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const statusColors = { active: 'badge-success', sprint: 'badge-info', suspended: 'badge-danger', archived: 'badge-warning' }
const statusLabels = { active: 'Actif', sprint: 'Sprint', suspended: 'Suspendu', archived: 'Archivé' }

export default function ClientManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `
            query GetClients {
              clients(order_by: { created_at: desc }) {
                id
                name
                status
                industry
                created_at
                offer { name }
                wallet { balance }
              }
            }
          `
        }, session.accessToken)
        if (data?.clients) setClients(data.clients)
      } catch (err) {
        console.error('Failed to fetch clients:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [session])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion Clients</h1>
          <p className="page-subtitle">{clients.length} comptes — création, édition, statut et accès.</p>
        </div>
        <Link to="/admin/clients/onboarding" className="btn btn-primary">
          <Plus size={16} /> Nouveau client
        </Link>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chargement des clients...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Client</th><th>Statut</th><th>Offre</th><th>Crédits</th><th>Industrie</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.id.split('-')[0]}</div>
                  </td>
                  <td><span className={`badge ${statusColors[c.status] || 'badge-info'}`}>{statusLabels[c.status] || c.status}</span></td>
                  <td>{c.offer?.name || 'N/A'}</td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{c.wallet?.balance || 0}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{c.industry || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button className="btn btn-sm btn-ghost"><Eye size={14} /></button>
                      <button className="btn btn-sm btn-ghost"><Edit size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
