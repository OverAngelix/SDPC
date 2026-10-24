# Feature 08 — Grille de 28 cases (7 × 4, et 4 × 7 en portrait)

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [07 — Responsive : grille adaptée au téléphone](07-responsive.md) |

## Explication de la feature

La grille passe de 35 à **28 emplacements** : **7 colonnes × 4 lignes** sur ordinateur et en paysage, **4 colonnes × 7 lignes** en portrait (téléphone). Sur téléphone, les cases passent d'environ 70 px à environ 89 px de côté : icônes et libellés plus grands, plus faciles à toucher, et les 28 emplacements tiennent toujours d'un coup dans l'écran. Sur ordinateur, 7 colonnes remplissent la largeur de la page.

Cette feature **remplace les valeurs des fiches 02 à 07** : emplacements 0 à 27 (au lieu de 0 à 34), 28 utilisables à la racine, 27 dans un dossier (au lieu de 35 et 34), formes 7 × 4 et 4 × 7 (au lieu de 7 × 5 et 5 × 7). Ces fiches, déjà livrées, ne sont pas réécrites.

## TODO

- [x] Serveur : `COLUMNS = 7`, `ROWS = 4`, donc `SLOTS = 28` ; validation de la position (0 à 27) et du déplacement
- [x] Client : formes 7 × 4 (paysage) et 4 × 7 (portrait), `SLOTS = 28`
- [x] Client : taille maximale d'une case sur grand écran
- [x] Tests serveur et client mis à jour (limites 27 et 28, formes, vague d'apparition)
- [x] `CLAUDE.md`, `README.md` et README des features : nouvelles dimensions
- [x] Vérification : rendu en portrait et sur ordinateur, fiche mise à jour

## Décisions

- **Chemin parcouru : 24 cases (6 × 4 et 4 × 6), puis 28.** Avec 24 cases, la grille laissait de l'espace vide (en bas sur téléphone, sur les côtés sur ordinateur) : le nombre de cases doit être fixe, sinon un bouton rangé loin disparaîtrait sur un petit écran, mais il pouvait mieux remplir l'écran.
- **28 emplacements, 7 × 4 et 4 × 7.** Un Stream Deck Elgato compte de 15 à 32 touches, et les dossiers servent à ranger le reste. 28 est le total qui donne une bonne grille tenant d'un coup dans l'écran dans les deux orientations. Les autres totaux étudiés : 30 cases (5 × 6 en portrait : cases de 70 px, ou 3 × 10 : environ 1,7 écran à défiler, avec le bouton retour qui sort de l'écran) et 32 (4 × 8 : tient seulement sur un écran très haut).
- **Pas de défilement en portrait.** 7 lignes de ~89 px font environ 660 px. Sur un écran plus court, le calcul de largeur maximale réduit un peu les cases pour que tout reste visible (~84 px sur un écran de 700 px de haut).
- **Sur ordinateur, des cases limitées à 124 px.** Sans limite, le calcul fondé sur la hauteur de l'écran agrandirait trop les cases. La taille maximale (`--tile-max` dans `ButtonGrid.vue`) donne une grille d'environ 940 px de large pour 530 px de haut, au format d'un écran 16:9.
- **Pas de correspondance ligne à ligne entre ordinateur et téléphone.** Une ligne de 7 cases sur ordinateur ne devient pas un nombre entier de lignes de 4 : l'ordre de lecture est conservé (de gauche à droite, de haut en bas), pas l'emplacement visuel. C'est le prix de ne pas défiler.
- **Aucune migration.** Le fichier de données actuel n'a aucun bouton au-delà de l'emplacement 20. Un fichier qui en aurait à partir de 28 serait refusé à la lecture, comme toute position invalide (règle existante du serveur).
- **Grille centrée dans l'écran, en hauteur comme en largeur.** Les pages Grille et Configuration occupent toute la hauteur sous la barre d'application et centrent leur contenu (classe `page-centered`, `App.vue`) ; si le contenu est plus haut que l'écran (Configuration en portrait, avec son texte d'explication), la page défile normalement.
- **La case 0 d'un dossier reste le retour**, en haut à gauche dans les deux formes.
- **Les formes restent déduites de `SLOTS`** : 7 × 4 = 4 × 7 = 28. Seules les constantes changent, le code de la feature 07 (détection de l'orientation, vague, dimensionnement) est inchangé.

## Implémentation

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/types.ts` | `COLUMNS`, `ROWS`, `SLOTS` |
| `server/test/buttons/*.test.ts` | Limites de position : 27 au lieu de 34, 28 au lieu de 35 |
| `client/src/grid.ts` | `LANDSCAPE_SHAPE` 7 × 4, `PORTRAIT_SHAPE` 4 × 7 |
| `client/src/components/ButtonGrid.vue` | Taille maximale d'une case (`--tile-max`) |
| `client/test/grid.test.ts` | Formes, emplacements, vague d'apparition |
| `CLAUDE.md`, `README.md`, `docs/feature/README.md` | Dimensions du projet |

### Validation

- [x] Tests serveur (82) et client (93), type-check et lint sans erreur
- [x] Rendu vérifié dans Chrome : 4 × 7 en portrait (cases de ~89 px, tout visible), 7 × 4 sur ordinateur (cases de 124 px)
- [ ] Parcours vérifié sur téléphone réel et sur un grand écran

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Ordinateur : la grille fait 7 colonnes × 4 lignes, environ 940 px de large, cases d'au plus 124 px.
2. Portrait (téléphone ou fenêtre étroite) : 4 colonnes × 7 lignes, cases plus grandes, aucun défilement.
3. Créer un bouton sur le dernier emplacement (le 28ᵉ), puis tenter d'en déplacer un au-delà : refusé.
4. Dans un dossier, la première case est le retour, 27 emplacements restent utilisables.
