# Feature 01 — Connexion client ↔ serveur

| | |
| --- | --- |
| **Statut** | Livré (une vérification visuelle restante, voir « Validation ») |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |

## Explication de la feature

Le client (Vue, port 3000) et le serveur (Express, port 4000) sont deux applications indépendantes. Cette première feature pose le socle qui les relie et prouve que la chaîne complète fonctionne :

- le serveur expose une route de santé, `GET /api/health` ;
- le client interroge cette route avec **axios** au démarrage ;
- la barre du haut affiche un indicateur : **Serveur connecté** (vert), **Serveur injoignable** (rouge) ou **Serveur : vérification…** (gris).

La connexion est revérifiée toutes les 15 secondes, et un clic sur la pastille relance la vérification immédiatement.

> **Mise à jour :** la pastille a été retirée de la barre d'application. Le store `server` et la route `GET /api/health` restent en place et testés, mais plus rien ne les appelle depuis l'interface : la section « Vérifier à la main » ci-dessous n'est plus applicable.

Toutes les futures fonctionnalités (lecture et écriture des boutons, des dossiers) passeront par la même instance axios, ce qui évite de réécrire la configuration réseau à chaque feature.

## TODO

- [x] Route `GET /api/health` côté serveur
- [x] Ajout d'axios au client
- [x] Instance axios partagée (`baseURL: '/api'`, délai maximal de 5 s)
- [x] Proxy Vite `/api` → `http://localhost:4000` (pas de CORS en développement)
- [x] Store Pinia `server` qui porte l'état de la connexion
- [x] Indicateur d'état dans la barre d'application
- [x] Revérifier la connexion périodiquement (le serveur peut tomber après le chargement)
- [x] Permettre de relancer la vérification en cliquant sur l'indicateur
- [x] Rendre l'URL du serveur configurable pour la production (variable d'environnement Vite)
- [x] Tests (route de santé, store)

## Implémentation

### Serveur

`server/src/app.ts` (`createApp()`) : Express 5 avec `cors` et `express.json()`, route :

```
GET /api/health  →  200  { "status": "ok" }
```

`server/src/index.ts` démarre l'application ; le port vient de `PORT` (défaut `4000`, voir `server/.env.example`). L'application est séparée du démarrage pour pouvoir être testée sans ouvrir le port 4000.

Tests : `server/test/app.test.ts` (`node:test` lancé par `tsx`), route de santé en 200 et route inconnue en 404. Commande : `npm test` dans `server/`.

### Client

| Fichier | Rôle |
| --- | --- |
| `client/src/api/http.ts` | Instance axios partagée (`baseURL` = `VITE_API_URL`, défaut `/api`, `timeout: 5000`) |
| `client/src/api/health.ts` | `fetchHealth()` : appelle `GET /health` et renvoie `HealthResponse` |
| `client/src/stores/server.ts` | Store Pinia : `status` (`unknown`, `online`, `offline`), `checkHealth()`, `retry()` (relance manuelle), `startPolling()` / `stopPolling()` (toutes les 15 s) |
| `client/test/stores/server.test.ts` | Tests du store (Vitest) : en ligne, hors ligne, relance, revérification périodique, chute du serveur |
| `client/src/App.vue` | Barre d'application et onglets (n'affiche plus l'indicateur de connexion, voir la mise à jour plus haut) |
| `client/env.d.ts`, `client/.env.example` | Typage et exemple de la variable `VITE_API_URL` |
| `client/vite.config.mts` | Proxy `/api` vers `http://localhost:4000` |

### Flux

```
App.vue (onMounted)
  → useServerStore().startPolling()      (vérifie tout de suite, puis toutes les 15 s)
    → checkHealth()
      → fetchHealth()                    (client/src/api/health.ts)
        → axios GET /api/health          (proxy Vite → serveur :4000)
      ← succès : status = 'online'
      ← erreur : status = 'offline'
  → le v-chip se met à jour

Clic sur le v-chip → retry() : status = 'unknown', puis checkHealth()
App.vue (onUnmounted) → stopPolling()
```

### Configuration de l'URL de l'API

En développement, rien à configurer : le proxy Vite redirige `/api` vers `http://localhost:4000`. En production, définir `VITE_API_URL` (voir `client/.env.example`) avant `npm run build`, par exemple `VITE_API_URL=https://mon-serveur.exemple/api`.

### Validation

- [x] Onglet **Grille** : pastille « Serveur connecté » affichée (captures validées)
- [x] Onglet **Configuration** : pastille « Serveur connecté » affichée (captures validées)
- [x] Type-check, lint et build du client sans erreur ; type-check et build du serveur sans erreur
- [x] Tests automatisés : 6 tests client (`npm test` dans `client/`), 2 tests serveur (`npm test` dans `server/`)
- [ ] Cas « Serveur injoignable » et revérification automatique vérifiés visuellement dans le navigateur (serveur arrêté puis relancé, sans recharger la page)

### Vérifier à la main

1. `cd server && npm run dev`
2. `cd client && npm run dev`
3. Ouvrir `http://localhost:3000` : la pastille doit passer à « Serveur connecté ».
4. Arrêter le serveur : en 15 secondes au plus, la pastille passe à « Serveur injoignable » sans recharger la page.
5. Relancer le serveur et cliquer sur la pastille : elle repasse brièvement à « vérification… » puis à « Serveur connecté ».
