# SDPC — Stream Deck pour PC

Un Stream Deck logiciel pour PC, dans l'esprit des Stream Deck d'Elgato : une grille de boutons (5 colonnes × 7 lignes) servant de raccourcis.

- Un **bouton** a une icône et un libellé configurables.
- Un bouton est soit une **action**, soit un **dossier**.
- **Action** : redirige vers une URL. Aucune application locale n'est lancée, aucune commande n'est exécutée.
- **Dossier** : un clic remplace la grille par celle du dossier (plusieurs niveaux de profondeur) ; un retour permet de remonter.

## Stack

| Dossier | Technologies | Port |
| --- | --- | --- |
| `client/` | Vue 3, Vuetify, Vue Router, Pinia, axios, Vite, TypeScript | 3000 |
| `server/` | Node, Express 5, TypeScript (ESM, `tsx` en développement) | 4000 |

Le client et le serveur sont indépendants : chacun a son `package.json` et son `package-lock.json`.

## Démarrage

```bash
# Serveur
cd server
npm ci
cp .env.example .env
npm run dev

# Client (dans un autre terminal)
cd client
npm ci
npm run dev
```

Puis ouvrir <http://localhost:3000>. En développement, le client redirige `/api` vers le serveur. En production, l'URL de l'API se règle avec `VITE_API_URL` (voir `client/.env.example`).

## Commandes

| Dossier | Commandes |
| --- | --- |
| `server/` | `npm run dev`, `npm run build`, `npm start`, `npm run type-check`, `npm test` |
| `client/` | `npm run dev`, `npm run build`, `npm run type-check`, `npm run lint`, `npm test` |

## Features mises en place

| Feature | Statut | Personne active |
| --- | --- | --- |
| [01 — Connexion client ↔ serveur](docs/feature/01-connexion-client-serveur.md) | Livré | OverAngelix |

La liste complète et le détail de chaque feature (TODO, implémentation) sont dans [`docs/feature/`](docs/feature/README.md).

## Licence

Projet libre de droit, placé dans le domaine public : voir [LICENSE](LICENSE) (Unlicense).
