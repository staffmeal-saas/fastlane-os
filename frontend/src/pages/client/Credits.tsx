import { useState } from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight, RotateCcw, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import type { TransactionType } from '../../types'

const typeLabels: Record<TransactionType, string> = { allocation: 'Allocation', consumption: 'Consommation', reservation: 'Réservation', release: 'Libération', carry_over: 'Report', recharge: 'Recharge', adjustment: 'Ajustement', expiration: 'Expiration' }
const typeColors: Record<TransactionType, string> = { allocation: 'badge-success', consumption: 'badge-danger', reservation: 'badge-warning', release: 'badge-info', carry_over: 'badge-purple', recharge: 'badge-success', adjustment: 'badge-info', expiration: 'badge-danger' }

interface TransactionsData {
  wallet_transactions: Array<{
    id: string; type: TransactionType; amount: number
    balance_after: number; description?: string; created_at: string
  }>
}

type TransactionFilter = 'all' | TransactionType

interface CreditBreakdownItem {
  label: string
  value: number
  total: number
  color: string
}

export default function Credits() {
  const { currentWallet } = useAuth()
  const [filter, setFilter] = useState<TransactionFilter>('all')

  const { data, loading, error, refetch } = useGraphQL<TransactionsData>({
    query: `query {
      wallet_transactions(order_by: { created_at: desc }, limit: 50) {
        id type amount balance_after description created_at
      }
    }`
  })

  const transactions = data?.wallet_transactions || []

  const balance = currentWallet?.balance || 0
  const reserved = currentWallet?.reserved || 0
  const carriedOver = currentWallet?.carried_over || 0
  const available = balance - reserved

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const breakdownItems: CreditBreakdownItem[] = [
    { label: 'Disponible', value: available, total: balance, color: 'var(--color-success)' },
    { label: 'Réservé', value: reserved, total: balance, color: 'var(--color-warning)' },
  ]

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portefeuille de crédits</h1>
          <p className="page-subtitle">Suivez vos crédits, allocations, consommations et historique complet.</p>
        </div>
        <Link to="/upgrade" className="btn btn-primary"><Plus size={16} /> Recharger</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-success-soft)', '--stat-color': 'var(--color-success)' } as React.CSSProperties}>
          <div className="stat-icon"><Wallet size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{available.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Disponible</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-primary-soft)', '--stat-color': 'var(--color-primary)' } as React.CSSProperties}>
          <div className="stat-icon"><ArrowUpRight size={20} /></div>
          <div className="stat-value">{balance.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Balance totale</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-warning-soft)', '--stat-color': 'var(--color-warning)' } as React.CSSProperties}>
          <div className="stat-icon"><ArrowDownRight size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{reserved.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Réservés</div>
        </div>
        <div className="stat-card" style={{ '--stat-bg': 'var(--color-purple-soft)', '--stat-color': 'var(--color-purple)' } as React.CSSProperties}>
          <div className="stat-icon"><RotateCcw size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--color-purple)' }}>{carriedOver.toLocaleString('fr-FR')}</div>
          <div className="stat-label">Reportés</div>
        </div>
      </div>

      {/* Credit Meter */}
      {balance > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-header"><span className="card-title">Répartition des crédits</span></div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
            {breakdownItems.map((item, i) => (
              <div key={i} style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.value.toLocaleString('fr-FR')}</span>
                </div>
                <div className="credit-meter"><div className="credit-meter-fill" style={{ width: `${Math.min(100, (item.value / item.total) * 100)}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historique des mouvements</span>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <select className="form-select" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem' }} value={filter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as TransactionFilter)}>
              <option value="all">Tous</option>
              <option value="allocation">Allocations</option>
              <option value="consumption">Consommations</option>
              <option value="reservation">Réservations</option>
              <option value="recharge">Recharges</option>
              <option value="carry_over">Reports</option>
              <option value="adjustment">Ajustements</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th style={{ textAlign: 'right' }}>Montant</th><th style={{ textAlign: 'right' }}>Solde après</th></tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
                <td><span className={`badge ${typeColors[t.type] || 'badge-info'}`}>{typeLabels[t.type] || t.type}</span></td>
                <td>{t.description || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{t.amount > 0 ? '+' : ''}{t.amount}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{(t.balance_after || 0).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>Aucun mouvement.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
