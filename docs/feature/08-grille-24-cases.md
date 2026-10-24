# Feature 08 — Grille de 24 cases (6 × 4, et 4 × 6 en portrait)

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [07 — Responsive : grille adaptée au téléphone](07-responsive.md) |

## Explication de la feature

La grille passe de 35 à **24 emplacements** : **6 colonnes × 4 lignes** sur ordinateur et en paysage, **4 colonnes × 6 lignes** en portrait (téléphone). Sur téléphone, les cases passent d'environ 70 px à environ 89 px de côté : icônes et libellés plus grands, plus faciles à toucher, et les 24 emplacements tiennent toujours d'un coup dans l'écran.

Cette feature **remplace les valeurs des fiches 02 à 07** : emplacements 0 à 23 (au lieu de 0 à 34), 24 utilisables à la racine, 23 dans un dossier (au lieu de 35 et 34), formes 6 × 4 et 4 × 6 (au lieu de 7 × 5 et 5 × 7). Ces fiches, déjà livrées, ne sont pas réécrites.

## TODO

- [ ] Serveur : `COLUMNS = 6`, `ROWS = 4`, donc `SLOTS = 24` ; validation de la position (0 à 23) et du déplacement
- [ ] Client : formes 6 × 4 (paysage) et 4 × 6 (portrait), `SLOTS = 24`
- [ ] Tests serveur et client mis à jour (limites 23 et 24, formes, vague d'apparition)
- [ ] `CLAUDE.md`, `README.md` et README des features : nouvelles dimensions
- [ ] Vérification : rendu en portrait et sur ordinateur, fiche mise à jour

## Décisions

- **24 emplacements suffisent.** Un Stream Deck Elgato compte de 15 à 32 touches, et les dossiers servent à ranger le reste.
- **4 × 6 en portrait, pas 3 × 8.** 3 colonnes donneraient des cases de 120 px mais 8 lignes feraient environ 1 000 px de haut pour ~750 px disponibles : il faudrait défiler. 4 × 6 tient dans l'écran sans défilement avec des cases de ~89 px.
- **Sur ordinateur, la grille occupe la même place qu'avant.** La largeur maximale de la grille et son calcul en hauteur ne changent pas : avec une colonne de moins, les cases grandissent d'environ 17 % en largeur, et la grille est un peu moins haute (4 lignes au lieu de 5). Aucun agrandissement forcé au-delà.
- **Aucune migration.** Le fichier de données actuel n'a aucun bouton au-delà de l'emplacement 20. Un fichier qui en aurait à partir de 24 serait refusé à la lecture, comme toute position invalide (règle existante du serveur).
- **La case 0 d'un dossier reste le retour**, en haut à gauche dans les deux formes.
- **Les formes restent déduites de `SLOTS`** : 6 × 4 = 4 × 6 = 24. Seules les constantes changent, le code de la feature 07 (détection de l'orientation, vague, dimensionnement) est inchangé.

## Implémentation

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/types.ts` | `COLUMNS`, `ROWS`, `SLOTS` |
| `server/test/buttons/*.test.ts` | Limites de position : 23 au lieu de 34, 24 au lieu de 35 |
| `client/src/grid.ts` | `LANDSCAPE_SHAPE` 6 × 4, `PORTRAIT_SHAPE` 4 × 6 |
| `client/test/grid.test.ts` | Formes, emplacements, vague d'apparition |
| `CLAUDE.md`, `README.md`, `docs/feature/README.md` | Dimensions du projet |

### Validation

- [ ] Tests serveur et client, type-check, lint et build sans erreur
- [ ] Rendu vérifié : 4 × 6 en portrait (cases de ~89 px, tout visible), 6 × 4 sur ordinateur (même place qu'avant)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Ordinateur : la grille fait 6 colonnes × 4 lignes, à peu près la même largeur qu'avant.
2. Portrait (téléphone ou fenêtre étroite) : 4 colonnes × 6 lignes, cases plus grandes, aucun défilement.
3. Créer un bouton sur le dernier emplacement (le 24ᵉ), puis tenter d'en déplacer un au-delà : refusé.
4. Dans un dossier, la première case est le retour, 23 emplacements restent utilisables.
