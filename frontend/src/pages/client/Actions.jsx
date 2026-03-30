import { useState, useEffect } from 'react'
import { ListChecks, LayoutGrid, Clock, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const statusLabels = { a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours', review: 'En review', terminee: 'Terminée', annulee: 'Annulée' }
const statusColors = { a_valider: 'badge-warning', planifiee: 'badge-info', en_cours: 'badge-primary', review: 'badge-purple', terminee: 'badge-success', annulee: 'badge-danger' }
const priorityLabels = { low: 'Basse', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente' }
const priorityColors = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', urgent: 'badge-danger' }
const kanbanColumns = ['a_valider', 'planifiee', 'en_cours', 'review', 'terminee']

export default function Actions() {
  const { session } = useAuth()
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!session?.accessToken) return
      try {
        const { data } = await nhost.graphql.request({
          query: `query {
            actions(order_by: { created_at: desc }) {
              id title status priority credits_reserved due_date
              campaign { name }
            }
          }`
        }, session.accessToken)
        if (data?.actions) setActions(data.actions)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [session])

  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="animate-in" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>Chargement...</div>

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Actions en cours</h1>
          <p className="page-subtitle">{actions.length} actions — suivi opérationnel du delivery</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('kanban')}><LayoutGrid size={16} /> Kanban</button>
          <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}><ListChecks size={16} /> Liste</button>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 'var(--space-xl)' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Rechercher une action..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      {view === 'kanban' ? (
        <div className="kanban-board">
          {kanbanColumns.map(col => {
            const colActions = filtered.filter(a => a.status === col)
            return (
              <div key={col} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="kanban-column-title"><span className={`badge ${statusColors[col]}`} style={{ padding: '2px 6px' }}></span>{statusLabels[col]}</span>
                  <span className="kanban-count">{colActions.length}</span>
                </div>
                {colActions.map(a => (
                  <div key={a.id} className="kanban-card">
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>{a.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{a.campaign?.name || '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${priorityColors[a.priority] || 'badge-info'}`}>{priorityLabels[a.priority] || a.priority}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.credits_reserved || 0} cr.</span>
                    </div>
                    {a.due_date && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <span><Clock size={12} style={{ marginRight: 2 }} />{new Date(a.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                ))}
                {colActions.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Vide</div>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Action</th><th>Campagne</th><th>Statut</th><th>Priorité</th><th>Crédits</th><th>Échéance</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td>{a.campaign?.name || '—'}</td>
                  <td><span className={`badge ${statusColors[a.status] || 'badge-info'}`}>{statusLabels[a.status] || a.status}</span></td>
                  <td><span className={`badge ${priorityColors[a.priority] || 'badge-info'}`}>{priorityLabels[a.priority] || a.priority}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{a.credits_reserved || 0}</td>
                  <td>{a.due_date ? new Date(a.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucune action.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
