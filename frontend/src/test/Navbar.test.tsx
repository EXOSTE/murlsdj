import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Navbar from '../components/Navbar'

describe('Navbar', () => {
  it('renders the site title', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Mur LSDJ').length).toBeGreaterThan(0)
  })

  it('renders the main navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Timeline' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Galerie' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Notre histoire' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+ Publier' })).toBeInTheDocument()
  })

  it('marks the active link with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/timeline']}>
        <Navbar />
      </MemoryRouter>
    )
    const timelineLink = screen.getByRole('link', { name: 'Timeline' })
    expect(timelineLink).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark an inactive link as current', () => {
    render(
      <MemoryRouter initialEntries={['/timeline']}>
        <Navbar />
      </MemoryRouter>
    )
    const galerieLink = screen.getByRole('link', { name: 'Galerie' })
    expect(galerieLink).not.toHaveAttribute('aria-current', 'page')
  })
})
