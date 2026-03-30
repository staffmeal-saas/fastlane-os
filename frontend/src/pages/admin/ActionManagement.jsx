import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Eye, ListChecks } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const statusLabels = { a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours', review: 'En review', terminee: 'Terminée', annulee: 'Annulée' }
const statusColors = { a_valider: 'badge-warning', planifiee: 'badge-info', en_cours: 'badge-primary', review: 'badge-purple', terminee: 'badge-success', annulee: 'badge-danger' }
const priorityColors = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', urgent: 'badge-danger' }

export default function ActionManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [actions, setActions] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ client_id: '', campaign_id: '', title: '', priority: 'medium', credits_reserved: 0, due_date: '', description: '' })

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            actions(order_by: { created_at: desc }) { id title status priority credits_reserved credits_consumed due_date client { id name } campaign { id name } }
            campaigns(order_by: { name: asc }) { id name client { id name } }
            clients(order_by: { name: asc }) { id name }
          }`
        }, session.accessToken)
        if (data?.actions) setActions(data.actions)
        if (data?.campaigns) setCampaigns(data.campaigns)
        if (data?.clients) setClients(data.clients)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const handleCreate = async () => {
    if (!form.title || !form.client_id || !form.campaign_id) return
    try {
      await nhost.graphql.request({
        query: `mutation($obj: actions_insert_input!) { insert_actions_one(object: $obj) { id } }`,
        variables: { obj: { client_id: form.client_id, campaign_id: form.campaign_id, title: form.title, priority: form.priority, credits_reserved: parseInt(form.credits_reserved) || 0, due_date: form.due_date || null, description: form.description } }
      }, session.accessToken)
      setShowModal(false)
      setForm({ client_id: '', campaign_id: '', title: '', priority: 'medium', credits_reserved: 0, due_date: '', description: '' })
      const { data } = await nhost.graphql.request({ query: `query { actions(order_by: { created_at: desc }) { id title status priority credits_reserved credits_consumed due_date client { id name } campaign { id name } } }` }, session.accessToken)
      if (data?.actions) setActions(data.actions)
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
        <input className="form-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chargement...</div> : (
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
                  <td><div style={{ display: 'flex', gap: 'var(--space-xs)' }}><button className="btn btn-sm btn-ghost"><Edit size={14} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucune action.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Nouvelle action</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value, campaign_id: ''})}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Campagne</label><select className="form-select" value={form.campaign_id} onChange={e => setForm({...form, campaign_id: e.target.value})}><option value="">Sélectionner...</option>{filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="Ex: Rédaction script..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Priorité</label><select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></div>
              <div className="form-group"><label className="form-label">Crédits réservés</label><input className="form-input" type="number" placeholder="Ex: 80" value={form.credits_reserved} onChange={e => setForm({...form, credits_reserved: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Échéance</label><input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Détails de l'action..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate}>Créer</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
