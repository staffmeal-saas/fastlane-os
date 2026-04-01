import { useState } from 'react'
import { Plus, Search, Edit, Eye, Megaphone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import nhost from '../../lib/nhost'
import type { CampaignStatus } from '../../types'

interface CampaignsData {
  campaigns: CampaignRow[]
  clients: ClientOption[]
}

interface CampaignRow {
  id: string
  name: string
  status: CampaignStatus | string
  start_date?: string
  end_date?: string
  credits_budget: number
  credits_consumed: number
  client?: { id: string; name: string }
  actions_aggregate?: { aggregate?: { count?: number } }
}

interface ClientOption {
  id: string
  name: string
}

interface CampaignForm {
  client_id: string
  name: string
  start_date: string
  end_date: string
  credits_budget: string | number
  objectives: string
}

const statusColors: Record<string, string> = { active: 'badge-success', completed: 'badge-info', draft: 'badge-warning', paused: 'badge-purple', archived: 'badge-danger' }
const statusLabels: Record<string, string> = { active: 'Active', completed: 'Terminée', draft: 'Brouillon', paused: 'En pause', archived: 'Archivée' }

export default function CampaignManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CampaignForm>({ client_id: '', name: '', start_date: '', end_date: '', credits_budget: 0, objectives: '' })

  const { data, loading, error, refetch } = useGraphQL<CampaignsData>({
    query: `query {
      campaigns(order_by: { created_at: desc }) { id name status start_date end_date credits_budget credits_consumed client { id name } actions_aggregate { aggregate { count } } }
      clients(order_by: { name: asc }) { id name }
    }`
  })

  const campaigns = data?.campaigns || []
  const clients = data?.clients || []

  const handleCreate = async () => {
    if (!form.name || !form.client_id) return
    try {
      await nhost.graphql.request({
        query: `mutation($obj: campaigns_insert_input!) { insert_campaigns_one(object: $obj) { id } }`,
        variables: { obj: { client_id: form.client_id, name: form.name, start_date: form.start_date || null, end_date: form.end_date || null, credits_budget: parseInt(String(form.credits_budget)) || 0, objectives: form.objectives } }
      }, session.accessToken)
      setShowModal(false)
      setForm({ client_id: '', name: '', start_date: '', end_date: '', credits_budget: 0, objectives: '' })
      refetch()
    } catch (err) { console.error(err) }
  }

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.client?.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Campagnes</h1><p className="page-subtitle">{campaigns.length} campagnes — créer, piloter, archiver.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nouvelle campagne</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher par campagne ou client..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <table className="data-table">
            <thead><tr><th>Campagne</th><th>Client</th><th>Statut</th><th>Période</th><th>Budget</th><th>Consommé</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td>{c.client?.name || '—'}</td>
                  <td><span className={`badge ${statusColors[c.status] || 'badge-info'}`}>{statusLabels[c.status] || c.status}</span></td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{c.start_date ? new Date(c.start_date).toLocaleDateString('fr-FR', { month: 'short' }) : '—'} - {c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : '—'}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.credits_budget || 0}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.credits_consumed || 0}</td>
                  <td><div style={{ display: 'flex', gap: 'var(--space-xs)' }}><button className="btn btn-sm btn-ghost"><Eye size={14} /></button><button className="btn btn-sm btn-ghost"><Edit size={14} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucune campagne.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Nouvelle campagne</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, client_id: e.target.value})}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Nom de la campagne</label><input className="form-input" placeholder="Ex: Outbound LinkedIn Q2" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, name: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Date début</label><input className="form-input" type="date" value={form.start_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, start_date: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Date fin</label><input className="form-input" type="date" value={form.end_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, end_date: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Budget crédits</label><input className="form-input" type="number" placeholder="Ex: 500" value={form.credits_budget} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, credits_budget: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Objectifs</label><textarea className="form-textarea" placeholder="Objectifs de la campagne..." value={form.objectives} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, objectives: e.target.value})} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate}>Créer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
