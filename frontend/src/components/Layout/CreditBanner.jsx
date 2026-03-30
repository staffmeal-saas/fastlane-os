import { useAuth } from '../../contexts/AuthContext'
import { Wallet } from 'lucide-react'

export default function CreditBanner() {
  const { currentWallet, isClient } = useAuth()

  // Only show for client users
  if (!isClient && !currentWallet) return null

  const balance = currentWallet?.balance || 0
  const reserved = currentWallet?.reserved || 0
  const carriedOver = currentWallet?.carried_over || 0
  const available = balance - reserved

  return (
    <div className="credit-banner">
      <div className="credit-banner-item">
        <Wallet size={16} style={{ color: 'var(--color-text-muted)' }} />
        <span className="credit-banner-label">Portefeuille</span>
      </div>

      <div className="credit-banner-item">
        <span className="credit-banner-label">Disponible</span>
        <span className="credit-banner-value available">{available.toLocaleString('fr-FR')}</span>
      </div>

      <div className="credit-banner-item">
        <span className="credit-banner-label">Réservé</span>
        <span className="credit-banner-value reserved">{reserved.toLocaleString('fr-FR')}</span>
      </div>

      <div className="credit-banner-item">
        <span className="credit-banner-label">Reporté</span>
        <span className="credit-banner-value carried">{carriedOver.toLocaleString('fr-FR')}</span>
      </div>

      <div className="credit-banner-item">
        <span className="credit-banner-label">Total</span>
        <span className="credit-banner-value consumed">{balance.toLocaleString('fr-FR')}</span>
      </div>
    </div>
  )
}
