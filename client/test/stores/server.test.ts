import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth } from '@/api/health'
import { POLL_INTERVAL_MS, useServerStore } from '@/stores/server'

vi.mock('@/api/health', () => ({ fetchHealth: vi.fn() }))

const fetchHealthMock = vi.mocked(fetchHealth)

describe('server store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchHealthMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('démarre à l\'état inconnu', () => {
    expect(useServerStore().status).toBe('unknown')
  })

  it('passe en ligne quand le serveur répond', async () => {
    fetchHealthMock.mockResolvedValue({ status: 'ok' })
    const server = useServerStore()
    await server.checkHealth()
    expect(server.status).toBe('online')
  })

  it('passe hors ligne quand le serveur est injoignable', async () => {
    fetchHealthMock.mockRejectedValue(new Error('Network Error'))
    const server = useServerStore()
    await server.checkHealth()
    expect(server.status).toBe('offline')
  })

  it('retry repasse par l\'état inconnu puis donne le résultat', async () => {
    fetchHealthMock.mockResolvedValueOnce({ status: 'ok' })
    const server = useServerStore()
    await server.checkHealth()

    fetchHealthMock.mockRejectedValueOnce(new Error('Network Error'))
    const promise = server.retry()
    expect(server.status).toBe('unknown')
    await promise
    expect(server.status).toBe('offline')
  })

  it('revérifie périodiquement et s\'arrête avec stopPolling', async () => {
    vi.useFakeTimers()
    fetchHealthMock.mockResolvedValue({ status: 'ok' })
    const server = useServerStore()

    server.startPolling()
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchHealthMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(fetchHealthMock).toHaveBeenCalledTimes(3)

    server.stopPolling()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2)
    expect(fetchHealthMock).toHaveBeenCalledTimes(3)
  })

  it('détecte la chute du serveur après le chargement', async () => {
    vi.useFakeTimers()
    fetchHealthMock.mockResolvedValueOnce({ status: 'ok' })
    const server = useServerStore()
    server.startPolling()
    await vi.advanceTimersByTimeAsync(0)
    expect(server.status).toBe('online')

    fetchHealthMock.mockRejectedValue(new Error('Network Error'))
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(server.status).toBe('offline')
    server.stopPolling()
  })
})
