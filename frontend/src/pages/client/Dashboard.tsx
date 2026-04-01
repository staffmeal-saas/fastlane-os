import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import {
  Megaphone, Wallet, FileText, ArrowRight,
  Zap, LucideIcon
} from 'lucide-react'
import type { ActionStatus, ActionPriority } from '../../types'

const statusLabels: Record<ActionStatus | string, string> = { a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours', review: 'En review', terminee: 'Terminée', annulee: 'Annulée' }
const statusColors: Record<string, string> = { a_valider: 'badge-warning', planifiee: 'badge-info', en_cours: 'badge-primary', review: 'badge-purple', terminee: 'badge-success', annulee: 'badge-danger' }
const priorityColors: Record<ActionPriority, string> = { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger', urgent: 'badge-danger' }

interface DashboardData {
  campaigns: Array<{
    id: string; name: string; status: string
    credits_budget: number; credits_consumed: number
    actions_aggregate?: { aggregate?: { count?: number } }
  }>
  actions: Array<{
    id: string; title: string; status: string
    priority: ActionPriority; campaign?: { name: string }
  }>
  documents: Array<{
    id: string; title: string; type: string; created_at: string
  }>
  campaigns_aggregate: { aggregate: { count: number } }
  actions_aggregate: { aggregate: { count: number } }
}

interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bg: string
}

export default function Dashboard() {
  const { currentWallet } = useAuth()

  const { data, loading, error, refetch } = useGraphQL<DashboardData>({
    query: `query {
      campaigns(order_by: { created_at: desc }, limit: 5) { id name status credits_budget credits_consumed actions_aggregate { aggregate { count } } }
      actions(where: { status: { _nin: ["terminee", "annulee"] } }, order_by: { created_at: desc }, limit: 5) { id title status priority campaign { name } }
      documents(order_by: { created_at: desc }, limit: 4) { id title type created_at }
      campaigns_aggregate(where: { status: { _eq: "active" } }) { aggregate { count } }
      actions_aggregate(where: { status: { _nin: ["terminee", "annulee"] } }) { aggregate { count } }
    }`
  })

  const campaigns = data?.campaigns || []
  const actions = data?.actions || []
  const documents = data?.documents || []
  const stats = {
    campaigns: data?.campaigns_aggregate?.aggregate?.count || 0,
    actions: data?.actions_aggregate?.aggregate?.count || 0,
  }

  const walletBalance = currentWallet?.balance || 0
  const walletReserved = currentWallet?.reserved || 0
  const walletCarriedOver = currentWallet?.carried_over || 0
  const available = walletBalance - walletReserved

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const statItems: StatItem[] = [
    { label: 'Crédits disponibles', value: available.toLocaleString('fr-FR'), icon: Wallet, color: 'var(--color-success)', bg: 'var(--color-success-soft)' },
    { label: 'Campagnes actives', value: stats.campaigns, icon: Megaphone, color: 'var(--color-primary)', bg: 'var(--color-primary-soft)' },
    { label: 'Actions ouvertes', value: stats.actions, icon: Zap, color: 'var(--color-purple)', bg: 'var(--color-purple-soft)' },
    { label: 'Documents', value: documents.length, icon: FileText, color: 'var(--color-warning)', bg: 'var(--color-warning-soft)' },
  ]

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title">Bonjour 👋</h1>
        <p className="page-subtitle">Voici votre tableau de bord — vue d'ensemble de votre activité Fastlane.</p>
      </div>

      <div className="stats-grid">
        {statItems.map((stat, i) => (
          <div key={i} className="stat-card" style={{ '--stat-bg': stat.bg, '--stat-color': stat.color, animationDelay: `${i * 0.1}s` } as React.CSSProperties}>
            <div className="stat-icon"><stat.icon size={20} /></div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="section-grid">
        {/* Credit Summary */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Wallet size={16} style={{ marginRight: 6 }} />Portefeuille de crédits</span>
            <Link to="/credits" className="btn btn-sm btn-ghost">Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{available.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Crédits disponibles</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Réservés</span><span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>{walletReserved}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Reportés</span><span style={{ fontWeight: 700, color: 'var(--color-purple)' }}>{walletCarriedOver}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: 'var(--color-text-muted)' }}>Total</span><span style={{ fontWeight: 700 }}>{walletBalance}</span></div>
            </div>
          </div>
          {walletBalance > 0 && (
            <>
              <div className="credit-meter"><div className="credit-meter-fill" style={{ width: `${Math.min(100, (available / walletBalance) * 100)}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>Utilisé: {walletReserved}</span><span>Total: {walletBalance}</span>
              </div>
            </>
          )}
        </div>

        {/* Active Campaigns */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Megaphone size={16} style={{ marginRight: 6 }} />Campagnes</span>
            <Link to="/campaigns" className="btn btn-sm btn-ghost">Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                  <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'draft' ? 'badge-warning' : 'badge-info'}`}>{c.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span><Zap size={12} style={{ marginRight: 4 }} />{c.actions_aggregate?.aggregate?.count || 0} actions</span>
                  <span><Wallet size={12} style={{ marginRight: 4 }} />{c.credits_budget || 0} crédits</span>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucune campagne pour le moment.</div>}
          </div>
        </div>
      </div>

      <div className="section-grid">
        {/* Priority Actions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Zap size={16} style={{ marginRight: 6 }} />Actions prioritaires</span>
            <Link to="/actions" className="btn btn-sm btn-ghost">Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {actions.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.campaign?.name || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <span className={`badge ${priorityColors[a.priority] || 'badge-info'}`}>{a.priority}</span>
                  <span className={`badge ${statusColors[a.status] || 'badge-info'}`}>{statusLabels[a.status] || a.status}</span>
                </div>
              </div>
            ))}
            {actions.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucune action en cours.</div>}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><FileText size={16} style={{ marginRight: 6 }} />Derniers livrables</span>
            <Link to="/documents" className="btn btn-sm btn-ghost">Voir tout <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', fontSize: '0.7rem', fontWeight: 700 }}>PDF</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                </div>
                <span className="badge badge-info">{doc.type}</span>
              </div>
            ))}
            {documents.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucun document.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
