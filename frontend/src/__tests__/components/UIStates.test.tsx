import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoadingState from '../../components/UI/LoadingState'
import ErrorState from '../../components/UI/ErrorState'
import EmptyState from '../../components/UI/EmptyState'
import { Inbox, Rocket } from 'lucide-react'

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingState message="Chargement des campagnes..." />)
    expect(screen.getByText('Chargement des campagnes...')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('renders with default message', () => {
    render(<ErrorState />)
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<ErrorState message="Erreur réseau" />)
    expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Oops" onRetry={onRetry} />)
    const btn = screen.getByText('Réessayer')
    expect(btn).toBeInTheDocument()
  })

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState message="Oops" />)
    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument()
  })

  it('calls onRetry when button clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Oops" onRetry={onRetry} />)
    await userEvent.click(screen.getByText('Réessayer'))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Aucune donnée" description="Il n'y a rien ici." />)
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument()
    expect(screen.getByText("Il n'y a rien ici.")).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const onClick = vi.fn()
    render(<EmptyState title="Vide" action={{ label: 'Créer', onClick }} />)
    expect(screen.getByText('Créer')).toBeInTheDocument()
  })

  it('calls action onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<EmptyState title="Vide" action={{ label: 'Créer', onClick }} />)
    await userEvent.click(screen.getByText('Créer'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render action when not provided', () => {
    render(<EmptyState title="Vide" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses default Inbox icon when no icon provided', () => {
    const { container } = render(<EmptyState title="Vide" />)
    // lucide renders SVG elements
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
