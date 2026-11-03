import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changePassword, deleteAccount } from '@/api/account'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({ http: { put: vi.fn(), delete: vi.fn() } }))

describe('api/account', () => {
  beforeEach(() => {
    vi.mocked(http.put).mockReset().mockResolvedValue({ data: undefined })
    vi.mocked(http.delete).mockReset().mockResolvedValue({ data: undefined })
  })

  it('changePassword envoie les deux mots de passe en PUT /account/password', async () => {
    await changePassword({ currentPassword: 'motdepasse', newPassword: 'nouveaumdp' })
    expect(http.put).toHaveBeenCalledWith('/account/password', { currentPassword: 'motdepasse', newPassword: 'nouveaumdp' })
  })

  it('deleteAccount envoie le mot de passe dans le corps du DELETE /account', async () => {
    await deleteAccount('motdepasse')
    expect(http.delete).toHaveBeenCalledWith('/account', { data: { password: 'motdepasse' } })
  })

  it('laisse remonter le refus du serveur', async () => {
    const refusal = new Error('403')
    vi.mocked(http.put).mockRejectedValue(refusal)
    await expect(changePassword({ currentPassword: 'mauvais', newPassword: 'nouveaumdp' })).rejects.toBe(refusal)
  })
})
