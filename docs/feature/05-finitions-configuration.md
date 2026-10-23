# Feature 05 — Finitions de la configuration

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md) |

## Explication de la feature

Les finitions qui rendent la configuration confortable et sûre :

- **Glisser-déposer** pour déplacer un bouton vers un autre emplacement du même dossier (échange si l'emplacement est occupé ; l'emplacement 0 d'un dossier, réservé au retour, n'est pas une destination).
- **Confirmation renforcée** avant de supprimer un dossier non vide, avec le nombre de boutons qui seront supprimés.
- **Export et import** de la configuration en JSON, pour la sauvegarder ou la transférer.

## TODO

- [ ] Serveur : route de déplacement (`POST /api/buttons/:id/move`) avec échange d'emplacements (emplacement 0 refusé dans un dossier)
- [ ] Serveur : `GET /api/config/export` (téléchargement du JSON)
- [ ] Serveur : `PUT /api/config/import` avec validation complète (mêmes règles que la feature 02, arbre cohérent) et remplacement atomique
- [ ] Client : glisser-déposer des boutons dans la grille d'édition
- [ ] Client : message de confirmation avec le nombre de boutons supprimés pour un dossier non vide
- [ ] Client : boutons d'export et d'import, retour d'erreur lisible si le fichier est invalide
- [ ] Déplacer un bouton vers un autre dossier (à décider, voir questions ouvertes)
- [ ] Tests serveur (déplacement, échange, import invalide) et client
- [ ] Fiche mise à jour et README du projet

## Implémentation (prévue)

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/router.ts` | Route `move` |
| `server/src/config/router.ts` | Routes d'export et d'import |
| `client/src/api/config.ts` | Appels d'export et d'import |
| `client/src/stores/buttons.ts` | Action `move` |
| `client/src/components/ButtonGrid.vue` | Glisser-déposer en mode édition |
| `client/src/components/ConfirmDelete.vue` | Existe depuis la feature 04 : ajouter le nombre d'éléments supprimés pour un dossier non vide |
| `client/src/pages/ConfigPage.vue` | Export et import |

## Questions ouvertes

- L'import remplace-t-il toute la configuration ou fusionne-t-il avec l'existante ? Le plus simple et le plus sûr : remplacer, après confirmation.
- Faut-il pouvoir déplacer un bouton d'un dossier à un autre (et pas seulement dans son dossier) ?
