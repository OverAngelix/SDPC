# Feature 04 — Configuration des boutons

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [02 — API des boutons](02-api-boutons.md), [03 — Grille de boutons](03-grille-boutons.md) |

## Explication de la feature

L'onglet **Configuration** permet de créer, modifier et supprimer les boutons : type (action ou dossier), icône, libellé, URL et contenu des dossiers.

L'écran réutilise la grille de la feature 03, en mode édition : un clic sur un emplacement vide ouvre la création à cet emplacement, un clic sur un bouton ouvre sa modification, et un clic sur un dossier permet d'entrer dedans pour configurer son contenu. Dans un dossier, la première case reste le bouton retour : elle n'est pas modifiable, la création y est impossible (le serveur refuse l'emplacement 0 hors de la racine).

## TODO

- [ ] Actions du store `buttons` : créer, modifier, supprimer (appels `POST`, `PATCH`, `DELETE`)
- [ ] Page de configuration : grille en mode édition, navigation dans les dossiers (réutilise `ButtonGrid`)
- [ ] Formulaire de création et de modification (boîte de dialogue) : type, libellé, icône, URL
- [ ] Champ URL affiché pour une action uniquement, validé `http(s)` côté client (le serveur reste l'autorité)
- [ ] Choix de l'icône : liste d'icônes MDI courantes et champ libre, avec aperçu
- [ ] Création à l'emplacement cliqué (position pré-remplie), sauf la case 0 d'un dossier qui reste le retour
- [ ] Suppression avec confirmation
- [ ] Gestion des erreurs du serveur (400, 409) dans le formulaire
- [ ] Retour visuel : confirmation d'enregistrement, erreurs
- [ ] Tests du formulaire (validation) et des actions du store
- [ ] Fiche mise à jour et README du projet

## Implémentation (prévue)

### Flux

```
ConfigPage (/config ou /config/folder/:id)
  → grille en mode édition
      emplacement vide → ButtonForm (création, position pré-remplie)
      bouton           → ButtonForm (modification) ou suppression
      dossier          → entre dans le dossier
  → store.create / update / remove → API → rechargement de la grille
```

### Fichiers prévus

| Fichier | Rôle |
| --- | --- |
| `client/src/api/buttons.ts` | Ajout de `createButton`, `updateButton`, `deleteButton` |
| `client/src/stores/buttons.ts` | Actions de création, modification, suppression |
| `client/src/components/ButtonForm.vue` | Formulaire en boîte de dialogue |
| `client/src/components/IconPicker.vue` | Choix de l'icône |
| `client/src/pages/ConfigPage.vue` | Page de l'onglet Configuration |
| `client/src/router/index.ts` | Route `/config/folder/:id` |

## Questions ouvertes

- Choix de l'icône : liste restreinte d'icônes courantes ou recherche dans tout le catalogue MDI ? La recherche complète demande une liste des noms d'icônes.
