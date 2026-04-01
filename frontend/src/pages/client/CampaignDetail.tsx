import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, Target, Wallet, Zap } from 'lucide-react'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import EmptyState from '../../components/UI/EmptyState'
import type { ActionStatus, CampaignStatus } from '../../types'

const statusLabels: Record<CampaignStatus, string> = { active: 'Active', completed: 'Terminée', draft: 'Brouillon', paused: 'En pause' }
const actionStatusLabels: Record<ActionStatus | string, string> = { a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours', review: 'En review', terminee: 'Terminée', annulee: 'Annulée' }
const actionStatusColors: Record<string, string> = { a_valider: 'badge-warning', planifiee: 'badge-info', en_cours: 'badge-primary', review: 'badge-purple', terminee: 'badge-success', annulee: 'badge-danger' }

interface CampaignData {
  campaigns_by_pk: {
    id: string
    name: string
    status: CampaignStatus
    description?: string
    objectives?: string
    kpi_targets?: string
    kpi_results?: string
    start_date?: string
    end_date?: string
    credits_budget: number
    credits_consumed: number
    client?: { id: string; name: string }
    actions: Array<{
      id: string; title: string; status: ActionStatus; priority: string
      credits_reserved: number; credits_consumed: number; due_date?: string
    }>
    documents: Array<{
      id: string; title: string; type: string; created_at: string
    }>
  } | null
}

interface StatItem {
  label: string
  value: string | number
  icon: typeof Users
  color: string
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, loading, error, refetch } = useGraphQL<CampaignData>({
    query: `query GetCampaign($id: uuid!) {
      campaigns_by_pk(id: $id) {
        id name status description objectives kpi_targets kpi_results
        start_date end_date credits_budget credits_consumed
        client { id name }
        actions(order_by: { created_at: desc }) { id title status priority credits_reserved credits_consumed due_date }
        documents(order_by: { created_at: desc }) { id title type created_at }
      }
    }`,
    variables: { id },
    skip: !id
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const campaign = data?.campaigns_by_pk
  if (!campaign) {
    return (
      <EmptyState
        icon={Target}
        title="Campagne introuvable"
        description="Cette campagne n'existe pas ou vous n'y avez pas accès."
        action={{ label: 'Retour aux campagnes', onClick: () => window.history.back() }}
      />
    )
  }

  const budgetPercent = campaign.credits_budget > 0
    ? Math.min(100, (campaign.credits_consumed / campaign.credits_budget) * 100)
    : 0

  const statItems: StatItem[] = [
    { label: 'Actions', value: campaign.actions.length, icon: Zap, color: 'var(--color-primary)' },
    { label: 'Documents', value: campaign.documents.length, icon: Target, color: 'var(--color-warning)' },
    { label: 'Budget utilisé', value: `${campaign.credits_consumed}/${campaign.credits_budget}`, icon: Wallet, color: 'var(--color-purple)' },
    { label: 'Statut', value: statusLabels[campaign.status] || campaign.status, icon: Calendar, color: 'var(--color-success)' },
  ]

  return (
    <div className="animate-in">
      <Link to="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Retour aux campagnes
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="page-subtitle">{campaign.description || 'Pas de description.'}</p>
        </div>
        <span className={`badge ${campaign.status === 'active' ? 'badge-success' : campaign.status === 'draft' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
          {statusLabels[campaign.status] || campaign.status}
        </span>
      </div>

      {campaign.client && (
        <div style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Client : <strong style={{ color: 'var(--color-text)' }}>{campaign.client.name}</strong>
          {campaign.start_date && <> · {new Date(campaign.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} — {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '...'}</>}
        </div>
      )}

      <div className="stats-grid">
        {statItems.map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-bg': 'rgba(59,130,246,0.1)', '--stat-color': s.color } as React.CSSProperties}>
            <div className="stat-icon"><s.icon size={20} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Budget crédits</span></div>
          {campaign.credits_budget > 0 ? (
            <>
              <div className="credit-meter"><div className="credit-meter-fill" style={{ width: `${budgetPercent}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <span>Consommé : {campaign.credits_consumed}</span>
                <span>Budget : {campaign.credits_budget}</span>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucun budget alloué.</p>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Objectifs</span></div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {campaign.objectives || 'Pas d\'objectifs définis.'}
          </p>
          {campaign.kpi_targets && (
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
              <strong>KPI cibles :</strong> {campaign.kpi_targets}
            </div>
          )}
        </div>
      </div>

      <div className="section-grid" style={{ marginTop: 'var(--space-xl)' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Actions liées ({campaign.actions.length})</span></div>
          {campaign.actions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {campaign.actions.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.title}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{a.credits_consumed || a.credits_reserved || 0} cr.</span>
                    <span className={`badge ${actionStatusColors[a.status] || 'badge-info'}`}>
                      {actionStatusLabels[a.status] || a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucune action.</p>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Documents ({campaign.documents.length})</span></div>
          {campaign.documents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {campaign.documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>PDF</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <span className="badge badge-info">{doc.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucun document.</p>
          )}
        </div>
      </div>
    </div>
  )
}
