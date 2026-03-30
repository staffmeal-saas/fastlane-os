import { useState, useEffect } from 'react'
import { Plus, Search, Upload, Eye, Download, FolderOpen } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const typeLabels = { strategy: 'Stratégie', audit: 'Audit', report: 'Rapport', script: 'Script', bilan: 'Bilan', pdf: 'PDF', other: 'Autre' }
const typeColors = { strategy: 'badge-primary', audit: 'badge-info', report: 'badge-purple', script: 'badge-warning', bilan: 'badge-success', pdf: 'badge-danger', other: 'badge-info' }

export default function DocumentManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [documents, setDocuments] = useState([])
  const [clients, setClients] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ client_id: '', campaign_id: '', title: '', type: 'other', description: '' })

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            documents(order_by: { created_at: desc }) { id title type is_published created_at client { id name } campaign { id name } versions_aggregate { aggregate { count } } }
            clients(order_by: { name: asc }) { id name }
            campaigns(order_by: { name: asc }) { id name client { id name } }
          }`
        }, session.accessToken)
        if (data?.documents) setDocuments(data.documents)
        if (data?.clients) setClients(data.clients)
        if (data?.campaigns) setCampaigns(data.campaigns)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const handleCreate = async () => {
    if (!form.title || !form.client_id) return
    try {
      await nhost.graphql.request({
        query: `mutation($obj: documents_insert_input!) { insert_documents_one(object: $obj) { id } }`,
        variables: { obj: { client_id: form.client_id, campaign_id: form.campaign_id || null, title: form.title, type: form.type, description: form.description, is_published: true, published_at: new Date().toISOString() } }
      }, session.accessToken)
      setShowModal(false)
      setForm({ client_id: '', campaign_id: '', title: '', type: 'other', description: '' })
      const { data } = await nhost.graphql.request({ query: `query { documents(order_by: { created_at: desc }) { id title type is_published created_at client { id name } campaign { id name } versions_aggregate { aggregate { count } } } }` }, session.accessToken)
      if (data?.documents) setDocuments(data.documents)
    } catch (err) { console.error(err) }
  }

  const filtered = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.client?.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Documents</h1><p className="page-subtitle">{documents.length} docs — upload, publier, versionner et rattacher les livrables.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Upload size={16} /> Nouveau document</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chargement...</div> : (
          <table className="data-table">
            <thead><tr><th>Document</th><th>Client</th><th>Type</th><th>Campagne</th><th>Publié</th><th>Date</th><th>Versions</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700 }}>{d.title}</td>
                  <td>{d.client?.name || '—'}</td>
                  <td><span className={`badge ${typeColors[d.type] || 'badge-info'}`}>{typeLabels[d.type] || d.type}</span></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{d.campaign?.name || '—'}</td>
                  <td><span className={`badge ${d.is_published ? 'badge-success' : 'badge-warning'}`}>{d.is_published ? 'Publié' : 'Brouillon'}</span></td>
                  <td>{new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                  <td>v{(d.versions_aggregate?.aggregate?.count || 0) + 1}</td>
                  <td><div style={{ display: 'flex', gap: 'var(--space-xs)' }}><button className="btn btn-sm btn-ghost"><Eye size={14} /></button><button className="btn btn-sm btn-ghost"><Download size={14} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun document.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Nouveau document</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="Ex: Stratégie Acquisition Q2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="strategy">Stratégie</option><option value="audit">Audit</option><option value="bilan">Bilan</option><option value="script">Script</option><option value="report">Rapport</option><option value="pdf">PDF</option><option value="other">Autre</option></select></div>
              <div className="form-group"><label className="form-label">Campagne (optionnel)</label><select className="form-select" value={form.campaign_id} onChange={e => setForm({...form, campaign_id: e.target.value})}><option value="">Aucune</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name} ({c.client?.name})</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Description du document..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate}>Publier</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
