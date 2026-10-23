# Feature 05 — Glisser-déposer des boutons

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md) |

## Explication de la feature

Deux améliorations qui rendent la configuration plus confortable et plus sûre :

- **Glisser-déposer** pour déplacer un bouton vers un autre emplacement du même dossier (échange si l'emplacement est occupé ; l'emplacement 0 d'un dossier, réservé au retour, n'est pas une destination).
- **Confirmation renforcée** avant de supprimer un dossier non vide, avec le nombre de boutons qui seront supprimés.

## TODO

- [ ] Serveur : route de déplacement (`POST /api/buttons/:id/move`) avec échange d'emplacements (emplacement 0 refusé dans un dossier)
- [ ] Client : glisser-déposer des boutons dans la grille d'édition
- [ ] Client : message de confirmation avec le nombre de boutons supprimés pour un dossier non vide
- [ ] Déplacer un bouton vers un autre dossier (à décider, voir questions ouvertes)
- [ ] Tests serveur (déplacement, échange) et client
- [ ] Fiche mise à jour et README du projet

## Implémentation (prévue)

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/router.ts` | Route `move` |
| `client/src/stores/buttons.ts` | Action `move` |
| `client/src/components/ButtonGrid.vue` | Glisser-déposer en mode édition |
| `client/src/components/ConfirmDelete.vue` | Existe depuis la feature 04 : ajouter le nombre d'éléments supprimés pour un dossier non vide |

## Questions ouvertes

- Faut-il pouvoir déplacer un bouton d'un dossier à un autre (et pas seulement dans son dossier) ?
