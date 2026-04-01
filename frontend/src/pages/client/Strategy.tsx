import { Zap, Target, TrendingUp, Users, Megaphone, BarChart3, FileText, ArrowRight, LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGraphQL } from '../../hooks/useGraphQL'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import type { BlockCategory } from '../../types'

const categoryIcons: Record<string, LucideIcon> = { acquisition: Users, conversion: Target, events: Megaphone, automation: Zap, sales_enablement: BarChart3 }
const categoryColors: Record<string, string> = { acquisition: 'var(--color-primary)', conversion: 'var(--color-success)', events: 'var(--color-warning)', automation: 'var(--color-purple)', sales_enablement: 'var(--color-info)' }

interface BlocksData {
  strategic_blocks: Array<{
    id: string; name: string; category: BlockCategory
    description?: string; objectives?: string
    kpi_targets?: Record<string, unknown> | null
  }>
}

export default function Strategy() {
  const { data, loading, error, refetch } = useGraphQL<BlocksData>({
    query: `query {
      strategic_blocks(order_by: { sort_order: asc }) {
        id name category description objectives kpi_targets
      }
    }`
  })

  const blocks = data?.strategic_blocks || []

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stratégie</h1>
          <p className="page-subtitle">Vue d'ensemble de la stratégie Fastlane — blocs, objectifs, KPIs et livrables.</p>
        </div>
        <Link to="/documents" className="btn btn-secondary"><FileText size={16} /> Livrables stratégiques</Link>
      </div>

      {/* Vision Block */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', borderLeft: '3px solid var(--color-primary)' }}>
        <div className="card-header"><span className="card-title"><Zap size={16} style={{ marginRight: 6 }} />Vision globale</span></div>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          <strong>Objectif principal :</strong> Structurer et piloter la croissance via les blocs stratégiques Fastlane. Chaque bloc couvre un pilier clé de votre développement commercial.
        </p>
      </div>

      {/* Strategic Blocks */}
      {blocks.length > 0 ? (
        <div className="section-grid">
          {blocks.map(block => {
            const Icon = categoryIcons[block.category] || Target
            const color = categoryColors[block.category] || 'var(--color-primary)'
            const kpis: [string, unknown][] = block.kpi_targets ? (typeof block.kpi_targets === 'object' ? Object.entries(block.kpi_targets) : []) : []
            return (
              <div key={block.id} className="card" style={{ borderTop: `2px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{block.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{block.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
                  {block.description || 'Pas de description.'}
                </p>
                {block.objectives && (
                  <div style={{ fontSize: '0.8rem', padding: 'var(--space-sm)', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-sm)' }}>
                    <strong>Objectif :</strong> {block.objectives}
                  </div>
                )}
                {kpis.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {kpis.map(([key, value], i) => (
                      <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingUp size={12} style={{ color }} />
                        <span>{key}: <strong>{String(value)}</strong></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-muted)' }}>
          <Zap size={32} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
          <p>Aucun bloc stratégique défini pour le moment.</p>
          <p style={{ fontSize: '0.85rem' }}>L'équipe Fastlane configurera vos blocs stratégiques lors du kickoff.</p>
        </div>
      )}
    </div>
  )
}
