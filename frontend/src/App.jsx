import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import CreditBanner from './components/Layout/CreditBanner'
import Login from './pages/Login'
import Dashboard from './pages/client/Dashboard'
import Credits from './pages/client/Credits'
import Campaigns from './pages/client/Campaigns'
import CampaignDetail from './pages/client/CampaignDetail'
import Actions from './pages/client/Actions'
import Documents from './pages/client/Documents'
import Strategy from './pages/client/Strategy'
import Sprint from './pages/client/Sprint'
import Upgrade from './pages/client/Upgrade'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientManagement from './pages/admin/ClientManagement'
import ClientOnboarding from './pages/admin/ClientOnboarding'
import CreditManagement from './pages/admin/CreditManagement'
import CampaignManagement from './pages/admin/CampaignManagement'
import ActionManagement from './pages/admin/ActionManagement'
import DocumentManagement from './pages/admin/DocumentManagement'
import AccessManagement from './pages/admin/AccessManagement'
import './index.css'

function ProtectedLayout({ pageTitle }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>FASTLANE OS</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={pageTitle || 'Fastlane OS'} />
        <div className="page-content">
          <Outlet />
        </div>
        <CreditBanner />
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Client Routes */}
      <Route element={<ProtectedLayout pageTitle="Dashboard" />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Stratégie" />}>
        <Route path="/strategy" element={<Strategy />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Campagnes" />}>
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Actions" />}>
        <Route path="/actions" element={<Actions />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Portefeuille de crédits" />}>
        <Route path="/credits" element={<Credits />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Documents" />}>
        <Route path="/documents" element={<Documents />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Sprint Actif" />}>
        <Route path="/sprint" element={<Sprint />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Recharger des crédits" />}>
        <Route path="/upgrade" element={<Upgrade />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedLayout pageTitle="Back-Office" />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Clients" />}>
        <Route path="/admin/clients" element={<ClientManagement />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Onboarding Client" />}>
        <Route path="/admin/clients/onboarding" element={<ClientOnboarding />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Crédits" />}>
        <Route path="/admin/credits" element={<CreditManagement />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Campagnes" />}>
        <Route path="/admin/campaigns" element={<CampaignManagement />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Actions" />}>
        <Route path="/admin/actions" element={<ActionManagement />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Documents" />}>
        <Route path="/admin/documents" element={<DocumentManagement />} />
      </Route>
      <Route element={<ProtectedLayout pageTitle="Gestion Accès" />}>
        <Route path="/admin/access" element={<AccessManagement />} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
