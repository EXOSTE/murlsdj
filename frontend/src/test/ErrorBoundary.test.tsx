import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import ErrorBoundary from '../components/ErrorBoundary'

const ThrowingChild = () => {
  throw new Error('Test error message')
}

const SafeChild = () => <div>Safe content</div>

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <SafeChild />
        </ErrorBoundary>
      </MemoryRouter>
    )
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws', () => {
    const originalError = console.error
    console.error = () => {}

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      </MemoryRouter>
    )

    console.error = originalError

    expect(screen.getByText('Une erreur inattendue')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /retour à l'accueil/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
  })

  it('shows the error message in the fallback', () => {
    const originalError = console.error
    console.error = () => {}

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>
      </MemoryRouter>
    )

    console.error = originalError

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})
