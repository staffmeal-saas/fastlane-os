import { useState } from 'react'
import { FileText, Download, Eye, Search, Grid, List } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import nhost from '../../lib/nhost'

const typeLabels: Record<string, string> = { pdf: 'PDF', audit: 'Audit', report: 'Rapport', script: 'Script', strategy: 'Stratégie', bilan: 'Bilan', other: 'Autre' }
const typeColors: Record<string, string> = { pdf: 'badge-danger', audit: 'badge-info', report: 'badge-purple', script: 'badge-warning', strategy: 'badge-primary', bilan: 'badge-success', other: 'badge-info' }

interface DocumentsData {
  documents: Array<{
    id: string; title: string; type: string; description?: string
    is_published: boolean; created_at: string; file_size?: number; file_id?: string
    campaign?: { name: string }
    versions_aggregate?: { aggregate?: { count?: number } }
  }>
}

type ViewMode = 'grid' | 'list'

export default function Documents() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data, loading, error, refetch } = useGraphQL<DocumentsData>({
    query: `query {
      documents(where: {is_published: {_eq: true}}, order_by: {created_at: desc}) {
        id title type description is_published created_at file_size file_id
        campaign { name }
        versions_aggregate { aggregate { count } }
      }
    }`
  })

  const documents = data?.documents || []
  const filtered = documents
    .filter(d => typeFilter === 'all' || d.type === typeFilter)
    .filter(d => d.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '—'
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const handleView = (doc: DocumentsData['documents'][0]) => {
    if (doc.file_id && session?.accessToken) {
      window.open(nhost.storage.getSignedUrl(doc.file_id, session.accessToken), '_blank')
    }
  }

  const handleDownload = (doc: DocumentsData['documents'][0]) => {
    if (doc.file_id && session?.accessToken) {
      const url = nhost.storage.getSignedUrl(doc.file_id, session.accessToken)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title
      a.click()
    }
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
          <input className="form-input" placeholder="Rechercher un document..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select className="form-select" style={{ width: 'auto', maxWidth: 200 }} value={typeFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}>
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
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => handleView(doc)} disabled={!doc.file_id}><Eye size={14} /> Voir</button>
                <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(doc)} disabled={!doc.file_id}><Download size={14} /></button>
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
                  <td><div style={{ display: 'flex', gap: 'var(--space-xs)' }}><button className="btn btn-sm btn-ghost" onClick={() => handleView(doc)} disabled={!doc.file_id}><Eye size={14} /></button><button className="btn btn-sm btn-ghost" onClick={() => handleDownload(doc)} disabled={!doc.file_id}><Download size={14} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun document.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
