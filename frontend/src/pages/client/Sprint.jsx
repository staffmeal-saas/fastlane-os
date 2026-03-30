import { Rocket, CheckCircle2, Clock, Users, Calendar, Target, FileText, ArrowRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const sprintDays = [
  { day: 1, label: 'Préparation', status: 'completed', tasks: ['Brief stratégique', 'Audit cible ICP', 'Scraping base prospects'], results: 'Base de 350 prospects qualifiés' },
  { day: 2, label: 'Lancement', status: 'completed', tasks: ['Création séquence LinkedIn', 'Envoi vague 1 (100 contacts)', 'Setup tracking'], results: '100 invitations envoyées' },
  { day: 3, label: 'Qualification', status: 'completed', tasks: ['Analyse réponses J+1', 'Relance personnalisée', 'Envoi vague 2'], results: '23 réponses, 8 conversations actives' },
  { day: 4, label: 'Démos', status: 'active', tasks: ['Suivi conversations', 'Booking meetings', 'Préparation pitch'], results: '4 meetings planifiés' },
  { day: 5, label: 'Closing', status: 'pending', tasks: ['Bilan performance', 'Recommandations', 'Proposition offre long terme'], results: null },
]

const results = [
  { label: 'Contacts touchés', value: '250', icon: Users },
  { label: 'Réponses', value: '23', icon: Target },
  { label: 'Meetings', value: '4', icon: Calendar },
  { label: 'Taux de réponse', value: '9.2%', icon: Zap },
]

export default function Sprint() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Rocket size={24} style={{ marginRight: 8 }} />Sprint Actif</h1>
          <p className="page-subtitle">Sprint gratuit de 5 jours — preuve de valeur Fastlane</p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>Jour 4/5</span>
      </div>

      {/* Results */}
      <div className="stats-grid">
        {results.map((r, i) => (
          <div key={i} className="stat-card" style={{ '--stat-bg': 'var(--color-primary-soft)', '--stat-color': 'var(--color-primary)' }}>
            <div className="stat-icon"><r.icon size={20} /></div>
            <div className="stat-value">{r.value}</div>
            <div className="stat-label">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header"><span className="card-title">Timeline du Sprint</span></div>
        <div className="timeline">
          {sprintDays.map((day) => (
            <div key={day.day} className={`timeline-item ${day.status === 'completed' ? 'completed' : ''}`}>
              <div className="timeline-date">
                Jour {day.day} — {day.label}
                {day.status === 'active' && <span className="badge badge-primary" style={{ marginLeft: 8 }}>Aujourd'hui</span>}
                {day.status === 'completed' && <CheckCircle2 size={14} style={{ marginLeft: 8, color: 'var(--color-success)' }} />}
                {day.status === 'pending' && <Clock size={14} style={{ marginLeft: 8, color: 'var(--color-text-muted)' }} />}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                {day.tasks.join(' · ')}
              </div>
              {day.results && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={12} /> {day.results}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Projection */}
      <div className="section-grid">
        <div className="card">
          <div className="card-header"><span className="card-title"><FileText size={16} style={{ marginRight: 6 }} />Documents clés</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {['Stratégie Sprint', 'Bilan intermédiaire J3', 'Base prospects qualifiés'].map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', fontSize: '0.65rem', fontWeight: 700 }}>PDF</div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem' }}>{doc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div className="card-header"><span className="card-title"><Zap size={16} style={{ marginRight: 6 }} />Projection offre long terme</span></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
            Avec l'offre Fastlane long terme, vous bénéficiez d'un portefeuille de crédits mensuel pour piloter vos campagnes en continu. Chaque action consomme des crédits selon sa complexité — vous gardez le contrôle total sur votre budget d'intervention.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              { name: 'Start', credits: '500 cr./mois', price: '2 500€/mois' },
              { name: 'Growth', credits: '1 000 cr./mois', price: '5 000€/mois' },
              { name: 'Scale', credits: '2 000 cr./mois', price: '9 000€/mois' },
            ].map((offer, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{offer.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{offer.credits}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{offer.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
