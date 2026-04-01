import { useState } from 'react'
import { Plus, Search, Edit } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL, useLazyGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import type { ActionStatus, ActionPriority } from '../../types'

interface ActionRow {
  id: string
  title: string
  status: ActionStatus | string
  priority: ActionPriority | string
  credits_reserved: number
  credits_consumed: number
  due_date?: string
  client?: { id: string; name: string }
  campaign?: { id: string; name: string }
}

interface CampaignOption {
  id: string
  name: string
  client?: { id: string; name: string }
}

interface ClientOption {
  id: string
  name: string
}

interface ActionForm {
  client_id: string
  campaign_id: string
  title: string
  priority: string
  credits_reserved: string | number
  due_date: string
  description: string
}

const statusLabels: Record<string, string> = { a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours', review: 'En review', terminee: 'Terminée', annulee: 'Annulée' }
const statusColors: Record<string, string> = { a_valider: 'badge-warning', planifiee: 'badge-info', en_cours: 'badge-primary', review: 'badge-purple', terminee: 'badge-success', annulee: 'badge-danger' }
const priorityColors: Record<string, string> = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', urgent: 'badge-danger' }
const validStatuses: ActionStatus[] = ['a_valider', 'planifiee', 'en_cours', 'review', 'terminee', 'annulee']

interface ActionsData {
  actions: ActionRow[]
  campaigns: CampaignOption[]
  clients: ClientOption[]
}

export default function ActionManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const [form, setForm] = useState<ActionForm>({ client_id: '', campaign_id: '', title: '', priority: 'medium', credits_reserved: 0, due_date: '', description: '' })

  const { data, loading, error, refetch } = useGraphQL<ActionsData>({
    query: `query {
      actions(order_by: { created_at: desc }) { id title status priority credits_reserved credits_consumed due_date client { id name } campaign { id name } }
      campaigns(order_by: { name: asc }) { id name client { id name } }
      clients(order_by: { name: asc }) { id name }
    }`
  })

  const { execute: createAction } = useLazyGraphQL(
    `mutation($obj: actions_insert_input!) { insert_actions_one(object: $obj) { id } }`
  )

  const { execute: updateActionStatus } = useLazyGraphQL(
    `mutation($id: uuid!, $status: action_status!) {
      update_actions_by_pk(pk_columns: {id: $id}, _set: {status: $status}) { id }
    }`
  )

  const actions = data?.actions || []
  const campaigns = data?.campaigns || []
  const clients = data?.clients || []

  const handleCreate = async () => {
    if (!form.title || !form.client_id || !form.campaign_id) return
    try {
      await createAction({
        obj: {
          client_id: form.client_id,
          campaign_id: form.campaign_id,
          title: form.title,
          priority: form.priority,
          credits_reserved: parseInt(String(form.credits_reserved)) || 0,
          due_date: form.due_date || null,
          description: form.description
        }
      })
      setShowModal(false)
      setForm({ client_id: '', campaign_id: '', title: '', priority: 'medium', credits_reserved: 0, due_date: '', description: '' })
      refetch()
    } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (actionId: string, newStatus: ActionStatus) => {
    setStatusDropdown(null)
    try {
      await updateActionStatus({ id: actionId, status: newStatus })
      refetch()
    } catch (err) { console.error(err) }
  }

  const filteredCampaigns = form.client_id ? campaigns.filter(c => c.client?.id === form.client_id) : campaigns
  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.client?.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Actions</h1><p className="page-subtitle">{actions.length} actions — créer, assigner, planifier et suivre.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Nouvelle action</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
          <table className="data-table">
            <thead><tr><th>Action</th><th>Client</th><th>Campagne</th><th>Statut</th><th>Priorité</th><th>Crédits</th><th>Échéance</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700 }}>{a.title}</td>
                  <td>{a.client?.name || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{a.campaign?.name || '—'}</td>
                  <td><span className={`badge ${statusColors[a.status] || 'badge-info'}`}>{statusLabels[a.status] || a.status}</span></td>
                  <td><span className={`badge ${priorityColors[a.priority] || 'badge-info'}`}>{a.priority}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{a.credits_reserved || 0}</td>
                  <td style={{ fontSize: '0.8rem' }}>{a.due_date ? new Date(a.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setStatusDropdown(statusDropdown === a.id ? null : a.id)}>
                        <Edit size={14} />
                      </button>
                      {statusDropdown === a.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', minWidth: 160, padding: 'var(--space-xs)' }}>
                          {validStatuses.map(s => (
                            <button key={s} onClick={() => handleStatusChange(a.id, s)} style={{
                              display: 'block', width: '100%', textAlign: 'left', padding: 'var(--space-xs) var(--space-sm)',
                              background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                              fontSize: '0.8rem', color: a.status === s ? 'var(--color-primary)' : 'var(--color-text)',
                              fontWeight: a.status === s ? 700 : 400
                            }}>
                              {statusLabels[s]} {a.status === s && '(actuel)'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucune action.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Nouvelle action</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, client_id: e.target.value, campaign_id: ''})}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Campagne</label><select className="form-select" value={form.campaign_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, campaign_id: e.target.value})}><option value="">Sélectionner...</option>{filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="Ex: Rédaction script..." value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, title: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Priorité</label><select className="form-select" value={form.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, priority: e.target.value})}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></div>
              <div className="form-group"><label className="form-label">Crédits réservés</label><input className="form-input" type="number" placeholder="Ex: 80" value={form.credits_reserved} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, credits_reserved: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Échéance</label><input className="form-input" type="date" value={form.due_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, due_date: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Détails de l'action..." value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, description: e.target.value})} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate}>Créer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
