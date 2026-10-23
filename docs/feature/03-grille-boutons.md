# Feature 03 — Grille de boutons

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [02 — API des boutons](02-api-boutons.md) |

## Explication de la feature

L'onglet **Grille** affiche les boutons comme un Stream Deck : 7 colonnes × 5 lignes, chaque bouton avec son icône et son libellé.

- Un clic sur une **action** ouvre son URL dans un nouvel onglet.
- Un clic sur un **dossier** remplace la grille par son contenu, sur autant de niveaux que nécessaire.
- Dans un dossier, le **bouton retour** occupe la première case de la grille (comme sur un Stream Deck Elgato) : 35 emplacements utilisables à la racine, 34 dans un dossier. Il n'y a pas de fil d'Ariane.
- Les emplacements libres sont affichés vides, pour que la grille garde toujours sa forme.

C'est la feature qui rend l'application utilisable au quotidien.

## TODO

- [x] Client API des boutons (`client/src/api/buttons.ts`) basé sur l'instance axios partagée, types dans `client/src/interfaces/button.ts`
- [x] Store Pinia `buttons` : chargement, boutons d'un dossier, chargement et erreur
- [x] Composant `ButtonTile` : icône MDI, libellé, tuile de retour, emplacement vide
- [x] Composant `ButtonGrid` : grille 7 × 5 construite à partir des positions 0 à 34
- [x] Routes `/` (racine) et `/folder/:id` pour que l'URL reflète le dossier ouvert
- [x] Clic sur une action : ouverture de l'URL dans un nouvel onglet
- [x] Clic sur un dossier : navigation vers son contenu
- [x] Bouton retour à la première case d'un dossier (pas de fil d'Ariane)
- [x] États : chargement, erreur (serveur injoignable), grille vide, dossier introuvable
- [x] Constantes de la grille (colonnes, lignes) centralisées côté client
- [x] Tests du store, de la construction de la grille et de la garde sur les URL (`client/test/`)
- [x] Fiche mise à jour et README du projet

## Décisions

- **Tout est chargé d'un coup** : `GET /api/buttons` renvoie la liste à plat, le client la garde dans le store et en déduit le contenu et le chemin de chaque dossier. Pas de requête par dossier, la navigation est instantanée.
- **Rechargement à chaque ouverture de l'onglet Grille**, pour voir les changements faits dans la configuration. Si un rechargement échoue, la grille déjà chargée reste affichée avec un avertissement.
- **Une action s'ouvre dans un nouvel onglet** (`window.open(url, '_blank', 'noopener,noreferrer')`) : la grille reste ouverte. Le client revérifie que l'URL est `http` ou `https` (`isHttpUrl`), même si le serveur la valide déjà : en cas d'URL douteuse, le clic ne fait rien.
- **Le retour est la case 0 de la grille d'un dossier**, pas un bouton à part : il mène au dossier parent, ou à la racine depuis un dossier de premier niveau. Le serveur interdit les boutons à cet emplacement (fiche 02) et `buildSlots` le laisse vide dans un dossier par sécurité.
- **Dossier introuvable** : un identifiant inconnu, une action, une chaîne de parents rompue ou cyclique donnent le même message avec un retour à l'accueil.
- **L'onglet Grille reste actif dans un dossier** : les routes `/` et `/folder/:id` partagent un parent commun.
- **Dimensions de la grille** dans `client/src/grid.ts` (`COLUMNS = 7`, `ROWS = 5`, `SLOTS`, `BACK_SLOT = 0`), miroir de `server/src/buttons/types.ts` : à garder alignés tant que la grille n'est pas modulable.

## Implémentation

### Flux

```
GridPage (/ ou /folder/:id)
  → useButtonsStore().load()               (GET /api/buttons)
  → boutons du dossier courant, rangés par position (buildSlots)
  → ButtonGrid : 35 emplacements, vides ou occupés
      clic action  → window.open(url, '_blank')    (http(s) uniquement)
      clic dossier → router.push(/folder/:id)
      case 0 d'un dossier → tuile de retour → router.push(parent ou racine)   (store.pathTo)
```

### États de la page

| Situation | Affichage |
| --- | --- |
| Premier chargement | Indicateur de chargement |
| Serveur injoignable, rien de chargé | Erreur avec bouton « Réessayer » |
| Serveur injoignable après un chargement | Grille conservée et avertissement avec « Réessayer » |
| Dossier inconnu | Avertissement et retour à l'accueil |
| Dossier sans bouton | Message d'aide, grille vide (seule la tuile de retour dans un dossier) |

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/interfaces/button.ts` | Types `Button` et `ButtonType` |
| `client/src/api/buttons.ts` | `fetchButtons` (`GET /buttons`) |
| `client/src/grid.ts` | Constantes de la grille, `BACK_SLOT` et `buildSlots` |
| `client/src/utils/url.ts` | `isHttpUrl` |
| `client/src/stores/buttons.ts` | Store Pinia : `buttons`, `loading`, `error`, `loaded`, `load`, `slotsOf`, `pathTo` (validité du dossier et dossier parent) |
| `client/src/components/ButtonTile.vue` | Un emplacement (bouton, retour ou vide) |
| `client/src/components/ButtonGrid.vue` | La grille, avec la tuile de retour à la case 0 d'un dossier |
| `client/src/pages/GridPage.vue` | Page de l'onglet Grille |
| `client/src/router/index.ts` | Routes `grid` (`/`) et `folder` (`/folder/:id`) |
| `client/test/grid.test.ts` | Tests de `buildSlots` |
| `client/test/stores/buttons.test.ts` | Tests du store |
| `client/test/utils/url.test.ts` | Tests de `isHttpUrl` |

### Vérifier à la main

```bash
cd server && npm run dev          # avec quelques boutons créés via l'API (voir la fiche 02)
cd client && npm run dev          # puis http://localhost:3000
```

Tests : `npm test` dans `client/`. Les composants ne sont pas couverts par des tests automatiques (pas d'environnement DOM) : la logique testable est dans le store, `grid.ts` et `url.ts`.
