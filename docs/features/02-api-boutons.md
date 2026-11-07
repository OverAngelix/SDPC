# Feature 02 — API des boutons

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `server/` |
| **Dépend de** | [01 — Connexion client ↔ serveur](01-connexion-client-serveur.md) |

## Explication de la feature

Le serveur conserve la configuration des boutons (le client n'en garde rien) et l'expose en JSON sous `/api/buttons`. Cette API est le contrat sur lequel s'appuient la grille (03), la configuration (04) et le glisser-déposer (05).

Un bouton est soit une **action** (redirige vers une URL), soit un **dossier** (contient d'autres boutons, sur plusieurs niveaux). Les boutons d'un même dossier se placent dans les emplacements d'une grille de 7 colonnes × 5 lignes, numérotés de **0 à 34**. Dans un dossier, l'emplacement **0 est réservé au bouton retour** (affiché par le client, comme sur un Stream Deck Elgato) : 35 emplacements utilisables à la racine, 34 dans un dossier.

Règle de sécurité : une action ne peut contenir qu'une URL `http` ou `https`. Aucune application locale n'est lancée, aucune commande n'est exécutée, et les schémas comme `javascript:` ou `file:` sont refusés.

## Décisions

- **Position = index d'emplacement de 0 à 34** dans le dossier parent (ligne = `position / 7` arrondi à l'inférieur, colonne = `position % 7`). Deux boutons d'un même dossier ne peuvent pas partager un emplacement ; deux dossiers différents peuvent utiliser le même numéro.
- **Emplacement 0 réservé dans un dossier** : un bouton ne peut pas y être placé (400), ni à la création, ni par `PATCH`, ni dans le fichier de données. Le serveur ne stocke pas le retour : c'est le client qui l'affiche. Ainsi aucun bouton ne peut être masqué par lui. À la racine, l'emplacement 0 est libre.
- **Grille en paysage, modulable plus tard.** Les dimensions (`COLUMNS = 7`, `ROWS = 5`, `SLOTS = 35`) et `BACK_SLOT = 0` sont définies à un seul endroit (`server/src/buttons/types.ts`), la validation s'y réfère.
- **Stockage dans un fichier JSON** (`server/data/buttons.json`, ignoré par git), sans base de données : pas de compte, un seul utilisateur.
- **Icône = nom MDI strict** (`mdi-` suivi de minuscules, chiffres et tirets) : le nom finit dans une classe CSS côté client, on n'accepte donc pas de texte libre.
- **Le dossier parent n'est pas modifiable par `PATCH`** : déplacer un bouton vers un autre dossier est discuté dans la feature 05, avec le glisser-déposer.
- **Un dossier non vide ne peut pas devenir une action** (409), pour ne pas orpheliner son contenu.

## TODO

- [x] Types : `Button`, `ButtonType`, constantes de la grille
- [x] Stockage JSON : lecture au démarrage, écriture atomique (fichier temporaire puis renommage), fichier créé s'il n'existe pas
- [x] `server/data/` ignoré par git
- [x] `GET /api/buttons` (liste à plat, filtre optionnel `?parentId=`)
- [x] `GET /api/buttons/:id`
- [x] `POST /api/buttons`
- [x] `PATCH /api/buttons/:id`
- [x] `DELETE /api/buttons/:id` (supprime aussi le contenu d'un dossier)
- [x] Validation : libellé, icône, type, URL `http(s)` pour une action et interdite pour un dossier, position entière de 0 à 34 (1 à 34 dans un dossier), parent existant et de type dossier
- [x] Erreurs JSON homogènes : 400 (données invalides), 404 (introuvable), 409 (emplacement occupé)
- [x] Tests (`node:test`) : validation, stockage, routes HTTP
- [x] Fiche mise à jour et README du projet

## Implémentation

### Modèle

```ts
type ButtonType = 'action' | 'folder'

interface Button {
  id: string              // UUID
  parentId: string | null // null = racine
  position: number        // 0 à 34 (1 à 34 dans un dossier : 0 est le retour), unique dans un même dossier
  label: string           // 50 caractères au plus
  icon: string            // nom d'icône MDI, ex. "mdi-youtube"
  type: ButtonType
  url?: string            // actions uniquement, http(s), 2048 caractères au plus
}
```

### Routes

| Méthode | Route | Rôle | Codes |
| --- | --- | --- | --- |
| GET | `/api/buttons` | Liste à plat. `?parentId=<id>` : contenu d'un dossier ; `?parentId=root` : la racine | 200, 400 |
| GET | `/api/buttons/:id` | Un bouton | 200, 404 |
| POST | `/api/buttons` | Crée un bouton (le serveur attribue l'`id`). `parentId` vaut `null` s'il est absent | 201, 400, 409 |
| PATCH | `/api/buttons/:id` | Modifie des champs (`label`, `icon`, `type`, `position`, `url`) | 200, 400, 404, 409 |
| POST | `/api/buttons/:id/move` | Déplace le bouton vers `{ "position": n }` dans son dossier, en échangeant avec l'occupant éventuel (feature 05). Renvoie les boutons dont l'emplacement a changé | 200, 400, 404 |
| DELETE | `/api/buttons/:id` | Supprime le bouton et, pour un dossier, tout son contenu | 204, 404 |

Les champs inconnus sont ignorés. Une route `/api/...` inconnue répond 404 en JSON.

### Erreurs

Toutes les erreurs ont la même forme :

```json
{ "error": "Données invalides", "details": ["url : seules les adresses http et https sont autorisées"] }
```

| Code | Cas |
| --- | --- |
| 400 | Données invalides (détail dans `details`), JSON mal formé (`{ "error": "Requête invalide" }`), parent introuvable ou qui n'est pas un dossier, emplacement 0 dans un dossier |
| 404 | Bouton ou route introuvable |
| 409 | Emplacement déjà occupé dans le dossier ; dossier non vide qui deviendrait une action |
| 500 | Erreur interne (détail seulement dans les journaux du serveur) |

### Stockage

`server/data/buttons.json`, au format `{ "buttons": [ ... ] }`. Le chemin se règle avec `DATA_FILE` (relatif à `server/`, voir `server/.env.example`).

- Au démarrage, le fichier est créé s'il n'existe pas.
- Un fichier illisible ou incohérent (JSON invalide, bouton invalide, identifiant ou emplacement en double, emplacement 0 dans un dossier, parent inexistant) fait échouer le démarrage avec un message clair, sans être écrasé.
- Chaque modification est écrite dans un fichier temporaire puis renommée, et les écritures se font l'une après l'autre.

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/types.ts` | Types et constantes de la grille |
| `server/src/buttons/validation.ts` | Validation des données reçues, fusion d'un `PATCH` |
| `server/src/buttons/store.ts` | Lecture et écriture du fichier JSON, règles métier (emplacement, parent, cascade) |
| `server/src/buttons/router.ts` | Routes Express |
| `server/src/errors.ts` | `HttpError` (code, message, détails) |
| `server/src/app.ts` | `createApp({ store })` : branche les routes, la route 404 JSON et la gestion d'erreurs |
| `server/src/index.ts` | Ouvre le stockage puis démarre le serveur |
| `server/test/helpers/server.ts` | Serveur de test sur un port libre avec un fichier temporaire |
| `server/test/buttons/*.test.ts` | Tests : validation, stockage, routes |
| `server/test/app.test.ts` | Tests : santé et route inconnue |

### Vérifier à la main

```bash
cd server && npm run dev
curl -X POST http://localhost:4000/api/buttons -H 'Content-Type: application/json' \
  -d '{"position":0,"label":"YouTube","icon":"mdi-youtube","type":"action","url":"https://www.youtube.com"}'
curl http://localhost:4000/api/buttons
```

Tests : `npm test` dans `server/`.
