import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Bell, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth()

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Utilisateur'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button className="btn btn-ghost" onClick={onMenuClick} style={{ display: 'none' }}>
          <Menu size={20} />
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-actions">
        <button className="btn btn-ghost" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-danger)'
          }} />
        </button>

        <div className="header-user" onClick={signOut} title="Se déconnecter">
          <div className="user-avatar">{initials}</div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {displayName}
          </span>
          <LogOut size={14} style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>
    </header>
  )
}
