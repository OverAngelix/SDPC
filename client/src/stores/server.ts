import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchHealth } from '@/api/health'

export type ServerStatus = 'unknown' | 'online' | 'offline'

export const POLL_INTERVAL_MS = 15_000

export const useServerStore = defineStore('server', () => {
  const status = ref<ServerStatus>('unknown')
  let checking = false
  let timer: ReturnType<typeof setInterval> | undefined

  async function checkHealth () {
    if (checking) {
      return
    }
    checking = true
    try {
      await fetchHealth()
      status.value = 'online'
    } catch {
      status.value = 'offline'
    } finally {
      checking = false
    }
  }

  // Relance manuelle : repasse par l'état « vérification » pour que l'utilisateur voie le retour
  function retry () {
    status.value = 'unknown'
    return checkHealth()
  }

  function startPolling (intervalMs = POLL_INTERVAL_MS) {
    stopPolling()
    checkHealth()
    timer = setInterval(checkHealth, intervalMs)
  }

  function stopPolling () {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  return { status, checkHealth, retry, startPolling, stopPolling }
})
