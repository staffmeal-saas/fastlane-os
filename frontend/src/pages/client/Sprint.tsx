import { Rocket, CheckCircle2, Clock, Users, Calendar, Target, FileText, Zap, Trophy, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import EmptyState from '../../components/UI/EmptyState'

interface SprintData {
  campaigns: Array<{
    id: string; name: string; status: string; created_at: string
    objectives?: string; kpi_targets?: string; kpi_results?: string
    actions: Array<{
      id: string; title: string; status: string; due_date?: string; created_at: string
    }>
    documents: Array<{
      id: string; title: string; type: string; created_at: string
    }>
  }>
  offers: Array<{
    id: string; name: string; monthly_credits: number; price_monthly: number | null
  }>
}

const actionStatusLabels: Record<string, string> = {
  a_valider: 'À valider', planifiee: 'Planifiée', en_cours: 'En cours',
  review: 'En review', terminee: 'Terminée', annulee: 'Annulée'
}
const actionStatusColors: Record<string, string> = {
  terminee: 'completed', en_cours: 'active', a_valider: 'pending', planifiee: 'pending', review: 'active'
}

export default function Sprint() {
  const { currentClient } = useAuth()

  const { data, loading, error, refetch } = useGraphQL<SprintData>({
    query: `query GetSprintData($clientId: uuid!) {
      campaigns(where: { client_id: { _eq: $clientId } }, order_by: { created_at: desc }, limit: 1) {
        id name status created_at objectives kpi_targets kpi_results
        actions(order_by: { created_at: asc }) { id title status due_date created_at }
        documents(order_by: { created_at: desc }, limit: 5) { id title type created_at }
      }
      offers(where: { is_sprint: { _eq: false } }, order_by: { monthly_credits: asc }) {
        id name monthly_credits price_monthly
      }
    }`,
    variables: { clientId: currentClient?.id },
    skip: !currentClient?.id
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const sprintCampaign = data?.campaigns?.[0]
  const offers = data?.offers || []

  if (!sprintCampaign) {
    return (
      <EmptyState
        icon={Rocket}
        title="Aucun sprint actif"
        description="Votre sprint n'a pas encore été configuré. L'équipe Fastlane vous contactera bientôt."
      />
    )
  }

  const sprintStart = new Date(sprintCampaign.created_at)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(daysDiff + 1, 5)
  const isSprintComplete = currentDay >= 5 || sprintCampaign.status === 'completed'

  const completedActions = sprintCampaign.actions.filter(a => a.status === 'terminee').length
  const totalActions = sprintCampaign.actions.length
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0

  const results = [
    { label: 'Actions terminées', value: `${completedActions}/${totalActions}`, icon: Users },
    { label: 'Documents', value: sprintCampaign.documents.length, icon: FileText },
    { label: 'Jour', value: `${currentDay}/5`, icon: Calendar },
    { label: 'Progression', value: `${progressPercent}%`, icon: Target },
  ]

  // Parse KPI targets/results if JSON strings
  let kpiTargets: string[] = []
  let kpiResults: string[] = []
  try {
    if (sprintCampaign.kpi_targets) kpiTargets = JSON.parse(sprintCampaign.kpi_targets)
    if (sprintCampaign.kpi_results) kpiResults = JSON.parse(sprintCampaign.kpi_results)
  } catch { /* not JSON, might be plain text */ }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Rocket size={24} style={{ marginRight: 8 }} />Sprint Actif</h1>
          <p className="page-subtitle">{sprintCampaign.name} — sprint gratuit de 5 jours · Démarré le {sprintStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`badge ${isSprintComplete ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
          {isSprintComplete ? 'Sprint terminé' : `Jour ${currentDay}/5`}
        </span>
      </div>

      <div className="stats-grid">
        {results.map((r, i) => (
          <div key={i} className="stat-card" style={{ '--stat-bg': 'var(--color-primary-soft)', '--stat-color': 'var(--color-primary)' } as React.CSSProperties}>
            <div className="stat-icon"><r.icon size={20} /></div>
            <div className="stat-value">{r.value}</div>
            <div className="stat-label">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Sprint progress bar */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <span className="card-title">Progression globale</span>
          <span style={{ fontWeight: 700, color: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{progressPercent}%</span>
        </div>
        <div style={{ height: 12, background: 'var(--color-surface)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6, transition: 'width 0.5s ease',
            width: `${progressPercent}%`,
            background: progressPercent === 100 ? 'var(--color-success)' : 'var(--gradient-primary)'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{completedActions} terminées</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{totalActions - completedActions} restantes</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header"><span className="card-title">Timeline du Sprint</span></div>
        <div className="timeline">
          {sprintCampaign.actions.map((action, idx) => {
            const cssClass = actionStatusColors[action.status] || 'pending'
            return (
              <div key={action.id} className={`timeline-item ${cssClass === 'completed' ? 'completed' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: cssClass === 'completed' ? 'var(--color-success)' : cssClass === 'active' ? 'var(--color-primary)' : 'var(--color-border)',
                    color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                  }}>
                    {cssClass === 'completed' ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {action.title}
                      {cssClass === 'active' && <span className="badge badge-primary" style={{ marginLeft: 8 }}>En cours</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {actionStatusLabels[action.status] || action.status}
                      {action.due_date && ` · Échéance : ${new Date(action.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {sprintCampaign.actions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Les actions du sprint apparaitront ici.
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {(kpiTargets.length > 0 || sprintCampaign.kpi_targets) && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header"><span className="card-title"><Trophy size={16} style={{ marginRight: 6 }} />KPIs & Résultats</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            {(Array.isArray(kpiTargets) ? kpiTargets : [{ target: sprintCampaign.kpi_targets }]).map((kpi: { target: string; result?: string }, i: number) => (
              <div key={i} style={{ padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Objectif</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{typeof kpi === 'string' ? kpi : kpi.target}</div>
                {(kpiResults[i] || (Array.isArray(kpiResults) && kpiResults[i])) && (
                  <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-xs) var(--space-sm)', background: 'var(--color-success-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    Résultat : {kpiResults[i]}
                  </div>
                )}
              </div>
            ))}
          </div>
          {sprintCampaign.objectives && (
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <strong>Objectifs :</strong> {sprintCampaign.objectives}
            </div>
          )}
        </div>
      )}

      <div className="section-grid">
        <div className="card">
          <div className="card-header"><span className="card-title"><FileText size={16} style={{ marginRight: 6 }} />Documents clés</span></div>
          {sprintCampaign.documents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {sprintCampaign.documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', fontSize: '0.65rem', fontWeight: 700 }}>PDF</div>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem' }}>{doc.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Aucun document pour le moment.</p>
          )}
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div className="card-header"><span className="card-title"><Zap size={16} style={{ marginRight: 6 }} />Passer au long terme</span></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
            Votre sprint touche à sa fin ? Passez à une offre long terme pour piloter vos campagnes en continu avec un portefeuille de crédits mensuel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {offers.map(offer => (
              <div key={offer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{offer.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{offer.monthly_credits} cr./mois</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{offer.price_monthly ? `${offer.price_monthly}€/mois` : 'Sur devis'}</div>
              </div>
            ))}
            {offers.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Les offres seront bientôt disponibles.</p>
            )}
          </div>
          <Link to="/upgrade" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-lg)' }}>
            <ArrowRight size={16} /> Voir les options de recharge
          </Link>
        </div>
      </div>
    </div>
  )
}
