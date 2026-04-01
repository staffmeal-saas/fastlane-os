import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Une erreur est survenue', onRetry }: ErrorStateProps) {
  return (
    <div className="state-container">
      <AlertTriangle size={32} style={{ color: 'var(--color-danger)' }} />
      <p className="state-text state-text-error">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Réessayer
        </button>
      )}
    </div>
  )
}
