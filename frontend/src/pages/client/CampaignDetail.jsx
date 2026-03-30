import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Calendar, Target, Wallet } from 'lucide-react'

export default function CampaignDetail() {
  const { id } = useParams()

  // Demo data
  const campaign = {
    id, name: 'Outbound LinkedIn Q1', status: 'active', type: 'outbound',
    start: '2026-01-15', end: '2026-03-31',
    description: 'Campagne de prospection LinkedIn ciblant les DRH des PME de 50-500 salariés. Approche multi-touch avec séquence de messages personnalisés.',
    objectives: 'Générer 200 leads qualifiés et 50 meetings avec des décideurs RH.',
    kpi: { leads: 156, meetings: 38, conversion: '24%', responses: 412 },
    credits: { budget: 800, consumed: 520 },
    actions: [
      { id: 1, title: 'Rédaction script cold call', status: 'en_cours', credits: 80 },
      { id: 2, title: 'Audit profil LinkedIn CEO', status: 'terminee', credits: 60 },
      { id: 3, title: 'Création séquence 5 messages', status: 'terminee', credits: 120 },
      { id: 4, title: 'Scraping base prospects', status: 'terminee', credits: 100 },
    ]
  }

  return (
    <div className="animate-in">
      <Link to="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Retour aux campagnes
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="page-subtitle">{campaign.description}</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>Active</span>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Leads', value: campaign.kpi.leads, icon: Users, color: 'var(--color-primary)' },
          { label: 'Meetings', value: campaign.kpi.meetings, icon: Calendar, color: 'var(--color-success)' },
          { label: 'Conversion', value: campaign.kpi.conversion, icon: Target, color: 'var(--color-warning)' },
          { label: 'Crédits utilisés', value: `${campaign.credits.consumed}/${campaign.credits.budget}`, icon: Wallet, color: 'var(--color-purple)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-bg': 'rgba(59,130,246,0.1)', '--stat-color': s.color }}>
            <div className="stat-icon"><s.icon size={20} /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Objectifs</span></div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{campaign.objectives}</p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Actions liées</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {campaign.actions.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.title}</span>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{a.credits} cr.</span>
                  <span className={`badge ${a.status === 'terminee' ? 'badge-success' : 'badge-primary'}`}>
                    {a.status === 'terminee' ? 'Terminée' : 'En cours'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
