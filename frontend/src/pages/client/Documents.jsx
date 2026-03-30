import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Search, Grid, List } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const typeLabels = { pdf: 'PDF', audit: 'Audit', report: 'Rapport', script: 'Script', strategy: 'Stratégie', bilan: 'Bilan', other: 'Autre' }
const typeColors = { pdf: 'badge-danger', audit: 'badge-info', report: 'badge-purple', script: 'badge-warning', strategy: 'badge-primary', bilan: 'badge-success', other: 'badge-info' }

export default function Documents() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            documents(order_by: { created_at: desc }) {
              id title type description is_published created_at file_size
              campaign { name }
              versions_aggregate { aggregate { count } }
            }
          }`
        }, session.accessToken)
        if (data?.documents) setDocuments(data.documents)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const filtered = documents
    .filter(d => typeFilter === 'all' || d.type === typeFilter)
    .filter(d => d.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>Chargement...</div>

  const formatSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents & Livrables</h1>
          <p className="page-subtitle">{documents.length} documents</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('grid')}><Grid size={16} /></button>
          <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('list')}><List size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" placeholder="Rechercher un document..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select className="form-select" style={{ width: 'auto', maxWidth: 200 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">Tous les types</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          {filtered.map(doc => (
            <div key={doc.id} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>PDF</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h4>
                  <span className={`badge ${typeColors[doc.type] || 'badge-info'}`}>{typeLabels[doc.type] || doc.type}</span>
                </div>
              </div>
              {doc.campaign && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>{doc.campaign.name}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                <span>{formatSize(doc.file_size)} · v{(doc.versions_aggregate?.aggregate?.count || 0) + 1}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }}><Eye size={14} /> Voir</button>
                <button className="btn btn-sm btn-ghost"><Download size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun document.</div>}
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Document</th><th>Type</th><th>Campagne</th><th>Date</th><th>Taille</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600 }}>{doc.title}</td>
                  <td><span className={`badge ${typeColors[doc.type] || 'badge-info'}`}>{typeLabels[doc.type] || doc.type}</span></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{doc.campaign?.name || '—'}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                  <td>{formatSize(doc.file_size)}</td>
                  <td><div style={{ display: 'flex', gap: 'var(--space-xs)' }}><button className="btn btn-sm btn-ghost"><Eye size={14} /></button><button className="btn btn-sm btn-ghost"><Download size={14} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun document.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
