import { useState } from 'react'
import { Plus, Search, Upload, Eye, Download, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL, useLazyGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import FileUpload from '../../components/UI/FileUpload'
import nhost from '../../lib/nhost'

interface DocumentsData {
  documents: Array<{
    id: string; title: string; type: string; is_published: boolean; created_at: string
    file_id?: string; file_url?: string; file_size?: number
    client?: { id: string; name: string }; campaign?: { id: string; name: string }
    versions_aggregate?: { aggregate?: { count?: number } }
  }>
  clients: Array<{ id: string; name: string }>
  campaigns: Array<{ id: string; name: string; client?: { id: string; name: string } }>
}

interface DocumentForm {
  client_id: string; campaign_id: string; title: string; type: string; description: string
}

const typeLabels: Record<string, string> = { strategy: 'Stratégie', audit: 'Audit', report: 'Rapport', script: 'Script', bilan: 'Bilan', pdf: 'PDF', other: 'Autre' }
const typeColors: Record<string, string> = { strategy: 'badge-primary', audit: 'badge-info', report: 'badge-purple', script: 'badge-warning', bilan: 'badge-success', pdf: 'badge-danger', other: 'badge-info' }

export default function DocumentManagement() {
  const { session } = useAuth()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [form, setForm] = useState<DocumentForm>({ client_id: '', campaign_id: '', title: '', type: 'other', description: '' })

  const { data, loading, error, refetch } = useGraphQL<DocumentsData>({
    query: `query {
      documents(order_by: { created_at: desc }) { id title type is_published created_at file_id file_url file_size client { id name } campaign { id name } versions_aggregate { aggregate { count } } }
      clients(order_by: { name: asc }) { id name }
      campaigns(order_by: { name: asc }) { id name client { id name } }
    }`
  })

  const { execute: createDoc } = useLazyGraphQL<{ insert_documents_one: { id: string } }>(
    `mutation($obj: documents_insert_input!) { insert_documents_one(object: $obj) { id } }`
  )

  const { execute: togglePublish } = useLazyGraphQL(
    `mutation($id: uuid!, $published: Boolean!, $publishedAt: timestamptz) {
      update_documents_by_pk(pk_columns: {id: $id}, _set: {is_published: $published, published_at: $publishedAt}) { id }
    }`
  )

  const documents = data?.documents || []
  const clients = data?.clients || []
  const campaigns = data?.campaigns || []

  const handleCreate = async () => {
    if (!form.title || !form.client_id || !selectedFile) return
    setUploading(true)

    try {
      // 1. Upload file to storage
      const uploadResult = await nhost.storage.upload(selectedFile, session!.accessToken)
      if (uploadResult.error || !uploadResult.data) {
        setUploading(false)
        return
      }

      // 2. Create document record
      await createDoc({
        obj: {
          client_id: form.client_id,
          campaign_id: form.campaign_id || null,
          title: form.title,
          type: form.type,
          description: form.description,
          file_id: uploadResult.data.id,
          file_url: nhost.storage.getSignedUrl(uploadResult.data.id, session!.accessToken),
          file_size: selectedFile.size,
          is_published: true,
          published_at: new Date().toISOString()
        }
      })

      setShowModal(false)
      setForm({ client_id: '', campaign_id: '', title: '', type: 'other', description: '' })
      setSelectedFile(null)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleTogglePublish = async (docId: string, currentPublished: boolean) => {
    try {
      await togglePublish({
        id: docId,
        published: !currentPublished,
        publishedAt: !currentPublished ? new Date().toISOString() : null
      })
      refetch()
    } catch (err) { console.error(err) }
  }

  const handleDownload = (doc: DocumentsData['documents'][0]) => {
    if (doc.file_id) {
      const url = nhost.storage.getSignedUrl(doc.file_id, session!.accessToken)
      window.open(url, '_blank')
    }
  }

  const filtered = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.client?.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Documents</h1><p className="page-subtitle">{documents.length} docs — upload, publier, versionner et rattacher les livrables.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Upload size={16} /> Nouveau document</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        <table className="data-table">
          <thead><tr><th>Document</th><th>Client</th><th>Type</th><th>Campagne</th><th>Publié</th><th>Date</th><th>Versions</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 700 }}>{d.title}</td>
                <td>{d.client?.name || '—'}</td>
                <td><span className={`badge ${typeColors[d.type] || 'badge-info'}`}>{typeLabels[d.type] || d.type}</span></td>
                <td style={{ color: 'var(--color-text-muted)' }}>{d.campaign?.name || '—'}</td>
                <td>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleTogglePublish(d.id, d.is_published)} title={d.is_published ? 'Dépublier' : 'Publier'}>
                    {d.is_published ? <ToggleRight size={18} style={{ color: 'var(--color-success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--color-text-muted)' }} />}
                  </button>
                </td>
                <td>{new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                <td>v{(d.versions_aggregate?.aggregate?.count || 0) + 1}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    {d.file_id && (
                      <>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(d)} title="Voir"><Eye size={14} /></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDownload(d)} title="Télécharger"><Download size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun document.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Nouveau document</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, client_id: e.target.value})}><option value="">Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Titre</label><input className="form-input" placeholder="Ex: Stratégie Acquisition Q2" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, title: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, type: e.target.value})}><option value="strategy">Stratégie</option><option value="audit">Audit</option><option value="bilan">Bilan</option><option value="script">Script</option><option value="report">Rapport</option><option value="pdf">PDF</option><option value="other">Autre</option></select></div>
              <div className="form-group"><label className="form-label">Campagne (optionnel)</label><select className="form-select" value={form.campaign_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, campaign_id: e.target.value})}><option value="">Aucune</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name} ({c.client?.name})</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Description du document..." value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group">
              <label className="form-label">Fichier</label>
              <FileUpload onFileSelect={setSelectedFile} uploading={uploading} />
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleCreate} disabled={!selectedFile || uploading}>{uploading ? 'Upload en cours...' : 'Publier'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
