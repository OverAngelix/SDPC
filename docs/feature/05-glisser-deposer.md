# Feature 05 — Glisser-déposer des boutons

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md) |

## Explication de la feature

Deux améliorations qui rendent la configuration plus confortable et plus sûre :

- **Glisser-déposer** pour déplacer un bouton vers un autre emplacement du même dossier. Si l'emplacement est libre, le bouton s'y place ; s'il est occupé, **les deux boutons échangent leur place**. L'emplacement 0 d'un dossier, réservé au retour, n'est pas une destination : le déposer là affiche un message.
- **Confirmation renforcée** avant de supprimer un dossier non vide, avec le nombre de boutons qui seront supprimés.

## TODO

- [x] Serveur : validation du déplacement (`validateMoveInput` : emplacement entier de 0 à 34, 0 refusé dans un dossier)
- [x] Serveur : déplacement et échange d'emplacements en une seule écriture (`ButtonStore.move`)
- [x] Serveur : route de déplacement `POST /api/buttons/:id/move` (emplacement 0 refusé dans un dossier)
- [x] Client : appel `moveButton` et action `move` du store
- [x] Client : glisser-déposer des boutons dans la grille d'édition
- [x] Client : message de confirmation avec le nombre de boutons supprimés pour un dossier non vide
- [x] Déplacer un bouton vers un autre dossier : non retenu (voir les décisions)
- [x] Tests serveur (validation, stockage, route) et client (store, compteur de contenu)
- [x] Fiche mise à jour et README du projet

## Décisions

- **Déplacement dans le dossier du bouton seulement.** Un bouton ne change pas de dossier par glisser-déposer : la grille n'affiche qu'un dossier à la fois, il n'y a donc pas de destination d'un autre dossier à viser. Le serveur ne le permet pas non plus (`PATCH` refuse toujours un `parentId` différent, fiche 02). Pour changer de dossier : recréer le bouton dans le dossier voulu.
- **Échange plutôt que refus** quand l'emplacement est occupé : le bouton déposé prend l'emplacement visé et l'occupant prend l'ancien emplacement du bouton déposé. Les deux écritures n'en font qu'une, le fichier n'est jamais dans un état intermédiaire.
- **Le serveur renvoie les boutons modifiés** (un seul, ou deux en cas d'échange ; liste vide si le bouton était déjà à cet emplacement). Le store les remplace dans sa liste, sans recharger tous les boutons.
- **La case 0 d'un dossier n'est pas une destination**, mais on ne la laisse pas muette : au survol avec un bouton la tuile de retour passe en rouge, et au lâcher un message explique que la première case est réservée au retour. Rien n'est envoyé au serveur dans ce cas ; s'il recevait la demande, il répondrait 400.
- **Glisser-déposer natif du navigateur** (HTML5), sans bibliothèque. Il ne fonctionne pas au toucher, ni au clavier : le formulaire de modification de la fiche 04 reste le moyen d'accès sans souris.
- **Confirmation renforcée sans saisie** : le dialogue de suppression d'un dossier non vide affiche un avertissement avec le nombre de boutons (sous-dossiers compris) et son bouton de confirmation le rappelle (« Supprimer le dossier et ses 3 boutons »). Le nombre est compté à l'ouverture du dialogue (`countContent`).
- **Export et import de la configuration** : retirés du périmètre de cette feature.

## Implémentation

### Flux

```
ButtonGrid (mode éditable)
  dragstart sur un bouton → mémorise le bouton glissé
  dragover sur une case   → surbrillance, sauf la case 0 d'un dossier
  drop sur une case       → emit('move', bouton, emplacement)
ConfigPage
  → store.move(id, emplacement) → POST /api/buttons/:id/move { position }
  → le serveur déplace ou échange, renvoie les boutons modifiés
  → le store les remplace, la grille se redessine
  → refus du serveur (400, 404) : message dans la barre d'information
```

### Route

| Méthode | Route | Rôle | Codes |
| --- | --- | --- | --- |
| POST | `/api/buttons/:id/move` | Déplace le bouton vers `{ "position": n }` dans son dossier, échange avec l'occupant éventuel. Renvoie la liste des boutons dont l'emplacement a changé | 200, 400, 404 |

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/validation.ts` | `validateMoveInput` |
| `server/src/buttons/store.ts` | `move` : déplacement et échange en une écriture |
| `server/src/buttons/router.ts` | Route `POST /:id/move` |
| `client/src/api/buttons.ts` | `moveButton` |
| `client/src/stores/buttons.ts` | Action `move` |
| `client/src/grid.ts` | `countContent` : nombre de boutons d'un dossier, sous-dossiers compris |
| `client/src/components/ButtonGrid.vue` | Glisser-déposer en mode édition, événement `move` |
| `client/src/components/ConfirmDelete.vue` | Avertissement et libellé avec le nombre de boutons supprimés |
| `client/src/pages/ConfigPage.vue` | Déplacement via le store, compte du contenu à supprimer |
| `server/test/buttons/*.test.ts` | Tests de la validation, du stockage et de la route de déplacement |
| `client/test/stores/buttons.test.ts` | Tests de l'action `move` |
| `client/test/grid.test.ts` | Tests de `countContent` |

### Validation

- [x] Tests serveur (76) et client (64), type-check, lint et build sans erreur
- [ ] Parcours vérifié visuellement dans le navigateur (déplacement vers une case libre, échange, case 0 d'un dossier, annulation en lâchant hors de la grille, confirmation d'un dossier non vide)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev          # puis http://localhost:3000/config
```

1. Glisser un bouton vers une case vide : il s'y place, et l'onglet Grille le montre au nouvel emplacement.
2. Glisser un bouton sur un autre bouton : les deux échangent leur place.
3. Dans un dossier, glisser un bouton sur la tuile de retour : elle passe en rouge, et en lâchant un message explique que la case est réservée. Le bouton reste à sa place.
4. Lâcher un bouton en dehors de la grille ou sur son propre emplacement : rien ne change.
5. Supprimer un dossier qui contient des boutons (dont un sous-dossier) : la confirmation annonce le nombre total de boutons supprimés.

Tests : `npm test` dans `client/` et dans `server/`. Le glisser-déposer lui-même n'est pas couvert par des tests automatiques (pas d'environnement DOM côté client) : la logique testable est dans le store, `countContent` et le serveur.
