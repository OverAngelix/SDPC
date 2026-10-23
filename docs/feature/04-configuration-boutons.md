# Feature 04 — Configuration des boutons

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [02 — API des boutons](02-api-boutons.md), [03 — Grille de boutons](03-grille-boutons.md) |

## Explication de la feature

L'onglet **Configuration** permet de créer, modifier et supprimer les boutons : type (action ou dossier), icône, libellé, URL et contenu des dossiers.

L'écran réutilise la grille de la feature 03, en mode édition : un clic sur un emplacement vide ouvre la création à cet emplacement, un clic sur un bouton ouvre sa modification, et un clic sur un dossier permet d'entrer dedans pour configurer son contenu. Dans un dossier, la première case reste le bouton retour : elle n'est pas modifiable, la création y est impossible (le serveur refuse l'emplacement 0 dans un dossier).

## TODO

- [x] Actions du store `buttons` : créer, modifier, supprimer (appels `POST`, `PATCH`, `DELETE`)
- [x] Page de configuration : grille en mode édition, navigation dans les dossiers (réutilise `ButtonGrid`)
- [x] Formulaire de création et de modification (boîte de dialogue) : type, libellé, icône, URL
- [x] Champ URL affiché pour une action uniquement, validé `http(s)` côté client (le serveur reste l'autorité)
- [x] Choix de l'icône : liste d'icônes MDI courantes et champ libre, avec aperçu
- [x] Création à l'emplacement cliqué (position pré-remplie), sauf la case 0 d'un dossier qui reste le retour
- [x] Suppression avec confirmation
- [x] Gestion des erreurs du serveur (400, 409) dans le formulaire
- [x] Retour visuel : confirmation d'enregistrement, erreurs
- [x] Tests du formulaire (validation) et des actions du store
- [x] Fiche mise à jour et README du projet
- [x] Pastille « Serveur connecté » retirée de la barre d'application (voir la fiche 01)

## Décisions

- **Une seule grille pour la grille et la configuration** : `ButtonGrid` prend une prop `editable`. En mode édition, un emplacement vide devient un bouton « + » (création à cet emplacement), chaque bouton affiche un crayon (modifier) et une corbeille (supprimer), un clic sur une action la modifie et un clic sur un dossier y entre. La case 0 d'un dossier reste la tuile de retour.
- **Le store met la liste à jour avec la réponse du serveur** (`create` ajoute, `update` remplace, `remove` retire le bouton et son contenu) au lieu de tout recharger. Les actions laissent remonter l'erreur : c'est le formulaire qui l'affiche.
- **Le serveur reste l'autorité** : le formulaire valide libellé, icône et URL `http(s)` avant l'envoi (mêmes limites que le serveur, `client/src/utils/buttonForm.ts`), mais les erreurs 400 et 409 du serveur s'affichent dans le formulaire. Les erreurs de saisie n'apparaissent qu'après une première tentative d'envoi.
- **Choix de l'icône** (question ouverte tranchée) : une liste restreinte d'icônes MDI courantes (`client/src/utils/icons.ts`) et un champ libre avec aperçu, sans recherche dans tout le catalogue MDI (elle demanderait d'embarquer la liste des noms). Un nom valide mais inexistant n'affiche simplement aucune icône.
- **Icône par défaut** : `mdi-web` pour une action, `mdi-folder` pour un dossier, remplacée quand on change le type tant que l'utilisateur n'a pas choisi la sienne.
- **Changement de type** : un bouton peut devenir dossier ou action. Un dossier non vide ne peut pas devenir une action : le serveur répond 409, affiché dans le formulaire.
- **Suppression** : confirmation simple (`ConfirmDelete`), avec un avertissement pour un dossier dont le contenu est supprimé aussi. Le nombre de boutons supprimés est ajouté par la feature 05.
- **Routes** : `/config` et `/config/folder/:id` partagent un parent commun, comme la grille, pour que l'onglet Configuration reste actif dans un dossier.
- **États communs** : chargement, erreur, dossier introuvable et avertissement de rechargement sont dans `GridStatus`, la navigation par dossier dans le composable `useFolderNavigation`. La grille et la configuration s'en servent avec leurs propres noms de routes.
- **Rechargement à chaque ouverture de l'onglet Configuration**, comme pour la grille.

## Implémentation

### Flux

```
ConfigPage (/config ou /config/folder/:id)
  → useButtonsStore().load()               (GET /api/buttons)
  → ButtonGrid editable
      emplacement vide → ButtonForm (création, parentId et position pré-remplis)
      bouton           → ButtonForm (modification) ou ConfirmDelete (suppression)
      dossier          → router.push(/config/folder/:id)
      case 0 d'un dossier → tuile de retour
  → store.create / update / remove → API (POST, PATCH, DELETE) → liste mise à jour
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/api/buttons.ts` | `createButton`, `updateButton`, `deleteButton` |
| `client/src/stores/buttons.ts` | Actions `create`, `update`, `remove` |
| `client/src/grid.ts` | `collectSubtree` : un bouton et tout son contenu |
| `client/src/interfaces/button.ts` | Types `ButtonInput` et `ButtonPatch` |
| `client/src/interfaces/api.ts` | Types des erreurs de l'API |
| `client/src/interfaces/buttonForm.ts` | Valeurs et erreurs du formulaire |
| `client/src/utils/buttonForm.ts` | `validateButtonForm`, `toButtonInput`, `toButtonPatch` |
| `client/src/utils/apiError.ts` | `describeApiError` : message affichable d'une erreur de l'API |
| `client/src/utils/icons.ts` | Icônes MDI courantes |
| `client/src/composables/folderNavigation.ts` | Dossier courant, chemin, ouverture et retour |
| `client/src/components/GridStatus.vue` | Chargement, erreur, dossier introuvable |
| `client/src/components/ButtonTile.vue` | Mode édition : création sur un emplacement libre, modifier et supprimer |
| `client/src/components/ButtonGrid.vue` | Prop `editable`, événements `create`, `edit`, `remove` |
| `client/src/components/ButtonForm.vue` | Formulaire en boîte de dialogue |
| `client/src/components/IconPicker.vue` | Choix de l'icône avec aperçu |
| `client/src/components/ConfirmDelete.vue` | Confirmation de suppression |
| `client/src/pages/ConfigPage.vue` | Page de l'onglet Configuration |
| `client/src/pages/GridPage.vue` | Utilise `GridStatus` et `useFolderNavigation` |
| `client/src/router/index.ts` | Routes `config` et `config-folder` |
| `client/test/stores/buttons.test.ts` | Tests des actions du store |
| `client/test/grid.test.ts` | Tests de `collectSubtree` |
| `client/test/utils/buttonForm.test.ts` | Tests de la validation et de la conversion du formulaire |
| `client/test/utils/apiError.test.ts` | Tests des messages d'erreur |

### Validation

- [x] Type-check, lint et build du client sans erreur ; tests automatiques du client
- [x] Formes de requêtes du client rejouées contre le vrai serveur : création d'une action et d'un dossier, 409 (emplacement occupé, dossier non vide devenu action), 400 (case 0 d'un dossier), modification, changement de type, suppression en cascade
- [ ] Parcours vérifié visuellement dans le navigateur (création, modification, suppression, dossiers sur plusieurs niveaux, erreurs du formulaire)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev          # puis http://localhost:3000/config
```

1. Cliquer sur un emplacement vide : le formulaire s'ouvre, choisir « Action », un libellé, une icône et une URL `https://…`, puis enregistrer. Le bouton apparaît à cet emplacement et dans l'onglet Grille.
2. Valider un formulaire vide : les erreurs s'affichent sous les champs, sans appel au serveur.
3. Créer un dossier, cliquer dessus, y créer un bouton : la case 0 est la tuile de retour, elle ne propose pas de création.
4. Modifier un bouton (crayon ou clic sur une action), changer son type en dossier : l'URL disparaît.
5. Essayer de transformer un dossier non vide en action : le serveur répond 409, le message s'affiche dans le formulaire.
6. Supprimer un dossier : la confirmation prévient que son contenu est supprimé aussi.

Tests : `npm test` dans `client/`. Les composants ne sont pas couverts par des tests automatiques (pas d'environnement DOM) : la logique testable est dans le store, `buttonForm.ts`, `apiError.ts` et `grid.ts`.
