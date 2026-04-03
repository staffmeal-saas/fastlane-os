import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Wallet,
  Megaphone,
  ListChecks,
  FileText,
  Rocket,
  ArrowUpCircle,
  Users,
  CreditCard,
  FolderOpen,
  Shield,
  BarChart3,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const clientNavFull: NavSection[] = [
  {
    section: "Espace Client",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/strategy", label: "Stratégie", icon: Zap },
      { to: "/campaigns", label: "Campagnes", icon: Megaphone },
      { to: "/actions", label: "Actions", icon: ListChecks },
      { to: "/credits", label: "Crédits", icon: Wallet },
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/upgrade", label: "Recharger", icon: ArrowUpCircle },
    ],
  },
  {
    section: "Sprint",
    items: [{ to: "/sprint", label: "Sprint Actif", icon: Rocket }],
  },
];

const clientNavSprint: NavSection[] = [
  {
    section: "Sprint",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/sprint", label: "Sprint Actif", icon: Rocket },
      { to: "/documents", label: "Documents", icon: FileText },
    ],
  },
];

const adminNavItems: NavSection[] = [
  {
    section: "Back-Office",
    items: [
      { to: "/admin", label: "Vue d'ensemble", icon: BarChart3 },
      { to: "/admin/clients", label: "Clients", icon: Users },
      { to: "/admin/credits", label: "Crédits", icon: CreditCard },
      { to: "/admin/campaigns", label: "Campagnes", icon: Megaphone },
      { to: "/admin/actions", label: "Actions", icon: ListChecks },
      { to: "/admin/documents", label: "Documents", icon: FolderOpen },
      { to: "/admin/access", label: "Accès", icon: Shield },
    ],
  },
];

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { isAdmin, currentClient } = useAuth();

  const isSprint =
    currentClient?.offer?.is_sprint || currentClient?.status === "sprint";
  const clientNav = isSprint ? clientNavSprint : clientNavFull;
  const navItems = isAdmin ? [...adminNavItems, ...clientNav] : clientNav;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <h1>FASTLANE</h1>
          <span className="logo-badge">OS</span>
          {mobileOpen && (
            <button
              className="btn btn-ghost"
              onClick={onClose}
              style={{ marginLeft: "auto" }}
            >
              <X size={18} />
            </button>
          )}
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
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  end={item.to === "/admin" || item.to === "/dashboard"}
                  onClick={handleNavClick}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div
          style={{
            padding: "var(--space-md)",
            borderTop: "1px solid var(--color-border)",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          Fastlane OS v1.0
        </div>
      </aside>
    </>
  );
}
