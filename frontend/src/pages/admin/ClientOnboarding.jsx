import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Wallet, Target, Rocket, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import nhost from '../../lib/nhost'

const steps = [
  { id: 1, name: 'Profil & Offre', icon: Building2 },
  { id: 2, name: 'Wallet Crédits', icon: Wallet },
  { id: 3, name: 'Stratégie', icon: Target },
  { id: 4, name: 'Kickoff', icon: Rocket }
]

export default function ClientOnboarding() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    profile: { name: '', email: '', industry: '', offer: 'Start', status: 'sprint', owner: '' },
    wallet: { initialCredits: 500 },
    strategy: { vision: '', acquisition: '', conversion: '', retention: '' },
    kickoff: { campaignName: 'Sprint Lancement', notes: '' }
  })

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(s => s + 1)
    else handleSubmit()
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!session?.accessToken) return
    setIsSubmitting(true)

    try {
      const { data: clientData } = await nhost.graphql.request({
        query: `
          mutation InsertClient($name: String!, $industry: String, $status: client_status!) {
            insert_clients_one(object: {
              name: $name,
              industry: $industry,
              status: $status
            }) {
              id
            }
          }
        `,
        variables: {
          name: formData.profile.name,
          industry: formData.profile.industry,
          status: formData.profile.status
        }
      }, session.accessToken)

      const newClientId = clientData?.insert_clients_one?.id

      if (newClientId) {
        await nhost.graphql.request({
          query: `
            mutation InsertWallet($clientId: uuid!, $balance: Int!) {
              insert_wallets_one(object: {
                client_id: $clientId,
                balance: $balance
              }) {
                id
              }
            }
          `,
          variables: {
            clientId: newClientId,
            balance: formData.wallet.initialCredits
          }
        }, session.accessToken)
      }

      setIsSubmitting(false)
      navigate('/admin/clients')
    } catch (err) {
      console.error('Failed to create client and wallet:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Onboarding Nouveau Client</h1>
          <p className="page-subtitle">Configurez le profil, la stratégie et les modules initiaux.</p>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2xl)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 2, background: 'var(--color-border)', zIndex: 0 }} />
        {steps.map((step) => {
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          return (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: 100 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive || isCompleted ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isActive || isCompleted ? 'white' : 'var(--color-text-muted)',
                border: `2px solid ${isActive || isCompleted ? 'var(--color-primary)' : 'var(--color-border)'}`,
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
              </div>
              <span style={{ 
                marginTop: 'var(--space-sm)', fontSize: '0.85rem', fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)'
              }}>{step.name}</span>
            </div>
          )
        })}
      </div>

      {/* Form Content */}
      <div className="card" style={{ minHeight: 400 }}>
        {currentStep === 1 && (
          <div className="animate-in">
            <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.25rem' }}>1. Profil Entreprise</h2>
            <div className="form-group">
              <label className="form-label">Nom de l'entreprise</label>
              <input className="form-input" placeholder="Ex: Acme Corp" 
                value={formData.profile.name} onChange={e => setFormData({...formData, profile: {...formData.profile, name: e.target.value}})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Email de contact (Owner)</label>
                <input className="form-input" type="email" placeholder="contact@acme.com" 
                  value={formData.profile.email} onChange={e => setFormData({...formData, profile: {...formData.profile, email: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Industrie</label>
                <input className="form-input" placeholder="Ex: SaaS, E-commerce..." 
                  value={formData.profile.industry} onChange={e => setFormData({...formData, profile: {...formData.profile, industry: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Statut Initial</label>
                <select className="form-select" value={formData.profile.status} onChange={e => setFormData({...formData, profile: {...formData.profile, status: e.target.value}})}>
                  <option value="sprint">Sprint (Essai)</option>
                  <option value="active">Actif</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Offre Fastlane</label>
                <select className="form-select" value={formData.profile.offer} onChange={e => setFormData({...formData, profile: {...formData.profile, offer: e.target.value}})}>
                  <option value="Sprint Gratuit">Sprint Gratuit</option>
                  <option value="Start">Start</option>
                  <option value="Growth">Growth</option>
                  <option value="Scale">Scale</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in">
            <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.25rem' }}>2. Configuration Wallet</h2>
            <div className="form-group">
              <label className="form-label">Crédits d'amorçage</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <input className="form-input" type="number" 
                  value={formData.wallet.initialCredits} 
                  onChange={e => setFormData({...formData, wallet: { initialCredits: parseInt(e.target.value) || 0 }})} 
                  style={{ width: 150, fontSize: '1.25rem', fontWeight: 600 }} />
                <span style={{ color: 'var(--color-text-muted)' }}>crédits alloués sur le premier mois</span>
              </div>
            </div>
            
            <div className="card" style={{ background: 'var(--color-surface-hover)', marginTop: 'var(--space-xl)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                💡 En activant le client, un portefeuille (`wallet`) sera généré automatiquement et une première transaction (`wallet_transaction`) d'allocation sera enregistrée pour la traçabilité.
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in">
            <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.25rem' }}>3. Stratégie & Axes</h2>
            <div className="form-group">
              <label className="form-label">Vision Globale</label>
              <textarea className="form-textarea" placeholder="Quel est l'objectif principal du client à 6 mois ?" rows={3}
                value={formData.strategy.vision} onChange={e => setFormData({...formData, strategy: {...formData.strategy, vision: e.target.value}})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Axe 1: Acquisition</label>
                <input className="form-input" placeholder="Ex: Lead Gen LinkedIn" 
                  value={formData.strategy.acquisition} onChange={e => setFormData({...formData, strategy: {...formData.strategy, acquisition: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Axe 2: Conversion</label>
                <input className="form-input" placeholder="Ex: Refonte Landing Pages" 
                  value={formData.strategy.conversion} onChange={e => setFormData({...formData, strategy: {...formData.strategy, conversion: e.target.value}})} />
              </div>
              <div className="form-group">
                <label className="form-label">Axe 3: Rétention</label>
                <input className="form-input" placeholder="Ex: Séquence Emailing Onboarding" 
                  value={formData.strategy.retention} onChange={e => setFormData({...formData, strategy: {...formData.strategy, retention: e.target.value}})} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-in">
            <h2 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.25rem' }}>4. Kickoff Campagne</h2>
            <div className="form-group">
              <label className="form-label">Nom de la première campagne</label>
              <input className="form-input" placeholder="Ex: Sprint Lancement" 
                value={formData.kickoff.campaignName} onChange={e => setFormData({...formData, kickoff: {...formData.kickoff, campaignName: e.target.value}})} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes d'Audit (Optionnel)</label>
              <textarea className="form-textarea" placeholder="Instructions pour les équipes Fastlane concernant cette première campagne..." rows={4}
                value={formData.kickoff.notes} onChange={e => setFormData({...formData, kickoff: {...formData.kickoff, notes: e.target.value}})} />
            </div>

            <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', marginTop: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <CheckCircle2 color="var(--color-success)" />
                <div>
                  <h4 style={{ color: 'var(--color-success)', marginBottom: 'var(--space-xs)' }}>Prêt à déployer</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    En cliquant sur "Terminer", Fastlane va générer le compte, le wallet, les blocs stratégiques et cette première campagne automatiquement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border)' }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentStep === 1 || isSubmitting}>
            <ArrowLeft size={16} /> Précédent
          </button>
          
          <button className="btn btn-primary" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Déploiement en cours...' : (
              <>
                {currentStep === 4 ? 'Terminer & Déployer' : 'Suivant'} {currentStep < 4 && <ArrowRight size={16} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
