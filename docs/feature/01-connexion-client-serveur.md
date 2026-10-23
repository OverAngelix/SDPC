# Feature 01 — Connexion client ↔ serveur

| | |
| --- | --- |
| **Statut** | En cours (socle livré et validé en interface, améliorations à faire) |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |

## Explication de la feature

Le client (Vue, port 3000) et le serveur (Express, port 4000) sont deux applications indépendantes. Cette première feature pose le socle qui les relie et prouve que la chaîne complète fonctionne :

- le serveur expose une route de santé, `GET /api/health` ;
- le client interroge cette route avec **axios** au démarrage ;
- la barre du haut affiche un indicateur : **Serveur connecté** (vert), **Serveur injoignable** (rouge) ou **Serveur : vérification…** (gris).

Toutes les futures fonctionnalités (lecture et écriture des boutons, des dossiers) passeront par la même instance axios, ce qui évite de réécrire la configuration réseau à chaque feature.

## TODO

- [x] Route `GET /api/health` côté serveur
- [x] Ajout d'axios au client
- [x] Instance axios partagée (`baseURL: '/api'`, délai maximal de 5 s)
- [x] Proxy Vite `/api` → `http://localhost:4000` (pas de CORS en développement)
- [x] Store Pinia `server` qui porte l'état de la connexion
- [x] Indicateur d'état dans la barre d'application
- [ ] Revérifier la connexion périodiquement (le serveur peut tomber après le chargement)
- [ ] Permettre de relancer la vérification en cliquant sur l'indicateur
- [ ] Rendre l'URL du serveur configurable pour la production (variable d'environnement Vite)
- [ ] Tests (route de santé, store)

## Implémentation

### Serveur

`server/src/index.ts` : Express 5 avec `cors` et `express.json()`, route :

```
GET /api/health  →  200  { "status": "ok" }
```

Le port vient de `PORT` (défaut `4000`, voir `server/.env.example`).

### Client

| Fichier | Rôle |
| --- | --- |
| `client/src/api/http.ts` | Instance axios partagée (`baseURL: '/api'`, `timeout: 5000`) |
| `client/src/api/health.ts` | `fetchHealth()` : appelle `GET /health` et renvoie `HealthResponse` |
| `client/src/stores/server.ts` | Store Pinia : `status` (`unknown`, `online`, `offline`) et action `checkHealth()` |
| `client/src/App.vue` | Appelle `checkHealth()` au montage et affiche l'indicateur (`v-chip`) |
| `client/vite.config.mts` | Proxy `/api` vers `http://localhost:4000` |

### Flux

```
App.vue (onMounted)
  → useServerStore().checkHealth()
    → fetchHealth()              (client/src/api/health.ts)
      → axios GET /api/health    (proxy Vite → serveur :4000)
    ← succès : status = 'online'
    ← erreur : status = 'offline'
  → le v-chip se met à jour
```

### Validation

- [x] Onglet **Grille** : pastille « Serveur connecté » affichée (captures validées)
- [x] Onglet **Configuration** : pastille « Serveur connecté » affichée (captures validées)
- [x] Type-check, lint et build du client sans erreur ; type-check du serveur sans erreur
- [ ] Cas « Serveur injoignable » vérifié visuellement (serveur arrêté, page rechargée)

### Vérifier à la main

1. `cd server && npm run dev`
2. `cd client && npm run dev`
3. Ouvrir `http://localhost:3000` : la pastille doit passer à « Serveur connecté ».
4. Arrêter le serveur et recharger la page : elle doit afficher « Serveur injoignable ».
