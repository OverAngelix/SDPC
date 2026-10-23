# Feature 02 — API des boutons

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | À définir |
| **Périmètre** | `server/` |
| **Dépend de** | [01 — Connexion client ↔ serveur](01-connexion-client-serveur.md) |

## Explication de la feature

Le serveur conserve la configuration des boutons (le client n'en garde rien) et l'expose en JSON sous `/api/buttons`. Cette API est le contrat sur lequel s'appuient la grille (03), la configuration (04) et les finitions (05).

Un bouton est soit une **action** (redirige vers une URL), soit un **dossier** (contient d'autres boutons, sur plusieurs niveaux). Les boutons d'un même dossier se placent dans les emplacements d'une grille de 5 colonnes × 7 lignes, numérotés de **0 à 34**.

Règle de sécurité : une action ne peut contenir qu'une URL `http` ou `https`. Aucune application locale n'est lancée, aucune commande n'est exécutée, et les schémas comme `javascript:` ou `file:` sont refusés.

## Décisions

- **Position = index d'emplacement de 0 à 34** dans le dossier parent (ligne = `position / 5`, colonne = `position % 5`, arrondi à l'inférieur pour la ligne). Deux boutons d'un même dossier ne peuvent pas partager un emplacement.
- **Grille modulable : plus tard.** Les dimensions (`COLUMNS = 5`, `ROWS = 7`, `SLOTS = 35`) sont définies à un seul endroit du serveur pour que les rendre configurables reste un petit changement.
- **Stockage dans un fichier JSON** (`server/data/buttons.json`), sans base de données : pas de compte, un seul utilisateur.

## TODO

- [ ] Types partagés côté serveur : `Button`, `ButtonType`, constantes de la grille
- [ ] Stockage JSON : lecture au démarrage, écriture atomique (fichier temporaire puis renommage), fichier créé s'il n'existe pas
- [ ] `server/data/` ignoré par git
- [ ] `GET /api/buttons` (liste à plat, filtre optionnel `?parentId=`)
- [ ] `GET /api/buttons/:id`
- [ ] `POST /api/buttons`
- [ ] `PATCH /api/buttons/:id`
- [ ] `DELETE /api/buttons/:id` (supprime aussi le contenu d'un dossier)
- [ ] Validation : libellé non vide, icône non vide, type connu, URL `http(s)` obligatoire pour une action et interdite pour un dossier, position entière entre 0 et 34, parent existant et de type dossier
- [ ] Erreurs JSON homogènes : 400 (données invalides), 404 (introuvable), 409 (emplacement occupé)
- [ ] Tests (`node:test`) : CRUD, validation, emplacement occupé, suppression en cascade, rechargement depuis le fichier
- [ ] Fiche mise à jour et README du projet

## Implémentation (prévue)

### Modèle

```ts
type ButtonType = 'action' | 'folder'

interface Button {
  id: string              // UUID
  parentId: string | null // null = racine
  position: number        // 0 à 34, unique dans un même dossier
  label: string
  icon: string            // nom d'icône MDI, ex. "mdi-youtube"
  type: ButtonType
  url?: string            // actions uniquement, http(s)
}
```

### Routes

| Méthode | Route | Rôle | Codes |
| --- | --- | --- | --- |
| GET | `/api/buttons` | Liste à plat, `?parentId=` pour filtrer un dossier | 200 |
| GET | `/api/buttons/:id` | Un bouton | 200, 404 |
| POST | `/api/buttons` | Crée un bouton (sans `id`) | 201, 400, 409 |
| PATCH | `/api/buttons/:id` | Modifie des champs | 200, 400, 404, 409 |
| DELETE | `/api/buttons/:id` | Supprime le bouton et, pour un dossier, tout son contenu | 204, 404 |

### Fichiers prévus

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/types.ts` | Types et constantes de la grille |
| `server/src/buttons/validation.ts` | Validation des données reçues |
| `server/src/buttons/store.ts` | Lecture et écriture du fichier JSON |
| `server/src/buttons/router.ts` | Routes Express, branchées dans `app.ts` |
| `server/src/buttons/*.test.ts` | Tests |
