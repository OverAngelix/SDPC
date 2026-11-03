# Features

Une fiche par feature : explication, TODO, implémentation et personne active. Nommer le fichier `NN-nom-de-la-feature.md` ; `NN` est le numéro utilisé dans les commits (`[NN]`, voir `.claude/commands/commit.md`).

| N° | Feature | Statut | Personne active |
| --- | --- | --- | --- |
| 01 | [Connexion client ↔ serveur](01-connexion-client-serveur.md) | Livré | OverAngelix |
| 02 | [API des boutons](02-api-boutons.md) | Livré | OverAngelix |
| 03 | [Grille de boutons](03-grille-boutons.md) | Livré | OverAngelix |
| 04 | [Configuration des boutons](04-configuration-boutons.md) | Livré | OverAngelix |
| 05 | [Glisser-déposer des boutons](05-glisser-deposer.md) | Livré | OverAngelix |
| 06 | [UX : couleurs et effets « juicy »](06-ux-couleurs-effets.md) | Livré | OverAngelix |
| 07 | [Responsive : grille adaptée au téléphone](07-responsive.md) | Livré | OverAngelix |
| 08 | [Grille de 28 cases (7 × 4, 4 × 7 en portrait)](08-grille-28-cases.md) | Livré | OverAngelix |
| 09 | [Comptes utilisateur et base de données SQLite](09-comptes-base-de-donnees.md) | Livré | OverAngelix |
| 10 | [Fenêtre « Mon compte » : mot de passe, remise à zéro et suppression](10-fenetre-mon-compte.md) | À faire | OverAngelix |
| 11 | [Menu « Mon compte » et réglages de l'application](11-menu-compte-reglages.md) | Livré | OverAngelix |

Ordre de réalisation : 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 11 → 10 (chaque feature dépend de la précédente ; la 10, fenêtre « Mon compte », vient après la 11).

## Plus tard

- Plein écran ou mode kiosque pour la grille.
- Rendre commun les types
- I18n
- Deploiement serveur OVH
- Image de fond de la grille (réglage de l'application, après la feature 11).
- **Grille modulable** : nombre de colonnes et de lignes configurable (aujourd'hui fixe : 7 × 4, 4 × 7 en portrait, emplacements 0 à 27 ; l'emplacement 0 d'un dossier est le retour).
