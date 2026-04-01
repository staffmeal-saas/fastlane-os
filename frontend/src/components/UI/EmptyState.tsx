import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="state-container">
      <Icon size={40} style={{ color: 'var(--color-text-muted)' }} />
      <p className="state-title">{title}</p>
      {description && <p className="state-description">{description}</p>}
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
