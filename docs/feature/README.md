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
| 08 | [Grille de 24 cases (6 × 4, 4 × 6 en portrait)](08-grille-24-cases.md) | Livré | OverAngelix |

Ordre de réalisation : 02 → 03 → 04 → 05 → 06 → 07 → 08 (chaque feature dépend de la précédente).

## Plus tard

- **Grille modulable** : nombre de colonnes et de lignes configurable (aujourd'hui fixe : 6 × 4, 4 × 6 en portrait, emplacements 0 à 23 ; l'emplacement 0 d'un dossier est le retour).
- Plein écran ou mode kiosque pour la grille, thèmes.
- Creation de compte
- Base de données au lieu de json
- Rendre commun les types
- I18n
- Dark theme, white theme et theme PC
- Deploiement serveur OVH
- configuration de l'app -> desactive son et visuel sonore, themes (dark, light, device)
