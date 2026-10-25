import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { startTestServer } from '../helpers/server.js'

const action = { position: 0, label: 'YouTube', icon: 'mdi-youtube', type: 'action', url: 'https://www.youtube.com' }
const folder = { position: 1, label: 'Musique', icon: 'mdi-folder', type: 'folder' }

describe('/api/buttons', () => {
  let server: Awaited<ReturnType<typeof startTestServer>>
  let jean: { id: string, cookie: string }
  let marie: { id: string, cookie: string }

  before(async () => {
    server = await startTestServer()
    jean = await server.signUp('jean@exemple.fr')
    marie = await server.signUp('marie@exemple.fr')
  })

  after(() => server.close())

  beforeEach(async () => {
    for (const { id } of [jean, marie]) {
      for (const button of server.store.list(id, null)) await server.store.remove(id, button.id)
    }
  })

  async function callAs (cookie: string | undefined, method: string, path: string, body?: unknown) {
    const res = await fetch(`${server.baseUrl}/api/buttons${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(cookie === undefined ? {} : { Cookie: cookie }),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, body: text === '' ? undefined : JSON.parse(text) }
  }

  // Sauf mention contraire, les tests agissent en tant que Jean
  function call (method: string, path: string, body?: unknown) {
    return callAs(jean.cookie, method, path, body)
  }

  it('POST crée un bouton (201) et GET le relit', async () => {
    const created = await call('POST', '', action)
    assert.equal(created.status, 201)
    assert.deepEqual({ ...created.body, id: undefined }, { ...action, parentId: null, id: undefined })

    const read = await call('GET', `/${created.body.id}`)
    assert.equal(read.status, 200)
    assert.deepEqual(read.body, created.body)
  })

  it('POST et PATCH acceptent une couleur, 400 si elle est hors palette', async () => {
    const created = await call('POST', '', { ...action, color: 'orange' })
    assert.equal(created.status, 201)
    assert.equal(created.body.color, 'orange')

    const patched = await call('PATCH', `/${created.body.id}`, { color: 'cyan' })
    assert.equal(patched.status, 200)
    assert.equal(patched.body.color, 'cyan')

    const invalid = await call('PATCH', `/${created.body.id}`, { color: 'rouge' })
    assert.equal(invalid.status, 400)
    assert.match(invalid.body.details[0], /^color/)
    assert.equal((await call('POST', '', { ...action, position: 5, color: '#fff' })).status, 400)
  })

  it('GET liste tous les boutons ou filtre par dossier', async () => {
    const parent = (await call('POST', '', folder)).body
    const child = (await call('POST', '', { ...action, position: 1, parentId: parent.id })).body
    const root = (await call('POST', '', { ...action, position: 2 })).body

    assert.equal((await call('GET', '')).body.length, 3)
    assert.deepEqual((await call('GET', `?parentId=${parent.id}`)).body, [child])
    assert.deepEqual((await call('GET', '?parentId=root')).body.map((b: { id: string }) => b.id), [parent.id, root.id])
  })

  it('GET refuse un filtre parentId répété (400)', async () => {
    assert.equal((await call('GET', '?parentId=a&parentId=b')).status, 400)
  })

  it('PATCH modifie un bouton', async () => {
    const created = (await call('POST', '', action)).body
    const patched = await call('PATCH', `/${created.id}`, { label: 'YT' })
    assert.equal(patched.status, 200)
    assert.equal(patched.body.label, 'YT')
    assert.equal(patched.body.url, action.url)
  })

  it('DELETE supprime (204) puis le bouton est introuvable (404)', async () => {
    const created = (await call('POST', '', action)).body
    assert.equal((await call('DELETE', `/${created.id}`)).status, 204)
    assert.equal((await call('GET', `/${created.id}`)).status, 404)
    assert.equal((await call('DELETE', `/${created.id}`)).status, 404)
  })

  it('DELETE d\'un dossier supprime son contenu', async () => {
    const parent = (await call('POST', '', folder)).body
    const child = (await call('POST', '', { ...action, position: 1, parentId: parent.id })).body
    await call('DELETE', `/${parent.id}`)
    assert.equal((await call('GET', `/${child.id}`)).status, 404)
  })

  it('répond 400 avec le détail des erreurs sur des données invalides', async () => {
    const res = await call('POST', '', { ...action, url: 'javascript:alert(1)', label: '' })
    assert.equal(res.status, 400)
    assert.equal(res.body.error, 'Données invalides')
    assert.equal(res.body.details.length, 2)
  })

  it('répond 409 sur un emplacement occupé', async () => {
    await call('POST', '', action)
    const res = await call('POST', '', { ...action, label: 'Autre' })
    assert.equal(res.status, 409)
    assert.equal(res.body.error, 'Emplacement déjà occupé')
  })

  it('répond 404 sur un identifiant inconnu', async () => {
    assert.equal((await call('GET', '/inconnu')).status, 404)
    assert.equal((await call('PATCH', '/inconnu', { label: 'x' })).status, 404)
  })

  it('répond 400 sur un JSON mal formé ou un corps absent', async () => {
    const malformed = await call('POST', '', '{pas du json')
    assert.equal(malformed.status, 400)
    assert.deepEqual(malformed.body, { error: 'Requête invalide' })
    assert.equal((await call('POST', '')).status, 400)
  })

  it('les modifications sont écrites dans la base', async () => {
    const created = (await call('POST', '', action)).body
    assert.deepEqual(server.store.list(jean.id), [created])
  })

  it('POST /:id/move déplace un bouton (200) et renvoie les boutons modifiés', async () => {
    const youtube = (await call('POST', '', action)).body
    const res = await call('POST', `/${youtube.id}/move`, { position: 9 })

    assert.equal(res.status, 200)
    assert.deepEqual(res.body, [{ ...youtube, position: 9 }])
    assert.equal((await call('GET', `/${youtube.id}`)).body.position, 9)
  })

  it('POST /:id/move échange deux boutons', async () => {
    const youtube = (await call('POST', '', action)).body
    const music = (await call('POST', '', folder)).body
    const res = await call('POST', `/${youtube.id}/move`, { position: music.position })

    assert.equal(res.status, 200)
    assert.deepEqual(res.body, [{ ...youtube, position: music.position }, { ...music, position: youtube.position }])
    assert.equal((await call('GET', `/${music.id}`)).body.position, youtube.position)
  })

  it('POST /:id/move répond 400 pour un emplacement invalide ou réservé, 404 pour un bouton inconnu', async () => {
    const parent = (await call('POST', '', folder)).body
    const inside = (await call('POST', '', { ...action, position: 1, parentId: parent.id })).body

    assert.equal((await call('POST', `/${inside.id}/move`, { position: 0 })).status, 400)
    assert.equal((await call('POST', `/${inside.id}/move`, { position: 99 })).status, 400)
    assert.equal((await call('POST', `/${inside.id}/move`, {})).status, 400)
    assert.equal((await call('POST', '/fantome/move', { position: 3 })).status, 404)
  })
  describe('authentification et isolation', () => {
    it('répond 401 sans session ou avec un jeton inconnu, sur chaque route', async () => {
      for (const cookie of [undefined, 'sdpc_session=inconnu']) {
        assert.equal((await callAs(cookie, 'GET', '')).status, 401)
        assert.equal((await callAs(cookie, 'GET', '/x')).status, 401)
        assert.equal((await callAs(cookie, 'POST', '', action)).status, 401)
        assert.equal((await callAs(cookie, 'PATCH', '/x', { label: 'y' })).status, 401)
        assert.equal((await callAs(cookie, 'POST', '/x/move', { position: 3 })).status, 401)
        assert.equal((await callAs(cookie, 'DELETE', '/x')).status, 401)
      }
    })

    it('DELETE / efface toute la grille de la personne (204), la grille des autres reste', async () => {
      const parent = (await call('POST', '', folder)).body
      await call('POST', '', { ...action, position: 1, parentId: parent.id })
      const theirs = (await callAs(marie.cookie, 'POST', '', action)).body

      const res = await call('DELETE', '')

      assert.equal(res.status, 204)
      assert.deepEqual((await call('GET', '')).body, [])
      assert.deepEqual((await callAs(marie.cookie, 'GET', '')).body, [theirs])
    })

    it('DELETE / sur une grille vide répond 204, et 401 sans session', async () => {
      assert.equal((await call('DELETE', '')).status, 204)
      assert.equal((await callAs(undefined, 'DELETE', '')).status, 401)
      assert.equal((await callAs('sdpc_session=inconnu', 'DELETE', '')).status, 401)
    })

    it('chaque personne ne voit que ses boutons', async () => {
      const mine = (await call('POST', '', action)).body
      const theirs = (await callAs(marie.cookie, 'POST', '', { ...action, label: 'Netflix' })).body

      assert.deepEqual((await call('GET', '')).body, [mine])
      assert.deepEqual((await callAs(marie.cookie, 'GET', '')).body, [theirs])
      assert.deepEqual((await call('GET', '?parentId=root')).body, [mine])
    })

    it('le même emplacement est libre pour chaque personne', async () => {
      assert.equal((await call('POST', '', action)).status, 201)
      assert.equal((await callAs(marie.cookie, 'POST', '', action)).status, 201)
    })

    it('répond 404 sur le bouton d\'une autre personne, sans le modifier', async () => {
      const theirs = (await callAs(marie.cookie, 'POST', '', action)).body

      assert.equal((await call('GET', `/${theirs.id}`)).status, 404)
      assert.equal((await call('PATCH', `/${theirs.id}`, { label: 'Volé' })).status, 404)
      assert.equal((await call('POST', `/${theirs.id}/move`, { position: 5 })).status, 404)
      assert.equal((await call('DELETE', `/${theirs.id}`)).status, 404)

      assert.deepEqual((await callAs(marie.cookie, 'GET', `/${theirs.id}`)).body, theirs)
    })

    it('refuse (400) de créer un bouton dans le dossier d\'une autre personne', async () => {
      const theirs = (await callAs(marie.cookie, 'POST', '', folder)).body
      assert.equal((await call('POST', '', { ...action, position: 1, parentId: theirs.id })).status, 400)
    })

    it('un compte supprimé emporte ses boutons et ses sessions', async () => {
      const mine = (await call('POST', '', action)).body
      server.db.prepare('DELETE FROM users WHERE id = ?').run(jean.id)

      assert.equal((await call('GET', `/${mine.id}`)).status, 401)
      assert.equal((server.db.prepare('SELECT count(*) AS n FROM buttons WHERE user_id = ?').get(jean.id) as { n: number }).n, 0)
      jean = await server.signUp('jean@exemple.fr')
    })
  })
})
