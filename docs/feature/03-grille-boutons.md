# Feature 03 — Grille de boutons

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [02 — API des boutons](02-api-boutons.md) |

## Explication de la feature

L'onglet **Grille** affiche les boutons comme un Stream Deck : 5 colonnes × 7 lignes, chaque bouton avec son icône et son libellé.

- Un clic sur une **action** redirige vers son URL.
- Un clic sur un **dossier** remplace la grille par son contenu, sur autant de niveaux que nécessaire.
- Un **retour** et un **fil d'Ariane** permettent de remonter.
- Les emplacements libres sont affichés vides, pour que la grille garde toujours sa forme.

C'est la feature qui rend l'application utilisable au quotidien.

## TODO

- [ ] Client API des boutons (`client/src/api/buttons.ts`) basé sur l'instance axios partagée
- [ ] Store Pinia `buttons` : chargement, boutons d'un dossier, chargement et erreur
- [ ] Composant `ButtonTile` : icône MDI, libellé, emplacement vide
- [ ] Composant `ButtonGrid` : grille 5 × 7 construite à partir des positions 0 à 34
- [ ] Routes `/` (racine) et `/folder/:id` pour que l'URL reflète le dossier ouvert
- [ ] Clic sur une action : redirection vers l'URL dans l'onglet courant
- [ ] Clic sur un dossier : navigation vers son contenu
- [ ] Bouton retour et fil d'Ariane
- [ ] États : chargement, erreur (serveur injoignable), grille vide, dossier introuvable
- [ ] Constantes de la grille (colonnes, lignes) centralisées côté client
- [ ] Tests du store et de la construction de la grille
- [ ] Fiche mise à jour et README du projet

## Implémentation (prévue)

### Flux

```
GridPage (/ ou /folder/:id)
  → useButtonsStore().load()               (GET /api/buttons)
  → boutons du dossier courant, rangés par position
  → ButtonGrid : 35 emplacements, vides ou occupés
      clic action  → window.location.assign(url)
      clic dossier → router.push(/folder/:id)
```

### Fichiers prévus

| Fichier | Rôle |
| --- | --- |
| `client/src/api/buttons.ts` | Appels axios (`GET /buttons`) et types `Button` |
| `client/src/stores/buttons.ts` | Store Pinia des boutons |
| `client/src/components/ButtonTile.vue` | Un emplacement (bouton ou vide) |
| `client/src/components/ButtonGrid.vue` | La grille |
| `client/src/components/FolderBreadcrumb.vue` | Retour et fil d'Ariane |
| `client/src/pages/GridPage.vue` | Page de l'onglet Grille |
| `client/src/router/index.ts` | Route `/folder/:id` |
