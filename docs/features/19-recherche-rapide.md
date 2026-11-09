# Feature 19 — Recherche rapide (⌘K / Ctrl+K)

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [03 — Grille de boutons](03-grille-boutons.md), [11 — Menu « Mon compte »](11-menu-compte-reglages.md), [13 — Big picture](13-big-picture.md) |

## Explication de la feature

Avec plusieurs niveaux de dossiers et sans fil d'Ariane, retrouver un bouton demande de se souvenir de son chemin. La recherche rapide ouvre une **barre de recherche en superposition**, dans l'esprit de Spotlight sur Mac :

- **⌘K** (Mac) ou **Ctrl+K** (Windows, Linux) l'ouvre depuis la grille, en mode normal comme en big picture ; une entrée **« Rechercher (⌘K) »** du menu « Mon compte » l'ouvre aussi, pour le téléphone.
- Une fenêtre sans cadre apparaît en haut de l'écran, au-dessus de la grille assombrie et floutée, avec un grand champ de saisie déjà actif.
- En tapant, la liste se filtre sur **tous les boutons, à tous les niveaux** : icône, libellé et, en plus petit, le chemin des dossiers (« Google › Outils ») ou le domaine de l'URL.
- **↑ / ↓** déplacent la sélection, **Entrée** ouvre le résultat, **Échap** ou un clic à côté referme.
- Une **action** s'ouvre dans un nouvel onglet ; un **dossier** remplace la grille par son contenu.

## TODO

### Étape 1 — Recherche (client)

- [ ] `client/src/grid.ts` (ou `utils/search.ts`) : `searchButtons(buttons, query)` renvoie les boutons trouvés avec leur chemin
- [ ] Comparaison sans casse ni accents (`normalize('NFD')`), sur le libellé et le domaine de l'URL
- [ ] Classement : libellé qui commence par la saisie, puis mot du libellé qui commence par la saisie, puis libellé qui la contient, puis domaine ; à égalité, ordre alphabétique
- [ ] Au plus 8 résultats ; saisie vide → aucun résultat
- [ ] Tests client : casse, accents, classement, dossiers imbriqués, chemin, limite

### Étape 2 — Fenêtre en superposition (client)

- [ ] `client/src/components/QuickSearch.vue` : `v-dialog` en haut de l'écran (environ 15 % du haut), largeur limitée (~640 px), coins arrondis, fond translucide flouté (`backdrop-filter`), voile flouté derrière
- [ ] Champ de saisie sans libellé, loupe à gauche, rappel `esc` à droite ; liste des résultats dessous, sélection en surbrillance
- [ ] Clavier : ↑ / ↓ (en boucle), Entrée, Échap ; la souris survole et clique aussi
- [ ] Message « Aucun résultat » ; saisie remise à zéro à chaque ouverture
- [ ] Respect des réglages : apparition animée sauf si les effets sont coupés ou `prefers-reduced-motion`
- [ ] Icône du résultat : même rendu que la case (y compris le favicon si la feature 17 est faite)

### Étape 3 — Ouverture et raccourci (client)

- [ ] `client/src/stores/quickSearch.ts` : `open`, `show()`, `hide()`
- [ ] Raccourci ⌘K / Ctrl+K dans `GridPage.vue`, avec `preventDefault()` (le navigateur l'utilise pour sa propre barre de recherche) ; ignoré si une autre fenêtre est ouverte
- [ ] Ouvrir un résultat : action → `window.open` comme `select` dans `GridPage.vue` (son de lancement compris) ; dossier → `openFolder(id)` ; la fenêtre se referme dans les deux cas
- [ ] Entrée **« Rechercher »** dans `AccountMenuItems.vue` (menu et tiroir), avec le raccourci affiché selon le système (`⌘K` sur Mac, `Ctrl K` ailleurs) ; action `'search'` dans `AccountAction` ; sur la configuration, elle ramène d'abord à la grille (comme le big picture)
- [ ] Tests client : store, raccourci (⌘ sur Mac, Ctrl ailleurs), ouverture d'une action et d'un dossier

### Étape 4 — Textes et documentation

- [ ] `search.placeholder`, `search.empty`, `menu.search` dans `locales/fr.ts` et `en.ts`
- [ ] Fiche mise à jour (fichiers, vérification à la main), README des features

## Décisions

- **Grille seulement.** La recherche sert à lancer un raccourci : elle vit sur la page grille (routes `grid` et `folder`), en mode normal et en big picture. Sur la configuration, ⌘K ne fait rien ; l'entrée du menu ramène à la grille avant d'ouvrir la recherche.
- **Spotlight plutôt que palette de commandes.** On ne cherche que des boutons, pas des actions de l'application (réglages, thème…) : la liste reste courte et lisible.
- **Le chemin à la place du fil d'Ariane.** Chaque résultat affiche les dossiers qui le contiennent : c'est là que l'utilisateur apprend où se trouve un bouton, sans ajouter de fil d'Ariane à la grille.
- **Ouvrir un dossier, c'est y naviguer**, pas l'afficher dans la fenêtre : le retour par la case 0 ramène ensuite à son parent, comme d'habitude.
- **⌘ sur Mac, Ctrl ailleurs**, détecté par `navigator.platform` / `userAgentData`. Les deux touches marchent partout, seul le rappel affiché change.
- **Tout se fait dans le client**, sur les boutons déjà chargés par le store : aucune route serveur, et la recherche marche aussi en mode invité.
- **Big picture : la fenêtre s'ouvre par-dessus**, sans quitter le mode. Les touches 1 à 7 (feature 18) et F sont ignorées tant qu'elle est ouverte (elle est une `v-overlay`).

## Implémentation

À compléter pendant la réalisation.

### Vérifier à la main

1. Sur la grille, ⌘K (Mac) ou Ctrl+K : la fenêtre s'ouvre en haut, grille floutée derrière, champ actif ; la barre de recherche du navigateur ne s'ouvre pas.
2. Taper « gm » : Gmail apparaît avec le chemin « Google ». Entrée : nouvel onglet, fenêtre refermée.
3. Taper le nom d'un dossier imbriqué, l'ouvrir : la grille affiche son contenu, la case 0 ramène à son parent.
4. Saisie avec ou sans accents, majuscules : mêmes résultats. Saisie sans résultat : « Aucun résultat ».
5. ↑ / ↓ en boucle, survol à la souris, Échap et clic à côté referment.
6. Big picture : ⌘K ouvre la fenêtre sans quitter le mode ; F et les chiffres ne réagissent pas tant qu'elle est ouverte.
7. Téléphone : menu « Mon compte » → « Rechercher » ; depuis la configuration, l'entrée ramène à la grille.
8. Thème sombre, effets coupés, anglais.
