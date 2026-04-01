import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Users, Eye, MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import type { ClientStatus } from '../../types'

interface ClientsData {
  clients: Array<{
    id: string; name: string; status: ClientStatus; industry?: string
    created_at: string; offer?: { name: string }; wallet?: { balance: number }
  }>
}

const statusColors: Record<ClientStatus, string> = { active: 'badge-success', sprint: 'badge-info', suspended: 'badge-danger', archived: 'badge-warning' }
const statusLabels: Record<ClientStatus, string> = { active: 'Actif', sprint: 'Sprint', suspended: 'Suspendu', archived: 'Archivé' }

export default function ClientManagement() {
  const [search, setSearch] = useState('')

  const { data, loading, error, refetch } = useGraphQL<ClientsData>({
    query: `query GetClients {
      clients(order_by: { created_at: desc }) {
        id name status industry created_at
        offer { name }
        wallet { balance }
      }
    }`
  })

  const clients = data?.clients || []
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
        <input className="form-input" placeholder="Rechercher un client..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {loading ? <LoadingState message="Chargement des clients..." /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
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
