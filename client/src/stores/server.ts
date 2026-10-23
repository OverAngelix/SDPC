import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchHealth } from '@/api/health'

export type ServerStatus = 'unknown' | 'online' | 'offline'

export const useServerStore = defineStore('server', () => {
  const status = ref<ServerStatus>('unknown')

  async function checkHealth () {
    try {
      await fetchHealth()
      status.value = 'online'
    } catch {
      status.value = 'offline'
    }
  }

  return { status, checkHealth }
})
