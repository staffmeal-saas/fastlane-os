import { useState } from 'react'
import { Search, Shield, UserPlus, Mail, Edit } from 'lucide-react'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import type { PlatformRole } from '../../types'

interface ClientMember {
  id: string
  user_id: string
  role: string
  client: { id: string; name: string }
}

interface AccessData {
  user_profiles: Array<{
    id: string; user_id: string; display_name?: string
    platform_role: PlatformRole; created_at: string
  }>
  clients: Array<{ id: string; name: string }>
  client_members: ClientMember[]
}

interface EnrichedProfile {
  id: string
  user_id: string
  display_name?: string
  platform_role: PlatformRole
  created_at: string
  memberships: ClientMember[]
}

const roleLabels: Record<PlatformRole, string> = {
  super_admin: 'Super Admin', admin_ops: 'Admin Ops', account_manager: 'Account Manager',
  sprint_manager: 'Sprint Manager', finance_admin: 'Finance/Admin',
  client_owner: 'Client Owner', client_collaborator: 'Collaborateur', prospect_sprint: 'Prospect Sprint'
}
const roleColors: Record<PlatformRole, string> = {
  super_admin: 'badge-danger', admin_ops: 'badge-purple', account_manager: 'badge-primary',
  sprint_manager: 'badge-info', finance_admin: 'badge-warning',
  client_owner: 'badge-success', client_collaborator: 'badge-info', prospect_sprint: 'badge-warning'
}

const ADMIN_ROLES: PlatformRole[] = ['super_admin', 'admin_ops', 'account_manager', 'sprint_manager', 'finance_admin']

export default function AccessManagement() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<{ email: string; display_name: string; platform_role: PlatformRole; client_id: string }>({ email: '', display_name: '', platform_role: 'client_owner', client_id: '' })

  const { data, loading, error, refetch } = useGraphQL<AccessData>({
    query: `query {
      user_profiles(order_by: { created_at: desc }) {
        id user_id display_name platform_role created_at
      }
      clients(order_by: { name: asc }) { id name }
      client_members(order_by: { created_at: desc }) { id user_id role client { id name } }
    }`
  })

  const membersMap: Record<string, ClientMember[]> = {}
  ;(data?.client_members || []).forEach(m => {
    if (!membersMap[m.user_id]) membersMap[m.user_id] = []
    membersMap[m.user_id].push(m)
  })

  const profiles: EnrichedProfile[] = (data?.user_profiles || []).map(p => ({
    ...p, memberships: membersMap[p.user_id] || []
  }))
  const clients = data?.clients || []

  const filtered = profiles.filter(u =>
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.platform_role || '').toLowerCase().includes(search.toLowerCase())
  )

  const internal = filtered.filter(u => ADMIN_ROLES.includes(u.platform_role))
  const external = filtered.filter(u => !ADMIN_ROLES.includes(u.platform_role))

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1 className="page-title">Gestion Accès</h1><p className="page-subtitle">{profiles.length} utilisateurs — inviter, attribuer des rôles et gérer les permissions.</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><UserPlus size={16} /> Inviter un utilisateur</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher un utilisateur..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {/* Internal Users */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header"><span className="card-title"><Shield size={16} style={{ marginRight: 6 }} />Équipe interne ({internal.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Nom</th><th>Rôle</th><th>Créé le</th><th>Actions</th></tr></thead>
          <tbody>
            {internal.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>{u.display_name || 'Sans nom'}</td>
                <td><span className={`badge ${roleColors[u.platform_role] || 'badge-info'}`}>{roleLabels[u.platform_role] || u.platform_role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                <td><button className="btn btn-sm btn-ghost"><Edit size={14} /></button></td>
              </tr>
            ))}
            {internal.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Aucun membre interne.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* External Users */}
      <div className="card">
        <div className="card-header"><span className="card-title">Utilisateurs externes ({external.length})</span></div>
        <table className="data-table">
          <thead><tr><th>Nom</th><th>Rôle</th><th>Client</th><th>Créé le</th><th>Actions</th></tr></thead>
          <tbody>
            {external.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>{u.display_name || 'Sans nom'}</td>
                <td><span className={`badge ${roleColors[u.platform_role] || 'badge-info'}`}>{roleLabels[u.platform_role] || u.platform_role}</span></td>
                <td>{u.memberships?.[0]?.client?.name || '—'}</td>
                <td>{new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                <td><button className="btn btn-sm btn-ghost"><Edit size={14} /></button></td>
              </tr>
            ))}
            {external.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)' }}>Aucun utilisateur externe.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Inviter un utilisateur</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label className="form-label">Nom complet</label><input className="form-input" placeholder="Prénom Nom" value={form.display_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, display_name: e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group"><label className="form-label">Rôle</label><select className="form-select" value={form.platform_role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, platform_role: e.target.value as PlatformRole})}>{(Object.entries(roleLabels) as [PlatformRole, string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Client (si externe)</label><select className="form-select" value={form.client_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, client_id: e.target.value})}><option value="">Aucun (interne)</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary"><Mail size={16} /> Créer le profil</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
