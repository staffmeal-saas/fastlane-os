import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export default function LoadingState({ message = 'Chargement...' }: LoadingStateProps) {
  return (
    <div className="state-container">
      <Loader2 size={32} className="spin" />
      <p className="state-text">{message}</p>
    </div>
  )
}
