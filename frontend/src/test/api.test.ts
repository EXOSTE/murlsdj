import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getBaseURL', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('returns VITE_API_URL when the env var is set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://custom.api.example.com')
    const { default: api } = await import('../lib/api')
    expect(api.defaults.baseURL).toBe('https://custom.api.example.com')
  })

  it('returns /_/backend on a non-localhost hostname', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'mur-lsdj.vercel.app' },
      writable: true,
      configurable: true,
    })
    const { default: api } = await import('../lib/api')
    expect(api.defaults.baseURL).toBe('/_/backend')
  })

  it('returns http://localhost:8000 on localhost', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    })
    const { default: api } = await import('../lib/api')
    expect(api.defaults.baseURL).toBe('http://localhost:8000')
  })
})
