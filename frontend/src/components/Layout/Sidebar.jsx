import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Wallet, Megaphone, ListChecks,
  FileText, Rocket, ArrowUpCircle,
  Users, Settings, CreditCard, FolderOpen,
  Shield, BarChart3, Zap
} from 'lucide-react'

const clientNavItems = [
  { section: 'Espace Client', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/strategy', label: 'Stratégie', icon: Zap },
    { to: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { to: '/actions', label: 'Actions', icon: ListChecks },
    { to: '/credits', label: 'Crédits', icon: Wallet },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/upgrade', label: 'Recharger', icon: ArrowUpCircle },
  ]},
  { section: 'Sprint', items: [
    { to: '/sprint', label: 'Sprint Actif', icon: Rocket },
  ]}
]

const adminNavItems = [
  { section: 'Back-Office', items: [
    { to: '/admin', label: 'Vue d\'ensemble', icon: BarChart3 },
    { to: '/admin/clients', label: 'Clients', icon: Users },
    { to: '/admin/credits', label: 'Crédits', icon: CreditCard },
    { to: '/admin/campaigns', label: 'Campagnes', icon: Megaphone },
    { to: '/admin/actions', label: 'Actions', icon: ListChecks },
    { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
    { to: '/admin/access', label: 'Accès', icon: Shield },
  ]}
]

export default function Sidebar() {
  const { isAdmin, isClient, profile } = useAuth()
  const location = useLocation()

  const navItems = isAdmin ? [...adminNavItems, ...clientNavItems] : clientNavItems

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>FASTLANE</h1>
        <span className="logo-badge">OS</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end={item.to === '/admin' || item.to === '/dashboard'}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        textAlign: 'center'
      }}>
        Fastlane OS v1.0
      </div>
    </aside>
  )
}
